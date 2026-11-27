"""Camera settings and photo checks.

A photo check is one photo of the tank and what Claude saw in it. A check that found an issue stays open until the
owner accepts it, rejects it or says it is not a problem.
"""

from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field, replace
from datetime import date, datetime, time, timedelta, tzinfo
from enum import StrEnum
from pathlib import Path
import re

from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .domain import InvalidInputError, JsonValue, Record
from .plan import format_time, parse_time

CAMERA_ID = "camera"
CAMERA_DOMAIN = "camera"
MAX_KEEP_DAYS = 365
MAX_CHECKS = 200
MAX_DISMISSED = 50
MAX_TEXT = 500
PHOTO_PATH = f"/api/{DOMAIN}/photos"
AREAS = ("water", "algae", "plants", "fish", "level")
IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
_PHOTO_ID = re.compile(r"[0-9A-HJKMNP-TV-Z]{26}")


class CheckReason(StrEnum):
    """What started a photo check."""

    DAILY = "daily"
    TEST = "test"
    MANUAL = "manual"
    CHAT = "chat"


class IssueState(StrEnum):
    """Where an issue the camera found is: open until the owner answers it."""

    OPEN = "open"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    DISMISSED = "dismissed"


@dataclass(frozen=True, slots=True, kw_only=True)
class CameraSettings:
    """Which camera looks at the tank, when it checks, whether it alerts and how long photos are kept."""

    camera: str | None = None
    check_time: time | None = time(14)
    after_test: bool = False
    alerts: bool = True
    keep_days: int = 30

    def to_json(self) -> Record:
        """Serialise for storage and tools."""
        return {
            "camera": self.camera,
            "check_time": None if self.check_time is None else format_time(self.check_time),
            "after_test": self.after_test,
            "alerts": self.alerts,
            "keep_days": self.keep_days,
        }

    @classmethod
    def from_json(cls, data: Record | None) -> CameraSettings:
        """Read from storage. Missing settings take their defaults."""
        stored = data or {}
        default = cls()
        camera = stored.get("camera")
        check_time = stored.get("check_time", format_time(time(14)))
        keep_days = stored.get("keep_days")
        return cls(
            camera=camera if isinstance(camera, str) and camera else None,
            check_time=parse_time(check_time) if isinstance(check_time, str) else None,
            after_test=stored.get("after_test") is True,
            alerts=stored.get("alerts", default.alerts) is not False,
            keep_days=keep_days if isinstance(keep_days, int) else default.keep_days,
        )


def check_camera(hass: HomeAssistant, settings: CameraSettings) -> None:
    """Raise InvalidInputError unless the camera exists and photos are kept for 1 to MAX_KEEP_DAYS days."""
    if settings.camera is not None and (
        not settings.camera.startswith(f"{CAMERA_DOMAIN}.") or hass.states.get(settings.camera) is None
    ):
        raise InvalidInputError(f"No camera entity {settings.camera}")
    if not 1 <= settings.keep_days <= MAX_KEEP_DAYS:
        raise InvalidInputError(f"Photos are kept for 1 to {MAX_KEEP_DAYS} days")


@dataclass(frozen=True, slots=True, kw_only=True)
class PhotoCheck:
    """One photo of the tank and what Claude saw in it.

    content_type is None when no photo is kept: it was not taken, or it is older than the camera keeps photos.
    asked says whether Claude was asked, which counts toward the daily cap. state is None when there is no issue.
    """

    id: str
    time: datetime
    reason: CheckReason
    content_type: str | None
    asked: bool
    summary: str | None = None
    issue: bool = False
    suggestion: str | None = None
    seen: dict[str, str] = field(default_factory=dict)
    note: str | None = None
    state: IssueState | None = None
    proposal_ids: tuple[str, ...] = ()

    def to_json(self) -> Record:
        """Serialise for storage and tools."""
        return {
            "id": self.id,
            "time": self.time.isoformat(),
            "reason": self.reason.value,
            "content_type": self.content_type,
            "asked": self.asked,
            "summary": self.summary,
            "issue": self.issue,
            "suggestion": self.suggestion,
            "seen": dict(self.seen),
            "note": self.note,
            "state": None if self.state is None else self.state.value,
            "proposal_ids": list(self.proposal_ids),
        }

    @classmethod
    def from_json(cls, data: Record) -> PhotoCheck:
        """Read from storage."""
        seen = data.get("seen")
        state = data.get("state")
        proposal_ids = data.get("proposal_ids")
        return cls(
            id=str(data["id"]),
            time=datetime.fromisoformat(str(data["time"])),
            reason=CheckReason(str(data["reason"])),
            content_type=_optional_str(data.get("content_type")),
            asked=data.get("asked") is True,
            summary=_optional_str(data.get("summary")),
            issue=data.get("issue") is True,
            suggestion=_optional_str(data.get("suggestion")),
            seen={str(key): str(value) for key, value in seen.items()} if isinstance(seen, dict) else {},
            note=_optional_str(data.get("note")),
            state=None if not isinstance(state, str) else IssueState(state),
            proposal_ids=tuple(str(item) for item in proposal_ids) if isinstance(proposal_ids, list) else (),
        )


def is_photo_id(value: str) -> bool:
    """Whether the value has the shape of a photo id, a ULID."""
    return _PHOTO_ID.fullmatch(value) is not None


def photo_file(directory: Path, check: PhotoCheck) -> Path | None:
    """Where the check's photo is stored, or None when it has none. The name comes from the id and type only."""
    if check.content_type is None or not is_photo_id(check.id):
        return None
    extension = IMAGE_TYPES.get(check.content_type)
    return None if extension is None else directory / f"{check.id}{extension}"


def asked_on(checks: Iterable[PhotoCheck], day: date, tz: tzinfo) -> int:
    """How many times Claude was asked to look at a photo on the local day."""
    return sum(1 for check in checks if check.asked and check.time.astimezone(tz).date() == day)


def kept_checks(checks: Sequence[PhotoCheck], day: date, tz: tzinfo) -> list[PhotoCheck]:
    """The latest checks, every check from the local day, open issues and the latest issues dismissed."""
    oldest_kept = len(checks) - MAX_CHECKS
    dismissed = [check.id for check in checks if check.state is IssueState.DISMISSED][-MAX_DISMISSED:]
    return [
        check
        for index, check in enumerate(checks)
        if index >= oldest_kept
        or check.time.astimezone(tz).date() == day
        or check.state is IssueState.OPEN
        or check.id in dismissed
    ]


def without_old_photos(checks: Iterable[PhotoCheck], now: datetime, keep_days: int) -> list[PhotoCheck]:
    """The checks, with the photos older than keep_days let go."""
    oldest = now - timedelta(days=keep_days)
    return [check if check.time >= oldest else replace(check, content_type=None) for check in checks]


def dismissed_findings(checks: Iterable[PhotoCheck]) -> list[str]:
    """What the owner said is not a problem, oldest first."""
    return [check.summary for check in checks if check.state is IssueState.DISMISSED and check.summary is not None]


def write_photo(path: Path, data: bytes) -> None:
    """Store a photo, making its folder when needed. Runs in the executor."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def remove_unused(directory: Path, used: set[str]) -> None:
    """Delete every file in the folder whose name is not used. Runs in the executor."""
    if not directory.is_dir():
        return
    for path in directory.iterdir():
        if path.name not in used and path.is_file():
            path.unlink()


def _optional_str(value: JsonValue) -> str | None:
    return value if isinstance(value, str) else None
