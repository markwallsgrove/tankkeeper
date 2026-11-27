"""The rules that give the status, from the records."""

from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from custom_components.tankkeeper.domain import InvalidInputError, Record
from custom_components.tankkeeper.lights import AutomationProblem, LightEvent, LightEventKind, LightStatus
from custom_components.tankkeeper.plan import Series, Slot, Task, TaskStatus
from custom_components.tankkeeper.rules import (
    Facts,
    Level,
    LightCheck,
    Reading,
    Rule,
    RuleResult,
    RuleSettings,
    Stage,
    Status,
    evaluate,
)

LONDON = ZoneInfo("Europe/London")
NOW = datetime(2026, 11, 26, 8, tzinfo=UTC)
TODAY = date(2026, 11, 26)


def _test(days_ago: float, source: str = "tank", **values: float) -> Reading:
    return Reading(time=NOW - timedelta(days=days_ago), source=source, values=values)


def _task(day: date, text: str, status: TaskStatus = TaskStatus.OPEN, slot: Slot = Slot.TASK) -> Task:
    return Task(id=f"{day}-{text}", day=day, slot=slot, text=text, status=status)


def _facts(
    *readings: Reading,
    stage: Stage | None = None,
    tasks: tuple[Task, ...] = (),
    lights: tuple[LightCheck, ...] = (),
    series: tuple[Series, ...] = (),
) -> Facts:
    return Facts(now=NOW, tz=LONDON, stage=stage, readings=readings, tasks=tasks, lights=lights, series=series)


def _result(status: Status, rule: Rule) -> RuleResult | None:
    return next((result for result in status.results if result.rule is rule), None)


def _level(status: Status, rule: Rule) -> Level | None:
    result = _result(status, rule)
    return None if result is None else result.level


def test_no_records_give_no_results_and_on_course() -> None:
    status = evaluate(_facts(), RuleSettings())

    assert status.results == ()
    assert status.level is Level.ON_COURSE
    assert status.problems() == ()


@pytest.mark.parametrize(
    ("value", "level"),
    [(0.5, Level.ON_COURSE), (2, Level.ON_COURSE), (2.5, Level.WATCH), (4, Level.WATCH), (4.5, Level.ACT)],
)
@pytest.mark.parametrize(("name", "rule"), [("ammonia", Rule.AMMONIA), ("nitrite", Rule.NITRITE)])
def test_ammonia_and_nitrite_limits(name: str, rule: Rule, value: float, level: Level) -> None:
    status = evaluate(_facts(Reading(time=NOW, source="tank", values={name: value})), RuleSettings())

    assert _level(status, rule) is level
    assert status.level is level


def test_the_newest_reading_counts_and_tap_readings_never_do() -> None:
    status = evaluate(
        _facts(_test(3, ammonia=5), _test(1, ammonia=0.5), _test(0, source="tap", ammonia=8)),
        RuleSettings(),
    )

    result = _result(status, Rule.AMMONIA)
    assert result == RuleResult(
        rule=Rule.AMMONIA,
        level=Level.ON_COURSE,
        reason="Ammonia 0.5 ppm on 25 Nov is inside the 2 ppm limit.",
        action=None,
    )


def test_of_two_readings_at_the_same_time_the_later_one_counts() -> None:
    status = evaluate(_facts(_test(1, ammonia=5), _test(1, ammonia=0.5)), RuleSettings())

    assert _level(status, Rule.AMMONIA) is Level.ON_COURSE


def test_reasons_say_what_to_do() -> None:
    status = evaluate(_facts(_test(1, ammonia=0.25, nitrite=4.5, ph=6.8), stage=Stage.CYCLING), RuleSettings())

    assert status.level is Level.ACT
    assert [(result.rule, result.level) for result in status.problems()] == [
        (Rule.NITRITE, Level.ACT),
        (Rule.PH, Level.WATCH),
    ]
    nitrite = _result(status, Rule.NITRITE)
    assert nitrite is not None
    assert nitrite.reason == "Nitrite 4.5 ppm on 25 Nov is above the 4 ppm limit."
    assert nitrite.action == "Change water to bring it under 4 ppm, then test again the next day."
    ph = _result(status, Rule.PH)
    assert ph is not None
    assert ph.reason == "pH 6.8 on 25 Nov is under 7. The cycle can slow below 7."
    assert ph.action == "Test pH again at the next test. If it is still under 7, change 20-25% of the water."


