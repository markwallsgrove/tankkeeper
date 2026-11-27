"""Records, history, undo, proposals and conversations, with no Home Assistant imports.

Every record lives in a collection, keyed by id. Every change to a record is a
Change with the record before and after, and every applied group of changes is
a HistoryEntry, so any change can be undone by applying its inverse.
"""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field, replace
from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from enum import StrEnum
import hmac
import re

type JsonValue = str | int | float | bool | list[JsonValue] | dict[str, JsonValue] | None
type Record = dict[str, JsonValue]

CODE_LIFETIME = timedelta(minutes=15)
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6
MAX_CODE_ATTEMPTS = 5
BATCH_IDLE = CODE_LIFETIME
BATCH_MAX_AGE = timedelta(hours=2)
MAX_CONVERSATION_MESSAGES = 200
MAX_RECORDED_MESSAGES = 500
SAID_ROLES = frozenset({"user", "assistant", "error"})
SNIPPET_BEFORE = 40
SNIPPET_AFTER = 80
NAME_LENGTH = 80
UNTITLED = "Untitled conversation"
DELETED_CONVERSATION = "deleted conversation"
NO_DELETE = "No delete of this conversation is waiting for you. Ask to delete it again"
TANK_ID = "tank"
WATER_ID = "water"


class Collection(StrEnum):
    """A kind of record."""

    TANK = "tank"
    WATER = "water"
    PRODUCTS = "products"
    CONTENTS = "contents"
    LOG = "log"
    NOTES = "notes"
    TASKS = "tasks"
    SETTINGS = "settings"
    LIGHTS = "lights"
    DECISIONS = "decisions"


SETUP_COLLECTIONS = (
    Collection.PRODUCTS,
    Collection.CONTENTS,
    Collection.TASKS,
    Collection.LIGHTS,
    Collection.DECISIONS,
)


class Source(StrEnum):
    """Who made a change."""

    PANEL = "panel"
    ASSIST = "assist"
    MCP = "mcp"
    RULE = "rule"
    NOTIFICATION = "notification"
    REVIEW = "review"
    CAMERA = "camera"


class ProposalState(StrEnum):
    """Where a proposal is in its life."""

    PENDING = "pending"
    APPLIED = "applied"
    REJECTED = "rejected"


class TankkeeperError(Exception):
    """A request that the records can't carry out. The key names the reason."""

    key = "error"

    def __init__(self, message: str) -> None:
        """Keep the message for the assistant."""
        super().__init__(message)
        self.message = message


class NotFoundError(TankkeeperError):
    """No record, proposal, history entry or conversation has that id."""

    key = "not_found"


class NothingToChangeError(TankkeeperError):
    """The change leaves every record as it is."""

    key = "nothing_to_change"


class InvalidInputError(TankkeeperError):
    """An argument the schema accepts but the records can't use."""

    key = "invalid_input"


class LightsOffError(TankkeeperError):
    """Every tank light is off, and the camera sees nothing in the dark."""

    key = "lights_off"


class FindingClosedError(TankkeeperError):
    """The photo check has no open issue."""

    key = "finding_closed"


class RecordChangedError(TankkeeperError):
    """A record changed after the change was worked out."""

    key = "record_changed"


class ProposalClosedError(TankkeeperError):
    """The proposal was already applied or rejected."""

    key = "proposal_closed"


class NotYourProposalError(TankkeeperError):
    """The proposal belongs to another person or conversation."""

    key = "not_your_proposal"


class ConversationFullError(TankkeeperError):
    """The conversation holds as many messages as it can."""

    key = "conversation_full"


class CodeWrongError(TankkeeperError):
    """The confirm code does not match."""

    key = "code_wrong"


class CodeExpiredError(TankkeeperError):
    """The confirm code is older than its lifetime."""

    key = "code_expired"


class TooManyAttemptsError(TankkeeperError):
    """Too many wrong codes were tried for the proposal."""

    key = "too_many_attempts"


class BatchExpiredError(TankkeeperError):
    """The conversation's batch can take no more changes: its code expired or is locked."""

    key = "batch_expired"


class BatchOpenError(TankkeeperError):
    """The conversation already has an open batch of another kind."""

    key = "batch_open"


class TankNotEmptyError(TankkeeperError):
    """Setup is only for a new or empty tank."""

    key = "tank_not_empty"


