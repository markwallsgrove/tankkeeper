"""The rules that turn the records into a status, with no Home Assistant imports."""

from collections.abc import Callable, Iterable, Mapping
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta, tzinfo
from enum import StrEnum
import re

from .domain import InvalidInputError, Record
from .lights import LightStatus
from .plan import Slot, Task, TaskStatus

RULES_ID = "rules"
DOSE_DAYS = 7
_TEST = re.compile(r"\btest", re.IGNORECASE)
_AMOUNT = re.compile(r"\s+[0-9.]+\s*ml$", re.IGNORECASE)


class Level(StrEnum):
    """How the tank is doing. The status is the worst level of any rule."""

    ON_COURSE = "on_course"
    WATCH = "watch"
    ACT = "act"


LEVEL_ORDER = (Level.ON_COURSE, Level.WATCH, Level.ACT)
LEVEL_TITLES = {Level.ON_COURSE: "On course", Level.WATCH: "Watch", Level.ACT: "Act"}
BACK_ON_COURSE = "Back on course."


class Rule(StrEnum):
    """A check on the records."""

    AMMONIA = "ammonia"
    NITRITE = "nitrite"
    PH = "ph"
    CYCLE_STALLED = "cycle_stalled"
    TEST_OVERDUE = "test_overdue"
    DOSE_SKIPPED = "dose_skipped"
    PLAN_ENDS = "plan_ends"
    LIGHT = "light"


class Stage(StrEnum):
    """Whether the tank is still cycling. A tank setting."""

    CYCLING = "cycling"
    CYCLED = "cycled"


@dataclass(frozen=True, slots=True, kw_only=True)
class RuleSettings:
    """The limits of each rule. Watch comes before Act."""

    nitrogen_watch: float = 2.0
    nitrogen_act: float = 4.0
    ph_watch: float = 7.0
    ph_act: float = 6.5
    stall_watch_days: int = 5
    stall_act_days: int = 7
    test_watch_days: int = 1
    test_act_days: int = 3
    skip_watch: int = 1
    skip_act: int = 2
    plan_watch_days: int = 14
    plan_act_days: int = 7

    def check(self) -> None:
        """Raise InvalidInputError unless each Act limit is at least as strict as its Watch limit."""
        problems = [
            message
            for broken, message in (
                (self.nitrogen_act < self.nitrogen_watch, "nitrogen_act must not be under nitrogen_watch"),
                (self.ph_act > self.ph_watch, "ph_act must not be above ph_watch"),
                (self.stall_act_days < self.stall_watch_days, "stall_act_days must not be under stall_watch_days"),
                (self.test_act_days < self.test_watch_days, "test_act_days must not be under test_watch_days"),
                (self.skip_act < self.skip_watch, "skip_act must not be under skip_watch"),
                (self.plan_act_days > self.plan_watch_days, "plan_act_days must not be above plan_watch_days"),
            )
            if broken
        ]
        if problems:
            raise InvalidInputError(". ".join(problems))

    def to_json(self) -> Record:
        """Serialise for storage."""
        return dict(asdict(self))

    @classmethod
    def from_json(cls, data: Record | None) -> RuleSettings:
        """Read from storage. Missing or broken settings take their defaults."""
        stored = data or {}
        default = cls()
        return cls(
            nitrogen_watch=_float(stored, "nitrogen_watch", default.nitrogen_watch),
            nitrogen_act=_float(stored, "nitrogen_act", default.nitrogen_act),
            ph_watch=_float(stored, "ph_watch", default.ph_watch),
            ph_act=_float(stored, "ph_act", default.ph_act),
            stall_watch_days=_int(stored, "stall_watch_days", default.stall_watch_days),
            stall_act_days=_int(stored, "stall_act_days", default.stall_act_days),
            test_watch_days=_int(stored, "test_watch_days", default.test_watch_days),
            test_act_days=_int(stored, "test_act_days", default.test_act_days),
            skip_watch=_int(stored, "skip_watch", default.skip_watch),
            skip_act=_int(stored, "skip_act", default.skip_act),
            plan_watch_days=_int(stored, "plan_watch_days", default.plan_watch_days),
            plan_act_days=_int(stored, "plan_act_days", default.plan_act_days),
        )