def test_watch_on_ammonia_says_to_test_again() -> None:
    result = _result(evaluate(_facts(_test(1, ammonia=3)), RuleSettings()), Rule.AMMONIA)

    assert result is not None
    assert result.reason == "Ammonia 3 ppm on 25 Nov is above the 2 ppm watch limit."
    assert result.action == "Test again within 2 days. Above 4 ppm, change water to bring it down."


@pytest.mark.parametrize(
    ("ph", "level"), [(7.4, Level.ON_COURSE), (7.0, Level.ON_COURSE), (6.8, Level.WATCH), (6.4, Level.ACT)]
)
def test_ph_while_cycling(ph: float, level: Level) -> None:
    assert _level(evaluate(_facts(_test(1, ph=ph), stage=Stage.CYCLING), RuleSettings()), Rule.PH) is level


@pytest.mark.parametrize("stage", [None, Stage.CYCLED])
def test_ph_only_counts_while_cycling(stage: Stage | None) -> None:
    assert _result(evaluate(_facts(_test(1, ph=6), stage=stage), RuleSettings()), Rule.PH) is None


def test_act_on_ph_says_to_change_water() -> None:
    result = _result(evaluate(_facts(_test(1, ph=6.2), stage=Stage.CYCLING), RuleSettings()), Rule.PH)

    assert result is not None
    assert result.action == "Change 20-25% of the water and test pH again the next day."
    ok = _result(evaluate(_facts(_test(1, ph=7.2), stage=Stage.CYCLING), RuleSettings()), Rule.PH)
    assert ok is not None
    assert ok.reason == "pH 7.2 on 25 Nov is at or above 7."


@pytest.mark.parametrize(("days", "level"), [(4, Level.ON_COURSE), (5, Level.WATCH), (7, Level.ACT)])
def test_cycle_stalled_when_ammonia_stays_the_same_and_no_nitrite(days: int, level: Level) -> None:
    facts = _facts(
        _test(days + 2, ammonia=2, nitrite=0),
        _test(days, ammonia=1, nitrite=0),
        _test(days / 2, ammonia=1, nitrite=0),
        _test(0, ammonia=1, nitrite=0),
        stage=Stage.CYCLING,
    )

    assert _level(evaluate(facts, RuleSettings()), Rule.CYCLE_STALLED) is level


def test_cycle_stalled_reason() -> None:
    facts = _facts(_test(7, ammonia=2, nitrite=0), _test(0, ammonia=2, nitrite=0), stage=Stage.CYCLING)

    result = _result(evaluate(facts, RuleSettings()), Rule.CYCLE_STALLED)

    assert result is not None
    assert result.reason == "Ammonia has stayed at 2 ppm for 7 days, since 19 Nov, and no nitrite shows."
    assert (
        result.action
        == "The cycle may have stalled. Check pH: under 7 can stall it, and a 20-25% water change is the fix."
    )


@pytest.mark.parametrize(
    "readings",
    [
        # Ammonia fell.
        (_test(7, ammonia=2, nitrite=0), _test(0, ammonia=1, nitrite=0)),
        # Ammonia rose after a dose.
        (_test(7, ammonia=1, nitrite=0), _test(0, ammonia=2, nitrite=0)),
        # Nitrite shows.
        (_test(7, ammonia=2, nitrite=0), _test(0, ammonia=2, nitrite=0.25)),
        # No ammonia left.
        (_test(7, ammonia=0, nitrite=0), _test(0, ammonia=0, nitrite=0)),
    ],
)
def test_a_moving_cycle_is_on_course(readings: tuple[Reading, ...]) -> None:
    status = evaluate(_facts(*readings, stage=Stage.CYCLING), RuleSettings())

    assert _level(status, Rule.CYCLE_STALLED) is Level.ON_COURSE


@pytest.mark.parametrize(
    ("readings", "stage"),
    [
        ((_test(7, ammonia=2), _test(0, ammonia=2)), Stage.CYCLING),
        ((_test(7, ammonia=2, nitrite=0), _test(0, ammonia=2, nitrite=0)), Stage.CYCLED),
        ((_test(0, nitrite=0),), Stage.CYCLING),
    ],
)
def test_cycle_stalled_needs_nitrite_readings_and_cycling(readings: tuple[Reading, ...], stage: Stage) -> None:
    assert _result(evaluate(_facts(*readings, stage=stage), RuleSettings()), Rule.CYCLE_STALLED) is None


