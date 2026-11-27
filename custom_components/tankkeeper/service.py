"""The one service layer that tools, flows and entities use to read and change records."""

from collections.abc import Callable, Iterable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, replace
from datetime import date, datetime
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
    InvalidInputError,
    Message,
    NotFoundError,
    NothingToChangeError,
    Proposal,
    ProposalState,
    Record,
    Source,
    TankState,
    accept_proposal,
    add_to_batch,
    apply_changes,
    apply_proposal,
    batch_view,
    changes_in_conversation,
    delete_conversation,
    find_batch,
    plan_changes,
    propose,
    reject_proposal,
    save_conversation,
    search_conversations,
    start_batch,
    tank_is_empty,
    undo_changes,
)
from .lights import Light, LightEvent, LightStatus, dose_time, prune_log
from .plan import REMINDERS_ID, Reminders, Task, TaskStatus, summary_for
from .rules import RULES_ID, Facts, LightCheck, Reading, RuleSettings, Stage, Status, evaluate

type Target = tuple[Collection, str, Record | None]

_DRAFT: ContextVar[tuple[TankkeeperService, TankState] | None] = ContextVar("tankkeeper_draft", default=None)


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
        self.hass = hass
        self._store: Store[Record] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry_id}")
        self._clock = clock
        self._code_factory = code_factory
        self._listeners: list[CALLBACK_TYPE] = []
        self._light_status: dict[str, LightStatus] = {}
        self._state = TankState()

    @property
    def state(self) -> TankState:
        """The records to read. Inside drafting, they include the open batch's changes."""
        draft = _DRAFT.get()
        return draft[1] if draft is not None and draft[0] is self else self._state

    @contextmanager
    def drafting(self, actor: Actor) -> Iterator[None]:
        """Read the records as the person's open batch would leave them, so a change builds on the batch."""
        batch = find_batch(self._state, user_id=actor.user_id, conversation_id=actor.conversation_id)
        if batch is None or not batch.is_open(self._clock()):
            yield
            return
        token = _DRAFT.set((self, batch_view(self._state, batch)))
        try:
            yield
        finally:
            _DRAFT.reset(token)

    async def async_load(self, tank: Record) -> None:
        """Load the records, or start a new tank with the given details."""
        stored = await self._store.async_load()
        if stored is None:
            self._state = TankState()
            self._state.records[Collection.TANK][TANK_ID] = tank
            await self._async_save()
        else:
            self._state = TankState.from_json(stored)

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

    def now(self) -> datetime:
        """The time now, from the service's clock."""
        return self._clock()

    def tank_name(self) -> str:
        """The tank's name."""
        return str(self.state.records[Collection.TANK].get(TANK_ID, {}).get("name") or DOMAIN.capitalize())

    def tasks(self) -> list[Task]:
        """Every task in the plan."""
        return [Task.from_record(task_id, record) for task_id, record in self.state.records[Collection.TASKS].items()]

    def task(self, task_id: str) -> Task:
        """One task, or NotFoundError."""
        return Task.from_record(task_id, self.state.require(Collection.TASKS, task_id))

    def reminders(self) -> Reminders:
        """The reminder settings."""
        return Reminders.from_json(self.state.get(Collection.SETTINGS, REMINDERS_ID))

    def reminders_on(self, day: date) -> Reminders:
        """The reminder settings for a day, with doses due when the first light turns on."""
        reminders = self.reminders()
        return replace(reminders, dose_time=dose_time(self.active_lights(), day, reminders.dose_time))

    def lights(self) -> list[Light]:
        """Every light, removed ones included."""
        return [
            Light.from_record(light_id, record) for light_id, record in self.state.records[Collection.LIGHTS].items()
        ]

    def active_lights(self) -> list[Light]:
        """The lights that have not been removed."""
        return [light for light in self.lights() if light.active]

    def has_lights(self) -> bool:
        """Whether a light is set."""
        return bool(self.active_lights())

    def light(self, light_id: str) -> Light:
        """One light that has not been removed, or NotFoundError."""
        light = Light.from_record(light_id, self.state.require(Collection.LIGHTS, light_id))
        if not light.active:
            raise NotFoundError(f"The light {light_id} was removed")
        return light

    def light_targets(self, light: Light) -> list[Target]:
        """The change that stores a light, after checking the integration can run it."""
        return [light_target(self.hass, light, self.active_lights())]

    def reason_for(self, entry: HistoryEntry) -> str | None:
        """The reason the proposal behind a history entry gave."""
        proposal = None if entry.proposal_id is None else self.state.proposals.get(entry.proposal_id)
        return None if proposal is None else proposal.reason

    def light_log(self) -> list[LightEvent]:
        """The on/off log of every light, oldest first."""
        return [LightEvent.from_json(event) for event in self.state.light_log]

    @callback
    def log_light(self, *events: LightEvent) -> None:
        """Add to the on/off log straight away, keeping only the last LOG_DAYS days, and save it."""
        log = prune_log([*self.light_log(), *events], self._clock())
        self._state.light_log = [event.to_json() for event in log]
        self.hass.async_create_task(self._async_save(), eager_start=False)

    def light_status(self, light_id: str) -> LightStatus:
        """Whether a light is following its schedule. Kept in memory only."""
        return self._light_status.get(light_id, LightStatus())

    @callback
    def set_light_status(self, light_id: str, status: LightStatus) -> None:
        """Change a light's status and tell the listeners."""
        if status == self.light_status(light_id):
            return
        if status.problem:
            self._light_status[light_id] = status
        else:
            self._light_status.pop(light_id, None)
        self.notify()

    @callback
    def notify(self) -> None:
        """Tell the listeners that something changed. They read the stored records, not a draft."""
        token = _DRAFT.set(None)
        try:
            for listener in list(self._listeners):
                listener()
        finally:
            _DRAFT.reset(token)

    def stage(self) -> Stage | None:
        """Whether the tank is cycling, from the tank details. None when it is not set."""
        stage = self.state.records[Collection.TANK].get(TANK_ID, {}).get("stage")
        return Stage(stage) if stage in list(Stage) else None

    def rule_settings(self) -> RuleSettings:
        """The limits of the rules."""
        return RuleSettings.from_json(self.state.get(Collection.SETTINGS, RULES_ID))

    def stage_targets(self, stage: Stage | None) -> list[Target]:
        """The change that stores whether the tank is cycling. None takes the stage away."""
        tank = {
            key: value for key, value in self.state.records[Collection.TANK].get(TANK_ID, {}).items() if key != "stage"
        }
        if stage is not None:
            tank["stage"] = stage.value
        return [(Collection.TANK, TANK_ID, tank)]

    def rule_targets(self, settings: RuleSettings) -> list[Target]:
        """The change that stores new rule limits, after checking them."""
        settings.check()
        if settings == self.rule_settings():
            raise NothingToChangeError("The rule limits already look like that")
        return [(Collection.SETTINGS, RULES_ID, settings.to_json())]

    def readings(self) -> list[Reading]:
        """Every water test in the log."""
        readings = []
        for entry in self.state.records[Collection.LOG].values():
            values = entry.get("values")
            moment = dt_util.parse_datetime(str(entry.get("time")))
            if entry.get("kind") != "test" or not isinstance(values, dict) or moment is None:
                continue
            numbers = {
                name: float(value)
                for name, value in values.items()
                if isinstance(value, int | float) and not isinstance(value, bool)
            }
            readings.append(Reading(time=moment, source=str(entry.get("source")), values=numbers))
        return readings

    def status(self) -> Status:
        """The rules' result for the records now."""
        facts = Facts(
            now=self._clock(),
            tz=dt_util.get_default_time_zone(),
            stage=self.stage(),
            readings=tuple(self.readings()),
            tasks=tuple(self.tasks()),
            lights=tuple(
                LightCheck(name=light.model, entity_id=light.entity_id, status=self.light_status(light.id))
                for light in self.active_lights()
            ),
        )
        return evaluate(facts, self.rule_settings())

    def product_names(self) -> list[str]:
        """The name of every product, to tell doses from other tasks."""
        return [
            str(product["name"]) for product in self.state.records[Collection.PRODUCTS].values() if product.get("name")
        ]

    def reminder_targets(self, reminders: Reminders) -> list[Target]:
        """The change that stores new reminder settings, or NothingToChangeError when they are the same."""
        if reminders == self.reminders():
            raise NothingToChangeError("The reminders already look like that")
        return [(Collection.SETTINGS, REMINDERS_ID, reminders.to_json())]

    async def async_finish_task(self, task_id: str, status: TaskStatus, note: str | None, actor: Actor) -> HistoryEntry:
        """Complete or skip a task straight away."""
        finished = self.task(task_id).finish(status, note, self._clock())
        return await self.async_set([(Collection.TASKS, task_id, finished.to_record())], actor, summary_for(finished))

    def tank_is_empty(self) -> bool:
        """Whether the tank has nothing that setup fills in yet."""
        return tank_is_empty(self._state)

    def batch(self, actor: Actor) -> Proposal:
        """The person's pending batch in the conversation, or NotFoundError."""
        batch = find_batch(self._state, user_id=actor.user_id, conversation_id=actor.conversation_id)
        if batch is None:
            raise NotFoundError("No batch is waiting in this conversation. Call tankkeeper__start_batch")
        return batch

    def batch_records(self, batch: Proposal) -> TankState:
        """The records as the batch would leave them."""
        return batch_view(self._state, batch)

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
            self._state,
            plan_changes(self._state, targets),
            history_id=ulid_now(),
            now=self._clock(),
            source=actor.source,
            conversation_id=actor.conversation_id,
            summary=summary,
            user_id=actor.user_id,
        )
        await self._async_save()
        return entry

    async def async_change(
        self,
        targets: Iterable[Target],
        actor: Actor,
        *,
        tool: str,
        summary: str,
        reason: str,
        evidence: str | None,
    ) -> Proposal | HistoryEntry:
        """Apply a change from the panel straight away, as the options flow does. Anyone else gets a proposal."""
        if actor.source is Source.PANEL:
            return await self.async_set(targets, actor, summary)
        return await self.async_propose(targets, actor, tool=tool, summary=summary, reason=reason, evidence=evidence)

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
        """Store a proposal for the targets, or add them to the person's batch. Nothing changes until it is applied."""
        self._check_conversation(actor)
        batch = find_batch(self._state, user_id=actor.user_id, conversation_id=actor.conversation_id)
        if batch is not None:
            added = add_to_batch(
                self._state,
                batch.id,
                targets,
                now=self._clock(),
                tool=tool,
                summary=summary,
                reason=reason,
                evidence=evidence,
            )
            await self._async_save()
            return added
        proposal = propose(
            self._state,
            plan_changes(self._state, targets),
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

    async def async_undo(self, history_id: str, actor: Actor, reason: str) -> Proposal | HistoryEntry:
        """Put back what a history entry changed: straight away from the panel, otherwise as a proposal."""
        entry = self._state.history_entry(history_id)
        targets = [(change.collection, change.record_id, change.after) for change in undo_changes(entry)]
        return await self.async_change(
            targets, actor, tool="undo_change", summary=f"Undo: {entry.summary}", reason=reason, evidence=None
        )

    async def async_apply(self, proposal_id: str, code: str, actor: Actor) -> HistoryEntry:
        """Apply a proposal with its confirm code. A wrong code is saved as a failed attempt."""
        try:
            entry = apply_proposal(
                self._state,
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

    async def async_start_batch(self, actor: Actor, *, summary: str, reason: str, setup: bool) -> Proposal:
        """Open a batch for the person in the conversation, or return the open one."""
        self._check_conversation(actor)
        batch = start_batch(
            self._state,
            proposal_id=ulid_now(),
            code=self._code_factory(),
            now=self._clock(),
            source=actor.source,
            user_id=actor.user_id,
            conversation_id=actor.conversation_id,
            summary=summary,
            reason=reason,
            setup=setup,
        )
        await self._async_save()
        return batch

    async def async_accept(self, proposal_id: str, user_id: str | None, source: Source) -> HistoryEntry:
        """Apply a proposal from its notification or the panel, recording who accepted it."""
        entry = accept_proposal(
            self._state, proposal_id, history_id=ulid_now(), now=self._clock(), source=source, user_id=user_id
        )
        await self._async_save()
        return entry

    async def async_decline(self, proposal_id: str, user_id: str | None) -> Proposal:
        """Reject a proposal from its notification or the panel, recording who rejected it."""
        proposal = reject_proposal(self._state, proposal_id, now=self._clock(), user_id=user_id, any_user=True)
        await self._async_save()
        return proposal

    async def async_mark_notified(self, proposal_ids: Iterable[str]) -> None:
        """Remember that the proposals were sent, so they are sent once."""
        for proposal_id in proposal_ids:
            self._state.proposals[proposal_id] = replace(self._state.proposal(proposal_id), notified=True)
        await self._async_save()

    async def async_reject(self, proposal_id: str, actor: Actor) -> Proposal:
        """Close a proposal without applying it."""
        proposal = reject_proposal(self._state, proposal_id, now=self._clock(), user_id=actor.user_id)
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
        if conversation_id is not None and conversation_id not in self._state.conversations:
            raise NotFoundError(f"No conversation with id {conversation_id}")
        conversation = save_conversation(
            self._state,
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

    async def async_delete_conversation(self, conversation_id: str) -> None:
        """Delete a conversation. The changes it made stay in the history."""
        delete_conversation(self._state, conversation_id)
        await self._async_save()

    def _check_conversation(self, actor: Actor) -> None:
        if actor.conversation_id is not None:
            self._state.conversation(actor.conversation_id)

    async def _async_save(self) -> None:
        await self._store.async_save(self._state.to_json())
        self.notify()


def light_target(hass: HomeAssistant, light: Light, others: Iterable[Light]) -> Target:
    """The change that stores a light, after checking it and that its entity exists and is free. Setup uses it too."""
    light.check()
    if light.active:
        if hass.states.get(light.entity_id) is None:
            raise InvalidInputError(f"No entity {light.entity_id}")
        if any(other.id != light.id and other.entity_id == light.entity_id for other in others):
            raise InvalidInputError(f"Another light already uses {light.entity_id}")
    return (Collection.LIGHTS, light.id, light.to_record())
