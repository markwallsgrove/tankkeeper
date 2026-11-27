"""Runs the light schedule: switches each light, logs on and off, and raises a problem when a light does not follow."""

from collections import deque
from dataclasses import replace
from datetime import datetime, timedelta
from functools import partial
import logging

from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import CALLBACK_TYPE, Context, Event, EventStateChangedData, HomeAssistant, State, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_track_point_in_time, async_track_state_change_event
from homeassistant.helpers.start import async_at_started
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .lights import Control, Light, LightChange, LightEvent, LightEventKind, LightStatus, next_change, wanted_on
from .service import TankkeeperService

_LOGGER = logging.getLogger(__name__)

BY_SCHEDULE = "schedule"
BY_OTHER = "other"
ISSUE_KEY = "light_problem"
CONTEXTS_KEPT = 100


def issue_id(light_id: str) -> str:
    """The repair issue for a light."""
    return f"light_{light_id}"


def service_call(light: Light, turn_on: bool) -> tuple[str, str, dict[str, object]]:
    """The action and data that switch a light, with its ramp, brightness and colour."""
    domain = light.entity_id.partition(".")[0]
    data: dict[str, object] = {"entity_id": [light.entity_id]}
    schedule = light.schedule_on(dt_util.now().date())
    if light.control is not Control.ON_OFF:
        if schedule.ramp_minutes:
            data["transition"] = schedule.ramp_minutes * 60
        if turn_on and schedule.brightness_pct is not None:
            data["brightness_pct"] = schedule.brightness_pct
        if turn_on and schedule.rgb_color is not None:
            data["rgb_color"] = list(schedule.rgb_color)
    return domain, "turn_on" if turn_on else "turn_off", data


