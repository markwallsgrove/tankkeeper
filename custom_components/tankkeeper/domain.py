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

type JsonValue = str | int | float | bool | list[JsonValue] | dict[str, JsonValue] | None
type Record = dict[str, JsonValue]

CODE_LIFETIME = timedelta(minutes=15)
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 6
MAX_CODE_ATTEMPTS = 5
MAX_CONVERSATION_MESSAGES = 200
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


class Source(StrEnum):
    """Who made a change."""

    PANEL = "panel"
    ASSIST = "assist"
    MCP = "mcp"
    RULE = "rule"


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

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "id": self.id,
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
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class Proposal:
    """A change waiting for a yes, with a one-use confirm code."""

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

    def code_expires(self) -> datetime:
        """When the confirm code stops working."""
        return self.created + CODE_LIFETIME

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
        }

    @classmethod
    def from_json(cls, data: Record) -> Proposal:
        """Read from storage."""
        decided = _optional_str(data["decided"])
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
        needle = query.casefold()
        return any(
            needle in text.casefold()
            for text in (self.title, self.summary, *(message.text for message in self.messages))
        )


@dataclass(slots=True)
class TankState:
    """Every record, the history, proposals and conversations of one tank, and the lights' on/off log."""

    records: dict[Collection, dict[str, Record]] = field(
        default_factory=lambda: {collection: {} for collection in Collection}
    )
    history: list[HistoryEntry] = field(default_factory=list)
    proposals: dict[str, Proposal] = field(default_factory=dict)
    conversations: dict[str, Conversation] = field(default_factory=dict)
    light_log: list[Record] = field(default_factory=list)

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
    entry = apply_changes(
        state,
        proposal.changes,
        history_id=history_id,
        now=now,
        source=source,
        conversation_id=proposal.conversation_id,
        summary=proposal.summary,
        proposal_id=proposal.id,
    )
    state.proposals[proposal.id] = replace(proposal, state=ProposalState.APPLIED, decided=now, history_id=entry.id)
    return entry


def reject_proposal(state: TankState, proposal_id: str, *, now: datetime, user_id: str | None) -> Proposal:
    """Close a pending proposal without applying it. Only the person who made it can."""
    proposal = state.proposal(proposal_id)
    if proposal.state is not ProposalState.PENDING:
        raise ProposalClosedError(f"The proposal was already {proposal.state.value}")
    if proposal.user_id != user_id:
        raise NotYourProposalError("The proposal was made by another person")
    rejected = replace(proposal, state=ProposalState.REJECTED, decided=now)
    state.proposals[proposal.id] = rejected
    return rejected


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
    if len(messages) + (0 if current is None else len(current.messages)) > MAX_CONVERSATION_MESSAGES:
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


def changes_in_conversation(state: TankState, conversation_id: str) -> list[HistoryEntry]:
    """History entries made in a conversation, oldest first."""
    return [entry for entry in state.history if entry.conversation_id == conversation_id]


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