@pytest.mark.parametrize(
    ("day", "level"),
    [(TODAY, Level.ON_COURSE), (TODAY - timedelta(days=1), Level.WATCH), (TODAY - timedelta(days=3), Level.ACT)],
)
def test_test_overdue_from_the_plan(day: date, level: Level) -> None:
    tasks = (_task(day, "Test ammonia and nitrite"), _task(TODAY + timedelta(days=2), "Test pH"))

    assert _level(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.TEST_OVERDUE) is level


def test_test_overdue_reason() -> None:
    tasks = (_task(TODAY - timedelta(days=2), "Test ammonia and nitrite"),)

    result = _result(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.TEST_OVERDUE)

    assert result is not None
    assert result.reason == "The test 'Test ammonia and nitrite' from 24 Nov is 2 days late."
    assert result.action == "Do the test and record the results."


def test_a_test_task_is_done_by_completing_skipping_or_recording_a_tank_test() -> None:
    late = TODAY - timedelta(days=3)
    tasks = (
        _task(late, "Test pH", TaskStatus.COMPLETE),
        _task(late, "Water test", TaskStatus.SKIP),
        _task(late - timedelta(days=1), "Test nitrate"),
        _task(late, "Clean the glass"),
    )

    status = evaluate(_facts(_test(4, nitrate=10), _test(0, source="tap", kh=4), tasks=tasks), RuleSettings())

    result = _result(status, Rule.TEST_OVERDUE)
    assert result == RuleResult(
        rule=Rule.TEST_OVERDUE, level=Level.ON_COURSE, reason="No planned test is late.", action=None
    )


def test_a_test_late_by_less_than_the_watch_days_is_on_course() -> None:
    tasks = (_task(TODAY - timedelta(days=1), "Test pH"),)

    status = evaluate(_facts(tasks=tasks), RuleSettings(test_watch_days=2, test_act_days=3))

    assert _result(status, Rule.TEST_OVERDUE) == RuleResult(
        rule=Rule.TEST_OVERDUE,
        level=Level.ON_COURSE,
        reason="The test 'Test pH' from 25 Nov is 1 day late.",
        action=None,
    )


def test_a_later_completed_test_does_an_earlier_one() -> None:
    tasks = (
        _task(TODAY - timedelta(days=5), "Test pH"),
        _task(TODAY - timedelta(days=2), "Test pH", TaskStatus.COMPLETE),
    )

    assert _level(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.TEST_OVERDUE) is Level.ON_COURSE


def test_a_tap_test_does_not_do_a_planned_test() -> None:
    tasks = (_task(TODAY - timedelta(days=3), "Test KH"),)

    status = evaluate(_facts(_test(0, source="tap", kh=4), tasks=tasks), RuleSettings())

    assert _level(status, Rule.TEST_OVERDUE) is Level.ACT


def test_no_test_tasks_give_no_test_result() -> None:
    tasks = (_task(TODAY - timedelta(days=3), "Clean the glass"),)

    assert _result(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.TEST_OVERDUE) is None


def _dose(days_ago: int, text: str, status: TaskStatus) -> Task:
    return _task(TODAY - timedelta(days=days_ago), text, status, Slot.DOSE)


@pytest.mark.parametrize(
    ("statuses", "level"),
    [
        ((TaskStatus.COMPLETE, TaskStatus.COMPLETE), Level.ON_COURSE),
        ((TaskStatus.SKIP, TaskStatus.COMPLETE), Level.ON_COURSE),
        ((TaskStatus.COMPLETE, TaskStatus.SKIP), Level.WATCH),
        ((TaskStatus.SKIP, TaskStatus.SKIP), Level.ACT),
    ],
)
def test_dose_skipped(statuses: tuple[TaskStatus, TaskStatus], level: Level) -> None:
    tasks = (
        _dose(2, "Bio-CO2 1.5 ml", statuses[0]),
        _dose(1, "Bio-CO2 1.5 ml", statuses[1]),
        _dose(1, "Easy-Life 2 ml", TaskStatus.COMPLETE),
        _dose(0, "Bio-CO2 1.5 ml", TaskStatus.OPEN),
    )

    assert _level(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.DOSE_SKIPPED) is level


