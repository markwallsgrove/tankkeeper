"""Tasks, reminder settings, event titles and importing a plan, with no Home Assistant."""

from datetime import UTC, date, datetime, time

import pytest

from custom_components.tankkeeper.plan import (
    PlanEvent,
    Reminders,
    Slot,
    Task,
    TaskNotOpenError,
    TaskStatus,
    action_for,
    add_summary,
    change_summary,
    format_time,
    import_tasks,
    is_dose,
    parse_action,
    parse_summary,
    parse_time,
    parse_todo_description,
    remove_summary,
    slot_for,
    sort_tasks,
    split_tasks,
    summary_for,
    tasks_due,
    tasks_open_on,
    tasks_overdue,
    todo_description,
)

DAY = date(2026, 11, 26)
NOW = datetime(2026, 11, 26, 9, 30, tzinfo=UTC)
PRODUCTS = ["Bio-CO2", "Plants Green"]


def _task(
    task_id: str = "t1",
    *,
    day: date = DAY,
    slot: Slot = Slot.TASK,
    text: str = "Water change 25%",
    status: TaskStatus = TaskStatus.OPEN,
    note: str = "",
    done_at: str | None = None,
) -> Task:
    return Task(id=task_id, day=day, slot=slot, text=text, status=status, note=note, done_at=done_at)


def test_reminders_default_to_todays_times_and_no_devices() -> None:
    reminders = Reminders.from_json(None)

    assert reminders == Reminders(notify=(), task_time=time(9), dose_time=time(12), resend_time=time(21))
    assert reminders.slot_time(Slot.TASK) == time(9)
    assert reminders.slot_time(Slot.DOSE) == time(12)


def test_reminders_round_trip_through_storage() -> None:
    reminders = Reminders(
        notify=("mobile_app_phone", "mobile_app_tablet"),
        task_time=time(8, 15),
        dose_time=time(13),
        resend_time=time(20, 45),
        status_notify=("mobile_app_tablet",),
    )

    stored = reminders.to_json()

    assert stored == {
        "notify": ["mobile_app_phone", "mobile_app_tablet"],
        "task_time": "08:15",
        "dose_time": "13:00",
        "resend_time": "20:45",
        "status_notify": ["mobile_app_tablet"],
    }
    assert Reminders.from_json(stored) == reminders


def test_reminders_fill_missing_fields_with_defaults() -> None:
    assert Reminders.from_json({"notify": ["mobile_app_phone"]}) == Reminders(notify=("mobile_app_phone",))


@pytest.mark.parametrize(
    ("value", "expected"),
    [("09:00", time(9)), ("9:05", time(9, 5)), ("21:30:00", time(21, 30)), (" 07:45 ", time(7, 45))],
)
def test_parse_time_reads_hours_and_minutes(value: str, expected: time) -> None:
    assert parse_time(value) == expected


@pytest.mark.parametrize("value", ["", "9", "24:00", "12:60", "12:00:30", "noon", "12-00", "12:00:00:00"])
def test_parse_time_rejects_anything_else(value: str) -> None:
    with pytest.raises(ValueError, match="HH:MM"):
        parse_time(value)


def test_format_time_is_hours_and_minutes() -> None:
    assert format_time(time(7, 5)) == "07:05"


def test_task_round_trips_through_its_record() -> None:
    task = _task(status=TaskStatus.SKIP, note="Away", done_at="2026-11-26T09:30:00+00:00", slot=Slot.DOSE)

    record = task.to_record()

    assert record == {
        "date": "2026-11-26",
        "slot": "dose",
        "text": "Water change 25%",
        "state": "skip",
        "note": "Away",
        "done_at": "2026-11-26T09:30:00+00:00",
    }
    assert Task.from_record("t1", record) == task


def test_finish_records_the_state_note_and_time() -> None:
    done = _task().finish(TaskStatus.COMPLETE, "Used RO water", NOW)

    assert (done.status, done.note, done.done_at) == (TaskStatus.COMPLETE, "Used RO water", NOW.isoformat())


def test_finish_without_a_note_keeps_the_old_note() -> None:
    done = _task(note="Check the filter too").finish(TaskStatus.SKIP, None, NOW)

    assert done.note == "Check the filter too"


def test_finish_needs_an_open_task() -> None:
    done = _task(status=TaskStatus.COMPLETE)

    with pytest.raises(TaskNotOpenError, match="already complete"):
        done.finish(TaskStatus.SKIP, None, NOW)


def test_finish_needs_complete_or_skip() -> None:
    with pytest.raises(ValueError, match="complete or skip"):
        _task().finish(TaskStatus.OPEN, None, NOW)


def test_reopen_clears_the_done_time() -> None:
    task = _task(status=TaskStatus.SKIP, note="Away", done_at=NOW.isoformat())

    assert task.reopen() == _task(note="Away")


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        (TaskStatus.OPEN, "Water change 25%"),
        (TaskStatus.COMPLETE, "Complete: Water change 25%"),
        (TaskStatus.SKIP, "Skip: Water change 25%"),
    ],
)
def test_summary_shows_the_state_like_todays_calendar(status: TaskStatus, expected: str) -> None:
    assert summary_for(_task(status=status)) == expected


