"""The plan: tasks, reminder settings, event titles and importing, with no Home Assistant imports."""

from collections.abc import Callable, Iterable
from dataclasses import dataclass, replace
from datetime import date, datetime, time, timedelta
from enum import StrEnum
import re

from .domain import JsonValue, Record, TankkeeperError

REMINDERS_ID = "reminders"
FOLLOW_UP_DAYS = 7
ACTION_PREFIX = "TANKKEEPER_"
TASK_SEPARATOR = ", "
_TIME = re.compile(r"(\d{1,2}):(\d{2})(?::00)?")
_PREFIX = re.compile(r"(complete|skip|to do):\s*", re.IGNORECASE)
_AMOUNT = r" [0-9.]+ ml"
_SKIP = re.compile(r"skip\b:?\s*", re.IGNORECASE)


class Slot(StrEnum):
    """When in the day a task is due. The time of each slot is a reminder setting."""

    TASK = "task"
    DOSE = "dose"


class TaskStatus(StrEnum):
    """Whether a task is still to do, done or skipped."""

    OPEN = "open"
    COMPLETE = "complete"
    SKIP = "skip"


class TaskNotOpenError(TankkeeperError):
    """The task was already completed or skipped."""

    key = "task_not_open"


def parse_time(value: str) -> time:
    """A time of day from HH:MM, or HH:MM:00 as Home Assistant's time picker gives it."""
    match = _TIME.fullmatch(value.strip())
    if match is None or int(match[1]) > 23 or int(match[2]) > 59:
        raise ValueError(f"{value!r} is not a time in HH:MM")
    return time(int(match[1]), int(match[2]))


def format_time(value: time) -> str:
    """A time of day as HH:MM."""
    return value.strftime("%H:%M")


