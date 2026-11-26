"""Examples for the records, history, proposals and conversations."""

from collections.abc import Callable
from dataclasses import replace
from datetime import UTC, datetime, timedelta
from typing import cast

import pytest

from custom_components.tankkeeper.domain import (
    CODE_LIFETIME,
    MAX_CODE_ATTEMPTS,
    MAX_CONVERSATION_MESSAGES,
    CodeExpiredError,
    CodeWrongError,
    Collection,
    Conversation,
    ConversationFullError,
    HistoryEntry,
    Message,
    NotFoundError,
    NothingToChangeError,
    NotYourProposalError,
    ProposalClosedError,
    ProposalState,
    Record,
    RecordChangedError,
    Source,
    TankState,
    TooManyAttemptsError,
    apply_changes,
    apply_proposal,
    changes_in_conversation,
    check_code,
    dose_for_volume,
    merge_record,
    plan_changes,
    propose,
    reject_proposal,
    save_conversation,
    search_conversations,
    undo_changes,
)

NOW = datetime(2026, 11, 26, 12, 0, tzinfo=UTC)
CODE = "ABC234"


def _state_with_proposal(*, user_id: str | None = "u1", conversation_id: str | None = "c1") -> TankState:
    state = TankState()
    propose(
        state,
        plan_changes(state, [(Collection.NOTES, "n1", {"text": "hello"})]),
        proposal_id="p1",
        code=CODE,
        now=NOW,
        source=Source.MCP,
        user_id=user_id,
        conversation_id=conversation_id,
        tool="add_note",
        summary="Add a note",
        reason="Because",
        evidence=None,
    )
    return state


def _apply(
    state: TankState,
    code: str = CODE,
    *,
    now: datetime = NOW,
    user_id: str | None = "u1",
    conversation_id: str | None = "c1",
) -> HistoryEntry:
    return apply_proposal(
        state,
        "p1",
        code,
        history_id="h1",
        now=now,
        source=Source.MCP,
        user_id=user_id,
        conversation_id=conversation_id,
    )


def _set(
    state: TankState, history_id: str, collection: Collection, record_id: str, after: Record | None
) -> HistoryEntry:
    return apply_changes(
        state,
        plan_changes(state, [(collection, record_id, after)]),
        history_id=history_id,
        now=NOW,
        source=Source.PANEL,
        conversation_id=None,
        summary=history_id,
    )


def test_plan_changes_leaves_out_records_already_there() -> None:
    state = TankState()
    _set(state, "h1", Collection.NOTES, "a", {"x": 1})

    changes = plan_changes(state, [(Collection.NOTES, "a", {"x": 1}), (Collection.NOTES, "b", {"y": 2})])

    assert [change.record_id for change in changes] == ["b"]
    assert changes[0].before is None


def test_plan_changes_with_nothing_new_raises() -> None:
    with pytest.raises(NothingToChangeError):
        plan_changes(TankState(), [(Collection.NOTES, "a", None)])


def test_apply_changes_deletes_a_record_set_to_none() -> None:
    state = TankState()
    _set(state, "h1", Collection.NOTES, "a", {"x": 1})

    entry = _set(state, "h2", Collection.NOTES, "a", None)

    assert state.get(Collection.NOTES, "a") is None
    assert entry.changes[0].before == {"x": 1}
    assert [item.id for item in state.history] == ["h1", "h2"]


def test_apply_changes_changes_nothing_when_one_record_moved_on() -> None:
    state = TankState()
    _set(state, "h1", Collection.NOTES, "a", {"x": 1})
    stale = plan_changes(state, [(Collection.NOTES, "b", {"y": 1}), (Collection.NOTES, "a", {"x": 2})])
    _set(state, "h2", Collection.NOTES, "a", {"x": 3})

    with pytest.raises(RecordChangedError):
        apply_changes(
            state, stale, history_id="h3", now=NOW, source=Source.PANEL, conversation_id=None, summary="stale"
        )

    assert state.get(Collection.NOTES, "b") is None
    assert len(state.history) == 2


def test_undo_changes_puts_records_back_in_reverse_order() -> None:
    state = TankState()
    _set(state, "h1", Collection.NOTES, "a", {"x": 1})
    entry = apply_changes(
        state,
        plan_changes(state, [(Collection.NOTES, "a", {"x": 2}), (Collection.NOTES, "b", {"y": 1})]),
        history_id="h2",
        now=NOW,
        source=Source.PANEL,
        conversation_id=None,
        summary="two",
    )

    undo = undo_changes(entry)
    apply_changes(state, undo, history_id="h3", now=NOW, source=Source.PANEL, conversation_id=None, summary="undo")

    assert [change.record_id for change in undo] == ["b", "a"]
    assert state.records[Collection.NOTES] == {"a": {"x": 1}}


