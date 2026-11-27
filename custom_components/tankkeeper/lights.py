"""Lights: schedules, helpers, one-day changes, the next change, the dose time and the on/off log.

No Home Assistant imports.
"""

from collections.abc import Iterable
from dataclasses import dataclass, replace
from datetime import date, datetime, time, timedelta, tzinfo
from enum import StrEnum

from .domain import JsonValue, Record, TankkeeperError
from .plan import format_time, parse_time

LOG_DAYS = 30
SWITCH_DOMAINS = ("light", "switch")


class Control(StrEnum):
    """How the light can be controlled."""

    ON_OFF = "on_off"
    DIMMABLE = "dimmable"
    COLOUR = "colour"


class LightEventKind(StrEnum):
    """What the on/off log records: a state, or a change the schedule missed or made late."""

    ON = "on"
    OFF = "off"
    UNAVAILABLE = "unavailable"
    MISSED = "missed"
    LATE = "late"


STATE_KINDS = frozenset({LightEventKind.ON, LightEventKind.OFF, LightEventKind.UNAVAILABLE})


class InvalidLightError(TankkeeperError):
    """A light the integration cannot run. The field names the value at fault."""

    key = "invalid_light"

    def __init__(self, field: str, message: str) -> None:
        """Keep the field and the message."""
        super().__init__(message)
        self.field = field


@dataclass(frozen=True, slots=True, kw_only=True)
class Schedule:
    """When the light is on, and how it turns on."""

    on: time
    off: time
    brightness_pct: int | None = None
    ramp_minutes: int = 0
    rgb_color: tuple[int, int, int] | None = None


@dataclass(frozen=True, slots=True, kw_only=True)
class OneDayChange:
    """Different on and off times, and brightness, for one day only."""

    day: date
    on: time
    off: time
    brightness_pct: int | None

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "date": self.day.isoformat(),
            "on": format_time(self.on),
            "off": format_time(self.off),
            "brightness_pct": self.brightness_pct,
        }

    @classmethod
    def from_json(cls, data: Record) -> OneDayChange:
        """Read from storage."""
        return cls(
            day=date.fromisoformat(_str(data["date"])),
            on=parse_time(_str(data["on"])),
            off=parse_time(_str(data["off"])),
            brightness_pct=_optional_int(data["brightness_pct"]),
        )


class AutomationProblem(StrEnum):
    """What is wrong with the automation that runs a light."""

    MISSING = "missing"
    OFF = "off"


