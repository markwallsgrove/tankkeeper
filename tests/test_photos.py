"""Which photo checks are kept, and how settings and checks read from storage."""

from dataclasses import replace
from datetime import UTC, date, datetime, time, timedelta
import io
from pathlib import Path
from typing import cast

from PIL import Image
import pytest

from custom_components.tankkeeper.photos import (
    MAX_CHECKS,
    MAX_DISMISSED,
    Area,
    CameraSettings,
    CheckReason,
    IssueState,
    PhotoCheck,
    cut_photo,
    cut_tiles,
    kept_checks,
    photo_file,
    tile_boxes,
    tile_files,
)
from custom_components.tankkeeper.plan import Weekday

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


def test_a_check_with_an_area_and_a_question_survives_storage() -> None:
    check = replace(
        _check(1, content_type="image/jpeg"),
        reason=CheckReason.AREA,
        area=Area(x=0.25, y=0.5, width=0.5, height=0.25),
        question="Is this white spot?",
    )

    assert check.to_json()["area"] == {"x": 0.25, "y": 0.5, "width": 0.5, "height": 0.25}
    assert PhotoCheck.from_json(check.to_json()) == check


def test_a_stored_area_that_is_wrong_is_ignored() -> None:
    stored = {**_check(1).to_json(), "area": {"x": "left", "y": 0, "width": 1, "height": 1}, "question": 3}

    assert PhotoCheck.from_json(stored) == _check(1)


def _image(size: tuple[int, int]) -> bytes:
    """A photo whose left half is red and right half is blue."""
    image = Image.new("RGB", size, (200, 0, 0))
    image.paste((0, 0, 200), (size[0] // 2, 0, size[0], size[1]))
    data = io.BytesIO()
    image.save(data, "PNG")
    return data.getvalue()


@pytest.mark.parametrize(
    ("area", "size", "colour"),
    [
        (Area(x=0, y=0, width=0.25, height=0.5), (400, 200), "red"),
        (Area(x=0.75, y=0.5, width=0.25, height=0.5), (400, 200), "blue"),
        (Area(x=0.5, y=0, width=1, height=1), (800, 400), "blue"),
        (Area(x=0.999, y=0.999, width=0.0001, height=0.0001), (1, 1), "blue"),
    ],
)
def test_cutting_a_photo_keeps_the_box_at_full_resolution(area: Area, size: tuple[int, int], colour: str) -> None:
    cut = cut_photo(_image((1600, 400)), area, long_edge=1568)

    with Image.open(io.BytesIO(cut)) as image:
        assert (image.format, image.size) == ("JPEG", size)
        red, _, blue = cast(tuple[int, int, int], image.convert("RGB").getpixel((0, 0)))
        assert (red > blue) is (colour == "red")


def test_a_cut_bigger_than_claude_reads_is_scaled_down() -> None:
    cut = cut_photo(_image((4000, 2000)), Area(x=0, y=0, width=1, height=0.5), long_edge=1568)

    with Image.open(io.BytesIO(cut)) as image:
        assert image.size == (1568, 392)


@pytest.mark.parametrize(
    ("size", "boxes"),
    [
        ((1000, 800), [(0, 0, 1000, 800)]),
        ((1092, 1092), [(0, 0, 1092, 1092)]),
        (
            (2304, 1296),
            [
                (0, 0, 1092, 1092),
                (606, 0, 1698, 1092),
                (1212, 0, 2304, 1092),
                (0, 204, 1092, 1296),
                (606, 204, 1698, 1296),
                (1212, 204, 2304, 1296),
            ],
        ),
    ],
)
def test_tiles_cover_the_frame_in_reading_order_and_overlap(
    size: tuple[int, int], boxes: list[tuple[int, int, int, int]]
) -> None:
    assert tile_boxes(*size) == boxes


def test_each_tile_overlaps_the_next_by_at_least_a_seventh() -> None:
    boxes = tile_boxes(3840, 2160)

    assert len(boxes) == 12
    assert boxes[0][2] - boxes[1][0] >= 1092 // 7
    assert boxes[0][3] - boxes[4][1] >= 1092 // 7
    assert (boxes[-1][2], boxes[-1][3]) == (3840, 2160)


def test_tiles_are_full_resolution_jpegs_of_the_frame() -> None:
    tiles = cut_tiles(_image((2304, 1296)))

    assert len(tiles) == 6
    for tile in tiles:
        with Image.open(io.BytesIO(tile)) as image:
            assert (image.format, image.size) == ("JPEG", (1092, 1092))


def test_a_frame_bigger_than_4k_is_scaled_down_before_it_is_cut() -> None:
    assert len(cut_tiles(_image((7680, 4320)))) == 12


def test_a_check_with_tiles_survives_storage_and_names_its_tile_files(tmp_path: Path) -> None:
    check = replace(_check(1, content_type="image/jpeg"), reason=CheckReason.THOROUGH, tiles=2)

    assert PhotoCheck.from_json(check.to_json()) == check
    assert PhotoCheck.from_json({**check.to_json(), "tiles": "2"}).tiles == 0
    assert tile_files(tmp_path, check) == [tmp_path / f"{check.id}-1.jpg", tmp_path / f"{check.id}-2.jpg"]
    assert tile_files(tmp_path, replace(check, content_type=None)) == []


def test_thorough_days_survive_storage_in_week_order() -> None:
    settings = CameraSettings(thorough_days=(Weekday.SUN, Weekday.MON))

    assert settings.thorough_days == (Weekday.MON, Weekday.SUN)
    assert CameraSettings.from_json(settings.to_json()) == settings
    assert CameraSettings.from_json({"thorough_days": ["sun", "someday", 3]}).thorough_days == (Weekday.SUN,)
    assert CameraSettings.from_json({"thorough_days": "sun"}).thorough_days == ()
