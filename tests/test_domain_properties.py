"""Hegel properties for the records, history, undo, confirm codes and doses."""

from collections.abc import Callable
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from decimal import Decimal
import json
from typing import cast

import hegel
from hegel import generators as gs
import pytest

from custom_components.tankkeeper.domain import (
    CODE_ALPHABET,
    CODE_LENGTH,
    CODE_LIFETIME,
    MAX_CODE_ATTEMPTS,
    Change,
    CodeExpiredError,
    CodeWrongError,
    Collection,
    Conversation,
    Message,
    NothingToChangeError,
    NotYourProposalError,
    ProposalState,
    Record,
    RecordChangedError,
    Source,
    TankkeeperError,
    TankState,
    TooManyAttemptsError,
    apply_changes,
    apply_proposal,
    check_code,
    dose_for_volume,
    dosing_within_tank,
    plan_changes,
    propose,
    reject_proposal,
    search_conversations,
    undo_changes,
)

START = datetime(2026, 1, 1, tzinfo=UTC)
RECORD_IDS = ["a", "b", "c"]
USERS = ["u1", "u2", None]
CONVERSATIONS = ["c1", "c2", None]

scalars = gs.one_of(
    gs.none(),
    gs.booleans(),
    gs.integers(min_value=-(2**53), max_value=2**53),
    gs.floats(allow_nan=False, allow_infinity=False),
    gs.text(max_size=8),
)
json_values = gs.recursive(
    scalars,
    lambda children: gs.one_of(gs.lists(children, max_size=3), gs.dicts(gs.text(max_size=5), children, max_size=3)),
    max_leaves=10,
)
records = gs.dicts(gs.text(max_size=5), json_values, max_size=4)
codes = gs.text(alphabet=CODE_ALPHABET, min_size=CODE_LENGTH, max_size=CODE_LENGTH)


@hegel.composite
def targets(tc: hegel.TestCase) -> list[tuple[Collection, str, Record | None]]:
    """Up to three distinct records and what to set each to."""
    keys = tc.draw(
        gs.lists(
            gs.tuples(gs.sampled_from(list(Collection)), gs.sampled_from(RECORD_IDS)),
            min_size=1,
            max_size=3,
            unique=True,
        )
    )
    return [(collection, record_id, tc.draw(gs.one_of(gs.none(), records))) for collection, record_id in keys]


def _replay(state: TankState) -> dict[Collection, dict[str, Record]]:
    replayed = TankState()
    for entry in state.history:
        for change in entry.changes:
            if change.after is None:
                replayed.records[change.collection].pop(change.record_id, None)
            else:
                replayed.records[change.collection][change.record_id] = change.after
    return replayed.records


def rule[F: Callable[..., None]](fn: F) -> F:
    """hegel.rule, typed."""
    return cast(F, hegel.rule(fn))


def invariant[F: Callable[..., None]](fn: F) -> F:
    """hegel.invariant, typed."""
    return cast(F, hegel.invariant(fn))