@dataclass(frozen=True, slots=True, kw_only=True)
class Reading:
    """One water test from the log."""

    time: datetime
    source: str
    values: Mapping[str, float]


@dataclass(frozen=True, slots=True, kw_only=True)
class LightCheck:
    """A light and whether it follows its schedule."""

    name: str
    entity_id: str
    status: LightStatus


@dataclass(frozen=True, slots=True, kw_only=True)
class Facts:
    """What the rules look at."""

    now: datetime
    tz: tzinfo
    stage: Stage | None
    readings: tuple[Reading, ...]
    tasks: tuple[Task, ...]
    lights: tuple[LightCheck, ...]

    @property
    def today(self) -> date:
        """The local date."""
        return self.now.astimezone(self.tz).date()

    def tank_readings(self, name: str) -> list[tuple[datetime, float]]:
        """Tank readings of one value, oldest first. Readings at the same time keep their order.

        Tap readings never count.
        """
        return sorted(
            (
                (reading.time, reading.values[name])
                for reading in self.readings
                if reading.source == "tank" and name in reading.values
            ),
            key=lambda item: item[0],
        )

    def day(self, moment: datetime) -> str:
        """A time as a local date, such as 25 Nov."""
        return _day(moment.astimezone(self.tz).date())


@dataclass(frozen=True, slots=True, kw_only=True)
class RuleResult:
    """What one rule found: its level, why, and what to do. On course has nothing to do."""

    rule: Rule
    level: Level
    reason: str
    action: str | None

    def to_json(self) -> Record:
        """Serialise for tools and entity attributes."""
        return {"rule": self.rule.value, "level": self.level.value, "reason": self.reason, "action": self.action}


@dataclass(frozen=True, slots=True, kw_only=True)
class Status:
    """The worst rule result, and every result."""

    level: Level
    results: tuple[RuleResult, ...]
    checked: datetime

    def problems(self) -> tuple[RuleResult, ...]:
        """The results that are Watch or Act."""
        return tuple(result for result in self.results if result.level is not Level.ON_COURSE)

    def summary(self) -> str:
        """The reasons and what to do for each problem, in one message."""
        return " ".join(f"{result.reason} {result.action}" for result in self.problems())

    def to_json(self) -> Record:
        """Serialise for tools."""
        return {
            "status": self.level.value,
            "checked": self.checked.isoformat(),
            "rules": [result.to_json() for result in self.results],
        }


def evaluate(facts: Facts, settings: RuleSettings) -> Status:
    """Run every rule. A rule without the data it needs gives no result."""
    results = tuple(result for check in _RULES for result in check(facts, settings))
    worst = max((LEVEL_ORDER.index(result.level) for result in results), default=0)
    return Status(level=LEVEL_ORDER[worst], results=results, checked=facts.now)


def alert(before: Status, after: Status) -> tuple[Level, str] | None:
    """The alert for a status change: when a rule got worse, or once when the tank is back on course."""
    was = {result.rule: LEVEL_ORDER.index(result.level) for result in before.results}
    worse = any(LEVEL_ORDER.index(result.level) > was.get(result.rule, 0) for result in after.results)
    if worse:
        return after.level, after.summary()
    if after.level is Level.ON_COURSE and before.level is not Level.ON_COURSE:
        return Level.ON_COURSE, BACK_ON_COURSE
    return None


def _nitrogen(facts: Facts, settings: RuleSettings) -> Iterable[RuleResult]:
    for rule, label in ((Rule.AMMONIA, "Ammonia"), (Rule.NITRITE, "Nitrite")):
        readings = facts.tank_readings(rule.value)
        if not readings:
            continue
        moment, value = readings[-1]
        reading = f"{label} {_number(value)} ppm on {facts.day(moment)}"
        act = _number(settings.nitrogen_act)
        if value > settings.nitrogen_act:
            yield RuleResult(
                rule=rule,
                level=Level.ACT,
                reason=f"{reading} is above the {act} ppm limit.",
                action=f"Change water to bring it under {act} ppm, then test again the next day.",
            )
        elif value > settings.nitrogen_watch:
            yield RuleResult(
                rule=rule,
                level=Level.WATCH,
                reason=f"{reading} is above the {_number(settings.nitrogen_watch)} ppm watch limit.",
                action=f"Test again within 2 days. Above {act} ppm, change water to bring it down.",
            )
        else:
            yield _on_course(rule, f"{reading} is inside the {_number(settings.nitrogen_watch)} ppm limit.")