@dataclass(frozen=True, slots=True, kw_only=True)
class Helpers:
    """The automation that runs a light, and the helpers it reads its schedule from."""

    automation: str
    on: str
    off: str
    brightness: str | None = None
    ramp: str | None = None

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "automation": self.automation,
            "on": self.on,
            "off": self.off,
            "brightness": self.brightness,
            "ramp": self.ramp,
        }

    @classmethod
    def from_json(cls, data: Record) -> Helpers:
        """Read from storage."""
        brightness = data["brightness"]
        ramp = data["ramp"]
        return cls(
            automation=_str(data["automation"]),
            on=_str(data["on"]),
            off=_str(data["off"]),
            brightness=None if brightness is None else _str(brightness),
            ramp=None if ramp is None else _str(ramp),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class Light:
    """A light an automation runs from helpers. TankKeeper sets the helpers to the schedule."""

    id: str
    entity_id: str
    model: str
    control: Control
    schedule: Schedule
    added: date
    helpers: Helpers | None = None
    one_day: OneDayChange | None = None
    removed: date | None = None

    @property
    def active(self) -> bool:
        """Whether the light has not been removed."""
        return self.removed is None

    def schedule_on(self, day: date) -> Schedule:
        """The schedule for a day, with the one-day change when it is for that day."""
        change = self.one_day
        if change is None or change.day != day:
            return self.schedule
        brightness = self.schedule.brightness_pct if change.brightness_pct is None else change.brightness_pct
        return replace(self.schedule, on=change.on, off=change.off, brightness_pct=brightness)

    def check(self) -> None:
        """Refuse a light the integration cannot run."""
        if not self.model.strip():
            raise InvalidLightError("model", "Give the light's model")
        domain = self.entity_id.partition(".")[0]
        if domain not in SWITCH_DOMAINS:
            raise InvalidLightError("entity_id", "A light is a light or switch entity")
        if self.control is not Control.ON_OFF and domain != "light":
            raise InvalidLightError("entity_id", "Only a light entity can dim or change colour")
        _check_schedule(self.control, self.schedule)
        if self.one_day is not None:
            _check_schedule(self.control, self.schedule_on(self.one_day.day))
        if self.helpers is not None:
            self._check_helpers(self.helpers)

    def _check_helpers(self, helpers: Helpers) -> None:
        for field, entity_id, domain in (
            ("automation", helpers.automation, "automation"),
            ("on_helper", helpers.on, "input_datetime"),
            ("off_helper", helpers.off, "input_datetime"),
            ("brightness_helper", helpers.brightness, "input_number"),
            ("ramp_helper", helpers.ramp, "input_number"),
        ):
            if entity_id is not None and entity_id.partition(".")[0] != domain:
                raise InvalidLightError(
                    field, f"The {field.replace('_', ' ')} must be an {domain} entity, not {entity_id}"
                )
        if helpers.on == helpers.off:
            raise InvalidLightError("off_helper", "The on and off times need two helpers")
        if helpers.brightness is not None and helpers.brightness == helpers.ramp:
            raise InvalidLightError("ramp_helper", "The brightness and the ramp need two helpers")
        days = [self.schedule] if self.one_day is None else [self.schedule, self.schedule_on(self.one_day.day)]
        if helpers.brightness is None and any(day.brightness_pct is not None for day in days):
            raise InvalidLightError("brightness_helper", "A brightness needs a brightness helper")
        if helpers.ramp is None and self.schedule.ramp_minutes:
            raise InvalidLightError("ramp_helper", "A ramp needs a ramp helper")

    def to_record(self) -> Record:
        """Serialise for storage."""
        schedule = self.schedule
        rgb: JsonValue = None if schedule.rgb_color is None else list(schedule.rgb_color)
        return {
            "entity_id": self.entity_id,
            "model": self.model,
            "control": self.control.value,
            "on": format_time(schedule.on),
            "off": format_time(schedule.off),
            "brightness_pct": schedule.brightness_pct,
            "ramp_minutes": schedule.ramp_minutes,
            "rgb_color": rgb,
            "helpers": None if self.helpers is None else self.helpers.to_json(),
            "one_day": None if self.one_day is None else self.one_day.to_json(),
            "added": self.added.isoformat(),
            "removed": None if self.removed is None else self.removed.isoformat(),
        }

    @classmethod
    def from_record(cls, light_id: str, record: Record) -> Light:
        """Read from storage."""
        rgb = record["rgb_color"]
        one_day = record["one_day"]
        removed = record["removed"]
        helpers = record.get("helpers")
        return cls(
            id=light_id,
            entity_id=_str(record["entity_id"]),
            model=_str(record["model"]),
            control=Control(_str(record["control"])),
            schedule=Schedule(
                on=parse_time(_str(record["on"])),
                off=parse_time(_str(record["off"])),
                brightness_pct=_optional_int(record["brightness_pct"]),
                ramp_minutes=_int(record["ramp_minutes"]),
                rgb_color=None if rgb is None else _rgb(rgb),
            ),
            helpers=None if helpers is None else Helpers.from_json(_record(helpers)),
            one_day=None if one_day is None else OneDayChange.from_json(_record(one_day)),
            added=date.fromisoformat(_str(record["added"])),
            removed=None if removed is None else date.fromisoformat(_str(removed)),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class LightChange:
    """The next time the schedule turns lights on or off."""

    time: datetime
    on: tuple[Light, ...]
    off: tuple[Light, ...]


@dataclass(frozen=True, slots=True, kw_only=True)
class LightEvent:
    """One entry in the on/off log."""

    time: datetime
    light_id: str
    kind: LightEventKind
    by: str | None = None
    wanted: bool | None = None
    minutes_late: int | None = None

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "time": self.time.isoformat(),
            "light_id": self.light_id,
            "kind": self.kind.value,
            "by": self.by,
            "wanted": self.wanted,
            "minutes_late": self.minutes_late,
        }

    @classmethod
    def from_json(cls, data: Record) -> LightEvent:
        """Read from storage."""
        wanted = data["wanted"]
        return cls(
            time=datetime.fromisoformat(_str(data["time"])),
            light_id=_str(data["light_id"]),
            kind=LightEventKind(_str(data["kind"])),
            by=None if data["by"] is None else _str(data["by"]),
            wanted=None if wanted is None else bool(wanted),
            minutes_late=_optional_int(data["minutes_late"]),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class LightStatus:
    """What stops a light following its schedule: no helpers, a broken automation or helper, or the light itself."""

    needs_helpers: bool = False
    automation: AutomationProblem | None = None
    helper_error: str | None = None
    unavailable_since: datetime | None = None
    missed: LightEvent | None = None

    @property
    def problem(self) -> bool:
        """Whether the light may not follow its schedule."""
        return (
            self.needs_helpers
            or self.automation is not None
            or self.helper_error is not None
            or self.unavailable_since is not None
            or self.missed is not None
        )

    def messages(self, model: str, entity_id: str, automation: str | None, tz: tzinfo) -> list[str]:
        """Each problem in words, for people."""
        messages: list[str] = []
        if self.needs_helpers:
            messages.append(
                f"{model} needs helpers: give it an automation and its on and off time helpers, "
                "then TankKeeper sets them."
            )
        if self.automation is not None:
            messages.append(f"The automation {automation} for {model} is {self.automation.value}.")
        if self.helper_error is not None:
            messages.append(f"{model}: {self.helper_error}.")
        if self.unavailable_since is not None:
            messages.append(f"{entity_id} for {model} is unavailable.")
        if self.missed is not None:
            turn = "on" if self.missed.wanted else "off"
            messages.append(f"{model} did not turn {turn} at {self.missed.time.astimezone(tz):%H:%M}.")
        return messages

    def to_json(self) -> Record:
        """Serialise for tools and entity attributes."""
        return {
            "needs_helpers": self.needs_helpers,
            "automation": None if self.automation is None else self.automation.value,
            "helper_error": self.helper_error,
            "unavailable_since": None if self.unavailable_since is None else self.unavailable_since.isoformat(),
            "missed": None if self.missed is None else self.missed.to_json(),
        }


def with_control(schedule: Schedule, control: Control) -> Schedule:
    """The schedule without the settings the control can't use."""
    if control is Control.ON_OFF:
        return replace(schedule, brightness_pct=None, ramp_minutes=0, rgb_color=None)
    if control is Control.DIMMABLE:
        return replace(schedule, rgb_color=None)
    return schedule


def add_summary(light: Light) -> str:
    """The summary of adding a light."""
    return f"Add the light {_describe(light)}"


def change_summary(light: Light) -> str:
    """The summary of changing a light."""
    return f"Change the light {_describe(light)}"


def remove_summary(light: Light) -> str:
    """The summary of removing a light."""
    return f"Remove the light {light.model}"


def one_day_summary(light: Light, change: OneDayChange) -> str:
    """The summary of a one-day change."""
    times = f"on {format_time(change.on)}, off {format_time(change.off)}"
    return f"Light {light.model} on {change.day.isoformat()} only: {times}"


def cancel_one_day_summary(light: Light) -> str:
    """The summary of cancelling a one-day change."""
    return f"Cancel the one-day change to {light.model}"


def _describe(light: Light) -> str:
    schedule = light.schedule
    return f"{light.model} on {light.entity_id}, on {format_time(schedule.on)}, off {format_time(schedule.off)}"


def wanted_on(light: Light, moment: datetime) -> bool:
    """Whether the schedule wants the light on at a moment, in the moment's time zone."""
    schedule = light.schedule_on(moment.date())
    return schedule.on <= moment.time() < schedule.off


def next_change(lights: Iterable[Light], now: datetime) -> LightChange | None:
    """The first time after now that the schedule turns lights on or off, looking at today and tomorrow."""
    changes: list[tuple[datetime, bool, Light]] = []
    for light in lights:
        if not light.active:
            continue
        for offset in (0, 1):
            day = now.date() + timedelta(days=offset)
            schedule = light.schedule_on(day)
            changes.extend(
                (when, turn_on, light)
                for when, turn_on in (
                    (datetime.combine(day, schedule.on, now.tzinfo), True),
                    (datetime.combine(day, schedule.off, now.tzinfo), False),
                )
                if when > now
            )
    if not changes:
        return None
    first = min(when for when, _, _ in changes)
    return LightChange(
        time=first,
        on=tuple(light for when, turn_on, light in changes if when == first and turn_on),
        off=tuple(light for when, turn_on, light in changes if when == first and not turn_on),
    )


def next_helper_change(on: time, off: time, after: datetime) -> tuple[datetime, bool] | None:
    """The first helper time after a moment, in the moment's time zone, and whether it turns the light on.

    Helpers at the same time never change the light.
    """
    if on == off:
        return None
    changes = [
        (datetime.combine(after.date() + timedelta(days=offset), moment, after.tzinfo), turn_on)
        for offset in (0, 1)
        for moment, turn_on in ((on, True), (off, False))
    ]
    return min((change for change in changes if change[0] > after), key=lambda change: change[0])


def last_helper_change(on: time, off: time, before: datetime) -> tuple[datetime, bool] | None:
    """The last helper time at or before a moment, in the moment's time zone, and whether it turned the light on.

    Helpers at the same time never change the light.
    """
    if on == off:
        return None
    changes = [
        (datetime.combine(before.date() - timedelta(days=offset), moment, before.tzinfo), turn_on)
        for offset in (0, 1)
        for moment, turn_on in ((on, True), (off, False))
    ]
    return max((change for change in changes if change[0] <= before), key=lambda change: change[0])


def dose_time(lights: Iterable[Light], day: date, default: time) -> time:
    """When doses are due on a day: the earliest light-on time, or the default without a light."""
    times = [light.schedule_on(day).on for light in lights if light.active]
    return min(times, default=default)


def prune_log(events: Iterable[LightEvent], now: datetime, days: int = LOG_DAYS) -> list[LightEvent]:
    """The log for the last days, with each light's last state before them so a chart can start."""
    cutoff = now - timedelta(days=days)
    ordered = sorted(events, key=lambda event: event.time)
    before: dict[str, LightEvent] = {
        event.light_id: event for event in ordered if event.time < cutoff and event.kind in STATE_KINDS
    }
    kept = set(map(id, before.values()))
    return [event for event in ordered if event.time >= cutoff or id(event) in kept]


def on_periods(
    events: Iterable[LightEvent], light_id: str, since: datetime, until: datetime
) -> list[tuple[datetime, datetime]]:
    """When the log shows a light on between two moments."""
    periods: list[tuple[datetime, datetime]] = []
    start: datetime | None = None
    for event in sorted(events, key=lambda item: item.time):
        if event.light_id != light_id or event.kind not in STATE_KINDS or event.time >= until:
            continue
        if event.kind is LightEventKind.ON:
            if start is None:
                start = max(event.time, since)
        elif start is not None:
            if event.time > start:
                periods.append((start, event.time))
            start = None
    if start is not None:
        periods.append((start, until))
    return periods


def state_periods(
    changes: Iterable[tuple[datetime, bool]], since: datetime, until: datetime
) -> list[tuple[datetime, datetime]]:
    """When recorded states show a light on between two moments. Each change is a time and whether the light was on."""
    periods: list[tuple[datetime, datetime]] = []
    start: datetime | None = None
    for moment, on in sorted(changes, key=lambda change: change[0]):
        if moment >= until:
            break
        if on:
            if start is None:
                start = max(moment, since)
        elif start is not None:
            if moment > start:
                periods.append((start, moment))
            start = None
    if start is not None:
        periods.append((start, until))
    return periods


def history_periods(
    changes: Iterable[tuple[datetime, bool]],
    fallback: Iterable[tuple[datetime, datetime]],
    since: datetime,
    until: datetime,
) -> list[tuple[datetime, datetime]]:
    """On periods from recorded changes, with the fallback periods for the time before the first change."""
    recorded = list(changes)
    if not recorded:
        return list(fallback)
    first = min(moment for moment, _ in recorded)
    before = [(start, min(end, first)) for start, end in fallback if start < first]
    after = state_periods(recorded, since, until)
    if before and after and before[-1][1] == after[0][0]:
        return [*before[:-1], (before[-1][0], after[0][1]), *after[1:]]
    return before + after


def _check_schedule(control: Control, schedule: Schedule) -> None:
    if schedule.off <= schedule.on:
        raise InvalidLightError("off", "The light turns off after it turns on, on the same day")
    if control is Control.ON_OFF:
        for field, value in (
            ("brightness_pct", schedule.brightness_pct),
            ("ramp_minutes", schedule.ramp_minutes or None),
            ("rgb_color", schedule.rgb_color),
        ):
            if value is not None:
                raise InvalidLightError(field, f"An on/off light has no {field}")
        return
    if schedule.brightness_pct is not None and not 1 <= schedule.brightness_pct <= 100:
        raise InvalidLightError("brightness_pct", "Brightness is from 1 to 100%")
    window = (datetime.combine(date.min, schedule.off) - datetime.combine(date.min, schedule.on)) // timedelta(
        minutes=1
    )
    if not 0 <= schedule.ramp_minutes <= window:
        raise InvalidLightError("ramp_minutes", "The ramp fits between the on and off times")
    if schedule.rgb_color is not None and (
        control is not Control.COLOUR or not all(0 <= part <= 255 for part in schedule.rgb_color)
    ):
        raise InvalidLightError("rgb_color", "Only a colour light has a colour, each part from 0 to 255")


def _str(value: JsonValue) -> str:
    if not isinstance(value, str):
        raise TypeError(f"Expected a string, got {value!r}")
    return value


def _int(value: JsonValue) -> int:
    if not isinstance(value, int) or isinstance(value, bool):
        raise TypeError(f"Expected an integer, got {value!r}")
    return value


def _optional_int(value: JsonValue) -> int | None:
    return None if value is None else _int(value)


def _record(value: JsonValue) -> Record:
    if not isinstance(value, dict):
        raise TypeError(f"Expected an object, got {value!r}")
    return value


def _rgb(value: JsonValue) -> tuple[int, int, int]:
    if not isinstance(value, list) or len(value) != 3:
        raise TypeError(f"Expected three colour parts, got {value!r}")
    red, green, blue = (_int(part) for part in value)
    return red, green, blue
