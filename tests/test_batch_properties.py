"""Hegel properties for batches: one proposal that many changes build up, applied and undone as one."""

from dataclasses import replace
from datetime import UTC, datetime, timedelta
import json

import hegel
from hegel import generators as gs
import pytest

from custom_components.tankkeeper.domain import (
    BATCH_IDLE,
    BATCH_MAX_AGE,
    MAX_CODE_ATTEMPTS,
    SETUP_COLLECTIONS,
    BatchExpiredError,
    BatchOpenError,
    CodeExpiredError,
    Collection,
    InvalidInputError,
    NothingToChangeError,
    Proposal,
    ProposalClosedError,
    ProposalState,
    Record,
    Source,
    TankNotEmptyError,
    TankState,
    accept_proposal,
    add_to_batch,
    apply_changes,
    apply_proposal,
    batch_view,
    check_code,
    find_batch,
    plan_changes,
    reject_proposal,
    start_batch,
    tank_is_empty,
    undo_changes,
)

START = datetime(2026, 1, 1, tzinfo=UTC)
RECORD_IDS = ["a", "b"]
COLLECTIONS = [Collection.TANK, Collection.PRODUCTS, Collection.NOTES]
CODE = "ABCDEF"

fields = gs.dicts(gs.sampled_from(["x", "y"]), gs.integers(min_value=0, max_value=2), max_size=2)


@hegel.composite
def targets(tc: hegel.TestCase) -> list[tuple[Collection, str, Record | None]]:
    """One or two distinct records from a small set, and what to set each to."""
    keys = tc.draw(
        gs.lists(
            gs.tuples(gs.sampled_from(COLLECTIONS), gs.sampled_from(RECORD_IDS)), min_size=1, max_size=2, unique=True
        )
    )
    return [(collection, record_id, tc.draw(gs.one_of(gs.none(), fields))) for collection, record_id in keys]


def _records(state: TankState) -> str:
    return json.dumps(TankState(records=state.records).to_json(), sort_keys=True)


def _start(state: TankState, now: datetime = START, *, setup: bool = False, proposal_id: str = "b1") -> Proposal:
    return start_batch(
        state,
        proposal_id=proposal_id,
        code=CODE,
        now=now,
        source=Source.MCP,
        user_id="u1",
        conversation_id="c1",
        summary="Set up",
        reason="New tank",
        setup=setup,
    )


def _add(
    state: TankState, batch: Proposal, chosen: list[tuple[Collection, str, Record | None]], now: datetime
) -> Proposal:
    return add_to_batch(state, batch.id, chosen, now=now, tool="t", summary="step", reason="r", evidence=None)


def _seed(state: TankState, chosen: list[tuple[Collection, str, Record | None]]) -> None:
    try:
        changes = plan_changes(state, chosen)
    except NothingToChangeError:
        return
    apply_changes(state, changes, history_id="seed", now=START, source=Source.PANEL, conversation_id=None, summary="s")


@hegel.test
def test_a_batch_applies_like_each_change_in_turn(tc: hegel.TestCase) -> None:
    state = TankState()
    _seed(state, tc.draw(targets()))
    original = _records(state)
    expected = TankState(records={key: dict(value) for key, value in state.records.items()})
    batch = _start(state)
    steps = 0
    for _ in range(tc.draw(gs.integers(min_value=1, max_value=5))):
        chosen = tc.draw(targets())
        try:
            changes = plan_changes(expected, chosen)
        except NothingToChangeError:
            with pytest.raises(NothingToChangeError):
                _add(state, batch, chosen, START)
            continue
        apply_changes(
            expected, changes, history_id="x", now=START, source=Source.PANEL, conversation_id=None, summary="s"
        )
        batch = _add(state, batch, chosen, START)
        steps += 1
        assert _records(batch_view(state, batch)) == _records(expected)
    assert _records(state) == original
    assert len(batch.steps) == steps
    keys = [(change.collection, change.record_id) for change in batch.changes]
    assert len(keys) == len(set(keys))
    assert all(change.before != change.after for change in batch.changes)

    if not batch.changes:
        with pytest.raises(NothingToChangeError):
            apply_proposal(
                state, batch.id, CODE, history_id="h", now=START, source=Source.MCP, user_id="u1", conversation_id="c1"
            )
        return
    entry = apply_proposal(
        state, batch.id, CODE, history_id="h", now=START, source=Source.MCP, user_id="u1", conversation_id="c1"
    )
    assert _records(state) == _records(expected)
    assert entry.changes == batch.changes
    apply_changes(
        state, undo_changes(entry), history_id="u", now=START, source=Source.MCP, conversation_id=None, summary="u"
    )
    assert _records(state) == original


