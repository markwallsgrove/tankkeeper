"""The plan: tasks, reminder settings, event titles and importing, with no Home Assistant imports."""

from collections.abc import Callable, Iterable
from dataclasses import dataclass, replace
from datetime import date, datetime, time, timedelta
from enum import StrEnum
import re

from .domain import InvalidInputError, JsonValue, NothingToChangeError, Record, TankkeeperError

REMINDERS_ID = "reminders"
FOLLOW_UP_DAYS = 7
REPEAT_DAYS = 14
MAX_EVERY_DAYS = 365
OCCURRENCE_SEPARATOR = "@"
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


class Weekday(StrEnum):
    """A day of the week a weekly task repeats on, in Python's weekday order."""

    MON = "mon"
    TUE = "tue"
    WED = "wed"
    THU = "thu"
    FRI = "fri"
    SAT = "sat"
    SUN = "sun"

    @property
    def number(self) -> int:
        """0 for Monday to 6 for Sunday, as date.weekday gives."""
        return list(Weekday).index(self)


class Scope(StrEnum):
    """Which occurrences of a repeating task a change applies to."""

    THIS = "this"
    FUTURE = "future"


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
    series_id: str | None = None

    def to_record(self) -> Record:
        """Serialise for storage. An occurrence of a repeating task keeps its series id."""
        record: Record = {
            "date": self.day.isoformat(),
            "slot": self.slot.value,
            "text": self.text,
            "state": self.status.value,
            "note": self.note,
            "done_at": self.done_at,
        }
        if self.series_id is not None:
            record["series"] = self.series_id
        return record

    @classmethod
    def from_record(cls, task_id: str, record: Record) -> Task:
        """Read from storage."""
        done_at = record.get("done_at")
        series_id = record.get("series")
        return cls(
            id=task_id,
            day=date.fromisoformat(str(record["date"])),
            slot=Slot(str(record["slot"])),
            text=str(record["text"]),
            status=TaskStatus(str(record["state"])),
            note=str(record.get("note") or ""),
            done_at=None if done_at is None else str(done_at),
            series_id=None if series_id is None else str(series_id),
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


def occurrence_id(series_id: str, day: date) -> str:
    """The task id of a repeating task's occurrence on a day."""
    return f"{series_id}{OCCURRENCE_SEPARATOR}{day.isoformat()}"


def parse_occurrence_id(task_id: str) -> tuple[str, date] | None:
    """The series id and day of an occurrence's task id, or None when the id is not one."""
    series_id, separator, day = task_id.rpartition(OCCURRENCE_SEPARATOR)
    if not separator or not series_id:
        return None
    try:
        return series_id, date.fromisoformat(day)
    except ValueError:
        return None


@dataclass(frozen=True, slots=True, kw_only=True)
class Series:
    """A repeating task: every N days, or weekly on given weekdays, from a start day to an optional end day."""

    id: str
    start: date
    slot: Slot
    text: str
    note: str = ""
    every_days: int | None = None
    weekdays: tuple[Weekday, ...] = ()
    until: date | None = None
    skipped: tuple[date, ...] = ()

    def __post_init__(self) -> None:
        """Check it repeats one way and ends on or after its start. Weekdays and skipped days are kept sorted."""
        if (self.every_days is None) == (not self.weekdays):
            raise InvalidInputError("A repeating task repeats every some days or on some weekdays, not both")
        if self.every_days is not None and not 1 <= self.every_days <= MAX_EVERY_DAYS:
            raise InvalidInputError(f"A task repeats every 1 to {MAX_EVERY_DAYS} days")
        if self.until is not None and self.until < self.start:
            raise InvalidInputError("A repeating task must end on or after its start")
        object.__setattr__(self, "weekdays", tuple(sorted(set(self.weekdays), key=lambda day: day.number)))
        object.__setattr__(self, "skipped", tuple(sorted(set(self.skipped))))

    @property
    def endless(self) -> bool:
        """Whether it repeats with no end day."""
        return self.until is None

    def occurs_on(self, day: date) -> bool:
        """Whether an occurrence falls on the day."""
        if day < self.start or (self.until is not None and day > self.until) or day in self.skipped:
            return False
        if self.every_days is not None:
            return (day - self.start).days % self.every_days == 0
        return any(day.weekday() == weekday.number for weekday in self.weekdays)

    def dates(self, first: date, last: date) -> list[date]:
        """The days of its occurrences from first to last."""
        low = max(first, self.start)
        high = last if self.until is None else min(last, self.until)
        if low > high:
            return []
        if self.every_days is not None:
            offset = -(-(low - self.start).days // self.every_days) * self.every_days
            days = (
                self.start + timedelta(days=step)
                for step in range(offset, (high - self.start).days + 1, self.every_days)
            )
        else:
            days = (low + timedelta(days=step) for step in range((high - low).days + 1))
        return [day for day in days if self.occurs_on(day)]

    def last_day(self) -> date | None:
        """The day of its last occurrence, or None when it never ends or has none left."""
        if self.until is None:
            return None
        if self.every_days is not None:
            day = self.start + timedelta(days=(self.until - self.start).days // self.every_days * self.every_days)
            step = timedelta(days=self.every_days)
        else:
            day, step = self.until, timedelta(days=1)
        while day >= self.start:
            if self.occurs_on(day):
                return day
            day -= step
        return None

    def occurrence(self, day: date) -> Task:
        """Its occurrence on the day, as an open task."""
        return Task(
            id=occurrence_id(self.id, day),
            day=day,
            slot=self.slot,
            text=self.text,
            note=self.note,
            series_id=self.id,
        )

    def repeat_text(self) -> str:
        """How it repeats, such as every 3 days until 2026-12-31 or every Mon and Thu."""
        if self.every_days is not None:
            text = "every day" if self.every_days == 1 else f"every {self.every_days} days"
        else:
            names = [weekday.value.capitalize() for weekday in self.weekdays]
            text = "every " + (names[0] if len(names) == 1 else f"{', '.join(names[:-1])} and {names[-1]}")
        return text if self.until is None else f"{text} until {self.until.isoformat()}"

    def to_record(self) -> Record:
        """Serialise for storage."""
        return {
            "start": self.start.isoformat(),
            "slot": self.slot.value,
            "text": self.text,
            "note": self.note,
            "every_days": self.every_days,
            "weekdays": [weekday.value for weekday in self.weekdays],
            "until": None if self.until is None else self.until.isoformat(),
            "skipped": [day.isoformat() for day in self.skipped],
        }

    @classmethod
    def from_record(cls, series_id: str, record: Record) -> Series:
        """Read from storage."""
        every_days = record.get("every_days")
        until = record.get("until")
        weekdays = record.get("weekdays")
        skipped = record.get("skipped")
        return cls(
            id=series_id,
            start=date.fromisoformat(str(record["start"])),
            slot=Slot(str(record["slot"])),
            text=str(record["text"]),
            note=str(record.get("note") or ""),
            every_days=every_days if isinstance(every_days, int) else None,
            weekdays=tuple(Weekday(str(day)) for day in weekdays) if isinstance(weekdays, list) else (),
            until=None if until is None else date.fromisoformat(str(until)),
            skipped=tuple(date.fromisoformat(str(day)) for day in skipped) if isinstance(skipped, list) else (),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class TaskEdit:
    """The fields a change to a task gives. None leaves a field as it is; endless takes away the end day."""

    text: str | None = None
    day: date | None = None
    slot: Slot | None = None
    status: TaskStatus | None = None
    note: str | None = None
    every_days: int | None = None
    weekdays: tuple[Weekday, ...] | None = None
    until: date | None = None
    endless: bool = False

    @property
    def repeats(self) -> bool:
        """Whether it changes how a repeating task repeats."""
        return self.every_days is not None or self.weekdays is not None or self.until is not None or self.endless


@dataclass(frozen=True, slots=True, kw_only=True)
class PlanUpdate:
    """The repeating tasks and tasks a change sets, None to remove, and the history summary."""

    series: tuple[tuple[str, Series | None], ...]
    tasks: tuple[tuple[str, Task | None], ...]
    summary: str


def remove_from_series(series: Series, day: date, scope: Scope, tasks: Iterable[Task]) -> PlanUpdate:
    """Take one occurrence, or it and every later one, out of the plan.

    Changed occurrences that are still open go too. Done ones stay as the record of what was done.
    """
    if scope is Scope.FUTURE:
        _check_not_ended(series, day)
    if scope is Scope.THIS:
        stored = [task.id for task in tasks if task.id == occurrence_id(series.id, day)]
        return PlanUpdate(
            series=((series.id, replace(series, skipped=(*series.skipped, day))),),
            tasks=tuple((task_id, None) for task_id in stored),
            summary=remove_summary(series.occurrence(day)),
        )
    kept = None if not series.dates(series.start, day - timedelta(days=1)) else _end_before(series, day)
    return PlanUpdate(
        series=((series.id, kept),),
        tasks=tuple((task.id, None) for task in _open_from(series, day, tasks)),
        summary=f"Remove the repeating task {series.text} from {day.isoformat()}",
    )


def edit_series(series: Series, day: date, tasks: Iterable[Task], edit: TaskEdit, new_id: str) -> PlanUpdate:
    """Change an occurrence and every later one.

    From the first occurrence the series changes in place. From a later one it ends the day before, and a new
    series with new_id starts on the occurrence's day, or on edit.day. Changed occurrences still open from that day
    take the change; days already done stay done.
    """
    if edit.status is not None:
        raise InvalidInputError("Mark one occurrence done at a time, not this and future ones")
    if edit.every_days is not None and edit.weekdays is not None:
        raise InvalidInputError("A repeating task repeats every some days or on some weekdays, not both")
    _check_not_ended(series, day)
    tasks = list(tasks)
    start = day if edit.day is None else edit.day
    in_place = not series.dates(series.start, day - timedelta(days=1))
    if not in_place and start < day:
        raise InvalidInputError(
            f"This and later occurrences can't start before {day.isoformat()}: that is the earlier occurrences' part"
        )
    every_days: int | None
    weekdays: tuple[Weekday, ...]
    if edit.every_days is not None:
        every_days, weekdays = edit.every_days, ()
    elif edit.weekdays is not None:
        every_days, weekdays = None, edit.weekdays
    else:
        every_days, weekdays = series.every_days, series.weekdays
    done = [] if in_place else [planned for _, planned in _occurrences(series, day, tasks, open_only=False)]
    changed = Series(
        id=series.id if in_place else new_id,
        start=start,
        slot=series.slot if edit.slot is None else edit.slot,
        text=series.text if edit.text is None else edit.text,
        note=series.note if edit.note is None else edit.note,
        every_days=every_days,
        weekdays=weekdays,
        until=None if edit.endless else series.until if edit.until is None else edit.until,
        skipped=(
            *(skipped for skipped in series.skipped if skipped >= start),
            *(done_day for done_day in done if done_day >= start),
        ),
    )
    if start == day and replace(changed, id=series.id, start=series.start, skipped=series.skipped) == series:
        raise NothingToChangeError("The records already look like that")
    changes: tuple[tuple[str, Series | None], ...] = (
        ((series.id, changed),) if in_place else ((series.id, _end_before(series, day)), (new_id, changed))
    )
    return PlanUpdate(
        series=changes,
        tasks=tuple((task.id, None) for task in _open_from(series, day, tasks)),
        summary=f"Change the repeating task {changed.text} from {start.isoformat()}",
    )


def _check_not_ended(series: Series, day: date) -> None:
    if series.until is not None and day > series.until:
        raise InvalidInputError(f"The repeating task {series.text} ends on {series.until.isoformat()}, before {day}")


def _end_before(series: Series, day: date) -> Series:
    return replace(
        series, until=day - timedelta(days=1), skipped=tuple(skipped for skipped in series.skipped if skipped < day)
    )


def _occurrences(series: Series, day: date, tasks: Iterable[Task], *, open_only: bool) -> list[tuple[Task, date]]:
    """Stored occurrences of the series from the day on, by the day they were planned for."""
    found: list[tuple[Task, date]] = []
    for task in tasks:
        parsed = parse_occurrence_id(task.id)
        if parsed is None or parsed[0] != series.id or parsed[1] < day:
            continue
        if (task.status is TaskStatus.OPEN) == open_only:
            found.append((task, parsed[1]))
    return found


def _open_from(series: Series, day: date, tasks: Iterable[Task]) -> list[Task]:
    return [task for task, _ in _occurrences(series, day, tasks, open_only=True)]


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