def test_lookups_raise_not_found() -> None:
    state = TankState()
    with pytest.raises(NotFoundError):
        state.require(Collection.TANK, "tank")
    with pytest.raises(NotFoundError):
        state.history_entry("h1")
    with pytest.raises(NotFoundError):
        state.proposal("p1")
    with pytest.raises(NotFoundError):
        state.conversation("c1")


def test_require_returns_the_record() -> None:
    state = TankState()
    _set(state, "h1", Collection.TANK, "tank", {"name": "Tank"})
    assert state.require(Collection.TANK, "tank") == {"name": "Tank"}
    assert state.history_entry("h1").summary == "h1"


def test_apply_proposal_with_the_code_applies_it_once() -> None:
    state = _state_with_proposal()

    entry = _apply(state, " abc234 ")

    proposal = state.proposal("p1")
    assert state.get(Collection.NOTES, "n1") == {"text": "hello"}
    assert entry.proposal_id == "p1"
    assert entry.conversation_id == "c1"
    assert proposal.state is ProposalState.APPLIED
    assert proposal.history_id == "h1"
    assert proposal.decided == NOW
    with pytest.raises(ProposalClosedError):
        _apply(state)


def test_wrong_code_counts_attempts_until_locked() -> None:
    state = _state_with_proposal()
    for attempt in range(1, MAX_CODE_ATTEMPTS + 1):
        with pytest.raises(CodeWrongError):
            _apply(state, "ZZZZZZ")
        assert state.proposal("p1").failed_attempts == attempt

    with pytest.raises(TooManyAttemptsError):
        _apply(state)
    assert state.get(Collection.NOTES, "n1") is None


def test_code_expires() -> None:
    state = _state_with_proposal()
    with pytest.raises(CodeExpiredError):
        _apply(state, now=NOW + CODE_LIFETIME)
    _apply(state, now=NOW + CODE_LIFETIME - timedelta(seconds=1))


def test_code_works_only_for_the_person_and_conversation() -> None:
    state = _state_with_proposal()
    with pytest.raises(NotYourProposalError):
        _apply(state, user_id="u2")
    with pytest.raises(NotYourProposalError):
        _apply(state, conversation_id="c2")
    with pytest.raises(NotYourProposalError):
        _apply(state, conversation_id=None)
    assert state.proposal("p1").failed_attempts == 0


def test_proposal_without_conversation_works_from_any_conversation() -> None:
    state = _state_with_proposal(conversation_id=None)
    _apply(state, conversation_id="any")
    assert state.proposal("p1").state is ProposalState.APPLIED


def test_check_code_on_a_rejected_proposal() -> None:
    state = _state_with_proposal()
    rejected = reject_proposal(state, "p1", now=NOW, user_id="u1")
    assert rejected.state is ProposalState.REJECTED
    assert rejected.decided == NOW
    with pytest.raises(ProposalClosedError):
        check_code(rejected, CODE, now=NOW, user_id="u1", conversation_id="c1")
    with pytest.raises(ProposalClosedError):
        reject_proposal(state, "p1", now=NOW, user_id="u1")


def test_only_the_person_who_proposed_can_reject() -> None:
    state = _state_with_proposal()
    with pytest.raises(NotYourProposalError):
        reject_proposal(state, "p1", now=NOW, user_id="u2")
    assert state.proposal("p1").state is ProposalState.PENDING


def test_save_conversation_keeps_a_conversation_within_its_size() -> None:
    state = TankState()

    def save(count: int) -> Conversation:
        return save_conversation(
            state,
            conversation_id="c1",
            now=NOW,
            source=Source.MCP,
            user_id="u1",
            title=None,
            summary=None,
            messages=[Message(role="user", text="x")] * count,
        )

    assert len(save(MAX_CONVERSATION_MESSAGES - 1).messages) == MAX_CONVERSATION_MESSAGES - 1
    assert len(save(1).messages) == MAX_CONVERSATION_MESSAGES
    with pytest.raises(ConversationFullError):
        save(1)
    assert len(state.conversations["c1"].messages) == MAX_CONVERSATION_MESSAGES


def test_save_conversation_creates_then_appends() -> None:
    state = TankState()
    first = save_conversation(
        state,
        conversation_id="c1",
        now=NOW,
        source=Source.MCP,
        user_id="u1",
        title=None,
        summary=None,
        messages=[],
    )
    assert (first.title, first.summary, first.messages) == ("", "", ())

    later = NOW + timedelta(hours=1)
    second = save_conversation(
        state,
        conversation_id="c1",
        now=later,
        source=Source.ASSIST,
        user_id="u2",
        title="Algae",
        summary=None,
        messages=[Message(role="user", text="Green spots")],
    )
    third = save_conversation(
        state,
        conversation_id="c1",
        now=later,
        source=Source.ASSIST,
        user_id="u2",
        title=None,
        summary="Dosed less",
        messages=[Message(role="assistant", text="Cut the dose")],
    )

    assert second.started == NOW
    assert second.updated == later
    assert second.source is Source.MCP
    assert (third.title, third.summary) == ("Algae", "Dosed less")
    assert [message.text for message in third.messages] == ["Green spots", "Cut the dose"]


