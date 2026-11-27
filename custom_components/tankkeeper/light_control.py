"""Sets each light's helpers to its schedule, logs on and off, and raises a problem when a light may not follow.

An automation in Home Assistant runs the light from the helpers. TankKeeper never switches the light.
"""

from dataclasses import replace
from datetime import date, datetime, time, timedelta
from functools import partial
import logging

from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, State, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_state_change_event,
    async_track_time_change,
)
from homeassistant.helpers.start import async_at_started
from homeassistant.util import dt as dt_util
import probatio

from .const import DOMAIN
from .lights import (
    AutomationProblem,
    Helpers,
    Light,
    LightEvent,
    LightEventKind,
    LightStatus,
    Schedule,
    last_helper_change,
    next_helper_change,
)
from .service import TankkeeperService, helper_problems

_LOGGER = logging.getLogger(__name__)

BY_AUTOMATION = "automation"
BY_OTHER = "other"
ISSUE_KEY = "light_problem"
GRACE = timedelta(minutes=5)


def issue_id(light_id: str) -> str:
    """The repair issue for a light."""
    return f"light_{light_id}"


def helper_values(helpers: Helpers, schedule: Schedule) -> list[tuple[str, str, dict[str, object]]]:
    """The helper actions that hold a schedule: the action, the helper and the data."""
    values: list[tuple[str, str, dict[str, object]]] = [
        ("input_datetime.set_datetime", helpers.on, {"time": schedule.on.isoformat()}),
        ("input_datetime.set_datetime", helpers.off, {"time": schedule.off.isoformat()}),
    ]
    if helpers.brightness is not None and schedule.brightness_pct is not None:
        values.append(("input_number.set_value", helpers.brightness, {"value": schedule.brightness_pct}))
    if helpers.ramp is not None:
        values.append(("input_number.set_value", helpers.ramp, {"value": schedule.ramp_minutes}))
    return values


def helper_time(state: State | None) -> time | None:
    """The time a time helper holds, or None when it holds none."""
    if state is None:
        return None
    try:
        return time.fromisoformat(state.state)
    except ValueError:
        return None


def helper_number(state: State | None) -> float | None:
    """The number a number helper holds, or None when it holds none."""
    if state is None:
        return None
    try:
        return float(state.state)
    except ValueError:
        return None


def _needs_push(before: Light | None, light: Light) -> bool:
    """Whether a light's helpers should be set after its record changed."""
    return light.helpers is not None and (
        before is None
        or (before.schedule, before.one_day, before.helpers) != (light.schedule, light.one_day, light.helpers)
    )


