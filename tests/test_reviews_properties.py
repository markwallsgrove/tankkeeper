"""Hegel properties for reviews: storage, pruning, the daily count and the phone message."""

from datetime import UTC, date, datetime, timedelta
from zoneinfo import ZoneInfo

import hegel
from hegel import generators as gs

from custom_components.tankkeeper.claude import Trigger
from custom_components.tankkeeper.reviews import MAX_REVIEWS, Review, comments_on, kept, message
from custom_components.tankkeeper.rules import Level

LONDON = ZoneInfo("Europe/London")
START = datetime(2026, 11, 20, tzinfo=UTC)
TODAY = date(2026, 11, 26)
words = gs.text(alphabet="abc XYZ019.:", min_size=1, max_size=40)


@hegel.composite
def review(tc: hegel.TestCase, minute: int = 0) -> Review:
    """One review, some time in the week up to the end of today."""
    triggers: list[Trigger] = tc.draw(gs.lists(gs.sampled_from(list(Trigger)), max_size=4, unique=True))
    proposal_ids: list[str] = tc.draw(gs.lists(words, max_size=3))
    return Review(
        id=f"r{minute}",
        time=START + timedelta(minutes=minute),
        triggers=tuple(triggers),
        level=tc.draw(gs.sampled_from(list(Level))),
        result=tc.draw(words),
        asked=tc.draw(gs.booleans()),
        comment=tc.draw(gs.optional(words)),
        note=tc.draw(gs.optional(words)),
        proposal_ids=tuple(proposal_ids),
    )


@hegel.composite
def reviews(tc: hegel.TestCase) -> list[Review]:
    """Reviews oldest first, sometimes more than are kept."""
    minutes: list[int] = tc.draw(gs.lists(gs.integers(min_value=0, max_value=7 * 24 * 60), max_size=MAX_REVIEWS + 30))
    return [tc.draw(review(minute)) for minute in sorted(minutes)]


def _today(item: Review) -> bool:
    return item.time.astimezone(LONDON).date() == TODAY


@hegel.test
def test_a_review_reads_back_as_it_was_stored(tc: hegel.TestCase) -> None:
    item = tc.draw(review(tc.draw(gs.integers(min_value=0, max_value=10_000))))

    assert Review.from_json(item.to_json()) == item


@hegel.test
def test_pruning_keeps_the_latest_and_every_review_from_today(tc: hegel.TestCase) -> None:
    items = tc.draw(reviews())

    result = kept(items, TODAY, LONDON)

    assert result == [item for item in items if item in result]
    assert items[-MAX_REVIEWS:] == result[-MAX_REVIEWS:]
    assert [item for item in items if _today(item)] == [item for item in result if _today(item)]
    assert len(result) <= max(MAX_REVIEWS, sum(1 for item in items if _today(item)))
    assert comments_on(result, TODAY, LONDON) == comments_on(items, TODAY, LONDON)


@hegel.test
def test_the_message_holds_the_result_the_comment_and_what_waits(tc: hegel.TestCase) -> None:
    item = tc.draw(review())

    lines = message(item).split("\n")

    assert lines[0] == item.result
    assert (f"Claude: {item.comment}" in lines) is (item.comment is not None)
    waiting = [line for line in lines if line.startswith(f"{len(item.proposal_ids)} plan change")]
    assert len(waiting) == (1 if item.proposal_ids else 0)
