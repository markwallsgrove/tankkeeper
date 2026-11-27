"""The one service layer that tools, flows and entities use to read and change records."""

from collections.abc import Awaitable, Callable, Iterable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, replace
from datetime import date, datetime
from functools import partial
from pathlib import Path
import secrets
import shutil

from homeassistant.components.recorder import history
from homeassistant.const import STATE_ON, STATE_UNAVAILABLE
from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.helpers.recorder import get_instance
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util
from homeassistant.util.ulid import ulid_now

from .claude import CLAUDE_ID, ClaudeSettings, check_settings
from .const import DOMAIN, STORAGE_VERSION
from .domain import (
    CODE_ALPHABET,
    CODE_LENGTH,
    CODE_LIFETIME,
    DELETED_CONVERSATION,
    NO_DELETE,
    TANK_ID,
    CodeExpiredError,
    CodeWrongError,
    Collection,
    Conversation,
    DeleteRequest,
    FindingClosedError,
    HistoryEntry,
    InvalidInputError,
    Match,
    Message,
    NotFoundError,
    NothingToChangeError,
    Proposal,
    ProposalState,
    Record,
    Source,
    TankkeeperError,
    TankState,
    TooManyAttemptsError,
    accept_proposal,
    add_to_batch,
    apply_changes,
    apply_proposal,
    batch_view,
    changes_in_conversation,
    check_delete,
    delete_conversation,
    find_batch,
    plan_changes,
    propose,
    record_turn,
    reject_proposal,
    rename_conversation,
    save_conversation,
    search_conversations,
    start_batch,
    tank_is_empty,
    undo_changes,
)
from .lights import InvalidLightError, Light, LightEvent, LightStatus, dose_time, history_periods, on_periods, prune_log
from .photos import (
    CAMERA_ID,
    CameraSettings,
    CheckReason,
    IssueState,
    PhotoCheck,
    asked_on,
    check_camera,
    kept_checks,
    photo_file,
    remove_unused,
    without_old_photos,
)
from .plan import REMINDERS_ID, Reminders, Task, TaskStatus, summary_for
from .reviews import Review, comments_on, kept
from .rules import RULES_ID, Facts, LightCheck, Reading, RuleSettings, Stage, Status, evaluate