@hegel.test
def test_the_code_lasts_while_the_batch_keeps_changing(tc: hegel.TestCase) -> None:
    state = TankState()
    batch = _start(state)
    now = START
    for index in range(tc.draw(gs.integers(min_value=1, max_value=12))):
        expires = batch.code_expires()
        assert expires == min(batch.last_change() + BATCH_IDLE, batch.created + BATCH_MAX_AGE)
        assert expires <= batch.created + BATCH_MAX_AGE
        now += timedelta(minutes=tc.draw(gs.integers(min_value=0, max_value=20)))
        assert batch.is_open(now) is (now < expires)
        if now >= expires:
            with pytest.raises(BatchExpiredError):
                _add(state, batch, [(Collection.NOTES, f"n{index}", {"x": 1})], now)
            with pytest.raises(CodeExpiredError):
                check_code(batch, CODE, now=now, user_id="u1", conversation_id="c1")
            return
        batch = _add(state, batch, [(Collection.NOTES, f"n{index}", {"x": 1})], now)
        assert batch.last_change() == now
        assert batch.code_expires() >= expires
        check_code(batch, CODE, now=now, user_id="u1", conversation_id="c1")


@hegel.test
def test_starting_again_carries_an_expired_batch(tc: hegel.TestCase) -> None:
    state = TankState()
    _seed(state, tc.draw(targets()))
    batch = _start(state)
    for _ in range(tc.draw(gs.integers(min_value=1, max_value=3))):
        try:
            batch = _add(state, batch, tc.draw(targets()), START)
        except NothingToChangeError:
            continue
    later = START + tc.draw(gs.sampled_from([BATCH_IDLE, BATCH_MAX_AGE, timedelta(days=1)]))
    _seed(state, tc.draw(gs.one_of(gs.just([]), targets())))
    view = batch_view(state, batch)
    assert find_batch(state, user_id="u1", conversation_id="c1") == batch

    renewed = _start(state, later, proposal_id="b2")

    assert state.proposal(batch.id).state is ProposalState.REJECTED
    assert state.proposal(batch.id).decided == later
    assert renewed.id == "b2"
    assert renewed.is_open(later)
    assert renewed.steps == batch.steps
    assert _records(batch_view(state, renewed)) == _records(view)
    assert all(change.before == state.get(change.collection, change.record_id) for change in renewed.changes)
    assert find_batch(state, user_id="u1", conversation_id="c1") == renewed


def test_start_returns_the_open_batch() -> None:
    state = TankState()
    batch = _start(state)
    assert _start(state, START + timedelta(minutes=1), proposal_id="other") == batch
    with pytest.raises(BatchOpenError):
        _start(state, setup=True, proposal_id="other")
    setup_state = TankState()
    draft = _start(setup_state, setup=True)
    assert _start(setup_state, proposal_id="other") == draft


def test_a_batch_needs_a_conversation() -> None:
    with pytest.raises(InvalidInputError):
        start_batch(
            TankState(),
            proposal_id="b",
            code=CODE,
            now=START,
            source=Source.ASSIST,
            user_id="u1",
            conversation_id=None,
            summary="s",
            reason="r",
            setup=False,
        )


def test_setup_needs_an_empty_tank() -> None:
    state = TankState()
    state.records[Collection.TANK]["tank"] = {"name": "Nano"}
    state.records[Collection.NOTES]["n"] = {"text": "hi"}
    assert tank_is_empty(state)
    assert _start(state, setup=True).setup
    for collection in SETUP_COLLECTIONS:
        full = TankState()
        full.records[collection]["x"] = {}
        assert not tank_is_empty(full)
        with pytest.raises(TankNotEmptyError):
            _start(full, setup=True)


