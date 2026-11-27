"""Repeating tasks: their occurrences and changes to one occurrence or this and future ones, with no Home Assistant."""

from dataclasses import replace
from datetime import UTC, date, datetime

import pytest

from custom_components.tankkeeper.domain import InvalidInputError, NothingToChangeError, Record
from custom_components.tankkeeper.plan import (
    Scope,
    Series,
    Slot,
    Task,
    TaskEdit,
    TaskStatus,
    Weekday,
    edit_series,
    occurrence_id,
    parse_occurrence_id,
    remove_from_series,
)

START = date(2026, 11, 26)
NOW = datetime(2026, 11, 26, 9, 30, tzinfo=UTC)


def _every(
    days: int | None = 3,
    *,
    until: date | None = None,
    skipped: tuple[date, ...] = (),
    note: str = "",
    weekdays: tuple[Weekday, ...] = (),
) -> Series:
    return Series(
        id="s1",
        start=START,
        slot=Slot.TASK,
        text="Water change 25%",
        note=note,
        every_days=days,
        weekdays=weekdays,
        until=until,
        skipped=skipped,
    )


def _weekly(*weekdays: Weekday, note: str = "") -> Series:
    return Series(id="s1", start=START, slot=Slot.DOSE, text="Bio-CO2 1.5 ml", note=note, weekdays=weekdays)


def test_every_n_days_counts_from_the_start() -> None:
    series = _every(3)

    assert series.dates(date(2026, 11, 20), date(2026, 12, 8)) == [
        date(2026, 11, 26),
        date(2026, 11, 29),
        date(2026, 12, 2),
        date(2026, 12, 5),
        date(2026, 12, 8),
    ]
    assert series.dates(date(2026, 11, 30), date(2026, 12, 4)) == [date(2026, 12, 2)]


def test_weekly_on_the_given_weekdays() -> None:
    series = _weekly(Weekday.MON, Weekday.THU)

    assert series.dates(START, date(2026, 12, 7)) == [
        date(2026, 11, 26),
        date(2026, 11, 30),
        date(2026, 12, 3),
        date(2026, 12, 7),
    ]


def test_the_end_date_and_skipped_days_leave_occurrences_out() -> None:
    series = _every(1, until=date(2026, 11, 30), skipped=(date(2026, 11, 28),))

    assert series.dates(START, date(2026, 12, 31)) == [
        date(2026, 11, 26),
        date(2026, 11, 27),
        date(2026, 11, 29),
        date(2026, 11, 30),
    ]
    assert series.occurs_on(date(2026, 11, 29))
    assert not series.occurs_on(date(2026, 11, 28))
    assert not series.occurs_on(date(2026, 12, 1))
    assert not series.occurs_on(date(2026, 11, 25))


def test_last_day_is_the_last_occurrence_or_none_without_an_end() -> None:
    assert _every(3).last_day() is None
    assert _every(3, until=date(2026, 12, 4)).last_day() == date(2026, 12, 2)
    assert _every(3, until=date(2026, 11, 28), skipped=(START,)).last_day() is None
    assert _every(3).endless
    assert not _every(3, until=date(2026, 12, 4)).endless


def test_an_occurrence_is_a_task_with_the_series_id() -> None:
    task = _weekly(Weekday.THU, note="After the water change").occurrence(START)

    assert task == Task(
        id="s1@2026-11-26",
        day=START,
        slot=Slot.DOSE,
        text="Bio-CO2 1.5 ml",
        note="After the water change",
        series_id="s1",
    )


def test_occurrence_ids_round_trip() -> None:
    assert occurrence_id("s1", START) == "s1@2026-11-26"
    assert parse_occurrence_id("s1@2026-11-26") == ("s1", START)
    assert parse_occurrence_id("01JD8") is None
    assert parse_occurrence_id("s1@Monday") is None
    assert parse_occurrence_id("@2026-11-26") is None


def test_series_round_trips_through_its_record() -> None:
    every = _every(3, until=date(2026, 12, 31), skipped=(date(2026, 11, 29),), note="Use RO")
    weekly = _weekly(Weekday.THU, Weekday.MON)

    assert every.to_record() == {
        "start": "2026-11-26",
        "slot": "task",
        "text": "Water change 25%",
        "note": "Use RO",
        "every_days": 3,
        "weekdays": [],
        "until": "2026-12-31",
        "skipped": ["2026-11-29"],
    }
    assert weekly.to_record()["weekdays"] == ["mon", "thu"]
    assert Series.from_record("s1", every.to_record()) == every
    assert Series.from_record("s1", weekly.to_record()) == weekly


