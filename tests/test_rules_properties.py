"""Hegel properties for the rules and the status."""

from dataclasses import replace
from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import hegel
from hegel import generators as gs

from custom_components.tankkeeper.lights import LightEvent, LightEventKind, LightStatus
from custom_components.tankkeeper.plan import Slot, Task, TaskStatus
from custom_components.tankkeeper.rules import (
    LEVEL_ORDER,
    Facts,
    Level,
    LightCheck,
    Reading,
    Rule,
    RuleSettings,
    Stage,
    evaluate,
)

LONDON = ZoneInfo("Europe/London")
NOW = datetime(2026, 11, 26, 8, tzinfo=UTC)
TODAY = date(2026, 11, 26)
READING_RULES = {Rule.AMMONIA, Rule.NITRITE, Rule.PH, Rule.CYCLE_STALLED}
KIT = [0.0, 0.25, 0.5, 1.0, 2.0, 4.0, 8.0]
NAMES = ["ammonia", "nitrite", "ph", "nitrate"]


@hegel.composite
def readings(tc: hegel.TestCase, source: str = "tank") -> tuple[Reading, ...]:
    """A few tests from the last two weeks."""
    count = tc.draw(gs.integers(min_value=0, max_value=6))
    result = []
    for _ in range(count):
        names = tc.draw(gs.lists(gs.sampled_from(NAMES), min_size=1, max_size=4, unique=True))
        values = {
            name: tc.draw(gs.floats(min_value=5.5, max_value=8.5) if name == "ph" else gs.sampled_from(KIT))
            for name in names
        }
        hours = tc.draw(gs.integers(min_value=0, max_value=24 * 14))
        result.append(Reading(time=NOW - timedelta(hours=hours), source=source, values=values))
    return tuple(result)


@hegel.composite
def tasks(tc: hegel.TestCase) -> tuple[Task, ...]:
    """A few tests, doses and other tasks around today."""
    count = tc.draw(gs.integers(min_value=0, max_value=6))
    return tuple(
        Task(
            id=f"t{index}",
            day=TODAY + timedelta(days=tc.draw(gs.integers(min_value=-10, max_value=20))),
            slot=tc.draw(gs.sampled_from(list(Slot))),
            text=tc.draw(gs.sampled_from(["Test pH", "Bio-CO2 1.5 ml", "Easy-Life 2 ml", "Clean the glass"])),
            status=tc.draw(gs.sampled_from(list(TaskStatus))),
        )
        for index in range(count)
    )


@hegel.composite
def lights(tc: hegel.TestCase) -> tuple[LightCheck, ...]:
    """A few lights, each fine, missing a change or unavailable."""
    missed = LightEvent(time=NOW, light_id="l1", kind=LightEventKind.MISSED, wanted=True)
    statuses = [LightStatus(), LightStatus(missed=missed), LightStatus(unavailable_since=NOW)]
    count = tc.draw(gs.integers(min_value=0, max_value=3))
    return tuple(
        LightCheck(name=f"Light {index}", entity_id=f"switch.l{index}", status=tc.draw(gs.sampled_from(statuses)))
        for index in range(count)
    )


@hegel.composite
def facts(tc: hegel.TestCase) -> Facts:
    """Any records the rules could see."""
    return Facts(
        now=NOW,
        tz=LONDON,
        stage=tc.draw(gs.sampled_from([None, Stage.CYCLING, Stage.CYCLED])),
        readings=tc.draw(readings()),
        tasks=tc.draw(tasks()),
        lights=tc.draw(lights()),
    )


@hegel.test
def test_status_is_the_worst_rule_result(tc: hegel.TestCase) -> None:
    status = evaluate(tc.draw(facts()), RuleSettings())

    worst = max((LEVEL_ORDER.index(result.level) for result in status.results), default=0)
    assert status.level is LEVEL_ORDER[worst]
    assert all(result.level is not Level.ON_COURSE for result in status.problems())
    assert all((result.action is None) == (result.level is Level.ON_COURSE) for result in status.results)
    assert all(result.reason for result in status.results)


@hegel.test
def test_tap_readings_never_count(tc: hegel.TestCase) -> None:
    base = tc.draw(facts())
    tap = tc.draw(readings(source="tap"))

    with_tap = replace(base, readings=base.readings + tap)

    assert evaluate(with_tap, RuleSettings()) == evaluate(base, RuleSettings())


@hegel.test
def test_missing_data_gives_no_result(tc: hegel.TestCase) -> None:
    base = tc.draw(facts())

    status = evaluate(replace(base, readings=(), tasks=(), lights=()), RuleSettings())
    without_readings = evaluate(replace(base, readings=()), RuleSettings())

    assert status.results == ()
    assert status.level is Level.ON_COURSE
    assert not {result.rule for result in without_readings.results} & READING_RULES


@hegel.test
def test_more_ammonia_never_lowers_the_level(tc: hegel.TestCase) -> None:
    low = tc.draw(gs.floats(min_value=0, max_value=10))
    high = low + tc.draw(gs.floats(min_value=0, max_value=10))

    def level(value: float) -> int:
        reading = Reading(time=NOW, source="tank", values={"ammonia": value})
        status = evaluate(
            Facts(now=NOW, tz=LONDON, stage=None, readings=(reading,), tasks=(), lights=()), RuleSettings()
        )
        return LEVEL_ORDER.index(status.level)

    assert level(low) <= level(high)


@hegel.test
def test_lower_ph_never_lowers_the_level(tc: hegel.TestCase) -> None:
    high = tc.draw(gs.floats(min_value=4, max_value=9))
    low = high - tc.draw(gs.floats(min_value=0, max_value=3))

    def level(value: float) -> int:
        reading = Reading(time=NOW, source="tank", values={"ph": value})
        status = evaluate(
            Facts(now=NOW, tz=LONDON, stage=Stage.CYCLING, readings=(reading,), tasks=(), lights=()), RuleSettings()
        )
        return LEVEL_ORDER.index(status.level)

    assert level(high) <= level(low)


@hegel.test
def test_stricter_settings_never_lower_the_level(tc: hegel.TestCase) -> None:
    drawn = tc.draw(facts())
    watch = tc.draw(gs.floats(min_value=0.1, max_value=2))
    stricter = RuleSettings(
        nitrogen_watch=watch, nitrogen_act=watch + tc.draw(gs.floats(min_value=0, max_value=4 - watch))
    )

    default = LEVEL_ORDER.index(evaluate(drawn, RuleSettings()).level)

    assert LEVEL_ORDER.index(evaluate(drawn, stricter).level) >= default