def _conversation(conversation_id: str, updated: datetime, title: str, *texts: str) -> Conversation:
    return Conversation(
        id=conversation_id,
        source=Source.MCP,
        user_id=None,
        started=NOW,
        updated=updated,
        title=title,
        summary="",
        messages=tuple(Message(role="user", text=text) for text in texts),
    )


def test_search_conversations_matches_any_text_newest_first() -> None:
    state = TankState()
    for conversation in (
        _conversation("old", NOW, "Algae"),
        _conversation("new", NOW + timedelta(days=1), "Plants", "some ALGAE here"),
        _conversation("none", NOW, "Fish"),
    ):
        state.conversations[conversation.id] = conversation

    assert [item.id for item in search_conversations(state, "algae")] == ["new", "old"]


def test_changes_in_conversation() -> None:
    state = TankState()
    apply_changes(
        state,
        plan_changes(state, [(Collection.NOTES, "a", {"x": 1})]),
        history_id="h1",
        now=NOW,
        source=Source.MCP,
        conversation_id="c1",
        summary="in",
    )
    _set(state, "h2", Collection.NOTES, "b", {"x": 1})
    assert [entry.id for entry in changes_in_conversation(state, "c1")] == ["h1"]


def test_merge_record_copies() -> None:
    current: Record = {"a": 1, "b": 2}
    merged = merge_record(current, {"b": 3})
    assert merged == {"a": 1, "b": 3}
    assert current == {"a": 1, "b": 2}


@pytest.mark.parametrize(
    ("amount", "per", "volume", "expected"),
    [(5, 100, 60, 3.0), (1, 40, 54, 1.4), (2.5, 50, 45, 2.3), (0, 10, 10, 0.0), (1, 10, 0, 0.0)],
)
def test_dose_for_volume(amount: float, per: float, volume: float, expected: float) -> None:
    assert dose_for_volume(amount, per, volume) == expected


def test_dose_for_volume_rounds_half_up() -> None:
    assert dose_for_volume(1, 20, 1) == 0.1
    assert dose_for_volume(1, 1, 1.25, step_ml=0.5) == 1.5


@pytest.mark.parametrize(
    ("amount", "per", "volume", "step"), [(-1, 1, 1, 0.1), (1, 0, 1, 0.1), (1, 1, -1, 0.1), (1, 1, 1, 0)]
)
def test_dose_for_volume_rejects_bad_input(amount: float, per: float, volume: float, step: float) -> None:
    with pytest.raises(ValueError, match="positive"):
        dose_for_volume(amount, per, volume, step)


def test_state_json_round_trip() -> None:
    state = _state_with_proposal()
    _apply(state)
    state.proposals["p2"] = replace(state.proposal("p1"), id="p2", state=ProposalState.PENDING, decided=None)
    save_conversation(
        state,
        conversation_id="c1",
        now=NOW,
        source=Source.MCP,
        user_id="u1",
        title="t",
        summary="s",
        messages=[Message(role="user", text="hi")],
    )

    assert TankState.from_json(state.to_json()) == state


def test_from_json_tolerates_a_missing_collection() -> None:
    data = TankState().to_json()
    data["records"] = {"notes": {"a": {"x": 1}}}
    state = TankState.from_json(data)
    assert state.records[Collection.TANK] == {}
    assert state.records[Collection.NOTES] == {"a": {"x": 1}}


def _first(data: Record, key: str) -> Record:
    return cast(list[Record], data[key])[0]


def _corrupt_summary(data: Record) -> None:
    _first(data, "history")["summary"] = 1


def _corrupt_changes(data: Record) -> None:
    _first(data, "history")["changes"] = "x"


def _corrupt_change(data: Record) -> None:
    _first(data, "history")["changes"] = ["x"]


def _corrupt_attempts(data: Record) -> None:
    _first(data, "proposals")["failed_attempts"] = "1"


def _corrupt_attempts_bool(data: Record) -> None:
    _first(data, "proposals")["failed_attempts"] = True


@pytest.mark.parametrize(
    "corrupt", [_corrupt_summary, _corrupt_changes, _corrupt_change, _corrupt_attempts, _corrupt_attempts_bool]
)
def test_from_json_rejects_wrong_types(corrupt: Callable[[Record], None]) -> None:
    state = _state_with_proposal()
    _apply(state)
    data = state.to_json()
    corrupt(data)

    with pytest.raises(TypeError):
        TankState.from_json(data)
