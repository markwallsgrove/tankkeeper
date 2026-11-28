"""Which photo checks are kept, and how settings and checks read from storage."""

from dataclasses import replace
from datetime import UTC, date, datetime, time, timedelta
from pathlib import Path

from custom_components.tankkeeper.photos import (
    MAX_CHECKS,
    MAX_DISMISSED,
    CameraSettings,
    CheckReason,
    IssueState,
    PhotoCheck,
    kept_checks,
    photo_file,
)

DAY = date(2026, 11, 26)
START = datetime(2026, 1, 1, tzinfo=UTC)


def _check(
    index: int, *, state: IssueState | None = None, at: datetime | None = None, content_type: str | None = None
) -> PhotoCheck:
    return PhotoCheck(
        id=f"01JD{index:022d}",
        time=at or START + timedelta(hours=index),
        reason=CheckReason.DAILY,
        content_type=content_type,
        asked=False,
        state=state,
    )


def test_the_latest_checks_today_open_issues_and_the_latest_dismissed_are_kept() -> None:
    open_issue = _check(0, state=IssueState.OPEN)
    dismissed = [_check(1 + index, state=IssueState.DISMISSED) for index in range(MAX_DISMISSED + 1)]
    today = _check(100, at=datetime(2026, 11, 26, 7, tzinfo=UTC))
    latest = [_check(1000 + index) for index in range(MAX_CHECKS)]

    kept = kept_checks([open_issue, *dismissed, today, *latest], DAY, UTC)

    assert kept == [open_issue, *dismissed[1:], today, *latest]


def test_settings_read_from_storage_take_defaults_for_what_is_missing_or_wrong() -> None:
    assert CameraSettings.from_json(None) == CameraSettings()
    assert CameraSettings.from_json({"camera": "", "keep_days": "7", "alerts": "no"}) == CameraSettings()
    assert CameraSettings.from_json({"check_time": None, "alerts": False, "after_test": True}) == CameraSettings(
        check_time=None, alerts=False, after_test=True
    )
    assert CameraSettings.from_json({"check_time": "07:15"}).check_time == time(7, 15)
    assert CameraSettings.from_json({"check_plants": False, "check_fish": "no"}) == CameraSettings(check_plants=False)


def test_a_check_read_from_storage_ignores_what_is_wrong() -> None:
    check = PhotoCheck.from_json(
        {"id": "x", "time": "2026-11-26T08:00:00+00:00", "reason": "test", "seen": [], "proposal_ids": "p", "state": 1}
    )

    assert check == PhotoCheck(
        id="x", time=datetime(2026, 11, 26, 8, tzinfo=UTC), reason=CheckReason.TEST, content_type=None, asked=False
    )


def test_a_photo_file_name_comes_only_from_a_valid_id_and_a_known_type() -> None:
    folder = Path("/photos")
    check = _check(1, content_type="image/png")

    assert photo_file(folder, check) == folder / f"{check.id}.png"
    assert photo_file(folder, replace(check, id="../../secrets")) is None
    assert photo_file(folder, replace(check, content_type="image/bmp")) is None
    assert photo_file(folder, replace(check, content_type=None)) is None
