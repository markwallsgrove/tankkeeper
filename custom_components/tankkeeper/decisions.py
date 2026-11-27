"""Numbered decisions: proposed, accepted or replaced by a later one."""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, replace
from datetime import date
from enum import StrEnum

from homeassistant.util.json import JsonObjectType, JsonValueType

from .domain import InvalidInputError, NotFoundError, Record


class DecisionStatus(StrEnum):
    """Where a decision stands."""

    PROPOSED = "proposed"
    ACCEPTED = "accepted"
    REPLACED = "replaced"


@dataclass(frozen=True, kw_only=True)
class Decision:
    """One numbered decision."""

    number: int
    title: str
    day: date
    status: DecisionStatus
    decision: str
    why: str
    open: tuple[str, ...] = ()
    replaced_by: int | None = None

    @property
    def record_id(self) -> str:
        """The number with four digits, as in 0007."""
        return record_id(self.number)

    def check(self) -> None:
        """Raise InvalidInputError unless a replaced decision names a later one, and only then."""
        if (self.status is DecisionStatus.REPLACED) != (self.replaced_by is not None):
            raise InvalidInputError(f"Decision {self.record_id} needs replaced_by exactly when it is replaced")
        if self.replaced_by is not None and self.replaced_by <= self.number:
            raise InvalidInputError(f"Decision {self.record_id} can only be replaced by a later decision")

    def summary(self) -> JsonObjectType:
        """The fields a list shows."""
        return {
            "number": self.number,
            "title": self.title,
            "date": self.day.isoformat(),
            "status": self.status.value,
            "replaced_by": self.replaced_by,
        }

    def to_record(self) -> Record:
        """Store every field."""
        open_points: list[JsonValueType] = list(self.open)
        return {
            **self.summary(),
            "decision": self.decision,
            "why": self.why,
            "open": open_points,
        }

    @classmethod
    def from_record(cls, record: Mapping[str, JsonValueType]) -> Decision:
        """Read a stored or imported decision. The date must be an ISO date."""
        replaced_by = record.get("replaced_by")
        open_points = record.get("open")
        return cls(
            number=int(str(record["number"])),
            title=str(record["title"]),
            day=parse_day(str(record["date"])),
            status=DecisionStatus(str(record["status"])),
            decision=str(record["decision"]),
            why=str(record["why"]),
            open=tuple(str(item) for item in open_points) if isinstance(open_points, list) else (),
            replaced_by=None if replaced_by is None else int(str(replaced_by)),
        )


def record_id(number: int) -> str:
    """The record id of a decision number."""
    return f"{number:04d}"


def parse_day(value: str) -> date:
    """An ISO date, or InvalidInputError."""
    try:
        return date.fromisoformat(value)
    except ValueError as err:
        raise InvalidInputError(f"{value} is not an ISO date") from err


def decisions_of(records: Mapping[str, Record]) -> dict[int, Decision]:
    """Every stored decision by number."""
    return {decision.number: decision for decision in (Decision.from_record(record) for record in records.values())}


def find(decisions: Mapping[int, Decision], number: int) -> Decision:
    """One decision, or NotFoundError."""
    if number not in decisions:
        raise NotFoundError(f"No decision {record_id(number)}")
    return decisions[number]


def next_number(decisions: Mapping[int, Decision]) -> int:
    """The number after the highest one."""
    return max(decisions, default=0) + 1


def add(decisions: Mapping[int, Decision], new: Decision, replaces: Iterable[int]) -> list[Decision]:
    """The new decision and each one it replaces, marked replaced."""
    replaced = [_replace(find(decisions, number), new.number) for number in replaces]
    return [new, *replaced]


def accept(decisions: Mapping[int, Decision], number: int) -> Decision:
    """A proposed decision, accepted."""
    decision = find(decisions, number)
    if decision.status is not DecisionStatus.PROPOSED:
        raise InvalidInputError(f"Decision {decision.record_id} is {decision.status.value}, not proposed")
    return replace(decision, status=DecisionStatus.ACCEPTED)


def replace_with(decisions: Mapping[int, Decision], number: int, replaced_by: int) -> Decision:
    """A decision, replaced by another stored one."""
    find(decisions, replaced_by)
    return _replace(find(decisions, number), replaced_by)


def check_import(decisions: Mapping[int, Decision], imported: list[Decision]) -> None:
    """Raise InvalidInputError for a number given twice, or a replaced_by that names no decision."""
    numbers = [decision.number for decision in imported]
    if len(set(numbers)) != len(numbers):
        raise InvalidInputError("Each decision number can be given only once")
    known = set(decisions) | set(numbers)
    for decision in imported:
        decision.check()
        if decision.replaced_by is not None and decision.replaced_by not in known:
            raise InvalidInputError(f"Decision {decision.record_id} is replaced by a decision that doesn't exist")


def replaces(decisions: Mapping[int, Decision], number: int) -> list[int]:
    """The numbers of the decisions this one replaced."""
    return sorted(decision.number for decision in decisions.values() if decision.replaced_by == number)


def _replace(decision: Decision, replaced_by: int) -> Decision:
    if decision.status is DecisionStatus.REPLACED:
        raise InvalidInputError(f"Decision {decision.record_id} is already replaced")
    replaced = replace(decision, status=DecisionStatus.REPLACED, replaced_by=replaced_by)
    replaced.check()
    return replaced