class LightRunner:
    """Switches the lights at their scheduled times and watches their entities."""

    def __init__(self, hass: HomeAssistant, service: TankkeeperService) -> None:
        """Keep what the runner needs. Nothing runs until start."""
        self._hass = hass
        self._service = service
        self._lights: dict[str, Light] = {}
        self._contexts: deque[str] = deque(maxlen=CONTEXTS_KEPT)
        self._cancel_timer: CALLBACK_TYPE | None = None
        self._cancel_states: CALLBACK_TYPE | None = None

    @callback
    def start(self) -> CALLBACK_TYPE:
        """Start the schedule. Returns a function that stops it and clears the repair issues."""
        self._lights = {light.id: light for light in self._service.active_lights()}
        self._track_states()
        self._schedule_next()
        stop_records = self._service.async_add_listener(self._records_changed)
        stop_started = async_at_started(self._hass, self._started)

        @callback
        def stop() -> None:
            stop_records()
            stop_started()
            self._cancel()
            for light in self._service.lights():
                ir.async_delete_issue(self._hass, DOMAIN, issue_id(light.id))

        return stop

    @callback
    def _cancel(self) -> None:
        if self._cancel_timer is not None:
            self._cancel_timer()
            self._cancel_timer = None
        if self._cancel_states is not None:
            self._cancel_states()
            self._cancel_states = None

    @callback
    def _started(self, hass: HomeAssistant) -> None:
        for light in self._lights.values():
            self._enforce(light)

    @callback
    def _records_changed(self) -> None:
        lights = {light.id: light for light in self._service.active_lights()}
        if lights == self._lights:
            return
        old = self._lights
        self._lights = lights
        self._track_states()
        self._schedule_next()
        for light_id, light in old.items():
            if light_id not in lights:
                self._set_status(light, LightStatus())
        for light_id, light in lights.items():
            if old.get(light_id) != light:
                self._set_status(light, LightStatus())
                self._enforce(light)

    @callback
    def _enforce(self, light: Light) -> None:
        """Put the light in the state its schedule wants now, or show that its entity is unavailable."""
        state = self._hass.states.get(light.entity_id)
        if _unavailable(state):
            self._set_status(light, LightStatus(unavailable_since=self._service.now()))
            return
        wanted = wanted_on(light, dt_util.now())
        if _is_on(state) != wanted:
            self._hass.async_create_task(self._async_switch(light, wanted), eager_start=False)

    @callback
    def _track_states(self) -> None:
        if self._cancel_states is not None:
            self._cancel_states()
            self._cancel_states = None
        entity_ids = sorted({light.entity_id for light in self._lights.values()})
        if entity_ids:
            self._cancel_states = async_track_state_change_event(self._hass, entity_ids, self._state_changed)

    @callback
    def _schedule_next(self) -> None:
        if self._cancel_timer is not None:
            self._cancel_timer()
            self._cancel_timer = None
        change = next_change(self._lights.values(), dt_util.now())
        if change is not None:
            self._cancel_timer = async_track_point_in_time(
                self._hass, partial(self._async_change_due, change), change.time
            )

    async def _async_change_due(self, change: LightChange, now: datetime) -> None:
        self._cancel_timer = None
        for light in change.on:
            await self._async_switch(light, True)
        for light in change.off:
            await self._async_switch(light, False)
        self._schedule_next()
        self._service.notify()

    async def _async_switch(self, light: Light, turn_on: bool, missed: LightEvent | None = None) -> None:
        """Switch the light. A light that can't be switched misses the change."""
        if _unavailable(self._hass.states.get(light.entity_id)):
            self._miss(light, turn_on)
            return
        domain, action, data = service_call(light, turn_on)
        context = Context()
        self._contexts.append(context.id)
        try:
            await self._hass.services.async_call(domain, action, data, blocking=True, context=context)
        except HomeAssistantError as err:
            _LOGGER.warning("Could not switch %s: %s", light.entity_id, err)
            self._miss(light, turn_on)
            return
        if missed is not None:
            now = self._service.now()
            self._service.log_light(
                LightEvent(
                    time=now,
                    light_id=light.id,
                    kind=LightEventKind.LATE,
                    by=BY_SCHEDULE,
                    wanted=turn_on,
                    minutes_late=(now - missed.time) // timedelta(minutes=1),
                )
            )
        self._set_status(light, LightStatus())

    @callback
    def _miss(self, light: Light, turn_on: bool) -> None:
        event = LightEvent(time=self._service.now(), light_id=light.id, kind=LightEventKind.MISSED, wanted=turn_on)
        self._service.log_light(event)
        self._set_status(light, replace(self._service.light_status(light.id), missed=event))

    @callback
    def _state_changed(self, event: Event[EventStateChangedData]) -> None:
        old = event.data["old_state"]
        new = event.data["new_state"]
        if (None if old is None else old.state) == (None if new is None else new.state):
            return
        for light in self._lights.values():
            if light.entity_id == event.data["entity_id"]:
                self._light_changed(light, old, new, event.context)

    @callback
    def _light_changed(self, light: Light, old: State | None, new: State | None, context: Context) -> None:
        now = self._service.now()
        status = self._service.light_status(light.id)
        if _unavailable(new):
            if not _unavailable(old):
                self._service.log_light(LightEvent(time=now, light_id=light.id, kind=LightEventKind.UNAVAILABLE))
            self._set_status(light, replace(status, unavailable_since=status.unavailable_since or now))
            return
        if new is None or new.state not in (STATE_ON, STATE_OFF):
            return
        by = BY_SCHEDULE if context.id in self._contexts else BY_OTHER
        kind = LightEventKind.ON if new.state == STATE_ON else LightEventKind.OFF
        self._service.log_light(LightEvent(time=now, light_id=light.id, kind=kind, by=by))
        if not status.problem:
            return
        wanted = wanted_on(light, dt_util.now())
        if _is_on(new) == wanted:
            self._set_status(light, LightStatus())
        elif status.unavailable_since is not None:
            self._set_status(light, replace(status, unavailable_since=None))
            self._hass.async_create_task(self._async_switch(light, wanted, status.missed), eager_start=False)

    @callback
    def _set_status(self, light: Light, status: LightStatus) -> None:
        before = self._service.light_status(light.id)
        self._service.set_light_status(light.id, status)
        if status.problem:
            ir.async_create_issue(
                self._hass,
                DOMAIN,
                issue_id(light.id),
                is_fixable=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key=ISSUE_KEY,
                translation_placeholders={"model": light.model, "entity_id": light.entity_id},
            )
            if not before.problem:
                _LOGGER.warning("The light %s on %s is not following its schedule", light.model, light.entity_id)
        else:
            ir.async_delete_issue(self._hass, DOMAIN, issue_id(light.id))
            if before.problem:
                _LOGGER.info("The light %s on %s follows its schedule again", light.model, light.entity_id)


def _unavailable(state: State | None) -> bool:
    return state is None or state.state in (STATE_UNAVAILABLE, STATE_UNKNOWN)


def _is_on(state: State | None) -> bool:
    return state is not None and state.state == STATE_ON
