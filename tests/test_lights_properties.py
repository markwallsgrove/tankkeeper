"""Hegel properties for light schedules, the next change, the dose time and the on/off log."""

from datetime import date, datetime, time, timedelta
import itertools
from zoneinfo import ZoneInfo

import hegel
from hegel import generators as gs

from custom_components.tankkeeper.lights import (
    LOG_DAYS,
    STATE_KINDS,
    Control,
    Light,
    LightEvent,
    LightEventKind,
    OneDayChange,
    Schedule,
    dose_time,
    next_change,
    on_periods,
    prune_log,
    wanted_on,
)

LONDON = ZoneInfo("Europe/London")
DAY = date(2026, 11, 26)
days = gs.temporal.dates(min_value=DAY - timedelta(days=3), max_value=DAY + timedelta(days=3))


@hegel.composite
def windows(tc: hegel.TestCase) -> tuple[time, time]:
    """An on time and a later off time on the same day."""
    on = tc.draw(gs.integers(min_value=0, max_value=24 * 60 - 2))
    off = tc.draw(gs.integers(min_value=on + 1, max_value=24 * 60 - 1))
    return time(on // 60, on % 60), time(off // 60, off % 60)


@hegel.composite
def lights(tc: hegel.TestCase) -> Light:
    """A light, maybe dimmable, maybe with a one-day change, maybe removed."""
    on, off = tc.draw(windows())
    control = tc.draw(gs.sampled_from(list(Control)))
    window = (off.hour * 60 + off.minute) - (on.hour * 60 + on.minute)
    dims = control is not Control.ON_OFF
    one_day = None
    if tc.draw(gs.booleans()):
        day_on, day_off = tc.draw(windows())
        one_day = OneDayChange(
            day=tc.draw(days),
            on=day_on,
            off=day_off,
            brightness_pct=tc.draw(gs.integers(min_value=1, max_value=100)) if dims else None,
        )
    ramp = 0
    if dims and one_day is not None:
        day_window = (one_day.off.hour * 60 + one_day.off.minute) - (one_day.on.hour * 60 + one_day.on.minute)
        ramp = tc.draw(gs.integers(min_value=0, max_value=min(window, day_window)))
    elif dims:
        ramp = tc.draw(gs.integers(min_value=0, max_value=window))
    return Light(
        id=tc.draw(gs.sampled_from(["a", "b", "c"])),
        entity_id="light.tank" if dims else "switch.tank",
        model="LED",
        control=control,
        schedule=Schedule(
            on=on,
            off=off,
            brightness_pct=tc.draw(gs.integers(min_value=1, max_value=100)) if dims else None,
            ramp_minutes=ramp,
            rgb_color=(1, 2, 3) if control is Control.COLOUR else None,
        ),
        one_day=one_day,
        added=DAY - timedelta(days=10),
        removed=DAY if tc.draw(gs.integers(min_value=0, max_value=4)) == 0 else None,
    )


@hegel.composite
def moments(tc: hegel.TestCase) -> datetime:
    """A moment around today, on the minute."""
    day = tc.draw(days)
    minute = tc.draw(gs.integers(min_value=0, max_value=24 * 60 - 1))
    return datetime.combine(day, time(minute // 60, minute % 60), LONDON)


@hegel.test
def test_generated_lights_pass_their_check(tc: hegel.TestCase) -> None:
    light = tc.draw(lights())

    light.check()
    assert Light.from_record(light.id, light.to_record()) == light


@hegel.test
def test_the_one_day_change_only_touches_its_day(tc: hegel.TestCase) -> None:
    light = tc.draw(lights())
    day = tc.draw(days)

    if light.one_day is None or light.one_day.day != day:
        assert light.schedule_on(day) == light.schedule
    else:
        assert (light.schedule_on(day).on, light.schedule_on(day).off) == (light.one_day.on, light.one_day.off)


@hegel.test
def test_nothing_changes_before_the_next_change(tc: hegel.TestCase) -> None:
    group = tc.draw(gs.lists(lights(), min_size=0, max_size=3))
    now = tc.draw(moments())
    change = next_change(group, now)
    active = [light for light in group if light.active]

    if not active:
        assert change is None
        return
    assert change is not None
    assert now < change.time <= now + timedelta(days=2)
    before = change.time - timedelta(minutes=1)
    for light in active:
        if before >= now:
            assert wanted_on(light, now) == wanted_on(light, before)
        if light in change.on:
            assert not wanted_on(light, before) or before < now
            assert wanted_on(light, change.time)
        if light in change.off:
            assert not wanted_on(light, change.time)


@hegel.test
def test_the_dose_time_is_the_earliest_light_on(tc: hegel.TestCase) -> None:
    group = tc.draw(gs.lists(lights(), min_size=0, max_size=3))
    day = tc.draw(days)
    default = time(9)
    result = dose_time(group, day, default)
    active = [light for light in group if light.active]

    if not active:
        assert result == default
    else:
        assert result in {light.schedule_on(day).on for light in active}
        assert all(result <= light.schedule_on(day).on for light in active)


@hegel.composite
def logs(tc: hegel.TestCase) -> list[LightEvent]:
    """A log over the last 40 days."""
    now = datetime.combine(DAY, time(12), LONDON)
    count = tc.draw(gs.integers(min_value=0, max_value=12))
    return [
        LightEvent(
            time=now - timedelta(minutes=tc.draw(gs.integers(min_value=0, max_value=40 * 24 * 60))),
            light_id=tc.draw(gs.sampled_from(["a", "b"])),
            kind=tc.draw(gs.sampled_from(list(LightEventKind))),
        )
        for _ in range(count)
    ]


@hegel.test
def test_pruning_keeps_the_chart_for_the_window(tc: hegel.TestCase) -> None:
    events = tc.draw(logs())
    now = datetime.combine(DAY, time(12), LONDON)
    since = now - timedelta(days=LOG_DAYS)
    kept = prune_log(events, now)

    assert all(event in events for event in kept)
    assert all(event.time >= since or event.kind in STATE_KINDS for event in kept)
    assert [event for event in kept if event.time >= since] == sorted(
        (event for event in events if event.time >= since), key=lambda event: event.time
    )
    for light_id in ("a", "b"):
        assert on_periods(kept, light_id, since, now) == on_periods(events, light_id, since, now)


@hegel.test
def test_on_periods_are_ordered_and_inside_the_window(tc: hegel.TestCase) -> None:
    events = tc.draw(logs())
    now = datetime.combine(DAY, time(12), LONDON)
    since = now - timedelta(days=7)
    periods = on_periods(events, "a", since, now)

    for start, end in periods:
        assert since <= start < end <= now
    for (_, first_end), (second_start, _) in itertools.pairwise(periods):
        assert first_end <= second_start