type Target = tuple[Collection, str, Record | None]
type PhotoChecker = Callable[[CheckReason], Awaitable[PhotoCheck]]

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
        self.entry_id = entry_id
        self._store: Store[Record] = Store(hass, STORAGE_VERSION, f"{DOMAIN}.{entry_id}")
        self._clock = clock
        self._code_factory = code_factory
        self._listeners: list[CALLBACK_TYPE] = []
        self._light_status: dict[str, LightStatus] = {}
        self._state = TankState()
        self._photo_checker: PhotoChecker | None = None
        self._asking = 0
        self._deletes: dict[tuple[str, str | None], DeleteRequest] = {}
        self.photo_dir = Path(hass.config.path(DOMAIN, "photos"))

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
        """Delete the stored records and photos."""
        await self._store.async_remove()
        await self.hass.async_add_executor_job(shutil.rmtree, self.photo_dir, True)

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

    async def async_light_on_periods(
        self, light: Light, since: datetime, until: datetime
    ) -> list[tuple[datetime, datetime]]:
        """When a light was on, from the day it was added.

        Uses the recorder's state history and the state now, and the on/off log for the time before the recorder's
        first state, or for all of it when the recorder has none or is not loaded.
        """
        start = max(since, dt_util.start_of_local_day(light.added))
        logged = on_periods(self.light_log(), light.id, start, until)
        if "recorder" not in self.hass.config.components:
            return logged
        states = await get_instance(self.hass).async_add_executor_job(
            partial(
                history.state_changes_during_period,
                self.hass,
                start,
                until,
                entity_id=light.entity_id,
                no_attributes=True,
            )
        )
        recorded = states.get(light.entity_id, [])
        now = self.hass.states.get(light.entity_id)
        if recorded and now is not None:
            recorded = [*recorded, now]
        changes = [(state.last_changed, state.state == STATE_ON) for state in recorded]
        return history_periods(changes, logged, start, until)

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
                LightCheck(
                    name=light.model,
                    entity_id=light.entity_id,
                    automation=None if light.helpers is None else light.helpers.automation,
                    status=self.light_status(light.id),
                )
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

    def claude(self) -> ClaudeSettings:
        """The Claude settings."""
        return ClaudeSettings.from_json(self.state.get(Collection.SETTINGS, CLAUDE_ID))

    def claude_targets(self, settings: ClaudeSettings) -> list[Target]:
        """The change that stores new Claude settings. Raises InvalidInputError or NothingToChangeError."""
        check_settings(self.hass, settings)
        if settings == self.claude():
            raise NothingToChangeError("The Claude settings already look like that")
        return [(Collection.SETTINGS, CLAUDE_ID, settings.to_json())]

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

    def search_conversations(self, query: str, limit: int) -> list[tuple[Conversation, Match]]:
        """Conversations that hold the query, newest first, each with where it matches."""
        found = search_conversations(self.state, query)[:limit]
        return [(conversation, match) for conversation in found if (match := conversation.match(query)) is not None]

    def conversation_name(self, conversation_id: str | None) -> str | None:
        """The name of the conversation a change was made in, DELETED_CONVERSATION when it is gone."""
        if conversation_id is None:
            return None
        conversation = self.state.conversations.get(conversation_id)
        return DELETED_CONVERSATION if conversation is None else conversation.name()

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

    async def async_record_turn(self, conversation_id: str, actor: Actor, messages: Iterable[Message]) -> None:
        """Add messages to the conversation with this id, starting it if needed. Past the limit, old ones make room."""
        record_turn(
            self._state,
            conversation_id=conversation_id,
            now=self._clock(),
            source=actor.source,
            user_id=actor.user_id,
            messages=messages,
        )
        await self._async_save()

    async def async_rename_conversation(self, conversation_id: str, title: str) -> Conversation:
        """Give a conversation a new title."""
        conversation = rename_conversation(self._state, conversation_id, title)
        await self._async_save()
        return conversation

    def reviews(self, limit: int) -> list[Review]:
        """The latest reviews, newest first."""
        return [Review.from_json(item) for item in reversed(self._state.reviews)][:limit]

    def asked_today(self) -> int:
        """How many times Claude was asked today, for a review comment or a photo check. The daily cap counts both."""
        tz = dt_util.get_default_time_zone()
        today = self._clock().astimezone(tz).date()
        reviews = (Review.from_json(item) for item in self._state.reviews)
        return comments_on(reviews, today, tz) + asked_on(self.photo_checks(), today, tz) + self._asking

    @contextmanager
    def reserve_ask(self, cap: int) -> Iterator[bool]:
        """Count one question to Claude toward today's cap until its record is stored.

        Yields False when the cap is reached.

        The check and the count happen in one step, so two questions at the same time can't both pass the cap.
        """
        if self.asked_today() >= cap:
            yield False
            return
        self._asking += 1
        try:
            yield True
        finally:
            self._asking -= 1

    async def async_add_review(self, review: Review) -> None:
        """Store a review. Old ones are dropped, but never one from today."""
        tz = dt_util.get_default_time_zone()
        reviews = [*(Review.from_json(item) for item in self._state.reviews), review]
        today = self._clock().astimezone(tz).date()
        self._state.reviews = [item.to_json() for item in kept(reviews, today, tz)]
        await self._async_save()

    def camera(self) -> CameraSettings:
        """The camera settings."""
        return CameraSettings.from_json(self.state.get(Collection.SETTINGS, CAMERA_ID))

    def camera_targets(self, settings: CameraSettings) -> list[Target]:
        """The change that stores new camera settings. Raises InvalidInputError or NothingToChangeError."""
        check_camera(self.hass, settings)
        if settings == self.camera():
            raise NothingToChangeError("The camera settings already look like that")
        return [(Collection.SETTINGS, CAMERA_ID, settings.to_json())]

    def photo_checks(self) -> list[PhotoCheck]:
        """Every photo check kept, oldest first."""
        return [PhotoCheck.from_json(item) for item in self._state.photo_checks]

    def photo_check(self, check_id: str) -> PhotoCheck:
        """One photo check, or NotFoundError."""
        for check in self.photo_checks():
            if check.id == check_id:
                return check
        raise NotFoundError(f"No photo check with id {check_id}")

    def open_issues(self) -> list[PhotoCheck]:
        """The issues the camera found that wait for the owner, newest first."""
        return [check for check in reversed(self.photo_checks()) if check.state is IssueState.OPEN]

    def photo_path(self, check: PhotoCheck) -> Path | None:
        """Where the check's photo is stored, or None when it has none."""
        return photo_file(self.photo_dir, check)

    @callback
    def set_photo_checker(self, checker: PhotoChecker) -> CALLBACK_TYPE:
        """Let the tools run photo checks with the camera runner. Returns a function that stops it."""
        self._photo_checker = checker

        @callback
        def remove() -> None:
            self._photo_checker = None

        return remove

    async def async_check_photo(self, reason: CheckReason) -> PhotoCheck:
        """Take a photo now and ask Claude to look at it."""
        if self._photo_checker is None:
            raise NotFoundError("Photo checks are not running")
        return await self._photo_checker(reason)

    async def async_save_photo_check(self, check: PhotoCheck) -> None:
        """Store a photo check, or update it by id, then let go of old checks and photos."""
        checks = [item for item in self.photo_checks() if item.id != check.id]
        checks.append(check)
        await self._async_keep_photos(checks)

    async def async_prune_photos(self) -> None:
        """Let go of old checks and the photos older than the camera keeps them."""
        await self._async_keep_photos(self.photo_checks())

    async def async_dismiss(self, check_id: str, user_id: str | None) -> PhotoCheck:
        """Close an issue as not a problem, so Claude ignores that finding next time. Its plan changes are rejected."""
        return await self._async_decline_issue(check_id, user_id, IssueState.DISMISSED)

    async def async_accept_finding(self, check_id: str, user_id: str | None, source: Source) -> PhotoCheck:
        """Close an issue as accepted, applying the plan changes proposed for it."""
        check = self._open_issue(check_id)
        before = self._state.to_json()
        try:
            for proposal in self._pending_for(check):
                accept_proposal(
                    self._state, proposal.id, history_id=ulid_now(), now=self._clock(), source=source, user_id=user_id
                )
        except TankkeeperError:
            self._state = TankState.from_json(before)
            raise
        closed = self._close(check, IssueState.ACCEPTED)
        await self._async_save()
        return closed

    async def async_reject_finding(self, check_id: str, user_id: str | None) -> PhotoCheck:
        """Close an issue as rejected, rejecting the plan changes proposed for it."""
        return await self._async_decline_issue(check_id, user_id, IssueState.REJECTED)

    async def _async_decline_issue(self, check_id: str, user_id: str | None, state: IssueState) -> PhotoCheck:
        check = self._open_issue(check_id)
        for proposal in self._pending_for(check):
            reject_proposal(self._state, proposal.id, now=self._clock(), user_id=user_id, any_user=True)
        closed = self._close(check, state)
        await self._async_save()
        return closed

    def _open_issue(self, check_id: str) -> PhotoCheck:
        check = self.photo_check(check_id)
        if check.state is not IssueState.OPEN:
            raise FindingClosedError(f"The photo check {check_id} has no open issue")
        return check

    def _pending_for(self, check: PhotoCheck) -> list[Proposal]:
        return [
            proposal
            for proposal_id in check.proposal_ids
            if (proposal := self._state.proposals.get(proposal_id)) is not None
            and proposal.state is ProposalState.PENDING
        ]

    def _close(self, check: PhotoCheck, state: IssueState) -> PhotoCheck:
        closed = replace(check, state=state)
        self._state.photo_checks = [
            closed.to_json() if item.id == check.id else item.to_json() for item in self.photo_checks()
        ]
        return closed

    async def _async_keep_photos(self, checks: list[PhotoCheck]) -> None:
        tz = dt_util.get_default_time_zone()
        now = self._clock()
        kept = without_old_photos(kept_checks(checks, now.astimezone(tz).date(), tz), now, self.camera().keep_days)
        self._state.photo_checks = [check.to_json() for check in kept]
        used = {path.name for check in kept if (path := self.photo_path(check)) is not None}
        await self.hass.async_add_executor_job(remove_unused, self.photo_dir, used)
        await self._async_save()

    def ask_to_delete_conversation(self, conversation_id: str, actor: Actor) -> DeleteRequest:
        """A confirm code that deletes the conversation, for this person only."""
        self._state.conversation(conversation_id)
        now = self._clock()
        self._deletes = {key: value for key, value in self._deletes.items() if now < value.created + CODE_LIFETIME}
        request = DeleteRequest(
            conversation_id=conversation_id, user_id=actor.user_id, code=self._code_factory(), created=now
        )
        self._deletes[conversation_id, actor.user_id] = request
        return request

    async def async_delete_conversation(self, conversation_id: str, code: str, actor: Actor) -> None:
        """Delete a conversation with the code asked for. The changes it made stay in the history."""
        self._state.conversation(conversation_id)
        key = (conversation_id, actor.user_id)
        request = self._deletes.get(key)
        if request is None:
            raise CodeExpiredError(NO_DELETE)
        try:
            check_delete(request, code, now=self._clock())
        except CodeWrongError:
            self._deletes[key] = replace(request, failed_attempts=request.failed_attempts + 1)
            raise
        except CodeExpiredError, TooManyAttemptsError:
            del self._deletes[key]
            raise
        self._deletes = {item: value for item, value in self._deletes.items() if item[0] != conversation_id}
        delete_conversation(self._state, conversation_id)
        await self._async_save()

    def _check_conversation(self, actor: Actor) -> None:
        if actor.conversation_id is not None:
            self._state.conversation(actor.conversation_id)

    async def _async_save(self) -> None:
        await self._store.async_save(self._state.to_json())
        self.notify()


