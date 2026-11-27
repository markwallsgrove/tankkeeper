"""Decisions end to end, through Home Assistant's LLM API: list, read, add, accept, replace and import."""

from homeassistant.util.json import JsonObjectType, JsonValueType
import pytest

from .common import Caller, apply, dict_of, list_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")]

CYCLING: dict[str, JsonValueType] = {
    "number": 2,
    "title": "Fishless cycle",
    "date": "2026-11-21",
    "status": "accepted",
    "decision": "Cycle the tank before fish go in.",
    "why": "Fish can't take ammonia.",
    "open": ["When to test"],
}
OLD_DOSE: dict[str, JsonValueType] = {
    "number": 9,
    "title": "Bio-CO2 dose",
    "date": "2026-11-23",
    "status": "replaced",
    "decision": "Dose 5 ml.",
    "why": "Label dose.",
    "replaced_by": 10,
}
NEW_DOSE: dict[str, JsonValueType] = {
    "number": 10,
    "title": "Bio-CO2 with a syringe",
    "date": "2026-11-25",
    "status": "accepted",
    "decision": "Dose 3.6 ml with a syringe.",
    "why": "Measured dose.",
}


async def _import(call: Caller, *decisions: dict[str, JsonValueType]) -> JsonObjectType:
    return await apply(call, await call.ok("import_decisions", decisions=list(decisions), reason="From the repo"))


async def _list(call: Caller, **args: JsonValueType) -> list[JsonObjectType]:
    return [dict_of(item) for item in list_of((await call.ok("list_decisions", **args))["decisions"])]


async def test_import_decisions_is_a_proposal_that_keeps_every_field(call: Caller) -> None:
    proposal = await call.ok("import_decisions", decisions=[NEW_DOSE, OLD_DOSE, CYCLING], reason="From the repo")

    assert proposal["summary"] == "Import 3 decisions"
    assert await _list(call) == []
    await apply(call, proposal)

    assert await _list(call) == [
        {"number": 2, "title": "Fishless cycle", "date": "2026-11-21", "status": "accepted", "replaced_by": None},
        {"number": 9, "title": "Bio-CO2 dose", "date": "2026-11-23", "status": "replaced", "replaced_by": 10},
        {
            "number": 10,
            "title": "Bio-CO2 with a syringe",
            "date": "2026-11-25",
            "status": "accepted",
            "replaced_by": None,
        },
    ]
    assert await call.ok("get_decision", number=2) == {**CYCLING, "replaced_by": None, "replaces": []}
    assert await call.ok("get_decision", number=10) == {**NEW_DOSE, "open": [], "replaced_by": None, "replaces": [9]}
    assert [item["number"] for item in await _list(call, status="accepted")] == [2, 10]


async def test_importing_the_same_decisions_again_changes_nothing(call: Caller) -> None:
    await _import(call, CYCLING)

    error = await call.error("import_decisions", decisions=[CYCLING], reason="Again")

    assert error == "nothing_to_change"


async def test_importing_a_changed_decision_updates_it_and_keeps_the_old_text(call: Caller) -> None:
    await _import(call, CYCLING)

    await _import(call, {**CYCLING, "decision": "Cycle for six weeks."})

    assert dict_of(await call.ok("get_decision", number=2))["decision"] == "Cycle for six weeks."
    history = list_of((await call.ok("get_history", collection="decisions", record_id="0002"))["history"])
    assert len(history) == 2


async def test_import_checks_the_decisions(call: Caller) -> None:
    replaced_alone = {**OLD_DOSE, "replaced_by": None}
    pointing_nowhere = {**OLD_DOSE, "replaced_by": 11}
    replaced_by_itself = {**OLD_DOSE, "replaced_by": 9}
    replaced_by_an_earlier_one = {**OLD_DOSE, "replaced_by": 2}
    accepted_but_replaced = {**NEW_DOSE, "replaced_by": 2}
    bad_date = {**CYCLING, "date": "21 Nov"}

    cases: list[list[JsonValueType]] = [
        [replaced_alone],
        [pointing_nowhere],
        [replaced_by_itself],
        [replaced_by_an_earlier_one, CYCLING],
        [accepted_but_replaced, CYCLING],
        [CYCLING, CYCLING],
        [bad_date],
    ]
    for decisions in cases:
        assert await call.error("import_decisions", decisions=decisions, reason="x") == "invalid_input"


async def test_import_can_point_at_a_stored_decision(call: Caller) -> None:
    await _import(call, NEW_DOSE)

    await _import(call, OLD_DOSE)

    assert dict_of(await call.ok("get_decision", number=10))["replaces"] == [9]


