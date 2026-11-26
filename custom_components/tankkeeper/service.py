"""The one service layer that tools, flows and entities use to read and change records."""

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from datetime import datetime
import secrets

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.ulid import ulid_now

from .const import DOMAIN, STORAGE_VERSION
from .domain import (
    CODE_ALPHABET,
    CODE_LENGTH,
    TANK_ID,
    Collection,
    Conversation,
    HistoryEntry,
    Message,
    NotFoundError,
    Proposal,
    ProposalState,
    Record,
    Source,
    TankState,
    apply_changes,
    apply_proposal,
    changes_in_conversation,
    plan_changes,
    propose,
    reject_proposal,
    save_conversation,
    search_conversations,
    undo_changes,
)

type Target = tuple[Collection, str, Record | None]


@dataclass(frozen=True, slots=True, kw_only=True)
class Actor:
    """Who is asking, from where, and in which conversation."""

    source: Source
    user_id: str | None
    conversation_id: str | None


def new_code() -> str:
    """A random confirm code."""
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LENGTH))


class TankkeeperService:
    """Holds one tank's records and saves every change to Home Assistant storage."""

    def __init__(
        self,
        hass: HomeAssistant,
        entry_id: str,
        *,
        clock: Callable[[], datetime] = dt_util.utcnow,
        code_factory: Callable[[], str] = new_code,
    ) -> None:
        """Set up storage for the config entry."""
        self._store: Store[Record] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry_id}")
        self._clock = clock
        self._code_factory = code_factory
        self._listeners: list[CALLBACK_TYPE] = []
        self.state = TankState()

    async def async_load(self, tank: Record) -> None:
        """Load the records, or start a new tank with the given details."""
        stored = await self._store.async_load()
        if stored is None:
            self.state = TankState()
            self.state.records[Collection.TANK][TANK_ID] = tank
            await self._async_save()
        else:
            self.state = TankState.from_json(stored)

    async def async_remove(self) -> None:
        """Delete the stored records."""
        await self._store.async_remove()

    @callback
    def async_add_listener(self, listener: CALLBACK_TYPE) -> CALLBACK_TYPE:
        """Call the listener after every saved change. Returns a function that stops it."""
        self._listeners.append(listener)

        @callback
        def remove() -> None:
            self._listeners.remove(listener)

        return remove

    def records(self, collection: Collection) -> dict[str, Record]:
        """Every record in a collection, by id."""
        return dict(self.state.records[collection])

    def pending_proposals(self) -> list[Proposal]:
        """Proposals waiting for a yes, oldest first."""
        return [proposal for proposal in self.state.proposals.values() if proposal.state is ProposalState.PENDING]

    def history(self, collection: Collection | None, record_id: str | None, limit: int) -> list[HistoryEntry]:
        """The newest history entries, optionally only those touching one collection or record."""
        entries = [
            entry
            for entry in self.state.history
            if any(
                (collection is None or change.collection is collection)
                and (record_id is None or change.record_id == record_id)
                for change in entry.changes
            )
        ]
        return list(reversed(entries))[:limit]

    def conversation(self, conversation_id: str) -> tuple[Conversation, list[HistoryEntry]]:
        """A conversation and the changes made in it."""
        return self.state.conversation(conversation_id), changes_in_conversation(self.state, conversation_id)

    def conversations(self, limit: int) -> list[Conversation]:
        """The newest conversations."""
        ordered = sorted(self.state.conversations.values(), key=lambda item: item.updated, reverse=True)
        return ordered[:limit]

    def search_conversations(self, query: str, limit: int) -> list[Conversation]:
        """Conversations that hold the query, newest first."""
        return search_conversations(self.state, query)[:limit]

    async def async_record(self, collection: Collection, record: Record, actor: Actor, summary: str) -> HistoryEntry:
        """Add a record straight away, as for doses, tests, contents and notes."""
        return await self.async_set(((collection, ulid_now(), record),), actor, summary)

    async def async_set(self, targets: Iterable[Target], actor: Actor, summary: str) -> HistoryEntry:
        """Set records straight away, keeping the old versions in the history."""
        self._check_conversation(actor)
        entry = apply_changes(
            self.state,
            plan_changes(self.state, targets),
            history_id=ulid_now(),
            now=self._clock(),
            source=actor.source,
            conversation_id=actor.conversation_id,
            summary=summary,
        )
        await self._async_save()
        return entry

    async def async_propose(
        self,
        targets: Iterable[Target],
        actor: Actor,
        *,
        tool: str,
        summary: str,
        reason: str,
        evidence: str | None,
    ) -> Proposal:
        """Store a proposal for the targets. Nothing changes until it is applied."""
        self._check_conversation(actor)
        proposal = propose(
            self.state,
            plan_changes(self.state, targets),
            proposal_id=ulid_now(),
            code=self._code_factory(),
            now=self._clock(),
            source=actor.source,
            user_id=actor.user_id,
            conversation_id=actor.conversation_id,
            tool=tool,
            summary=summary,
            reason=reason,
            evidence=evidence,
        )
        await self._async_save()
        return proposal

    async def async_propose_undo(self, history_id: str, actor: Actor, reason: str) -> Proposal:
        """Propose putting back what a history entry changed."""
        entry = self.state.history_entry(history_id)
        targets = [(change.collection, change.record_id, change.after) for change in undo_changes(entry)]
        return await self.async_propose(
            targets, actor, tool="undo_change", summary=f"Undo: {entry.summary}", reason=reason, evidence=None
        )

    async def async_apply(self, proposal_id: str, code: str, actor: Actor) -> HistoryEntry:
        """Apply a proposal with its confirm code. A wrong code is saved as a failed attempt."""
        try:
            entry = apply_proposal(
                self.state,
                proposal_id,
                code,
                history_id=ulid_now(),
                now=self._clock(),
                source=actor.source,
                user_id=actor.user_id,
                conversation_id=actor.conversation_id,
            )
        finally:
            await self._async_save()
        return entry

    async def async_reject(self, proposal_id: str, actor: Actor) -> Proposal:
        """Close a proposal without applying it."""
        proposal = reject_proposal(self.state, proposal_id, now=self._clock(), user_id=actor.user_id)
        await self._async_save()
        return proposal

    async def async_save_conversation(
        self,
        conversation_id: str | None,
        actor: Actor,
        *,
        title: str | None,
        summary: str | None,
        messages: Iterable[Message],
    ) -> Conversation:
        """Start a conversation, or add to one."""
        if conversation_id is not None and conversation_id not in self.state.conversations:
            raise NotFoundError(f"No conversation with id {conversation_id}")
        conversation = save_conversation(
            self.state,
            conversation_id=conversation_id or ulid_now(),
            now=self._clock(),
            source=actor.source,
            user_id=actor.user_id,
            title=title,
            summary=summary,
            messages=messages,
        )
        await self._async_save()
        return conversation

    def _check_conversation(self, actor: Actor) -> None:
        if actor.conversation_id is not None:
            self.state.conversation(actor.conversation_id)

    async def _async_save(self) -> None:
        await self._store.async_save(self.state.to_json())
        for listener in list(self._listeners):
            listener()