def light_target(hass: HomeAssistant, light: Light, others: Iterable[Light]) -> Target:
    """The change that stores a light, after checking it, its entity and its helpers. Setup uses it too."""
    light.check()
    if light.active:
        if hass.states.get(light.entity_id) is None:
            raise InvalidInputError(f"No entity {light.entity_id}")
        if any(other.id != light.id and other.entity_id == light.entity_id for other in others):
            raise InvalidInputError(f"Another light already uses {light.entity_id}")
        if problems := helper_problems(hass, light):
            field, message = problems[0]
            raise InvalidLightError(field, message[:1].upper() + message[1:])
    return (Collection.LIGHTS, light.id, light.to_record())


def helper_problems(hass: HomeAssistant, light: Light) -> list[tuple[str, str]]:
    """Each helper of a light that is missing or can't hold its value, as the field and the problem."""
    helpers = light.helpers
    if helpers is None:
        return []
    problems: list[tuple[str, str]] = []
    if hass.states.get(helpers.automation) is None:
        problems.append(("automation", f"no automation {helpers.automation}"))
    for field, entity_id in (("on_helper", helpers.on), ("off_helper", helpers.off)):
        state = hass.states.get(entity_id)
        if state is None:
            problems.append((field, f"no helper {entity_id}"))
        elif state.state == STATE_UNAVAILABLE:
            problems.append((field, f"the helper {entity_id} is unavailable"))
        elif not state.attributes.get("has_time") or state.attributes.get("has_date"):
            problems.append((field, f"the helper {entity_id} must hold a time only: turn has_time on and has_date off"))
    days = [light.schedule] if light.one_day is None else [light.schedule, light.schedule_on(light.one_day.day)]
    for field, number, values in (
        ("brightness_helper", helpers.brightness, [day.brightness_pct for day in days]),
        ("ramp_helper", helpers.ramp, [day.ramp_minutes for day in days]),
    ):
        if number is None:
            continue
        state = hass.states.get(number)
        if state is None:
            problems.append((field, f"no helper {number}"))
            continue
        if "min" not in state.attributes or "max" not in state.attributes:
            problems.append((field, f"the helper {number} is unavailable"))
            continue
        low = float(state.attributes["min"])
        high = float(state.attributes["max"])
        problems.extend(
            (field, f"the helper {number} goes from {low:g} to {high:g}, so it can't hold {value}")
            for value in sorted({value for value in values if value is not None})
            if not low <= value <= high
        )
    return problems