@dataclass(frozen=True, slots=True, kw_only=True)
class Change:
    """One record before and after. None means the record does not exist."""

    collection: Collection
    record_id: str
    before: Record | None
    after: Record | None

    def inverse(self) -> Change:
        """The change that puts the record back."""
        return replace(self, before=self.after, after=self.before)

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "collection": self.collection.value,
            "record_id": self.record_id,
            "before": self.before,
            "after": self.after,
        }

    @classmethod
    def from_json(cls, data: Record) -> Change:
        """Read from storage."""
        return cls(
            collection=Collection(_str(data["collection"])),
            record_id=_str(data["record_id"]),
            before=_optional_record(data["before"]),
            after=_optional_record(data["after"]),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class HistoryEntry:
    """A group of changes applied together."""

    id: str
    time: datetime
    source: Source
    conversation_id: str | None
    summary: str
    changes: tuple[Change, ...]
    proposal_id: str | None = None
    user_id: str | None = None

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "time": self.time.isoformat(),
            "source": self.source.value,
            "conversation_id": self.conversation_id,
            "summary": self.summary,
            "changes": [change.to_json() for change in self.changes],
            "proposal_id": self.proposal_id,
        }

    @classmethod
    def from_json(cls, data: Record) -> HistoryEntry:
        """Read from storage."""
        return cls(
            id=_str(data["id"]),
            time=datetime.fromisoformat(_str(data["time"])),
            source=Source(_str(data["source"])),
            conversation_id=_optional_str(data["conversation_id"]),
            summary=_str(data["summary"]),
            changes=tuple(Change.from_json(_record(item)) for item in _list(data["changes"])),
            proposal_id=_optional_str(data["proposal_id"]),
            user_id=_optional_str(data.get("user_id")),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class Step:
    """One change tool call that added to a batch."""

    time: datetime
    tool: str
    summary: str
    reason: str
    evidence: str | None

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "time": self.time.isoformat(),
            "tool": self.tool,
            "summary": self.summary,
            "reason": self.reason,
            "evidence": self.evidence,
        }

    @classmethod
    def from_json(cls, data: Record) -> Step:
        """Read from storage."""
        return cls(
            time=datetime.fromisoformat(_str(data["time"])),
            tool=_str(data["tool"]),
            summary=_str(data["summary"]),
            reason=_str(data["reason"]),
            evidence=_optional_str(data["evidence"]),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class Proposal:
    """Changes waiting for a yes, with a one-use confirm code.

    A batch stays open to more changes from the same person and conversation
    while its code is valid.
    """

    id: str
    created: datetime
    source: Source
    user_id: str | None
    conversation_id: str | None
    tool: str
    summary: str
    reason: str
    evidence: str | None
    changes: tuple[Change, ...]
    code: str
    state: ProposalState = ProposalState.PENDING
    failed_attempts: int = 0
    decided: datetime | None = None
    history_id: str | None = None
    batch: bool = False
    setup: bool = False
    updated: datetime | None = None
    steps: tuple[Step, ...] = ()
    notified: bool = False
    decided_by: str | None = None

    def last_change(self) -> datetime:
        """When a change was last added."""
        return self.created if self.updated is None else self.updated

    def code_expires(self) -> datetime:
        """When the confirm code stops working.

        A batch's code lasts BATCH_IDLE after its last change, and never past BATCH_MAX_AGE.
        """
        if not self.batch:
            return self.created + CODE_LIFETIME
        return min(self.last_change() + BATCH_IDLE, self.created + BATCH_MAX_AGE)

    def is_open(self, now: datetime) -> bool:
        """Whether the batch can still take changes."""
        return (
            self.batch
            and self.state is ProposalState.PENDING
            and self.failed_attempts < MAX_CODE_ATTEMPTS
            and now < self.code_expires()
        )

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "id": self.id,
            "created": self.created.isoformat(),
            "source": self.source.value,
            "user_id": self.user_id,
            "conversation_id": self.conversation_id,
            "tool": self.tool,
            "summary": self.summary,
            "reason": self.reason,
            "evidence": self.evidence,
            "changes": [change.to_json() for change in self.changes],
            "code": self.code,
            "state": self.state.value,
            "failed_attempts": self.failed_attempts,
            "decided": None if self.decided is None else self.decided.isoformat(),
            "history_id": self.history_id,
            "batch": self.batch,
            "setup": self.setup,
            "updated": None if self.updated is None else self.updated.isoformat(),
            "steps": [step.to_json() for step in self.steps],
            "notified": self.notified,
            "decided_by": self.decided_by,
        }

    @classmethod
    def from_json(cls, data: Record) -> Proposal:
        """Read from storage."""
        decided = _optional_str(data["decided"])
        updated = _optional_str(data.get("updated"))
        return cls(
            id=_str(data["id"]),
            created=datetime.fromisoformat(_str(data["created"])),
            source=Source(_str(data["source"])),
            user_id=_optional_str(data["user_id"]),
            conversation_id=_optional_str(data["conversation_id"]),
            tool=_str(data["tool"]),
            summary=_str(data["summary"]),
            reason=_str(data["reason"]),
            evidence=_optional_str(data["evidence"]),
            changes=tuple(Change.from_json(_record(item)) for item in _list(data["changes"])),
            code=_str(data["code"]),
            state=ProposalState(_str(data["state"])),
            failed_attempts=_int(data["failed_attempts"]),
            decided=None if decided is None else datetime.fromisoformat(decided),
            history_id=_optional_str(data["history_id"]),
            batch=_bool(data.get("batch", False)),
            setup=_bool(data.get("setup", False)),
            updated=None if updated is None else datetime.fromisoformat(updated),
            steps=tuple(Step.from_json(_record(item)) for item in _list(data.get("steps", []))),
            notified=_bool(data.get("notified", False)),
            decided_by=_optional_str(data.get("decided_by")),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class Message:
    """One message in a conversation."""

    role: str
    text: str

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {"role": self.role, "text": self.text}

    @classmethod
    def from_json(cls, data: Record) -> Message:
        """Read from storage."""
        return cls(role=_str(data["role"]), text=_str(data["text"]))


@dataclass(frozen=True, slots=True, kw_only=True)
class Conversation:
    """A conversation with Claude and the key messages in it."""

    id: str
    source: Source
    user_id: str | None
    started: datetime
    updated: datetime
    title: str
    summary: str
    messages: tuple[Message, ...]

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "id": self.id,
            "source": self.source.value,
            "user_id": self.user_id,
            "started": self.started.isoformat(),
            "updated": self.updated.isoformat(),
            "title": self.title,
            "summary": self.summary,
            "messages": [message.to_json() for message in self.messages],
        }

    @classmethod
    def from_json(cls, data: Record) -> Conversation:
        """Read from storage."""
        return cls(
            id=_str(data["id"]),
            source=Source(_str(data["source"])),
            user_id=_optional_str(data["user_id"]),
            started=datetime.fromisoformat(_str(data["started"])),
            updated=datetime.fromisoformat(_str(data["updated"])),
            title=_str(data["title"]),
            summary=_str(data["summary"]),
            messages=tuple(Message.from_json(_record(item)) for item in _list(data["messages"])),
        )

    def text_contains(self, query: str) -> bool:
        """Whether the title, summary or any message holds the query, ignoring case."""
        return self.match(query) is not None

    def match(self, query: str) -> Match | None:
        """Where the query is, ignoring case: what was said first, then the title, the summary and tool calls."""
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        said = [(index, message) for index, message in enumerate(self.messages) if message.role in SAID_ROLES]
        other = [(index, message) for index, message in enumerate(self.messages) if message.role not in SAID_ROLES]
        places: list[tuple[str, int | None, str | None, str]] = [
            *(("message", index, message.role, message.text) for index, message in said),
            ("title", None, None, self.title),
            ("summary", None, None, self.summary),
            *(("message", index, message.role, message.text) for index, message in other),
        ]
        for where, index, role, text in places:
            found = pattern.search(text)
            if found is not None:
                return _match(where, index, role, text, found)
        return None

    def name(self) -> str:
        """The title, or the first thing the owner said, on one line."""
        title = " ".join(self.title.split())
        if title:
            return title
        first = next((message.text for message in self.messages if message.role == "user"), "")
        words = " ".join(first.split())
        if not words:
            return UNTITLED
        return words if len(words) <= NAME_LENGTH else f"{words[: NAME_LENGTH - 1]}…"