@pytest.mark.parametrize(
    ("days", "weekdays", "until"),
    [
        (None, (), None),
        (3, (Weekday.MON,), None),
        (0, (), None),
        (366, (), None),
        (3, (), date(2026, 11, 25)),
    ],
)
def test_a_series_repeats_one_way_and_ends_after_it_starts(
    days: int | None, weekdays: tuple[Weekday, ...], until: date | None
) -> None:
    with pytest.raises(InvalidInputError):
        _every(days, weekdays=weekdays, until=until)


def test_a_task_keeps_its_series_id_in_its_record() -> None:
    task = _every(3).occurrence(START)

    record = task.to_record()

    assert record["series"] == "s1"
    assert Task.from_record(task.id, record) == task
    assert "series" not in replace(task, series_id=None).to_record()


def test_repeat_text_says_how_it_repeats() -> None:
    assert _every(1).repeat_text() == "every day"
    assert _every(3, until=date(2026, 12, 31)).repeat_text() == "every 3 days until 2026-12-31"
    assert _weekly(Weekday.MON, Weekday.THU).repeat_text() == "every Mon and Thu"
    assert _weekly(Weekday.MON, Weekday.WED, Weekday.FRI).repeat_text() == "every Mon, Wed and Fri"
    assert _weekly(Weekday.SUN).repeat_text() == "every Sun"


def _done(series: Series, day: date, status: TaskStatus = TaskStatus.COMPLETE) -> Task:
    return series.occurrence(day).finish(status, None, NOW)


def _records(changes: tuple[tuple[str, Series | None], ...]) -> dict[str, Record | None]:
    return {series_id: None if series is None else series.to_record() for series_id, series in changes}


def test_remove_this_one_skips_its_day_and_drops_its_change() -> None:
    series = _every(3)
    moved = series.occurrence(date(2026, 11, 29)).edit(now=NOW, day=date(2026, 11, 30))

    update = remove_from_series(series, date(2026, 11, 29), Scope.THIS, [moved])

    assert update.series == (("s1", replace(series, skipped=(date(2026, 11, 29),))),)
    assert update.tasks == ((moved.id, None),)
    assert update.summary == "Remove the task Water change 25% on 2026-11-29"


def test_remove_this_and_future_ends_the_series_and_keeps_done_tasks() -> None:
    series = _every(3, skipped=(date(2026, 12, 5),))
    done = _done(series, date(2026, 12, 2))
    open_change = series.occurrence(date(2026, 12, 8)).edit(now=NOW, note="Use RO")
    earlier = series.occurrence(START).edit(now=NOW, note="First")

    update = remove_from_series(series, date(2026, 11, 29), Scope.FUTURE, [done, open_change, earlier])

    assert update.series == (("s1", replace(series, until=date(2026, 11, 28), skipped=())),)
    assert update.tasks == ((open_change.id, None),)
    assert update.summary == "Remove the repeating task Water change 25% from 2026-11-29"


def test_remove_this_and_future_from_the_first_removes_the_series() -> None:
    series = _weekly(Weekday.MON)

    update = remove_from_series(series, date(2026, 11, 30), Scope.FUTURE, [])

    assert update.series == (("s1", None),)
    assert update.tasks == ()


def test_edit_this_and_future_splits_the_series() -> None:
    series = _every(3, until=date(2026, 12, 31), skipped=(date(2026, 11, 29), date(2026, 12, 5)))
    done = _done(series, date(2026, 12, 8), TaskStatus.SKIP)
    open_change = series.occurrence(date(2026, 12, 11)).edit(now=NOW, note="Use RO")
    earlier = series.occurrence(START).edit(now=NOW, note="First")

    update = edit_series(
        series, date(2026, 12, 2), [done, open_change, earlier], TaskEdit(text="Water change 30%"), "s2"
    )

    assert _records(update.series) == {
        "s1": replace(series, until=date(2026, 12, 1), skipped=(date(2026, 11, 29),)).to_record(),
        "s2": replace(
            series,
            id="s2",
            start=date(2026, 12, 2),
            text="Water change 30%",
            skipped=(date(2026, 12, 5), date(2026, 12, 8)),
        ).to_record(),
    }
    assert update.tasks == ((open_change.id, None),)
    assert update.summary == "Change the repeating task Water change 30% from 2026-12-02"


