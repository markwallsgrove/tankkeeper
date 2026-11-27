"""Hegel properties for tasks, times, event titles, actions and importing a plan."""

from datetime import date, time, timedelta
import itertools

import hegel
from hegel import generators as gs

from custom_components.tankkeeper.plan import (
    FOLLOW_UP_DAYS,
    MAX_EVERY_DAYS,
    PlanEvent,
    Reminders,
    Series,
    Slot,
    Task,
    TaskStatus,
    Weekday,
    action_for,
    format_time,
    import_tasks,
    is_dose,
    occurrence_id,
    parse_action,
    parse_occurrence_id,
    parse_summary,
    parse_time,
    split_tasks,
    summary_for,
    tasks_due,
    tasks_overdue,
)

DAY = date(2026, 11, 26)
words = gs.text(alphabet="abcXYZ0129 .,:%-", min_size=1, max_size=20)
statuses = gs.sampled_from(list(TaskStatus))
days = gs.temporal.dates(min_value=DAY - timedelta(days=10), max_value=DAY + timedelta(days=3))


@hegel.composite
def tasks(tc: hegel.TestCase) -> list[Task]:
    """A few tasks around today."""
    count = tc.draw(gs.integers(min_value=0, max_value=6))
    return [
        Task(
            id=f"t{index}",
            day=tc.draw(days),
            slot=tc.draw(gs.sampled_from(list(Slot))),
            text=tc.draw(words),
            status=tc.draw(statuses),
        )
        for index in range(count)
    ]


@hegel.test
def test_times_round_trip(tc: hegel.TestCase) -> None:
    moment = time(tc.draw(gs.integers(min_value=0, max_value=23)), tc.draw(gs.integers(min_value=0, max_value=59)))

    assert parse_time(format_time(moment)) == moment


@hegel.test
def test_summary_round_trips_for_plain_text(tc: hegel.TestCase) -> None:
    text = tc.draw(words).strip()
    tc.assume(parse_summary(text) == (TaskStatus.OPEN, text) and text != "")
    status = tc.draw(statuses)
    task = Task(id="t", day=DAY, slot=Slot.TASK, text=text, status=status)

    assert parse_summary(summary_for(task)) == (status, text)


@hegel.test
def test_split_tasks_gives_trimmed_parts_without_separators(tc: hegel.TestCase) -> None:
    parts = split_tasks(tc.draw(words))

    assert all(part and part == part.strip() and ", " not in part for part in parts)


@hegel.test
def test_actions_round_trip(tc: hegel.TestCase) -> None:
    status = tc.draw(gs.sampled_from([TaskStatus.COMPLETE, TaskStatus.SKIP]))
    task_id = tc.draw(gs.text(alphabet="0123456789ABCDEFGHJKMNPQRSTVWXYZ", min_size=1, max_size=26))

    assert parse_action(action_for(status, task_id)) == (status, task_id)


@hegel.test
def test_a_product_and_amount_is_a_dose(tc: hegel.TestCase) -> None:
    product = tc.draw(gs.text(alphabet="abcXYZ-.+()", min_size=1, max_size=10))
    amount = tc.draw(gs.from_regex(r"[0-9]{1,3}(\.[0-9]{1,2})?", fullmatch=True))
    extra = tc.draw(gs.text(alphabet="abc", min_size=1, max_size=5))

    assert is_dose(f"{product} {amount} ml", [product])
    assert not is_dose(f"{product} {amount} ml {extra}", [product])


@hegel.test
def test_due_and_overdue_tasks_are_open_and_in_range(tc: hegel.TestCase) -> None:
    plan = tc.draw(tasks())
    slot = tc.draw(gs.sampled_from(list(Slot)))

    due = tasks_due(plan, DAY, slot)
    overdue = tasks_overdue(plan, DAY, lambda _: Reminders())

    assert all(task.status is TaskStatus.OPEN and task.day == DAY and task.slot is slot for task in due)
    assert all(
        task.status is TaskStatus.OPEN and DAY - timedelta(days=FOLLOW_UP_DAYS) <= task.day < DAY for task in overdue
    )
    assert len(due) == sum(
        1 for task in plan if task.status is TaskStatus.OPEN and task.day == DAY and task.slot is slot
    )


@hegel.test
def test_import_never_duplicates_and_a_second_import_adds_nothing(tc: hegel.TestCase) -> None:
    existing = tc.draw(tasks())
    events = [
        PlanEvent(day=tc.draw(days), summary=tc.draw(words), description="")
        for _ in range(tc.draw(gs.integers(min_value=0, max_value=5)))
    ]
    counter = itertools.count()

    imported = import_tasks(existing, events, ["abc"], lambda: f"n{next(counter)}")

    keys = [(task.day, task.text.casefold()) for task in [*existing, *imported]]
    assert len(set(keys[len(existing) :])) == len(imported)
    assert not {(task.day, task.text.casefold()) for task in existing} & set(keys[len(existing) :])
    assert import_tasks([*existing, *imported], events, ["abc"], lambda: f"n{next(counter)}") == []


@hegel.composite
def series(tc: hegel.TestCase) -> Series:
    """A repeating task around today, every some days or weekly."""
    start = tc.draw(days)
    weekly = tc.draw(gs.booleans())
    chosen: list[Weekday] = tc.draw(gs.lists(gs.sampled_from(list(Weekday)), min_size=1, max_size=7))
    skipped: list[date] = tc.draw(gs.lists(days, max_size=4))
    until = tc.draw(gs.one_of(gs.just(None), gs.temporal.dates(min_value=start, max_value=start + timedelta(days=60))))
    return Series(
        id=tc.draw(gs.text(alphabet="0123456789ABC@", min_size=1, max_size=8)),
        start=start,
        slot=Slot.TASK,
        text="Water change",
        every_days=None if weekly else tc.draw(gs.integers(min_value=1, max_value=MAX_EVERY_DAYS)),
        weekdays=tuple(chosen) if weekly else (),
        until=until,
        skipped=tuple(skipped),
    )


@hegel.test
def test_series_dates_are_the_days_it_occurs_on_and_it_round_trips(tc: hegel.TestCase) -> None:
    repeating = tc.draw(series())
    first = tc.draw(days)
    last = first + timedelta(days=tc.draw(gs.integers(min_value=0, max_value=60)))

    every_day = [first + timedelta(days=step) for step in range((last - first).days + 1)]

    assert repeating.dates(first, last) == [day for day in every_day if repeating.occurs_on(day)]
    assert Series.from_record(repeating.id, repeating.to_record()) == repeating
    assert all(parse_occurrence_id(occurrence_id(repeating.id, day)) == (repeating.id, day) for day in every_day)
