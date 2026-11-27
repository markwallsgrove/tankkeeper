"""Lights: schedules, one-day changes, the next change, the dose time and the on/off log. No Home Assistant imports."""

from collections.abc import Iterable
from dataclasses import dataclass, replace
from datetime import date, datetime, time, timedelta
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


@dataclass(frozen=True, slots=True, kw_only=True)
class Light:
    """A light the integration switches on a schedule."""

    id: str
    entity_id: str
    model: str
    control: Control
    schedule: Schedule
    added: date
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
    """Whether a light's entity is unavailable, and the last change the schedule missed."""

    unavailable_since: datetime | None = None
    missed: LightEvent | None = None

    @property
    def problem(self) -> bool:
        """Whether the light is not following its schedule."""
        return self.unavailable_since is not None or self.missed is not None

    def to_json(self) -> Record:
        """Serialise for tools and entity attributes."""
        return {
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
