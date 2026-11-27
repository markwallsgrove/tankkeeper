"""Lights: schedules, one-day changes, the next change, the dose time and the on/off log."""

from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.tankkeeper.lights import (
    Control,
    InvalidLightError,
    Light,
    LightEvent,
    LightEventKind,
    LightStatus,
    OneDayChange,
    Schedule,
    dose_time,
    history_periods,
    next_change,
    on_periods,
    prune_log,
    state_periods,
    wanted_on,
)

LONDON = ZoneInfo("Europe/London")
DAY = date(2026, 11, 26)


def _at(hour: int, minute: int = 0, day: date = DAY) -> datetime:
    return datetime.combine(day, time(hour, minute), LONDON)


def _light(light_id: str = "l1", **changes: object) -> Light:
    fields: dict[str, object] = {
        "id": light_id,
        "entity_id": "switch.tank_light",
        "model": "LED 10120",
        "control": Control.ON_OFF,
        "schedule": Schedule(on=time(12), off=time(20)),
        "added": DAY,
    }
    fields.update(changes)
    return Light(**fields)  # type: ignore[arg-type]  # fields are checked by each test that passes them


def test_a_light_round_trips_through_its_record() -> None:
    light = _light(
        entity_id="light.tank",
        control=Control.COLOUR,
        schedule=Schedule(on=time(11), off=time(19), brightness_pct=80, ramp_minutes=30, rgb_color=(255, 200, 150)),
        one_day=OneDayChange(day=DAY, on=time(11), off=time(22), brightness_pct=60),
        removed=date(2026, 12, 1),
    )

    record = light.to_record()

    assert record == {
        "entity_id": "light.tank",
        "model": "LED 10120",
        "control": "colour",
        "on": "11:00",
        "off": "19:00",
        "brightness_pct": 80,
        "ramp_minutes": 30,
        "rgb_color": [255, 200, 150],
        "one_day": {"date": "2026-11-26", "on": "11:00", "off": "22:00", "brightness_pct": 60},
        "added": "2026-11-26",
        "removed": "2026-12-01",
    }
    assert Light.from_record("l1", record) == light


def test_a_plain_light_record_has_no_dimming() -> None:
    record = _light().to_record()

    assert record["brightness_pct"] is None
    assert record["ramp_minutes"] == 0
    assert record["rgb_color"] is None
    assert record["one_day"] is None
    assert record["removed"] is None
    assert Light.from_record("l1", record) == _light()


def test_the_one_day_change_applies_only_on_its_day() -> None:
    light = _light(
        control=Control.DIMMABLE,
        entity_id="light.tank",
        schedule=Schedule(on=time(12), off=time(20), brightness_pct=90, ramp_minutes=20),
        one_day=OneDayChange(day=DAY, on=time(12), off=time(22), brightness_pct=None),
    )

    assert light.schedule_on(DAY) == Schedule(on=time(12), off=time(22), brightness_pct=90, ramp_minutes=20)
    assert light.schedule_on(DAY + timedelta(days=1)) == light.schedule
    assert light.schedule_on(DAY - timedelta(days=1)) == light.schedule


def test_a_one_day_brightness_replaces_the_usual_one() -> None:
    light = _light(
        control=Control.DIMMABLE,
        entity_id="light.tank",
        schedule=Schedule(on=time(12), off=time(20), brightness_pct=90),
        one_day=OneDayChange(day=DAY, on=time(13), off=time(20), brightness_pct=40),
    )

    assert light.schedule_on(DAY) == Schedule(on=time(13), off=time(20), brightness_pct=40)


def test_the_light_is_wanted_on_between_on_and_off() -> None:
    light = _light()

    assert not wanted_on(light, _at(11, 59))
    assert wanted_on(light, _at(12))
    assert wanted_on(light, _at(19, 59))
    assert not wanted_on(light, _at(20))


def test_the_next_change_is_today_or_tomorrow() -> None:
    light = _light()

    morning = next_change([light], _at(8))
    evening = next_change([light], _at(12))
    night = next_change([light], _at(21))

    assert morning is not None
    assert (morning.time, morning.on, morning.off) == (_at(12), (light,), ())
    assert evening is not None
    assert (evening.time, evening.on, evening.off) == (_at(20), (), (light,))
    assert night is not None
    assert (night.time, night.on) == (_at(12, day=DAY + timedelta(days=1)), (light,))


def test_lights_that_change_together_share_the_next_change() -> None:
    first = _light("a")
    second = _light("b", entity_id="switch.other")
    later = _light("c", entity_id="switch.later", schedule=Schedule(on=time(13), off=time(20)))

    change = next_change([later, first, second], _at(8))

    assert change is not None
    assert [item.id for item in change.on] == ["a", "b"]


def test_one_change_turns_some_lights_on_and_others_off() -> None:
    day_light = _light("a")
    night_light = _light("b", entity_id="switch.moon", schedule=Schedule(on=time(6), off=time(12)))

    change = next_change([day_light, night_light], _at(8))

    assert change is not None
    assert (change.time, change.on, change.off) == (_at(12), (day_light,), (night_light,))