def test_adding_to_a_closed_or_locked_batch_fails() -> None:
    state = TankState()
    batch = _add(state, _start(state), [(Collection.NOTES, "a", {"x": 1})], START)
    state.proposals[batch.id] = locked = replace(batch, failed_attempts=MAX_CODE_ATTEMPTS)
    assert not locked.is_open(START)
    with pytest.raises(BatchExpiredError):
        _add(state, locked, [(Collection.NOTES, "b", {"x": 1})], START)
    reject_proposal(state, batch.id, now=START, user_id="u1")
    with pytest.raises(ProposalClosedError):
        _add(state, batch, [(Collection.NOTES, "b", {"x": 1})], START)
    assert find_batch(state, user_id="u1", conversation_id="c1") is None


def test_accept_applies_without_a_code_and_records_who() -> None:
    state = TankState()
    batch = _add(state, _start(state), [(Collection.NOTES, "a", {"x": 1})], START)
    later = START + timedelta(days=1)
    entry = accept_proposal(state, batch.id, history_id="h", now=later, source=Source.NOTIFICATION, user_id="u2")
    assert entry.source is Source.NOTIFICATION
    assert entry.proposal_id == batch.id
    accepted = state.proposal(batch.id)
    assert accepted.state is ProposalState.APPLIED
    assert accepted.decided_by == "u2"
    assert accepted.history_id == "h"
    assert state.get(Collection.NOTES, "a") == {"x": 1}
    with pytest.raises(ProposalClosedError):
        accept_proposal(state, batch.id, history_id="h2", now=later, source=Source.NOTIFICATION, user_id="u2")


def test_accept_needs_a_person_and_a_change() -> None:
    state = TankState()
    batch = _start(state)
    with pytest.raises(NothingToChangeError):
        accept_proposal(state, batch.id, history_id="h", now=START, source=Source.NOTIFICATION, user_id="u1")
    batch = _add(state, batch, [(Collection.NOTES, "a", {"x": 1})], START)
    with pytest.raises(InvalidInputError):
        accept_proposal(state, batch.id, history_id="h", now=START, source=Source.NOTIFICATION, user_id=None)
    assert state.proposal(batch.id).state is ProposalState.PENDING


def test_anyone_with_the_notification_can_reject() -> None:
    state = TankState()
    batch = _add(state, _start(state), [(Collection.NOTES, "a", {"x": 1})], START)
    rejected = reject_proposal(state, batch.id, now=START, user_id="u2", any_user=True)
    assert rejected.state is ProposalState.REJECTED
    assert rejected.decided_by == "u2"


@hegel.test
def test_a_batch_survives_storage(tc: hegel.TestCase) -> None:
    state = TankState()
    batch = _start(state)
    for minute in range(tc.draw(gs.integers(min_value=0, max_value=3))):
        try:
            batch = _add(state, batch, tc.draw(targets()), START + timedelta(minutes=minute))
        except NothingToChangeError:
            continue
    state.proposals[batch.id] = replace(batch, notified=tc.draw(gs.booleans()))
    stored = json.loads(json.dumps(state.to_json()))
    assert TankState.from_json(stored).to_json() == state.to_json()


def test_proposals_stored_before_batches_still_load() -> None:
    state = TankState()
    batch = _add(state, _start(state), [(Collection.NOTES, "a", {"x": 1})], START)
    stored = batch.to_json()
    for key in ("batch", "setup", "updated", "steps", "notified", "decided_by"):
        del stored[key]
    loaded = Proposal.from_json(stored)
    assert not loaded.batch
    assert not loaded.setup
    assert loaded.last_change() == loaded.created
    assert loaded.steps == ()
    assert not loaded.notified
    assert loaded.decided_by is None


def test_a_stored_batch_flag_must_be_true_or_false() -> None:
    state = TankState()
    stored = _start(state).to_json()
    stored["batch"] = "yes"
    with pytest.raises(TypeError):
        Proposal.from_json(stored)