@pytest.mark.parametrize(
    ("summary", "expected"),
    [
        ("Water change", (TaskStatus.OPEN, "Water change")),
        ("To do: Water change", (TaskStatus.OPEN, "Water change")),
        ("complete:  Water change ", (TaskStatus.COMPLETE, "Water change")),
        ("Skip: Water change", (TaskStatus.SKIP, "Water change")),
        ("SKIP:Water change", (TaskStatus.SKIP, "Water change")),
        ("Skipping the water change", (TaskStatus.OPEN, "Skipping the water change")),
    ],
)
def test_parse_summary_reads_the_state_prefix(summary: str, expected: tuple[TaskStatus, str]) -> None:
    assert parse_summary(summary) == expected


def test_split_tasks_splits_on_comma_space() -> None:
    assert split_tasks(" Bio-CO2 1.5 ml, Plants Green 2 ml,  , Trim plants ") == [
        "Bio-CO2 1.5 ml",
        "Plants Green 2 ml",
        "Trim plants",
    ]


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Bio-CO2 1.5 ml", True),
        ("plants green 2 ml", True),
        ("Plants Green 10 ml", True),
        ("Plants Green ml", False),
        ("Plants Green 2 ml daily", False),
        ("Water change 25%", False),
        ("Bio-CO2", False),
    ],
)
def test_is_dose_matches_a_product_and_amount(text: str, expected: bool) -> None:
    assert is_dose(text, PRODUCTS) is expected


def test_is_dose_escapes_product_names() -> None:
    assert not is_dose("BioXCO2 1 ml", ["Bio.CO2"])
    assert is_dose("Bio.CO2 1 ml", ["Bio.CO2"])


def test_slot_for_puts_doses_in_the_dose_slot() -> None:
    assert slot_for("Bio-CO2 1.5 ml", PRODUCTS) is Slot.DOSE
    assert slot_for("Trim plants", PRODUCTS) is Slot.TASK
    assert slot_for("Bio-CO2 1.5 ml", []) is Slot.TASK


def test_due_tasks_are_open_tasks_for_the_day_and_slot() -> None:
    tasks = [
        _task("a"),
        _task("b", slot=Slot.DOSE),
        _task("c", status=TaskStatus.COMPLETE),
        _task("d", day=date(2026, 11, 25)),
    ]

    assert [task.id for task in tasks_due(tasks, DAY, Slot.TASK)] == ["a"]
    assert [task.id for task in tasks_due(tasks, DAY, Slot.DOSE)] == ["b"]
    assert [task.id for task in tasks_open_on(tasks, DAY, Reminders())] == ["a", "b"]


def test_open_and_overdue_tasks_follow_the_plan_order() -> None:
    reminders = Reminders(dose_time=time(8))
    yesterday = date(2026, 11, 25)
    tasks = [
        _task("b", text="B"),
        _task("a", text="A"),
        _task("dose", slot=Slot.DOSE),
        _task("old b", day=yesterday, text="B"),
        _task("old a", day=yesterday, text="A"),
        _task("old dose", day=yesterday, slot=Slot.DOSE),
    ]

    assert [task.id for task in tasks_open_on(tasks, DAY, reminders)] == ["dose", "a", "b"]
    assert [task.id for task in tasks_overdue(tasks, DAY, lambda _: reminders)] == ["old dose", "old a", "old b"]


def test_overdue_tasks_are_open_tasks_from_the_last_week() -> None:
    tasks = [
        _task("today"),
        _task("yesterday", day=date(2026, 11, 25)),
        _task("week", day=date(2026, 11, 19)),
        _task("older", day=date(2026, 11, 18)),
        _task("done", day=date(2026, 11, 25), status=TaskStatus.SKIP),
    ]

    assert [task.id for task in tasks_overdue(tasks, DAY, lambda _: Reminders())] == ["week", "yesterday"]


def test_sort_tasks_orders_by_day_then_slot_time_then_text() -> None:
    reminders = Reminders(dose_time=time(8))
    tasks = [
        _task("b", text="B"),
        _task("a", text="A"),
        _task("dose", slot=Slot.DOSE),
        _task("earlier", day=date(2026, 11, 25)),
    ]

    assert [task.id for task in sort_tasks(tasks, lambda _: reminders)] == ["earlier", "dose", "a", "b"]


def test_sort_tasks_uses_each_days_slot_times() -> None:
    yesterday = date(2026, 11, 25)
    tasks = [
        _task("dose", slot=Slot.DOSE),
        _task("task"),
        _task("old dose", day=yesterday, slot=Slot.DOSE),
        _task("old task", day=yesterday),
    ]

    def reminders_on(day: date) -> Reminders:
        return Reminders(dose_time=time(8) if day == yesterday else time(10))

    assert [task.id for task in sort_tasks(tasks, reminders_on)] == ["old dose", "old task", "task", "dose"]