@dataclass(frozen=True, slots=True, kw_only=True)
class Match:
    """Where a conversation holds a search query: a snippet of that text on one line, with the query from start to end.

    field is title, summary or message; index and role name the message.
    """

    field: str
    index: int | None
    role: str | None
    snippet: str
    start: int
    end: int

    def to_json(self) -> Record:
        """Serialise for the tools and the panel."""
        return {
            "field": self.field,
            "index": self.index,
            "role": self.role,
            "snippet": self.snippet,
            "start": self.start,
            "end": self.end,
        }


def _match(where: str, index: int | None, role: str | None, text: str, found: re.Match[str]) -> Match:
    first = max(0, found.start() - SNIPPET_BEFORE)
    last = min(len(text), found.end() + SNIPPET_AFTER)
    prefix = "…" if first > 0 else ""
    suffix = "…" if last < len(text) else ""
    body = re.sub(r"\s", " ", text[first:last])
    start = len(prefix) + found.start() - first
    return Match(
        field=where,
        index=index,
        role=role,
        snippet=f"{prefix}{body}{suffix}",
        start=start,
        end=start + found.end() - found.start(),
    )


@dataclass(frozen=True, slots=True, kw_only=True)
class DeleteRequest:
    """A request to delete a conversation, waiting for its confirm code."""

    conversation_id: str
    user_id: str | None
    code: str
    created: datetime
    failed_attempts: int = 0


