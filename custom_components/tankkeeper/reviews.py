"""Reviews: what started one, the rules' result, Claude's optional comment and the plan changes it proposed."""

from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import date, datetime, tzinfo

from .claude import Trigger
from .domain import Collection, HistoryEntry, JsonValue, Record
from .rules import LEVEL_TITLES, Level, Status

MAX_REVIEWS = 100
MAX_COMMENT = 1000
TASK_DONE = ("complete", "skip")
TRIGGER_ORDER = tuple(Trigger)
NO_RESULTS = "On course. No rule has the data it needs yet."
ALL_INSIDE = "On course. Every rule is inside its limits."
WAITING_ONE = "1 plan change waits for you in the panel."
WAITING_MANY = "{count} plan changes wait for you in the panel."


@dataclass(frozen=True, slots=True, kw_only=True)
class Review:
    """One review of the tank. asked says whether Claude was asked for a comment, which counts toward the cap."""

    id: str
    time: datetime
    triggers: tuple[Trigger, ...]
    level: Level
    result: str
    asked: bool
    comment: str | None
    note: str | None
    proposal_ids: tuple[str, ...]

    def to_json(self) -> Record:
        """Serialise for storage and tools."""
        return {
            "id": self.id,
            "time": self.time.isoformat(),
            "triggers": [trigger.value for trigger in self.triggers],
            "level": self.level.value,
            "result": self.result,
            "asked": self.asked,
            "comment": self.comment,
            "note": self.note,
            "proposal_ids": list(self.proposal_ids),
        }

    @classmethod
    def from_json(cls, data: Record) -> Review:
        """Read from storage."""
        return cls(
            id=str(data["id"]),
            time=datetime.fromisoformat(str(data["time"])),
            triggers=tuple(Trigger(str(value)) for value in _list(data["triggers"])),
            level=Level(str(data["level"])),
            result=str(data["result"]),
            asked=data["asked"] is True,
            comment=_optional_str(data["comment"]),
            note=_optional_str(data["note"]),
            proposal_ids=tuple(str(value) for value in _list(data["proposal_ids"])),
        )


def ordered(triggers: Iterable[Trigger]) -> tuple[Trigger, ...]:
    """The triggers in a fixed order, each once."""
    chosen = set(triggers)
    return tuple(trigger for trigger in TRIGGER_ORDER if trigger in chosen)


def event_triggers(entries: Iterable[HistoryEntry]) -> set[Trigger]:
    """What the history entries start: a test recorded, or a task completed or skipped."""
    found: set[Trigger] = set()
    for entry in entries:
        for change in entry.changes:
            after = change.after
            if after is None:
                continue
            if change.collection is Collection.LOG and change.before is None and after.get("kind") == "test":
                found.add(Trigger.TEST)
            before = change.before or {}
            if (
                change.collection is Collection.TASKS
                and before.get("state") == "open"
                and after.get("state") in TASK_DONE
            ):
                found.add(Trigger.TASK)
    return found


def result_text(status: Status) -> str:
    """The rules' result in one line, such as Watch: pH 6.8 is under 7.0."""
    if status.level is not Level.ON_COURSE:
        return f"{LEVEL_TITLES[status.level]}: {status.summary()}"
    return ALL_INSIDE if status.results else NO_RESULTS


def comments_on(reviews: Iterable[Review], day: date, tz: tzinfo) -> int:
    """How many times Claude was asked for a comment on the local day."""
    return sum(1 for review in reviews if review.asked and review.time.astimezone(tz).date() == day)


def kept(reviews: Sequence[Review], day: date, tz: tzinfo) -> list[Review]:
    """The latest reviews, and every review from the local day, so the daily cap still counts them all."""
    oldest_kept = len(reviews) - MAX_REVIEWS
    return [
        review
        for index, review in enumerate(reviews)
        if index >= oldest_kept or review.time.astimezone(tz).date() == day
    ]


def message(review: Review) -> str:
    """The review for a phone: the rules' result, Claude's comment and the plan changes waiting."""
    lines = [review.result]
    if review.comment is not None:
        lines.append(f"Claude: {review.comment}")
    if review.proposal_ids:
        count = len(review.proposal_ids)
        lines.append(WAITING_ONE if count == 1 else WAITING_MANY.format(count=count))
    return "\n".join(lines)


def _list(value: JsonValue) -> list[JsonValue]:
    return value if isinstance(value, list) else []


def _optional_str(value: JsonValue) -> str | None:
    return value if isinstance(value, str) else None