def test_actions_round_trip() -> None:
    assert action_for(TaskStatus.COMPLETE, "t1") == "TANKKEEPER_COMPLETE|t1"
    assert action_for(TaskStatus.SKIP, "t1") == "TANKKEEPER_SKIP|t1"
    assert parse_action("TANKKEEPER_COMPLETE|t1") == (TaskStatus.COMPLETE, "t1")
    assert parse_action("TANKKEEPER_SKIP|t1") == (TaskStatus.SKIP, "t1")


@pytest.mark.parametrize("action", ["FISH_COMPLETE|t1", "TANKKEEPER_COMPLETE|", "TANKKEEPER_OPEN|t1", "TANKKEEPER"])
def test_parse_action_ignores_other_actions(action: str) -> None:
    assert parse_action(action) is None


def test_action_for_needs_complete_or_skip() -> None:
    with pytest.raises(ValueError, match="complete or skip"):
        action_for(TaskStatus.OPEN, "t1")


def test_import_splits_events_keeps_state_and_picks_slots() -> None:
    events = [
        PlanEvent(day=DAY, summary="To do: Bio-CO2 1.5 ml, Trim plants", description="Why: growth"),
        PlanEvent(day=date(2026, 11, 25), summary="Complete: Water change 25%", description="Complete: done"),
        PlanEvent(day=date(2026, 11, 24), summary="Skip: Plants Green 2 ml", description=""),
    ]
    ids = iter(["n1", "n2", "n3", "n4"])

    imported = import_tasks([], events, PRODUCTS, lambda: next(ids))

    assert imported == [
        Task(id="n1", day=DAY, slot=Slot.DOSE, text="Bio-CO2 1.5 ml", note="Why: growth"),
        Task(id="n2", day=DAY, slot=Slot.TASK, text="Trim plants", note="Why: growth"),
        Task(
            id="n3",
            day=date(2026, 11, 25),
            slot=Slot.TASK,
            text="Water change 25%",
            status=TaskStatus.COMPLETE,
            note="Complete: done",
        ),
        Task(id="n4", day=date(2026, 11, 24), slot=Slot.DOSE, text="Plants Green 2 ml", status=TaskStatus.SKIP),
    ]


def test_import_skips_tasks_already_in_the_plan() -> None:
    existing = [_task("old", text="Trim plants", status=TaskStatus.COMPLETE)]
    events = [
        PlanEvent(day=DAY, summary="To do: trim plants, Test water", description=""),
        PlanEvent(day=DAY, summary="Test water", description=""),
    ]

    imported = import_tasks(existing, events, PRODUCTS, lambda: "new")

    assert [(task.day, task.text) for task in imported] == [(DAY, "Test water")]


def test_edit_changes_only_the_fields_given() -> None:
    task = _task(status=TaskStatus.SKIP, note="Away", done_at="earlier")

    assert task.edit(now=NOW) == task
    assert task.edit(text="Trim plants", day=date(2026, 11, 27), slot=Slot.DOSE, note="", now=NOW) == _task(
        day=date(2026, 11, 27),
        slot=Slot.DOSE,
        text="Trim plants",
        status=TaskStatus.SKIP,
        done_at="earlier",
    )


def test_edit_sets_the_done_time_when_the_state_changes() -> None:
    task = _task(status=TaskStatus.SKIP, done_at="earlier")

    assert task.edit(status=TaskStatus.SKIP, now=NOW).done_at == "earlier"
    assert task.edit(status=TaskStatus.COMPLETE, now=NOW).done_at == NOW.isoformat()
    assert task.edit(status=TaskStatus.OPEN, now=NOW).done_at is None


def test_change_summaries_name_the_task_and_day() -> None:
    assert add_summary(_task()) == "Add the task Water change 25% on 2026-11-26"
    assert change_summary(_task()) == "Change the task Water change 25% on 2026-11-26"
    assert remove_summary(_task()) == "Remove the task Water change 25% on 2026-11-26"


@pytest.mark.parametrize(
    ("status", "note", "expected"),
    [
        (TaskStatus.OPEN, "", None),
        (TaskStatus.OPEN, "Use RO", "Use RO"),
        (TaskStatus.COMPLETE, "Cloudy", "Cloudy"),
        (TaskStatus.SKIP, "", "Skip"),
        (TaskStatus.SKIP, "Away", "Skip: Away"),
    ],
)
def test_todo_description_shows_skips(status: TaskStatus, note: str, expected: str | None) -> None:
    assert todo_description(_task(status=status, note=note)) == expected


@pytest.mark.parametrize(
    ("description", "expected"),
    [
        (None, (False, "")),
        ("Cloudy", (False, "Cloudy")),
        ("Skip", (True, "")),
        ("skip: away all day", (True, "away all day")),
        ("SKIP away", (True, "away")),
        ("Skipped the filter", (False, "Skipped the filter")),
    ],
)
def test_parse_todo_description_reads_a_skip(description: str | None, expected: tuple[bool, str]) -> None:
    assert parse_todo_description(description) == expected