@dataclass(slots=True)
class TankState:
    """Every record of one tank, with its history, proposals, conversations, reviews, photo checks and light log."""

    records: dict[Collection, dict[str, Record]] = field(
        default_factory=lambda: {collection: {} for collection in Collection}
    )
    history: list[HistoryEntry] = field(default_factory=list)
    proposals: dict[str, Proposal] = field(default_factory=dict)
    conversations: dict[str, Conversation] = field(default_factory=dict)
    light_log: list[Record] = field(default_factory=list)
    reviews: list[Record] = field(default_factory=list)
    photo_checks: list[Record] = field(default_factory=list)

    def get(self, collection: Collection, record_id: str) -> Record | None:
        """The record, or None when it does not exist."""
        return self.records[collection].get(record_id)

    def require(self, collection: Collection, record_id: str) -> Record:
        """The record, or NotFoundError."""
        record = self.get(collection, record_id)
        if record is None:
            raise NotFoundError(f"No {collection.value} record with id {record_id}")
        return record

    def history_entry(self, history_id: str) -> HistoryEntry:
        """The history entry, or NotFoundError."""
        for entry in self.history:
            if entry.id == history_id:
                return entry
        raise NotFoundError(f"No history entry with id {history_id}")

    def proposal(self, proposal_id: str) -> Proposal:
        """The proposal, or NotFoundError."""
        try:
            return self.proposals[proposal_id]
        except KeyError:
            raise NotFoundError(f"No proposal with id {proposal_id}") from None

    def conversation(self, conversation_id: str) -> Conversation:
        """The conversation, or NotFoundError."""
        try:
            return self.conversations[conversation_id]
        except KeyError:
            raise NotFoundError(f"No conversation with id {conversation_id}") from None

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "records": {collection.value: dict(records) for collection, records in self.records.items()},
            "history": [entry.to_json() for entry in self.history],
            "proposals": [proposal.to_json() for proposal in self.proposals.values()],
            "conversations": [conversation.to_json() for conversation in self.conversations.values()],
            "light_log": list(self.light_log),
            "reviews": list(self.reviews),
            "photo_checks": list(self.photo_checks),
        }

    @classmethod
    def from_json(cls, data: Record) -> TankState:
        """Read from storage."""
        stored = _record(data["records"])
        records: dict[Collection, dict[str, Record]] = {
            collection: {
                record_id: _record(record) for record_id, record in _record(stored.get(collection.value, {})).items()
            }
            for collection in Collection
        }
        proposals = (Proposal.from_json(_record(item)) for item in _list(data["proposals"]))
        conversations = (Conversation.from_json(_record(item)) for item in _list(data["conversations"]))
        return cls(
            records=records,
            history=[HistoryEntry.from_json(_record(item)) for item in _list(data["history"])],
            proposals={proposal.id: proposal for proposal in proposals},
            conversations={conversation.id: conversation for conversation in conversations},
            light_log=[_record(item) for item in _list(data.get("light_log", []))],
            reviews=[_record(item) for item in _list(data.get("reviews", []))],
            photo_checks=[_record(item) for item in _list(data.get("photo_checks", []))],
        )