def test_removed_lights_have_no_changes_and_no_dose_time() -> None:
    light = _light(removed=DAY)

    assert next_change([light], _at(8)) is None
    assert dose_time([light], DAY, time(12)) == time(12)


def test_doses_follow_the_earliest_light_on_time() -> None:
    lights = [
        _light("a", schedule=Schedule(on=time(13), off=time(20))),
        _light(
            "b",
            entity_id="switch.other",
            one_day=OneDayChange(day=DAY, on=time(11, 30), off=time(20), brightness_pct=None),
        ),
    ]

    assert dose_time(lights, DAY, time(9)) == time(11, 30)
    assert dose_time(lights, DAY + timedelta(days=1), time(9)) == time(12)
    assert dose_time([], DAY, time(9)) == time(9)


@pytest.mark.parametrize(
    ("light", "field"),
    [
        (_light(schedule=Schedule(on=time(20), off=time(12))), "off"),
        (_light(schedule=Schedule(on=time(12), off=time(12))), "off"),
        (_light(schedule=Schedule(on=time(12), off=time(20), brightness_pct=50)), "brightness_pct"),
        (_light(schedule=Schedule(on=time(12), off=time(20), ramp_minutes=10)), "ramp_minutes"),
        (_light(schedule=Schedule(on=time(12), off=time(20), rgb_color=(1, 2, 3))), "rgb_color"),
        (_light(entity_id="fan.tank"), "entity_id"),
        (_light(control=Control.DIMMABLE), "entity_id"),
        (
            _light(
                control=Control.DIMMABLE,
                entity_id="light.tank",
                schedule=Schedule(on=time(12), off=time(20), brightness_pct=0),
            ),
            "brightness_pct",
        ),
        (
            _light(
                control=Control.DIMMABLE,
                entity_id="light.tank",
                schedule=Schedule(on=time(12), off=time(20), brightness_pct=101),
            ),
            "brightness_pct",
        ),
        (
            _light(
                control=Control.DIMMABLE,
                entity_id="light.tank",
                schedule=Schedule(on=time(12), off=time(13), ramp_minutes=61),
            ),
            "ramp_minutes",
        ),
        (
            _light(
                control=Control.DIMMABLE,
                entity_id="light.tank",
                schedule=Schedule(on=time(12), off=time(20), ramp_minutes=-1),
            ),
            "ramp_minutes",
        ),
        (
            _light(
                control=Control.DIMMABLE,
                entity_id="light.tank",
                schedule=Schedule(on=time(12), off=time(20), rgb_color=(1, 2, 3)),
            ),
            "rgb_color",
        ),
        (
            _light(
                control=Control.COLOUR,
                entity_id="light.tank",
                schedule=Schedule(on=time(12), off=time(20), rgb_color=(1, 2, 256)),
            ),
            "rgb_color",
        ),
        (_light(one_day=OneDayChange(day=DAY, on=time(22), off=time(21), brightness_pct=None)), "off"),
        (_light(one_day=OneDayChange(day=DAY, on=time(12), off=time(21), brightness_pct=50)), "brightness_pct"),
        (_light(model=" "), "model"),
    ],
)
def test_check_refuses_a_light_it_cannot_run(light: Light, field: str) -> None:
    with pytest.raises(InvalidLightError) as raised:
        light.check()

    assert raised.value.field == field
    assert raised.value.key == "invalid_light"


def test_check_accepts_the_lights_it_can_run() -> None:
    _light().check()
    _light(entity_id="light.tank").check()
    _light(
        control=Control.COLOUR,
        entity_id="light.tank",
        schedule=Schedule(on=time(12), off=time(13), brightness_pct=100, ramp_minutes=60, rgb_color=(0, 0, 255)),
    ).check()


def test_a_status_is_a_problem_while_unavailable_or_a_change_was_missed() -> None:
    missed = LightEvent(time=_at(12), light_id="l1", kind=LightEventKind.MISSED, wanted=True)

    assert not LightStatus().problem
    assert LightStatus(unavailable_since=_at(11)).problem
    assert LightStatus(missed=missed).problem
    assert LightStatus(unavailable_since=_at(11), missed=missed).to_json() == {
        "unavailable_since": _at(11).isoformat(),
        "missed": missed.to_json(),
    }
    assert LightStatus().to_json() == {"unavailable_since": None, "missed": None}


def test_events_round_trip() -> None:
    events = [
        LightEvent(time=_at(12), light_id="l1", kind=LightEventKind.ON, by="schedule"),
        LightEvent(time=_at(12), light_id="l1", kind=LightEventKind.MISSED, wanted=True),
        LightEvent(time=_at(13), light_id="l1", kind=LightEventKind.LATE, wanted=True, minutes_late=60),
    ]

    assert [LightEvent.from_json(event.to_json()) for event in events] == events
    assert events[0].to_json() == {
        "time": _at(12).isoformat(),
        "light_id": "l1",
        "kind": "on",
        "by": "schedule",
        "wanted": None,
        "minutes_late": None,
    }