@dataclass(frozen=True, slots=True, kw_only=True)
class Reminders:
    """Which notify services get reminders and status alerts, and when reminders go out."""

    notify: tuple[str, ...] = ()
    status_notify: tuple[str, ...] = ()
    task_time: time = time(9)
    dose_time: time = time(12)
    resend_time: time = time(21)

    def slot_time(self, slot: Slot) -> time:
        """The time a slot is due."""
        return self.dose_time if slot is Slot.DOSE else self.task_time

    def to_json(self) -> Record:
        """Serialise for storage."""
        return {
            "notify": list(self.notify),
            "status_notify": list(self.status_notify),
            "task_time": format_time(self.task_time),
            "dose_time": format_time(self.dose_time),
            "resend_time": format_time(self.resend_time),
        }

    @classmethod
    def from_json(cls, data: Record | None) -> Reminders:
        """Read from storage. Missing settings take their defaults."""
        stored = data or {}
        default = cls()
        return cls(
            notify=_names_or(stored.get("notify"), default.notify),
            status_notify=_names_or(stored.get("status_notify"), default.status_notify),
            task_time=_time_or(stored.get("task_time"), default.task_time),
            dose_time=_time_or(stored.get("dose_time"), default.dose_time),
            resend_time=_time_or(stored.get("resend_time"), default.resend_time),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class Task:
    """One task in the plan."""

    id: str
    day: date
    slot: Slot
    text: str
    status: TaskStatus = TaskStatus.OPEN
    note: str = ""
    done_at: str | None = None

    def to_record(self) -> Record:
        """Serialise for storage."""
        return {
            "date": self.day.isoformat(),
            "slot": self.slot.value,
            "text": self.text,
            "state": self.status.value,
            "note": self.note,
            "done_at": self.done_at,
        }

    @classmethod
    def from_record(cls, task_id: str, record: Record) -> Task:
        """Read from storage."""
        done_at = record.get("done_at")
        return cls(
            id=task_id,
            day=date.fromisoformat(str(record["date"])),
            slot=Slot(str(record["slot"])),
            text=str(record["text"]),
            status=TaskStatus(str(record["state"])),
            note=str(record.get("note") or ""),
            done_at=None if done_at is None else str(done_at),
        )

    def finish(self, status: TaskStatus, note: str | None, now: datetime) -> Task:
        """The task completed or skipped now. Only an open task can be."""
        if status is TaskStatus.OPEN:
            raise ValueError("A task finishes as complete or skip")
        if self.status is not TaskStatus.OPEN:
            raise TaskNotOpenError(f"The task {self.text} is already {self.status.value}")
        return replace(self, status=status, note=self.note if note is None else note, done_at=now.isoformat())

    def reopen(self) -> Task:
        """The task open again."""
        return replace(self, status=TaskStatus.OPEN, done_at=None)

    def edit(
        self,
        *,
        now: datetime,
        text: str | None = None,
        day: date | None = None,
        slot: Slot | None = None,
        status: TaskStatus | None = None,
        note: str | None = None,
    ) -> Task:
        """The task with the given fields changed. A new state sets the done time, or clears it when open."""
        new_status = self.status if status is None else status
        if new_status is self.status:
            done_at = self.done_at
        else:
            done_at = None if new_status is TaskStatus.OPEN else now.isoformat()
        return replace(
            self,
            text=self.text if text is None else text,
            day=self.day if day is None else day,
            slot=self.slot if slot is None else slot,
            status=new_status,
            note=self.note if note is None else note,
            done_at=done_at,
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class PlanEvent:
    """An event from another calendar, to import."""

    day: date
    summary: str
    description: str


def summary_for(task: Task) -> str:
    """The event title: the text, with Complete: or Skip: in front once done, as in today's calendar."""
    if task.status is TaskStatus.OPEN:
        return task.text
    return f"{task.status.value.capitalize()}: {task.text}"


def add_summary(task: Task) -> str:
    """The history summary for a new task."""
    return f"Add the task {task.text} on {task.day.isoformat()}"


def change_summary(task: Task) -> str:
    """The history summary for a changed task."""
    return f"Change the task {task.text} on {task.day.isoformat()}"


def remove_summary(task: Task) -> str:
    """The history summary for a removed task."""
    return f"Remove the task {task.text} on {task.day.isoformat()}"


def todo_description(task: Task) -> str | None:
    """The to-do item description: the note, with Skip in front for a skipped task."""
    if task.status is TaskStatus.SKIP:
        return f"Skip: {task.note}" if task.note else "Skip"
    return task.note or None


def parse_todo_description(description: str | None) -> tuple[bool, str]:
    """Whether a to-do description asks to skip, and the note without the Skip in front."""
    text = (description or "").strip()
    match = _SKIP.match(text)
    if match is None:
        return False, text
    return True, text[match.end() :].strip()


def parse_summary(summary: str) -> tuple[TaskStatus, str]:
    """The state and text from an event title. Complete:, Skip: and To do: prefixes ignore case."""
    stripped = summary.strip()
    match = _PREFIX.match(stripped)
    if match is None:
        return TaskStatus.OPEN, stripped
    prefix = match[1].casefold()
    status = TaskStatus.COMPLETE if prefix == "complete" else TaskStatus.SKIP if prefix == "skip" else TaskStatus.OPEN
    return status, stripped[match.end() :].strip()


def split_tasks(text: str) -> list[str]:
    """The tasks in an event title that lists several, split on comma and space."""
    return [part.strip() for part in text.split(TASK_SEPARATOR) if part.strip()]


def is_dose(text: str, products: Iterable[str]) -> bool:
    """Whether the text is a product name and an amount in ml, such as Bio-CO2 1.5 ml."""
    names = [re.escape(name) for name in products if name]
    if not names:
        return False
    return re.fullmatch(f"(?:{'|'.join(names)}){_AMOUNT}", text.strip(), re.IGNORECASE) is not None


def slot_for(text: str, products: Iterable[str]) -> Slot:
    """The dose slot for a dose, the task slot for anything else."""
    return Slot.DOSE if is_dose(text, products) else Slot.TASK


def tasks_due(tasks: Iterable[Task], day: date, slot: Slot) -> list[Task]:
    """Open tasks for a day and slot."""
    return [task for task in tasks if task.status is TaskStatus.OPEN and task.day == day and task.slot is slot]


def tasks_open_on(tasks: Iterable[Task], day: date, reminders: Reminders) -> list[Task]:
    """Open tasks for a day, in plan order."""
    return sort_tasks(
        (task for task in tasks if task.status is TaskStatus.OPEN and task.day == day), lambda _: reminders
    )


def tasks_overdue(tasks: Iterable[Task], day: date, reminders_on: Callable[[date], Reminders]) -> list[Task]:
    """Open tasks from the days before, up to FOLLOW_UP_DAYS back, in plan order."""
    oldest = day - timedelta(days=FOLLOW_UP_DAYS)
    return sort_tasks(
        (task for task in tasks if task.status is TaskStatus.OPEN and oldest <= task.day < day), reminders_on
    )


def sort_tasks(tasks: Iterable[Task], reminders_on: Callable[[date], Reminders]) -> list[Task]:
    """Tasks by day, then that day's slot time, then text."""
    return sorted(tasks, key=lambda task: (task.day, reminders_on(task.day).slot_time(task.slot), task.text, task.id))


def action_for(status: TaskStatus, task_id: str) -> str:
    """The notification action that completes or skips a task."""
    if status is TaskStatus.OPEN:
        raise ValueError("An action is complete or skip")
    return f"{ACTION_PREFIX}{status.value.upper()}|{task_id}"


def parse_action(action: str) -> tuple[TaskStatus, str] | None:
    """The state and task id from a notification action, or None when it is not TankKeeper's."""
    name, _, task_id = action.partition("|")
    for status in (TaskStatus.COMPLETE, TaskStatus.SKIP):
        if name == f"{ACTION_PREFIX}{status.value.upper()}" and task_id:
            return status, task_id
    return None


def import_tasks(
    existing: Iterable[Task], events: Iterable[PlanEvent], products: Iterable[str], new_id: Callable[[], str]
) -> list[Task]:
    """Tasks from another calendar's events, keeping Complete: and Skip:. Tasks already planned are left out."""
    names = list(products)
    seen = {(task.day, task.text.casefold()) for task in existing}
    imported: list[Task] = []
    for event in events:
        status, text = parse_summary(event.summary)
        for part in split_tasks(text):
            key = (event.day, part.casefold())
            if key in seen:
                continue
            seen.add(key)
            imported.append(
                Task(
                    id=new_id(),
                    day=event.day,
                    slot=slot_for(part, names),
                    text=part,
                    status=status,
                    note=event.description,
                )
            )
    return imported


def _names_or(value: JsonValue, default: tuple[str, ...]) -> tuple[str, ...]:
    return tuple(str(item) for item in value) if isinstance(value, list) else default


def _time_or(value: JsonValue, default: time) -> time:
    return default if value is None else parse_time(str(value))