class TankMachine(hegel.StateMachine):
    """Random changes, undos and proposals against one tank."""

    def __init__(self) -> None:
        """Start with an empty tank."""
        self.state = TankState()
        self.now = START
        self.count = 0

    def _next_id(self) -> str:
        self.count += 1
        return f"{self.count:06d}"

    @rule
    def set_records(self, tc: hegel.TestCase) -> None:
        """Set records straight away."""
        try:
            chosen = tc.draw(targets())
            changes = plan_changes(self.state, chosen)
        except NothingToChangeError:
            return
        apply_changes(
            self.state,
            changes,
            history_id=self._next_id(),
            now=self.now,
            source=Source.PANEL,
            conversation_id=None,
            summary="set",
        )

    @rule
    def undo(self, tc: hegel.TestCase) -> None:
        """Undo a history entry. It applies in full or, if a record moved on since, not at all."""
        if not self.state.history:
            return
        entry = tc.draw(gs.sampled_from(self.state.history))
        before = json.dumps(self.state.to_json(), sort_keys=True)
        try:
            apply_changes(
                self.state,
                undo_changes(entry),
                history_id=self._next_id(),
                now=self.now,
                source=Source.PANEL,
                conversation_id=None,
                summary="undo",
            )
        except RecordChangedError:
            assert json.dumps(self.state.to_json(), sort_keys=True) == before
            return
        for change in entry.changes:
            assert self.state.get(change.collection, change.record_id) == change.before

    @rule
    def undo_latest(self, tc: hegel.TestCase) -> None:
        """Undoing the newest entry always works and puts every record back."""
        if not self.state.history:
            return
        records = json.dumps(TankState(records=self.state.records).to_json(), sort_keys=True)
        entry = self.state.history[-1]
        apply_changes(
            self.state,
            undo_changes(entry),
            history_id=self._next_id(),
            now=self.now,
            source=Source.PANEL,
            conversation_id=None,
            summary="undo",
        )
        apply_changes(
            self.state,
            entry.changes,
            history_id=self._next_id(),
            now=self.now,
            source=Source.PANEL,
            conversation_id=None,
            summary="redo",
        )
        assert json.dumps(TankState(records=self.state.records).to_json(), sort_keys=True) == records

    @rule
    def make_proposal(self, tc: hegel.TestCase) -> None:
        """Propose a change for a person in a conversation."""
        try:
            chosen = tc.draw(targets())
            changes = plan_changes(self.state, chosen)
        except NothingToChangeError:
            return
        propose(
            self.state,
            changes,
            proposal_id=self._next_id(),
            code=tc.draw(codes),
            now=self.now,
            source=Source.MCP,
            user_id=tc.draw(gs.sampled_from(USERS)),
            conversation_id=tc.draw(gs.sampled_from(CONVERSATIONS)),
            tool="test",
            summary="proposed",
            reason="because",
            evidence=None,
        )

    @rule
    def try_code(self, tc: hegel.TestCase) -> None:
        """Try a code on a proposal. Records change only when every check passes."""
        if not self.state.proposals:
            return
        proposal = tc.draw(gs.sampled_from(list(self.state.proposals.values())))
        code = tc.draw(gs.one_of(gs.just(proposal.code), gs.just(proposal.code.lower()), codes))
        user_id = tc.draw(gs.one_of(gs.just(proposal.user_id), gs.sampled_from(USERS)))
        conversation_id = tc.draw(gs.one_of(gs.just(proposal.conversation_id), gs.sampled_from(CONVERSATIONS)))
        before_records = json.dumps(TankState(records=self.state.records).to_json(), sort_keys=True)
        history_length = len(self.state.history)
        try:
            entry = apply_proposal(
                self.state,
                proposal.id,
                code,
                history_id=self._next_id(),
                now=self.now,
                source=Source.MCP,
                user_id=user_id,
                conversation_id=conversation_id,
            )
        except CodeWrongError:
            assert code.upper() != proposal.code
            assert self.state.proposal(proposal.id).failed_attempts == proposal.failed_attempts + 1
        except TankkeeperError:
            assert self.state.proposal(proposal.id) == proposal
        else:
            assert proposal.state is ProposalState.PENDING
            assert proposal.user_id == user_id
            assert proposal.conversation_id in (None, conversation_id)
            assert proposal.failed_attempts < MAX_CODE_ATTEMPTS
            assert code.upper() == proposal.code
            assert self.now < proposal.code_expires()
            assert entry.changes == proposal.changes
            assert self.state.proposal(proposal.id).state is ProposalState.APPLIED
            return
        assert json.dumps(TankState(records=self.state.records).to_json(), sort_keys=True) == before_records
        assert len(self.state.history) == history_length

    @rule
    def reject(self, tc: hegel.TestCase) -> None:
        """Reject a pending proposal. Only the person who made it can."""
        pending = [item for item in self.state.proposals.values() if item.state is ProposalState.PENDING]
        if pending:
            proposal = tc.draw(gs.sampled_from(pending))
            user_id = tc.draw(gs.sampled_from(USERS))
            if user_id != proposal.user_id:
                with pytest.raises(NotYourProposalError):
                    reject_proposal(self.state, proposal.id, now=self.now, user_id=user_id)
                assert self.state.proposal(proposal.id).state is ProposalState.PENDING
                return
            assert reject_proposal(self.state, proposal.id, now=self.now, user_id=user_id).decided == self.now

    @rule
    def wait(self, tc: hegel.TestCase) -> None:
        """Let time pass."""
        self.now += timedelta(minutes=tc.draw(gs.integers(min_value=0, max_value=20)))

    @invariant
    def history_replays_to_records(self, tc: hegel.TestCase) -> None:
        """The records are exactly what the history adds up to."""
        assert _replay(self.state) == self.state.records

    @invariant
    def survives_storage(self, tc: hegel.TestCase) -> None:
        """Saving and loading through JSON changes nothing."""
        stored = json.loads(json.dumps(self.state.to_json()))
        assert TankState.from_json(stored).to_json() == self.state.to_json()

    @invariant
    def proposals_are_consistent(self, tc: hegel.TestCase) -> None:
        """Applied proposals point at their history entry; attempts never pass the limit."""
        for proposal in self.state.proposals.values():
            assert proposal.failed_attempts <= MAX_CODE_ATTEMPTS
            if proposal.state is ProposalState.APPLIED:
                assert proposal.history_id is not None
                assert self.state.history_entry(proposal.history_id).proposal_id == proposal.id
            else:
                assert proposal.history_id is None
            assert (proposal.decided is None) == (proposal.state is ProposalState.PENDING)


test_tank_machine = hegel.state_machine_test(TankMachine)


@hegel.test
def test_change_inverse_is_an_involution(tc: hegel.TestCase) -> None:
    change = Change(
        collection=tc.draw(gs.sampled_from(list(Collection))),
        record_id=tc.draw(gs.text(max_size=5)),
        before=tc.draw(gs.one_of(gs.none(), records)),
        after=tc.draw(gs.one_of(gs.none(), records)),
    )
    assert change.inverse().inverse() == change
    assert Change.from_json(change.to_json()) == change