def test_edit_this_and_future_from_the_first_changes_the_series_in_place() -> None:
    series = _weekly(Weekday.MON)
    first = series.occurrence(date(2026, 11, 30)).edit(now=NOW, note="Moved")

    update = edit_series(
        series,
        date(2026, 11, 30),
        [first],
        TaskEdit(every_days=2, slot=Slot.TASK, note="Half dose", until=date(2027, 1, 31)),
        "s2",
    )

    assert update.series == (
        (
            "s1",
            Series(
                id="s1",
                start=date(2026, 11, 30),
                slot=Slot.TASK,
                text="Bio-CO2 1.5 ml",
                note="Half dose",
                every_days=2,
                until=date(2027, 1, 31),
            ),
        ),
    )
    assert update.tasks == ((first.id, None),)


def test_edit_this_and_future_can_move_the_start_change_the_weekdays_and_drop_the_end() -> None:
    series = _every(3, until=date(2026, 12, 31))

    update = edit_series(
        series,
        START,
        [],
        TaskEdit(day=date(2026, 11, 28), weekdays=(Weekday.SAT,), endless=True),
        "s2",
    )

    [(_, changed)] = update.series
    assert changed == replace(series, start=date(2026, 11, 28), every_days=None, weekdays=(Weekday.SAT,), until=None)


@pytest.mark.parametrize(
    "edit",
    [
        TaskEdit(status=TaskStatus.COMPLETE),
        TaskEdit(every_days=2, weekdays=(Weekday.MON,)),
        TaskEdit(until=date(2026, 11, 1)),
    ],
)
def test_edit_this_and_future_refuses_a_state_two_repeats_or_an_end_before_the_start(edit: TaskEdit) -> None:
    with pytest.raises(InvalidInputError):
        edit_series(_every(3), START, [], edit, "s2")


def test_a_task_edit_knows_when_it_changes_the_repeat() -> None:
    assert not TaskEdit(text="X", day=START, slot=Slot.DOSE, status=TaskStatus.SKIP, note="n").repeats
    assert TaskEdit(every_days=2).repeats
    assert TaskEdit(weekdays=(Weekday.MON,)).repeats
    assert TaskEdit(until=START).repeats
    assert TaskEdit(endless=True).repeats


@pytest.mark.timeout(1)
def test_last_day_is_found_without_walking_every_day() -> None:
    far = date(9999, 12, 31)

    assert _every(1, until=far, skipped=(far,)).last_day() == date(9999, 12, 30)
    assert _every(7, until=far).last_day() == date(9999, 12, 30)
    assert _every(7, until=far, skipped=(date(9999, 12, 30),)).last_day() == date(9999, 12, 23)
    assert _weekly(Weekday.MON).last_day() is None
    assert replace(_weekly(Weekday.MON, Weekday.THU), until=far).last_day() == date(9999, 12, 30)


def test_this_and_future_after_the_end_is_refused() -> None:
    series = _every(1, until=date(2026, 12, 4))

    with pytest.raises(InvalidInputError):
        remove_from_series(series, date(2026, 12, 6), Scope.FUTURE, [])
    with pytest.raises(InvalidInputError):
        edit_series(series, date(2026, 12, 6), [], TaskEdit(text="Later"), "s2")


def test_this_and_future_from_a_later_one_cannot_start_before_it() -> None:
    with pytest.raises(InvalidInputError):
        edit_series(_every(1), date(2026, 12, 1), [], TaskEdit(day=date(2026, 11, 28)), "s2")


@pytest.mark.parametrize(
    "edit", [TaskEdit(), TaskEdit(text="Water change 25%", every_days=3), TaskEdit(day=date(2026, 12, 2))]
)
def test_this_and_future_that_changes_nothing_is_refused(edit: TaskEdit) -> None:
    with pytest.raises(NothingToChangeError):
        edit_series(_every(3), date(2026, 12, 2), [], edit, "s2")