def plan_changes(state: TankState, targets: Iterable[tuple[Collection, str, Record | None]]) -> tuple[Change, ...]:
    """Changes that set each record to its target, leaving out ones already there."""
    changes = tuple(
        Change(collection=collection, record_id=record_id, before=state.get(collection, record_id), after=after)
        for collection, record_id, after in targets
    )
    changes = tuple(change for change in changes if change.before != change.after)
    if not changes:
        raise NothingToChangeError("The records already look like that")
    return changes


def apply_changes(
    state: TankState,
    changes: tuple[Change, ...],
    *,
    history_id: str,
    now: datetime,
    source: Source,
    conversation_id: str | None,
    summary: str,
    proposal_id: str | None = None,
    user_id: str | None = None,
) -> HistoryEntry:
    """Apply every change, or none if any record no longer matches its before."""
    for change in changes:
        if state.get(change.collection, change.record_id) != change.before:
            raise RecordChangedError(
                f"The {change.collection.value} record {change.record_id} changed since this change was made"
            )
    for change in changes:
        records = state.records[change.collection]
        if change.after is None:
            del records[change.record_id]
        else:
            records[change.record_id] = change.after
    entry = HistoryEntry(
        id=history_id,
        time=now,
        source=source,
        conversation_id=conversation_id,
        summary=summary,
        changes=changes,
        proposal_id=proposal_id,
        user_id=user_id,
    )
    state.history.append(entry)
    return entry


def undo_changes(entry: HistoryEntry) -> tuple[Change, ...]:
    """The changes that put back what a history entry changed, newest first."""
    return tuple(change.inverse() for change in reversed(entry.changes))


def propose(
    state: TankState,
    changes: tuple[Change, ...],
    *,
    proposal_id: str,
    code: str,
    now: datetime,
    source: Source,
    user_id: str | None,
    conversation_id: str | None,
    tool: str,
    summary: str,
    reason: str,
    evidence: str | None,
) -> Proposal:
    """Store a proposal for the changes, waiting for a yes."""
    proposal = Proposal(
        id=proposal_id,
        created=now,
        source=source,
        user_id=user_id,
        conversation_id=conversation_id,
        tool=tool,
        summary=summary,
        reason=reason,
        evidence=evidence,
        changes=changes,
        code=code,
    )
    state.proposals[proposal.id] = proposal
    return proposal


def check_code(
    proposal: Proposal,
    code: str,
    *,
    now: datetime,
    user_id: str | None,
    conversation_id: str | None,
) -> None:
    """Raise unless the code can apply the proposal now, for this person and conversation."""
    if proposal.state is not ProposalState.PENDING:
        raise ProposalClosedError(f"The proposal was already {proposal.state.value}")
    if proposal.user_id != user_id:
        raise NotYourProposalError("The proposal was made by another person")
    if proposal.conversation_id is not None and proposal.conversation_id != conversation_id:
        raise NotYourProposalError("The proposal belongs to another conversation")
    if proposal.failed_attempts >= MAX_CODE_ATTEMPTS:
        raise TooManyAttemptsError("Too many wrong codes. Make the proposal again")
    if not hmac.compare_digest(code.strip().upper().encode(), proposal.code.encode()):
        raise CodeWrongError("The confirm code does not match")
    if now >= proposal.code_expires():
        raise CodeExpiredError("The confirm code has expired. Make the proposal again")


def apply_proposal(
    state: TankState,
    proposal_id: str,
    code: str,
    *,
    history_id: str,
    now: datetime,
    source: Source,
    user_id: str | None,
    conversation_id: str | None,
) -> HistoryEntry:
    """Apply a pending proposal with its confirm code. A wrong code counts as an attempt."""
    proposal = state.proposal(proposal_id)
    try:
        check_code(proposal, code, now=now, user_id=user_id, conversation_id=conversation_id)
    except CodeWrongError:
        state.proposals[proposal.id] = replace(proposal, failed_attempts=proposal.failed_attempts + 1)
        raise
    return _apply(state, proposal, history_id=history_id, now=now, source=source, user_id=user_id)