@hegel.test
def test_check_code_order(tc: hegel.TestCase) -> None:
    code = tc.draw(codes)
    state = TankState()
    proposal = propose(
        state,
        plan_changes(state, [(Collection.NOTES, "a", {"x": 1})]),
        proposal_id="p",
        code=code,
        now=START,
        source=Source.MCP,
        user_id="u1",
        conversation_id="c1",
        tool="t",
        summary="s",
        reason="r",
        evidence=None,
    )
    attempts = tc.draw(gs.integers(min_value=0, max_value=MAX_CODE_ATTEMPTS + 2))
    elapsed = tc.draw(gs.temporal.durations(min_value=timedelta(0), max_value=CODE_LIFETIME * 2))
    tried = tc.draw(gs.one_of(gs.just(code), codes, gs.text(max_size=8)))
    user_id = tc.draw(gs.sampled_from(USERS))
    conversation_id = tc.draw(gs.sampled_from(CONVERSATIONS))
    proposal = replace(proposal, failed_attempts=attempts)

    expected: type[TankkeeperError] | None
    if user_id != "u1" or conversation_id != "c1":
        expected = NotYourProposalError
    elif attempts >= MAX_CODE_ATTEMPTS:
        expected = TooManyAttemptsError
    elif tried.strip().upper() != code:
        expected = CodeWrongError
    elif elapsed >= CODE_LIFETIME:
        expected = CodeExpiredError
    else:
        expected = None
    now = START + elapsed
    if expected is None:
        check_code(proposal, tried, now=now, user_id=user_id, conversation_id=conversation_id)
    else:
        with pytest.raises(expected):
            check_code(proposal, tried, now=now, user_id=user_id, conversation_id=conversation_id)


@hegel.test
def test_dosing_within_tank_compares_only_numbers(tc: hegel.TestCase) -> None:
    tank = tc.draw(gs.dicts(gs.sampled_from(["volume_litres", "dosing_volume_litres", "name"]), json_values))
    volume = tank.get("volume_litres")
    dosing = tank.get("dosing_volume_litres")
    numbers = isinstance(volume, int | float) and isinstance(dosing, int | float)
    assert dosing_within_tank(tank) is (not numbers or cast(float, dosing) <= cast(float, volume))


@hegel.test
def test_dose_for_volume_rounds_to_nearest_step(tc: hegel.TestCase) -> None:
    amount = tc.draw(gs.floats(min_value=0, max_value=1000))
    per = tc.draw(gs.floats(min_value=0.1, max_value=1000))
    volume = tc.draw(gs.floats(min_value=0, max_value=10000))
    step = tc.draw(gs.sampled_from([0.1, 0.5, 1.0]))

    dose = dose_for_volume(amount, per, volume, step)

    exact = Decimal(str(amount)) * Decimal(str(volume)) / Decimal(str(per))
    steps = Decimal(str(dose)) / Decimal(str(step))
    assert steps == steps.to_integral_value()
    assert abs(Decimal(str(dose)) - exact) <= Decimal(str(step)) / 2


@hegel.test
def test_dose_for_volume_grows_with_volume(tc: hegel.TestCase) -> None:
    amount = tc.draw(gs.floats(min_value=0, max_value=100))
    per = tc.draw(gs.floats(min_value=1, max_value=500))
    small = tc.draw(gs.floats(min_value=0, max_value=1000))
    large = tc.draw(gs.floats(min_value=small, max_value=2000))
    assert dose_for_volume(amount, per, small) <= dose_for_volume(amount, per, large)


@hegel.composite
def conversations(tc: hegel.TestCase, index: int) -> Conversation:
    """A conversation with some text."""
    words = gs.text(alphabet="abcAB ", max_size=6)
    return Conversation(
        id=f"c{index}",
        source=Source.MCP,
        user_id=None,
        started=START,
        updated=START + timedelta(minutes=tc.draw(gs.integers(min_value=0, max_value=100))),
        title=tc.draw(words),
        summary=tc.draw(words),
        messages=tuple(Message(role="user", text=text) for text in tc.draw(gs.lists(words, max_size=3))),
    )


@hegel.test
def test_search_finds_exactly_the_matching_conversations(tc: hegel.TestCase) -> None:
    state = TankState()
    for index in range(tc.draw(gs.integers(min_value=0, max_value=5))):
        conversation = tc.draw(conversations(index))
        state.conversations[conversation.id] = conversation
    query = tc.draw(gs.text(alphabet="abAB", min_size=1, max_size=2))

    found = search_conversations(state, query)

    texts: dict[str, list[str]] = {
        item.id: [item.title, item.summary, *(message.text for message in item.messages)]
        for item in state.conversations.values()
    }
    expected = {key for key, values in texts.items() if any(query.lower() in value.lower() for value in values)}
    assert {item.id for item in found} == expected
    assert [item.updated for item in found] == sorted((item.updated for item in found), reverse=True)