async def test_add_numbers_the_decision_and_waits_for_a_yes(call: Caller) -> None:
    await _import(call, CYCLING)

    proposal = await call.ok(
        "set_decision",
        action="add",
        title="Water changes",
        decision="25% every week.",
        why="Keeps nitrate down.",
        open=["Which day"],
        reason="Agreed in chat",
    )

    assert proposal["summary"] == "Add decision 0003: Water changes"
    await apply(call, proposal)
    assert await call.ok("get_decision", number=3) == {
        "number": 3,
        "title": "Water changes",
        "date": "2026-11-26",
        "status": "proposed",
        "decision": "25% every week.",
        "why": "Keeps nitrate down.",
        "open": ["Which day"],
        "replaced_by": None,
        "replaces": [],
    }


async def test_the_first_decision_is_number_one(call: Caller) -> None:
    proposal = await call.ok(
        "set_decision",
        action="add",
        title="Plan in Home Assistant",
        decision="Keep the plan here.",
        why="One place.",
        status="accepted",
        date="2026-11-20",
        reason="Setup",
    )
    await apply(call, proposal)

    [only] = await _list(call)
    assert only == {
        "number": 1,
        "title": "Plan in Home Assistant",
        "date": "2026-11-20",
        "status": "accepted",
        "replaced_by": None,
    }


async def test_a_new_decision_can_replace_older_ones(call: Caller) -> None:
    await _import(call, CYCLING)

    proposal = await call.ok(
        "set_decision",
        action="add",
        title="Cycle with Dr Tim's",
        decision="Dose bottled ammonia.",
        why="Known dose.",
        status="accepted",
        replaces=[2],
        reason="Better method",
    )
    assert proposal["summary"] == "Add decision 0003: Cycle with Dr Tim's, replacing 0002"
    await apply(call, proposal)

    assert dict_of(await call.ok("get_decision", number=2))["status"] == "replaced"
    assert dict_of(await call.ok("get_decision", number=2))["replaced_by"] == 3
    assert dict_of(await call.ok("get_decision", number=3))["replaces"] == [2]


async def test_accept_a_proposed_decision(call: Caller) -> None:
    await _import(call, {**CYCLING, "status": "proposed"})

    proposal = await call.ok("set_decision", action="accept", number=2, reason="Owner agreed")

    assert proposal["summary"] == "Accept decision 0002: Fishless cycle"
    await apply(call, proposal)
    assert dict_of(await call.ok("get_decision", number=2))["status"] == "accepted"
    assert await call.error("set_decision", action="accept", number=2, reason="Again") == "invalid_input"


async def test_replace_a_decision_with_another(call: Caller) -> None:
    await _import(call, {**OLD_DOSE, "status": "accepted", "replaced_by": None}, NEW_DOSE)

    proposal = await call.ok("set_decision", action="replace", number=9, replaced_by=10, reason="Syringe")

    assert proposal["summary"] == "Replace decision 0009 with 0010"
    await apply(call, proposal)
    decision = await call.ok("get_decision", number=9)
    assert (decision["status"], decision["replaced_by"]) == ("replaced", 10)
    assert await call.error("set_decision", action="accept", number=9, reason="Back") == "invalid_input"
    assert await call.error("set_decision", action="replace", number=9, replaced_by=10, reason="x") == "invalid_input"


async def test_set_decision_checks_its_input(call: Caller) -> None:
    await _import(call, CYCLING, {**OLD_DOSE, "status": "accepted", "replaced_by": None})

    for args in (
        {"action": "add", "title": "No text", "reason": "x"},
        {"action": "add", "title": "T", "decision": "D", "why": "W", "date": "soon", "reason": "x"},
        {"action": "accept", "reason": "x"},
        {"action": "replace", "number": 2, "reason": "x"},
        {"action": "replace", "number": 2, "replaced_by": 2, "reason": "x"},
        {"action": "replace", "number": 9, "replaced_by": 2, "reason": "x"},
    ):
        assert await call.error("set_decision", **args) == "invalid_input"
    assert await call.error("set_decision", action="accept", number=7, reason="x") == "not_found"
    new = {"title": "T", "decision": "D", "why": "W", "reason": "x"}
    assert await call.error("set_decision", action="add", replaces=[7], **new) == "not_found"
    assert await call.error("set_decision", action="replace", number=2, replaced_by=7, reason="x") == "not_found"
    assert await call.error("get_decision", number=7) == "not_found"


async def test_decisions_keep_their_history(call: Caller) -> None:
    await _import(call, {**CYCLING, "status": "proposed"})
    await apply(call, await call.ok("set_decision", action="accept", number=2, reason="Owner agreed"))

    history = list_of((await call.ok("get_history", collection="decisions", record_id="0002"))["history"])

    assert [dict_of(entry)["summary"] for entry in history] == [
        "Accept decision 0002: Fishless cycle",
        "Import 1 decision",
    ]