def _ph(facts: Facts, settings: RuleSettings) -> Iterable[RuleResult]:
    readings = facts.tank_readings("ph")
    if facts.stage is not Stage.CYCLING or not readings:
        return
    moment, value = readings[-1]
    reading = f"pH {_number(value)} on {facts.day(moment)}"
    watch = _number(settings.ph_watch)
    if value < settings.ph_act:
        yield RuleResult(
            rule=Rule.PH,
            level=Level.ACT,
            reason=f"{reading} is under {_number(settings.ph_act)}. The cycle can stall below {watch}.",
            action="Change 20-25% of the water and test pH again the next day.",
        )
    elif value < settings.ph_watch:
        yield RuleResult(
            rule=Rule.PH,
            level=Level.WATCH,
            reason=f"{reading} is under {watch}. The cycle can slow below {watch}.",
            action=f"Test pH again at the next test. If it is still under {watch}, change 20-25% of the water.",
        )
    else:
        yield _on_course(Rule.PH, f"{reading} is at or above {watch}.")


def _cycle_stalled(facts: Facts, settings: RuleSettings) -> Iterable[RuleResult]:
    ammonia = facts.tank_readings("ammonia")
    if facts.stage is not Stage.CYCLING or not ammonia:
        return
    latest, value = ammonia[-1]
    since = latest
    for moment, older in reversed(ammonia):
        if older != value:
            break
        since = moment
    nitrite = [reading for moment, reading in facts.tank_readings("nitrite") if since <= moment <= latest]
    if not nitrite:
        return
    days = (latest - since).days
    if value == 0:
        yield _on_course(Rule.CYCLE_STALLED, "No ammonia is left.")
        return
    if any(reading > 0 for reading in nitrite):
        yield _on_course(Rule.CYCLE_STALLED, "Nitrite shows, so the cycle is moving.")
        return
    reason = (
        f"Ammonia has stayed at {_number(value)} ppm for {days} days, since {facts.day(since)}, and no nitrite shows."
    )
    action = "The cycle may have stalled. Check pH: under 7 can stall it, and a 20-25% water change is the fix."
    if days >= settings.stall_act_days:
        yield RuleResult(rule=Rule.CYCLE_STALLED, level=Level.ACT, reason=reason, action=action)
    elif days >= settings.stall_watch_days:
        yield RuleResult(rule=Rule.CYCLE_STALLED, level=Level.WATCH, reason=reason, action=action)
    else:
        yield _on_course(Rule.CYCLE_STALLED, f"Ammonia has stayed at {_number(value)} ppm for {days} days.")


def _test_overdue(facts: Facts, settings: RuleSettings) -> Iterable[RuleResult]:
    tests = sorted((task for task in facts.tasks if _TEST.search(task.text)), key=lambda task: task.day)
    if not tests:
        return
    tested = [reading.time.astimezone(facts.tz).date() for reading in facts.readings if reading.source == "tank"]
    done = [task.day for task in tests if task.status is TaskStatus.COMPLETE]
    late = [
        task
        for task in tests
        if task.status is TaskStatus.OPEN
        and task.day < facts.today
        and not any(day >= task.day for day in [*tested, *done])
    ]
    if not late:
        yield _on_course(Rule.TEST_OVERDUE, "No planned test is late.")
        return
    oldest = late[0]
    days = (facts.today - oldest.day).days
    level = _level(days >= settings.test_act_days, days >= settings.test_watch_days)
    reason = f"The test '{oldest.text}' from {_day(oldest.day)} is {_count(days, 'day')} late."
    if level is Level.ON_COURSE:
        yield _on_course(Rule.TEST_OVERDUE, reason)
    else:
        yield RuleResult(
            rule=Rule.TEST_OVERDUE, level=level, reason=reason, action="Do the test and record the results."
        )