class LightRunner:
    """Keeps the helpers on the schedule and watches each light, its automation and its helpers."""

    def __init__(self, hass: HomeAssistant, service: TankkeeperService) -> None:
        """Keep what the runner needs. Nothing runs until start."""
        self._hass = hass
        self._service = service
        self._lights: dict[str, Light] = {}
        self._checks: dict[str, CALLBACK_TYPE] = {}
        self._start_checks: dict[str, CALLBACK_TYPE] = {}
        self._helper_errors: dict[str, str] = {}
        self._cancel_states: CALLBACK_TYPE | None = None
        self._watching = False
        self._pending: set[str] = set()

    @callback
    def start(self) -> CALLBACK_TYPE:
        """Start watching once Home Assistant has started. Returns a function that stops it and clears the issues."""
        self._lights = {light.id: light for light in self._service.active_lights()}
        stop_records = self._service.async_add_listener(self._records_changed)
        stop_started = async_at_started(self._hass, self._started)
        stop_midnight = async_track_time_change(self._hass, self._async_midnight, hour=0, minute=0, second=0)

        @callback
        def stop() -> None:
            stop_records()
            stop_started()
            stop_midnight()
            self._watching = False
            self._track_states()
            for light_id in list(self._checks):
                self._cancel_check(light_id)
            for cancel in self._start_checks.values():
                cancel()
            self._start_checks.clear()
            for light in self._service.lights():
                ir.async_delete_issue(self._hass, DOMAIN, issue_id(light.id))

        return stop

    @callback
    def _started(self, hass: HomeAssistant) -> None:
        self._watching = True
        self._track_states()
        for light in self._lights.values():
            self._refresh(light)
            self._schedule_check(light)
            self._hass.async_create_task(self._async_start(light, light.id in self._pending), eager_start=False)
        self._pending.clear()

    async def _async_start(self, light: Light, pending: bool) -> None:
        """Set the helpers a light needs after startup, then check it against the times they hold."""
        if pending and light.helpers is not None:
            await self._async_push(light, light.helpers, self._today())
        else:
            await self._async_sync_day(light)
        if self._watching and (current := self._lights.get(light.id)) is not None:
            self._check_after_start(current)

    @callback
    def _records_changed(self) -> None:
        lights = {light.id: light for light in self._service.active_lights()}
        if lights == self._lights:
            return
        old = self._lights
        self._lights = lights
        if not self._watching:
            self._pending.update(
                light_id for light_id, light in lights.items() if _needs_push(old.get(light_id), light)
            )
            return
        self._track_states()
        for light_id, light in old.items():
            if light_id not in lights:
                self._cancel_check(light_id)
                if (cancel := self._start_checks.pop(light_id, None)) is not None:
                    cancel()
                self._helper_errors.pop(light_id, None)
                self._set_status(light, LightStatus())
        for light_id, light in lights.items():
            before = old.get(light_id)
            if before == light:
                continue
            self._refresh(light)
            self._schedule_check(light)
            helpers = light.helpers
            if helpers is not None and _needs_push(before, light):
                self._hass.async_create_task(self._async_push(light, helpers, self._today()), eager_start=False)

    async def _async_midnight(self, now: datetime) -> None:
        for light in list(self._lights.values()):
            await self._async_sync_day(light)

    async def _async_sync_day(self, light: Light) -> None:
        """Set a one-day change on its day, and the schedule back after it while the helpers still hold the change."""
        change = light.one_day
        helpers = light.helpers
        if change is None or helpers is None:
            return
        today = self._today()
        if change.day == today or (change.day < today and self._holds(helpers, light.schedule_on(change.day))):
            await self._async_push(light, helpers, today)

    def _holds(self, helpers: Helpers, schedule: Schedule) -> bool:
        return all(self._has(entity_id, data) for _, entity_id, data in helper_values(helpers, schedule))

    def _has(self, entity_id: str, data: dict[str, object]) -> bool:
        state = self._hass.states.get(entity_id)
        if "time" in data:
            return state is not None and state.state == data["time"]
        return helper_number(state) == data["value"]

    async def _async_push(self, light: Light, helpers: Helpers, day: date) -> None:
        """Set each helper that does not hold the day's schedule yet, from the light's current record."""
        current = self._lights.get(light.id)
        if current is None or current.helpers is None:
            return
        light, helpers = current, current.helpers
        self._helper_errors.pop(light.id, None)
        for action, entity_id, data in helper_values(helpers, light.schedule_on(day)):
            if self._hass.states.get(entity_id) is None or self._has(entity_id, data):
                continue
            domain, _, name = action.partition(".")
            try:
                await self._hass.services.async_call(domain, name, {"entity_id": entity_id, **data}, blocking=True)
            except (HomeAssistantError, probatio.Invalid) as err:
                self._helper_errors[light.id] = f"could not set {entity_id}: {err}"
                break
        if self._watching and (current := self._lights.get(light.id)) is not None:
            self._refresh(current)

    @callback
    def _track_states(self) -> None:
        if self._cancel_states is not None:
            self._cancel_states()
            self._cancel_states = None
        if not self._watching:
            return
        entity_ids: set[str] = set()
        for light in self._lights.values():
            entity_ids.add(light.entity_id)
            if (helpers := light.helpers) is not None:
                entity_ids.update(
                    entity_id
                    for entity_id in (helpers.automation, helpers.on, helpers.off, helpers.brightness, helpers.ramp)
                    if entity_id is not None
                )
        if entity_ids:
            self._cancel_states = async_track_state_change_event(self._hass, sorted(entity_ids), self._state_changed)

    @callback
    def _state_changed(self, event: Event[EventStateChangedData]) -> None:
        if not self._watching:
            return
        entity_id = event.data["entity_id"]
        for light in list(self._lights.values()):
            if light.entity_id == entity_id:
                self._light_changed(light, event.data["old_state"], event.data["new_state"])
                continue
            if light.helpers is None:
                continue
            self._refresh(light)
            if entity_id in (light.helpers.on, light.helpers.off):
                self._schedule_check(light)
            if entity_id != light.helpers.automation and self._needs_retry(light, event.data["old_state"]):
                self._hass.async_create_task(self._async_push(light, light.helpers, self._today()), eager_start=False)

    def _needs_retry(self, light: Light, old: State | None) -> bool:
        """Whether a helper that changed may now take the values a push could not set: it is new, or a set failed."""
        return old is None or light.id in self._helper_errors

    @callback
    def _light_changed(self, light: Light, old: State | None, new: State | None) -> None:
        if (None if old is None else old.state) == (None if new is None else new.state):
            return
        now = self._service.now()
        if _unavailable(new):
            if not _unavailable(old):
                self._service.log_light(LightEvent(time=now, light_id=light.id, kind=LightEventKind.UNAVAILABLE))
            self._refresh(light)
            return
        if new is None or new.state not in (STATE_ON, STATE_OFF):
            return
        by = BY_AUTOMATION if self._by_automation(light, new) else BY_OTHER
        turned_on = new.state == STATE_ON
        kind = LightEventKind.ON if turned_on else LightEventKind.OFF
        self._service.log_light(LightEvent(time=now, light_id=light.id, kind=kind, by=by))
        status = self._service.light_status(light.id)
        if status.missed is not None and status.missed.wanted == turned_on:
            self._service.log_light(
                LightEvent(
                    time=now,
                    light_id=light.id,
                    kind=LightEventKind.LATE,
                    by=by,
                    wanted=turned_on,
                    minutes_late=(now - status.missed.time) // timedelta(minutes=1),
                )
            )
            self._service.set_light_status(light.id, replace(status, missed=None))
        self._refresh(light)

    def _by_automation(self, light: Light, new: State) -> bool:
        if light.helpers is None:
            return False
        automation = self._hass.states.get(light.helpers.automation)
        return automation is not None and automation.context.id == new.context.id

    @callback
    def _refresh(self, light: Light) -> None:
        """Work out the light's status from its entity, automation and helpers, keeping a missed change."""
        current = self._service.light_status(light.id)
        unavailable_since = (
            (current.unavailable_since or self._service.now())
            if _unavailable(self._hass.states.get(light.entity_id))
            else None
        )
        helpers = light.helpers
        if helpers is None:
            status = LightStatus(needs_helpers=True, unavailable_since=unavailable_since, missed=current.missed)
        else:
            automation = self._hass.states.get(helpers.automation)
            problem: AutomationProblem | None = None
            if _unavailable(automation):
                problem = AutomationProblem.MISSING
            elif automation is not None and automation.state == STATE_OFF:
                problem = AutomationProblem.OFF
            errors = [message for field, message in helper_problems(self._hass, light) if field != "automation"]
            status = LightStatus(
                automation=problem,
                helper_error=errors[0] if errors else self._helper_errors.get(light.id),
                unavailable_since=unavailable_since,
                missed=current.missed,
            )
        self._set_status(light, status)

    @callback
    def _schedule_check(self, light: Light) -> None:
        """Check the light a little after its next helper time, or after one that has just passed."""
        self._cancel_check(light.id)
        times = self._helper_times(light)
        if times is None:
            return
        change = next_helper_change(*times, dt_util.now() - GRACE)
        if change is None:
            return
        when, turn_on = change
        self._checks[light.id] = async_track_point_in_time(
            self._hass, partial(self._check, light.id, when, turn_on), when + self._wait(light, turn_on)
        )

    def _wait(self, light: Light, turn_on: bool) -> timedelta:
        """How long a light has to follow a helper time: the grace time, plus the ramp the helper holds for off."""
        if turn_on or light.helpers is None or light.helpers.ramp is None:
            return GRACE
        ramp = helper_number(self._hass.states.get(light.helpers.ramp))
        return GRACE + timedelta(minutes=ramp or 0)

    def _helper_times(self, light: Light) -> tuple[time, time] | None:
        """The on and off times the helpers hold, or None when a light has no helpers or one holds no time."""
        if light.helpers is None:
            return None
        on = helper_time(self._hass.states.get(light.helpers.on))
        off = helper_time(self._hass.states.get(light.helpers.off))
        return None if on is None or off is None else (on, off)

    @callback
    def _check_after_start(self, light: Light) -> None:
        """Check the light a little after startup against its last helper time.

        A helper time within the grace time before or after startup has its own check.
        """
        times = self._helper_times(light)
        if times is None:
            return
        now = dt_util.now()
        last = last_helper_change(*times, now - GRACE)
        upcoming = next_helper_change(*times, now - GRACE)
        if last is None or upcoming is None or upcoming[0] <= now + GRACE:
            return
        when, turn_on = last
        self._start_checks[light.id] = async_track_point_in_time(
            self._hass, partial(self._start_check, light.id, when, turn_on), now + GRACE
        )

    @callback
    def _start_check(self, light_id: str, when: datetime, turn_on: bool, now: datetime) -> None:
        self._start_checks.pop(light_id, None)
        self._verify(self._lights[light_id], when, turn_on)

    @callback
    def _cancel_check(self, light_id: str) -> None:
        if (cancel := self._checks.pop(light_id, None)) is not None:
            cancel()

    @callback
    def _check(self, light_id: str, when: datetime, turn_on: bool, now: datetime) -> None:
        self._checks.pop(light_id, None)
        light = self._lights[light_id]
        self._verify(light, when, turn_on)
        self._schedule_check(light)

    @callback
    def _verify(self, light: Light, when: datetime, turn_on: bool) -> None:
        """Log a missed change when the light did not reach the state its helpers wanted within its wait."""
        light_id = light.id
        state = self._hass.states.get(light.entity_id)
        status = self._service.light_status(light_id)
        kind = LightEventKind.ON if turn_on else LightEventKind.OFF
        wait = self._wait(light, turn_on)
        followed = any(
            event.light_id == light_id and event.kind == kind and when <= event.time <= when + wait
            for event in self._service.light_log()
        )
        if followed or (not _unavailable(state) and _is_on(state) == turn_on):
            self._set_status(light, replace(status, missed=None))
        else:
            missed = LightEvent(
                time=dt_util.as_utc(when), light_id=light_id, kind=LightEventKind.MISSED, wanted=turn_on
            )
            self._service.log_light(missed)
            self._set_status(light, replace(status, missed=missed))

    @callback
    def _set_status(self, light: Light, status: LightStatus) -> None:
        before = self._service.light_status(light.id)
        self._service.set_light_status(light.id, status)
        if status.problem:
            automation = None if light.helpers is None else light.helpers.automation
            problems = status.messages(light.model, light.entity_id, automation, dt_util.get_default_time_zone())
            ir.async_create_issue(
                self._hass,
                DOMAIN,
                issue_id(light.id),
                is_fixable=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key=ISSUE_KEY,
                translation_placeholders={"model": light.model, "problems": " ".join(problems)},
            )
            if not before.problem:
                _LOGGER.warning("The light %s on %s may not follow its schedule", light.model, light.entity_id)
        else:
            ir.async_delete_issue(self._hass, DOMAIN, issue_id(light.id))
            if before.problem:
                _LOGGER.info("The light %s on %s follows its schedule again", light.model, light.entity_id)

    def _today(self) -> date:
        return dt_util.now().date()


def _unavailable(state: State | None) -> bool:
    return state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN)


def _is_on(state: State | None) -> bool:
    return state is not None and state.state == STATE_ON