def test_dose_skipped_counts_each_product_and_only_the_last_week() -> None:
    tasks = (
        _dose(9, "Bio-CO2 1.5 ml", TaskStatus.SKIP),
        _dose(2, "Bio-CO2 1.5 ml", TaskStatus.SKIP),
        _dose(1, "Easy-Life 2 ml", TaskStatus.SKIP),
    )

    result = _result(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.DOSE_SKIPPED)

    assert result is not None
    assert result.level is Level.WATCH
    assert result.reason == "Bio-CO2 was skipped on 24 Nov. Easy-Life was skipped on 25 Nov."
    assert result.action == "Give the next dose as planned."


def test_dose_skipped_twice_reason() -> None:
    tasks = (_dose(2, "Bio-CO2 1.5 ml", TaskStatus.SKIP), _dose(1, "Bio-CO2 2 ml", TaskStatus.SKIP))

    result = _result(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.DOSE_SKIPPED)

    assert result is not None
    assert result.level is Level.ACT
    assert result.reason == "Bio-CO2 was skipped 2 times running, last on 25 Nov."
    assert result.action == "Give the dose, or change the plan if it is no longer needed."


def test_no_finished_doses_give_no_dose_result() -> None:
    tasks = (_dose(0, "Bio-CO2 1.5 ml", TaskStatus.OPEN), _task(TODAY, "Test pH", TaskStatus.SKIP))

    assert _result(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.DOSE_SKIPPED) is None


@pytest.mark.parametrize(
    ("days_left", "level"),
    [(20, Level.ON_COURSE), (14, Level.WATCH), (8, Level.WATCH), (7, Level.ACT), (-2, Level.ACT)],
)
def test_plan_runs_out(days_left: int, level: Level) -> None:
    tasks = (_task(TODAY - timedelta(days=5), "Test pH"), _task(TODAY + timedelta(days=days_left), "Clean"))

    assert _level(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.PLAN_ENDS) is level


def test_plan_runs_out_reason() -> None:
    tasks = (_task(TODAY + timedelta(days=6), "Clean"),)

    result = _result(evaluate(_facts(tasks=tasks), RuleSettings()), Rule.PLAN_ENDS)

    assert result is not None
    assert result.reason == "The plan ends on 2 Dec, in 6 days."
    assert result.action == "Add tasks to the plan beyond 2 Dec."


def _series(until: date | None) -> Series:
    return Series(id="s1", start=TODAY - timedelta(days=3), slot=Slot.TASK, text="Clean", every_days=7, until=until)


def test_a_repeating_task_with_no_end_never_lets_the_plan_run_out() -> None:
    tasks = (_task(TODAY + timedelta(days=1), "Clean"),)

    result = _result(evaluate(_facts(tasks=tasks, series=(_series(None),)), RuleSettings()), Rule.PLAN_ENDS)

    assert result is not None
    assert result.level is Level.ON_COURSE
    assert result.reason == "A repeating task has no end day, so the plan never runs out."


@pytest.mark.parametrize(
    ("until", "tasks", "level", "reason"),
    [
        (TODAY + timedelta(days=30), (), Level.ON_COURSE, "The plan ends on 21 Dec, in 25 days."),
        (TODAY + timedelta(days=6), (), Level.ACT, "The plan ends on 30 Nov, in 4 days."),
        (TODAY + timedelta(days=6), (_task(TODAY + timedelta(days=20), "Trim"),), Level.ON_COURSE, None),
        (TODAY - timedelta(days=2), (), Level.ACT, None),
    ],
)
def test_a_repeating_task_with_an_end_counts_its_last_occurrence(
    until: date, tasks: tuple[Task, ...], level: Level | None, reason: str | None
) -> None:
    result = _result(evaluate(_facts(tasks=tasks, series=(_series(until),)), RuleSettings()), Rule.PLAN_ENDS)

    assert (None if result is None else result.level) is level
    if reason is not None:
        assert result is not None
        assert result.reason == reason


def test_a_repeating_task_with_no_occurrences_left_is_not_a_plan() -> None:
    empty = Series(id="s1", start=TODAY, slot=Slot.TASK, text="Clean", every_days=7, until=TODAY, skipped=(TODAY,))

    assert _result(evaluate(_facts(series=(empty,)), RuleSettings()), Rule.PLAN_ENDS) is None


def _light(status: LightStatus) -> LightCheck:
    return LightCheck(
        name="Chihiros WRGB II", entity_id="switch.tank_light", automation="automation.tank_light", status=status
    )