def _dose_skipped(facts: Facts, settings: RuleSettings) -> Iterable[RuleResult]:
    oldest = facts.today - timedelta(days=DOSE_DAYS)
    finished = sorted(
        (
            task
            for task in facts.tasks
            if task.slot is Slot.DOSE and task.status is not TaskStatus.OPEN and oldest <= task.day <= facts.today
        ),
        key=lambda task: task.day,
    )
    if not finished:
        return
    runs: dict[str, list[Task]] = {}
    for task in finished:
        run = runs.setdefault(_AMOUNT.sub("", task.text.strip()), [])
        if task.status is TaskStatus.SKIP:
            run.append(task)
        else:
            run.clear()
    skipped = {product: run for product, run in runs.items() if run}
    worst = max((len(run) for run in skipped.values()), default=0)
    level = _level(worst >= settings.skip_act, worst >= settings.skip_watch)
    if level is Level.ON_COURSE:
        yield _on_course(Rule.DOSE_SKIPPED, "No planned dose was skipped.")
        return
    reasons = [
        f"{product} was skipped on {_day(run[-1].day)}."
        if len(run) == 1
        else f"{product} was skipped {len(run)} times running, last on {_day(run[-1].day)}."
        for product, run in skipped.items()
    ]
    action = (
        "Give the dose, or change the plan if it is no longer needed."
        if level is Level.ACT
        else "Give the next dose as planned."
    )
    yield RuleResult(rule=Rule.DOSE_SKIPPED, level=level, reason=" ".join(reasons), action=action)


def _plan_ends(facts: Facts, settings: RuleSettings) -> Iterable[RuleResult]:
    if not facts.tasks:
        return
    last = max(task.day for task in facts.tasks)
    days = (last - facts.today).days
    level = _level(days <= settings.plan_act_days, days <= settings.plan_watch_days)
    reason = f"The plan ends on {_day(last)}, in {_count(days, 'day')}."
    if level is Level.ON_COURSE:
        yield _on_course(Rule.PLAN_ENDS, reason)
    else:
        yield RuleResult(
            rule=Rule.PLAN_ENDS, level=level, reason=reason, action=f"Add tasks to the plan beyond {_day(last)}."
        )


def _light(facts: Facts, settings: RuleSettings) -> Iterable[RuleResult]:
    if not facts.lights:
        return
    reasons: list[str] = []
    for light in facts.lights:
        missed = light.status.missed
        if missed is not None:
            turn = "on" if missed.wanted else "off"
            reasons.append(f"{light.name} did not turn {turn} at {missed.time.astimezone(facts.tz):%H:%M}.")
        if light.status.unavailable_since is not None:
            reasons.append(f"{light.entity_id} for {light.name} is unavailable.")
    unavailable = any(light.status.unavailable_since is not None for light in facts.lights)
    level = _level(unavailable, bool(reasons))
    if level is Level.ON_COURSE:
        yield _on_course(Rule.LIGHT, "The lights follow their schedule.")
        return
    action = (
        "Check the plug has power and is connected to Home Assistant."
        if level is Level.ACT
        else "Check the light and its plug."
    )
    yield RuleResult(rule=Rule.LIGHT, level=level, reason=" ".join(reasons), action=action)


_RULES: tuple[Callable[[Facts, RuleSettings], Iterable[RuleResult]], ...] = (
    _nitrogen,
    _ph,
    _cycle_stalled,
    _test_overdue,
    _dose_skipped,
    _plan_ends,
    _light,
)


def _on_course(rule: Rule, reason: str) -> RuleResult:
    return RuleResult(rule=rule, level=Level.ON_COURSE, reason=reason, action=None)


def _level(act: bool, watch: bool) -> Level:
    if act:
        return Level.ACT
    return Level.WATCH if watch else Level.ON_COURSE


def _number(value: float) -> str:
    return f"{value:g}"


def _count(value: int, unit: str) -> str:
    return f"{value} {unit}" if value == 1 else f"{value} {unit}s"


def _day(day: date) -> str:
    return f"{day.day} {day:%b}"


def _number_in(stored: Record, key: str) -> float | None:
    value = stored.get(key)
    return float(value) if isinstance(value, int | float) and not isinstance(value, bool) else None


def _float(stored: Record, key: str, default: float) -> float:
    value = _number_in(stored, key)
    return default if value is None else value


def _int(stored: Record, key: str, default: int) -> int:
    value = _number_in(stored, key)
    return default if value is None else int(value)