def accept_proposal(
    state: TankState, proposal_id: str, *, history_id: str, now: datetime, source: Source, user_id: str | None
) -> HistoryEntry:
    """Apply a pending proposal from a notification or the panel. No code: the person must be known."""
    proposal = state.proposal(proposal_id)
    if proposal.state is not ProposalState.PENDING:
        raise ProposalClosedError(f"The proposal was already {proposal.state.value}")
    if user_id is None:
        raise InvalidInputError("Accepting without a code needs a known person")
    return _apply(state, proposal, history_id=history_id, now=now, source=source, user_id=user_id)


def _apply(
    state: TankState, proposal: Proposal, *, history_id: str, now: datetime, source: Source, user_id: str | None
) -> HistoryEntry:
    if not proposal.changes:
        raise NothingToChangeError("The batch has no changes yet")
    entry = apply_changes(
        state,
        proposal.changes,
        history_id=history_id,
        now=now,
        source=source,
        conversation_id=proposal.conversation_id,
        summary=proposal.summary,
        proposal_id=proposal.id,
        user_id=user_id,
    )
    state.proposals[proposal.id] = replace(
        proposal, state=ProposalState.APPLIED, decided=now, decided_by=user_id, history_id=entry.id
    )
    return entry


def reject_proposal(
    state: TankState, proposal_id: str, *, now: datetime, user_id: str | None, any_user: bool = False
) -> Proposal:
    """Close a pending proposal without applying it.

    Only the person who made it can, unless any_user, as from a notification.
    """
    proposal = state.proposal(proposal_id)
    if proposal.state is not ProposalState.PENDING:
        raise ProposalClosedError(f"The proposal was already {proposal.state.value}")
    if not any_user and proposal.user_id != user_id:
        raise NotYourProposalError("The proposal was made by another person")
    rejected = replace(proposal, state=ProposalState.REJECTED, decided=now, decided_by=user_id)
    state.proposals[proposal.id] = rejected
    return rejected


def tank_is_empty(state: TankState) -> bool:
    """Whether the tank has nothing that setup fills in yet."""
    return not any(state.records[collection] for collection in SETUP_COLLECTIONS)


def find_batch(state: TankState, *, user_id: str | None, conversation_id: str | None) -> Proposal | None:
    """The person's pending batch in the conversation, open or not."""
    if conversation_id is None:
        return None
    for proposal in reversed(state.proposals.values()):
        if (
            proposal.batch
            and proposal.state is ProposalState.PENDING
            and proposal.user_id == user_id
            and proposal.conversation_id == conversation_id
        ):
            return proposal
    return None


def batch_view(state: TankState, proposal: Proposal) -> TankState:
    """The records as they would be with the batch applied. History and proposals are shared."""
    records = {collection: dict(items) for collection, items in state.records.items()}
    for change in proposal.changes:
        if change.after is None:
            records[change.collection].pop(change.record_id, None)
        else:
            records[change.collection][change.record_id] = change.after
    return TankState(
        records=records,
        history=state.history,
        proposals=state.proposals,
        conversations=state.conversations,
        light_log=state.light_log,
        reviews=state.reviews,
        photo_checks=state.photo_checks,
    )


def start_batch(
    state: TankState,
    *,
    proposal_id: str,
    code: str,
    now: datetime,
    source: Source,
    user_id: str | None,
    conversation_id: str | None,
    summary: str,
    reason: str,
    setup: bool,
) -> Proposal:
    """Open a batch for the person in the conversation, or return the one already open.

    An expired batch is rejected and its changes carry over to the new one.
    """
    if conversation_id is None:
        raise InvalidInputError("A batch needs a conversation_id from tankkeeper__save_conversation")
    existing = find_batch(state, user_id=user_id, conversation_id=conversation_id)
    if existing is not None and existing.is_open(now):
        if setup and not existing.setup:
            raise BatchOpenError("This conversation already has an open batch. Apply or reject it first")
        return existing
    if setup and not tank_is_empty(state):
        raise TankNotEmptyError("Setup is only for a new or empty tank. Use tankkeeper__start_batch")
    changes: tuple[Change, ...] = ()
    steps: tuple[Step, ...] = ()
    if existing is not None:
        reject_proposal(state, existing.id, now=now, user_id=user_id)
        changes = _rebased(state, existing.changes)
        steps = existing.steps
    proposal = Proposal(
        id=proposal_id,
        created=now,
        source=source,
        user_id=user_id,
        conversation_id=conversation_id,
        tool="start_setup" if setup else "start_batch",
        summary=summary,
        reason=reason,
        evidence=None,
        changes=changes,
        code=code,
        batch=True,
        setup=setup,
        updated=now,
        steps=steps,
    )
    state.proposals[proposal.id] = proposal
    return proposal