def test_light_problems() -> None:
    missed = LightEvent(time=NOW - timedelta(hours=1), light_id="l1", kind=LightEventKind.MISSED, wanted=True)

    fine = evaluate(_facts(lights=(_light(LightStatus()),)), RuleSettings())
    watch = evaluate(_facts(lights=(_light(LightStatus(missed=missed)),)), RuleSettings())
    act = evaluate(
        _facts(lights=(_light(LightStatus(missed=missed)), _light(LightStatus(unavailable_since=NOW)))),
        RuleSettings(),
    )

    assert _result(fine, Rule.LIGHT) == RuleResult(
        rule=Rule.LIGHT, level=Level.ON_COURSE, reason="The lights follow their schedule.", action=None
    )
    watch_result = _result(watch, Rule.LIGHT)
    assert watch_result is not None
    assert watch_result.level is Level.WATCH
    assert watch_result.reason == "Chihiros WRGB II did not turn on at 07:00."
    assert watch_result.action == "Check the light, its plug and its automation."
    act_result = _result(act, Rule.LIGHT)
    assert act_result is not None
    assert act_result.level is Level.ACT
    assert act_result.reason == (
        "Chihiros WRGB II did not turn on at 07:00. switch.tank_light for Chihiros WRGB II is unavailable."
    )
    assert act_result.action == "Check the plug has power and is connected to Home Assistant."


@pytest.mark.parametrize(
    ("status", "reason"),
    [
        (
            LightStatus(needs_helpers=True),
            "Chihiros WRGB II needs helpers: give it an automation and its on and off time helpers, "
            "then TankKeeper sets them.",
        ),
        (
            LightStatus(automation=AutomationProblem.MISSING),
            "The automation automation.tank_light for Chihiros WRGB II is missing.",
        ),
        (
            LightStatus(helper_error="no helper input_datetime.tank_light_on"),
            "Chihiros WRGB II: no helper input_datetime.tank_light_on.",
        ),
    ],
)
def test_a_broken_automation_or_helper_is_act(status: LightStatus, reason: str) -> None:
    result = _result(evaluate(_facts(lights=(_light(status),)), RuleSettings()), Rule.LIGHT)

    assert result == RuleResult(
        rule=Rule.LIGHT,
        level=Level.ACT,
        reason=reason,
        action="Check the light's automation and helpers in Home Assistant.",
    )


def test_a_missed_off_says_off() -> None:
    missed = LightEvent(time=NOW, light_id="l1", kind=LightEventKind.MISSED, wanted=False)

    result = _result(evaluate(_facts(lights=(_light(LightStatus(missed=missed)),)), RuleSettings()), Rule.LIGHT)

    assert result is not None
    assert result.reason == "Chihiros WRGB II did not turn off at 08:00."


def test_status_json() -> None:
    status = evaluate(_facts(_test(1, ammonia=3)), RuleSettings())

    assert status.to_json() == {
        "status": "watch",
        "checked": NOW.isoformat(),
        "rules": [
            {
                "rule": "ammonia",
                "level": "watch",
                "reason": "Ammonia 3 ppm on 25 Nov is above the 2 ppm watch limit.",
                "action": "Test again within 2 days. Above 4 ppm, change water to bring it down.",
            }
        ],
    }
    assert status.summary() == (
        "Ammonia 3 ppm on 25 Nov is above the 2 ppm watch limit. "
        "Test again within 2 days. Above 4 ppm, change water to bring it down."
    )


def test_settings_change_the_limits() -> None:
    settings = RuleSettings(nitrogen_watch=0.25, nitrogen_act=1)

    assert _level(evaluate(_facts(_test(1, ammonia=0.5)), settings), Rule.AMMONIA) is Level.WATCH


def test_settings_round_trip_and_take_defaults() -> None:
    settings = RuleSettings(ph_watch=7.2, stall_act_days=10)

    assert RuleSettings.from_json(settings.to_json()) == settings
    assert RuleSettings.from_json(None) == RuleSettings()
    assert RuleSettings.from_json({"ph_watch": "x", "plan_act_days": 3}) == RuleSettings(plan_act_days=3)


@pytest.mark.parametrize(
    "changes",
    [
        {"nitrogen_act": 1.0},
        {"ph_act": 7.5},
        {"stall_act_days": 4},
        {"test_act_days": 0},
        {"skip_act": 0},
        {"plan_act_days": 20},
    ],
)
def test_act_must_be_at_least_as_strict_as_watch(changes: Record) -> None:
    settings = RuleSettings.from_json(changes)

    with pytest.raises(InvalidInputError):
        settings.check()


def test_default_settings_pass_the_check() -> None:
    RuleSettings().check()