def test_prune_keeps_the_window_and_the_state_before_it() -> None:
    now = _at(12)
    old_on = LightEvent(time=now - timedelta(days=40), light_id="l1", kind=LightEventKind.ON)
    old_off = LightEvent(time=now - timedelta(days=35), light_id="l1", kind=LightEventKind.OFF)
    old_missed = LightEvent(time=now - timedelta(days=34), light_id="l1", kind=LightEventKind.MISSED, wanted=True)
    other_old = LightEvent(time=now - timedelta(days=33), light_id="l2", kind=LightEventKind.UNAVAILABLE)
    recent = LightEvent(time=now - timedelta(days=2), light_id="l1", kind=LightEventKind.ON)

    kept = prune_log([recent, old_on, other_old, old_off, old_missed], now)

    assert kept == [old_off, other_old, recent]


def test_on_periods_follow_the_log_and_clip_to_the_window() -> None:
    now = _at(23)
    since = _at(0)
    events = [
        LightEvent(time=_at(20, day=DAY - timedelta(days=1)), light_id="l1", kind=LightEventKind.ON),
        LightEvent(time=_at(2), light_id="l1", kind=LightEventKind.OFF),
        LightEvent(time=_at(12), light_id="l1", kind=LightEventKind.ON),
        LightEvent(time=_at(13), light_id="l2", kind=LightEventKind.OFF),
        LightEvent(time=_at(14), light_id="l1", kind=LightEventKind.UNAVAILABLE),
        LightEvent(time=_at(15), light_id="l1", kind=LightEventKind.MISSED, wanted=True),
        LightEvent(time=_at(16), light_id="l1", kind=LightEventKind.ON),
    ]

    assert on_periods(events, "l1", since, now) == [(_at(0), _at(2)), (_at(12), _at(14)), (_at(16), _at(23))]
    assert on_periods([], "l1", since, now) == []


def test_times_are_compared_in_utc() -> None:
    event = LightEvent(time=datetime(2026, 11, 26, 12, tzinfo=UTC), light_id="l1", kind=LightEventKind.ON)

    assert on_periods([event], "l1", _at(11), _at(13)) == [(_at(12), _at(13))]


@pytest.mark.parametrize(
    "changes",
    [
        {"model": 1},
        {"ramp_minutes": True},
        {"ramp_minutes": "5"},
        {"rgb_color": [1, 2]},
        {"rgb_color": "red"},
        {"one_day": "tomorrow"},
    ],
)
def test_a_damaged_record_is_refused(changes: dict[str, object]) -> None:
    record = _light().to_record() | changes

    with pytest.raises(TypeError):
        Light.from_record("l1", record)  # type: ignore[arg-type]  # the damaged values are the point of the test


def test_on_periods_skip_repeated_states_and_periods_before_the_window() -> None:
    yesterday = DAY - timedelta(days=1)
    events = [
        LightEvent(time=_at(9, day=yesterday), light_id="l1", kind=LightEventKind.OFF),
        LightEvent(time=_at(12, day=yesterday), light_id="l1", kind=LightEventKind.ON),
        LightEvent(time=_at(20, day=yesterday), light_id="l1", kind=LightEventKind.OFF),
        LightEvent(time=_at(12), light_id="l1", kind=LightEventKind.ON),
        LightEvent(time=_at(13), light_id="l1", kind=LightEventKind.ON),
        LightEvent(time=_at(20), light_id="l1", kind=LightEventKind.OFF),
    ]

    assert on_periods(events, "l1", _at(0), _at(23)) == [(_at(12), _at(20))]


def test_state_periods_follow_recorded_states_and_clip_to_the_window() -> None:
    changes = [
        (_at(20, day=DAY - timedelta(days=1)), True),
        (_at(2), False),
        (_at(12), True),
        (_at(13), True),
        (_at(14), False),
        (_at(16), True),
    ]

    assert state_periods(changes, _at(0), _at(23)) == [(_at(0), _at(2)), (_at(12), _at(14)), (_at(16), _at(23))]
    assert state_periods([], _at(0), _at(23)) == []
    assert state_periods([(_at(1), False), (_at(22, day=DAY - timedelta(days=1)), True)], _at(0), _at(3)) == [
        (_at(0), _at(1))
    ]
    assert state_periods([(_at(5), True)], _at(0), _at(3)) == []


def test_history_periods_use_the_fallback_before_the_first_recorded_change() -> None:
    fallback = [(_at(1), _at(3)), (_at(5), _at(9))]

    assert history_periods([], fallback, _at(0), _at(23)) == fallback
    assert history_periods([(_at(7), True), (_at(8), False)], fallback, _at(0), _at(23)) == [
        (_at(1), _at(3)),
        (_at(5), _at(8)),
    ]
    assert history_periods([(_at(8), False), (_at(10), True)], fallback, _at(0), _at(23)) == [
        (_at(1), _at(3)),
        (_at(5), _at(8)),
        (_at(10), _at(23)),
    ]
    assert history_periods([(_at(4), False)], fallback, _at(0), _at(23)) == [(_at(1), _at(3))]