def add_to_batch(
    state: TankState,
    proposal_id: str,
    targets: Iterable[tuple[Collection, str, Record | None]],
    *,
    now: datetime,
    tool: str,
    summary: str,
    reason: str,
    evidence: str | None,
) -> Proposal:
    """Add changes to an open batch. A record changed twice keeps one change, from now to its newest value."""
    proposal = state.proposal(proposal_id)
    if proposal.state is not ProposalState.PENDING:
        raise ProposalClosedError(f"The batch was already {proposal.state.value}")
    if not proposal.is_open(now):
        raise BatchExpiredError(
            "The batch can take no more changes. Call tankkeeper__start_batch again to carry its changes on"
        )
    planned = plan_changes(batch_view(state, proposal), targets)
    merged = {(change.collection, change.record_id): change for change in proposal.changes}
    for change in planned:
        key = (change.collection, change.record_id)
        before = merged[key].before if key in merged else change.before
        merged[key] = replace(change, before=before)
    changes = tuple(change for change in merged.values() if change.before != change.after)
    step = Step(time=now, tool=tool, summary=summary, reason=reason, evidence=evidence)
    added = replace(proposal, changes=changes, updated=now, steps=(*proposal.steps, step))
    state.proposals[proposal.id] = added
    return added


def _rebased(state: TankState, changes: tuple[Change, ...]) -> tuple[Change, ...]:
    rebased = (
        Change(
            collection=change.collection,
            record_id=change.record_id,
            before=state.get(change.collection, change.record_id),
            after=change.after,
        )
        for change in changes
    )
    return tuple(change for change in rebased if change.before != change.after)


def check_delete(request: DeleteRequest, code: str, *, now: datetime) -> None:
    """Raise unless the code can delete the conversation now."""
    if request.failed_attempts >= MAX_CODE_ATTEMPTS:
        raise TooManyAttemptsError("Too many wrong codes. Ask to delete it again")
    if not hmac.compare_digest(code.strip().upper().encode(), request.code.encode()):
        raise CodeWrongError("The confirm code does not match")
    if now >= request.created + CODE_LIFETIME:
        raise CodeExpiredError("The confirm code has expired. Ask to delete it again")


def rename_conversation(state: TankState, conversation_id: str, title: str) -> Conversation:
    """Give a conversation a new title. Its place among the newest stays."""
    current = state.conversation(conversation_id)
    name = title.strip()
    if not name:
        raise InvalidInputError("A title needs some text")
    renamed = replace(current, title=name)
    state.conversations[conversation_id] = renamed
    return renamed


def record_turn(
    state: TankState,
    *,
    conversation_id: str,
    now: datetime,
    source: Source,
    user_id: str | None,
    messages: Iterable[Message],
) -> Conversation:
    """Add what was said and done in a turn, starting the conversation if needed.

    Past MAX_RECORDED_MESSAGES, the oldest tool calls go first, then the oldest messages.
    """
    current = state.conversations.get(conversation_id)
    every = (*(() if current is None else current.messages), *messages)
    kept = _keep_newest(every, MAX_RECORDED_MESSAGES)
    if current is None:
        conversation = Conversation(
            id=conversation_id,
            source=source,
            user_id=user_id,
            started=now,
            updated=now,
            title="",
            summary="",
            messages=kept,
        )
    else:
        conversation = replace(current, updated=now, messages=kept)
    state.conversations[conversation_id] = conversation
    return conversation


def _keep_newest(messages: tuple[Message, ...], limit: int) -> tuple[Message, ...]:
    excess = len(messages) - limit
    if excess <= 0:
        return messages
    tools = [index for index, message in enumerate(messages) if message.role not in SAID_ROLES][:excess]
    dropped = set(tools)
    kept = tuple(message for index, message in enumerate(messages) if index not in dropped)
    return kept[len(kept) - limit :]


def delete_conversation(state: TankState, conversation_id: str) -> None:
    """Delete a conversation. The changes it made stay in the history."""
    state.conversation(conversation_id)
    del state.conversations[conversation_id]


def save_conversation(
    state: TankState,
    *,
    conversation_id: str,
    now: datetime,
    source: Source,
    user_id: str | None,
    title: str | None,
    summary: str | None,
    messages: Iterable[Message],
) -> Conversation:
    """Start a conversation, or update its title and summary and add messages."""
    current = state.conversations.get(conversation_id)
    messages = tuple(messages)
    if messages and len(messages) + (0 if current is None else len(current.messages)) > MAX_CONVERSATION_MESSAGES:
        raise ConversationFullError(
            f"A conversation holds up to {MAX_CONVERSATION_MESSAGES} messages. Start a new conversation"
        )
    if current is None:
        conversation = Conversation(
            id=conversation_id,
            source=source,
            user_id=user_id,
            started=now,
            updated=now,
            title=title or "",
            summary=summary or "",
            messages=messages,
        )
    else:
        conversation = replace(
            current,
            updated=now,
            title=current.title if title is None else title,
            summary=current.summary if summary is None else summary,
            messages=(*current.messages, *messages),
        )
    state.conversations[conversation_id] = conversation
    return conversation


def search_conversations(state: TankState, query: str) -> list[Conversation]:
    """Conversations that hold the query, newest first."""
    found = [conversation for conversation in state.conversations.values() if conversation.text_contains(query)]
    return sorted(found, key=lambda conversation: conversation.updated, reverse=True)


CODE_KEYS = frozenset({"code", "code_expires", "next_step"})


def changes_in_conversation(state: TankState, conversation_id: str) -> list[HistoryEntry]:
    """History entries made in a conversation, oldest first."""
    return [entry for entry in state.history if entry.conversation_id == conversation_id]


def without_codes(value: JsonValue) -> JsonValue:
    """The value with every confirm code, its expiry and the step that uses it left out, at any depth."""
    return without_keys(value, CODE_KEYS)


def without_keys(value: JsonValue, keys: frozenset[str]) -> JsonValue:
    """The value with the given keys left out, at any depth."""
    if isinstance(value, dict):
        return {key: without_keys(item, keys) for key, item in value.items() if key not in keys}
    if isinstance(value, list):
        return [without_keys(item, keys) for item in value]
    return value


def merge_record(current: Mapping[str, JsonValue], updates: Mapping[str, JsonValue]) -> Record:
    """A copy of the record with the given fields replaced."""
    return {**current, **updates}


def dosing_within_tank(tank: Mapping[str, JsonValue]) -> bool:
    """Whether the tank's dosing volume is no larger than its full volume."""
    volume = tank.get("volume_litres")
    dosing = tank.get("dosing_volume_litres")
    if isinstance(volume, int | float) and isinstance(dosing, int | float):
        return dosing <= volume
    return True


def dose_for_volume(amount_ml: float, per_litres: float, volume_litres: float, step_ml: float = 0.1) -> float:
    """A label dose scaled to a volume of water, rounded half up to the measuring step."""
    if amount_ml < 0 or per_litres <= 0 or volume_litres < 0 or step_ml <= 0:
        raise ValueError("Doses and volumes must be positive")
    exact = Decimal(str(amount_ml)) * Decimal(str(volume_litres)) / Decimal(str(per_litres))
    step = Decimal(str(step_ml))
    steps = (exact / step).quantize(Decimal(1), rounding=ROUND_HALF_UP)
    return float(steps * step)


def _str(value: JsonValue) -> str:
    if not isinstance(value, str):
        raise TypeError(f"Expected a string, got {value!r}")
    return value


def _optional_str(value: JsonValue) -> str | None:
    return None if value is None else _str(value)


def _bool(value: JsonValue) -> bool:
    if not isinstance(value, bool):
        raise TypeError(f"Expected true or false, got {value!r}")
    return value


def _int(value: JsonValue) -> int:
    if not isinstance(value, int) or isinstance(value, bool):
        raise TypeError(f"Expected an integer, got {value!r}")
    return value


def _list(value: JsonValue) -> list[JsonValue]:
    if not isinstance(value, list):
        raise TypeError(f"Expected a list, got {value!r}")
    return value


def _record(value: JsonValue) -> Record:
    if not isinstance(value, dict):
        raise TypeError(f"Expected an object, got {value!r}")
    return value


def _optional_record(value: JsonValue) -> Record | None:
    return None if value is None else _record(value)
