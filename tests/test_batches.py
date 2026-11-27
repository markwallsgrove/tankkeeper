"""Batches and setup through the tools: many changes in one proposal, one code, one undo."""

from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from homeassistant.util.json import JsonObjectType
import pytest

from custom_components.tankkeeper.domain import BATCH_IDLE, BATCH_MAX_AGE

from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")

TODAY = "todo.tankkeeper_today"
WAITING = "sensor.nano_proposals_waiting"


async def _conversation(call: Caller) -> str:
    return str_of((await call.ok("save_conversation", title="Setup"))["conversation_id"])


async def _batch(call: Caller, conversation_id: str) -> JsonObjectType:
    return await call.ok(
        "start_batch", summary="Tidy the records", reason="Owner's notes", conversation_id=conversation_id
    )


def _changes(proposal: JsonObjectType) -> list[JsonObjectType]:
    return [dict_of(item) for item in list_of(proposal["changes"])]


async def test_changes_in_a_batch_build_one_proposal(call: Caller) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    assert batch["batch"] is True
    assert batch["setup"] is False
    assert batch["changes"] == []
    assert batch["steps"] == []
    code = batch["code"]

    first = await call.ok("set_tank", name="Big", reason="Rename", conversation_id=conversation_id)
    second = await call.ok("set_tank", temperature_c=24, reason="Shrimp", conversation_id=conversation_id)
    third = await call.ok("set_water", ph=7.2, reason="Tap", evidence="Water report", conversation_id=conversation_id)

    for proposal in (first, second, third):
        assert proposal["proposal_id"] == batch["proposal_id"]
        assert proposal["code"] == code
    tank_changes = [change for change in _changes(third) if change["collection"] == "tank"]
    assert len(tank_changes) == 1
    after = dict_of(tank_changes[0]["after"])
    assert after["name"] == "Big"
    assert after["temperature_c"] == 24
    assert dict_of(tank_changes[0]["before"])["name"] == "Nano"
    assert [dict_of(step)["tool"] for step in list_of(third["steps"])] == ["set_tank", "set_tank", "set_water"]
    assert [dict_of(step)["reason"] for step in list_of(third["steps"])] == ["Rename", "Shrimp", "Tap"]
    assert [dict_of(step).get("evidence") for step in list_of(third["steps"])] == [None, None, "Water report"]

    tank = await call.ok("get_tank")
    assert dict_of(tank["tank"])["name"] == "Nano"
    assert tank["proposals_waiting"] == 1
    listed = list_of((await call.ok("list_proposals"))["proposals"])
    assert len(listed) == 1
    assert dict_of(listed[0])["batch"] is True
    assert len(list_of(dict_of(listed[0])["steps"])) == 3
    assert "code" not in dict_of(listed[0])


async def test_a_batch_applies_with_one_code_and_undoes_as_one(call: Caller) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    await call.ok("set_tank", name="Big", reason="Rename", conversation_id=conversation_id)
    added = await call.ok("add_product", name="Easy Green", reason="Fertiliser", conversation_id=conversation_id)
    product_id = next(str_of(change["record_id"]) for change in _changes(added) if change["collection"] == "products")
    await call.ok(
        "update_product", product_id=product_id, purpose="Plants", reason="Label", conversation_id=conversation_id
    )

    applied = await call.ok(
        "apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id
    )

    history = dict_of(applied["history"])
    assert history["summary"] == "Tidy the records"
    assert len(list_of(history["changes"])) == 2
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Big"
    products = list_of((await call.ok("list_products"))["products"])
    assert [(dict_of(item)["name"], dict_of(item)["purpose"]) for item in products] == [("Easy Green", "Plants")]

    undo = await call.ok("undo_change", history_id=history["id"], reason="Wrong tank")
    assert len(_changes(undo)) == 2
    await apply(call, undo)
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Nano"
    assert (await call.ok("list_products"))["products"] == []


async def test_a_change_that_puts_a_record_back_leaves_the_batch(call: Caller) -> None:
    conversation_id = await _conversation(call)
    await _batch(call, conversation_id)
    await call.ok("set_tank", name="Big", reason="Rename", conversation_id=conversation_id)
    back = await call.ok("set_tank", name="Nano", reason="Keep the name", conversation_id=conversation_id)
    assert back["changes"] == []
    assert await call.error("set_tank", name="Nano", reason="Again", conversation_id=conversation_id) == (
        "nothing_to_change"
    )


async def test_a_batch_applies_in_full_or_not_at_all(call: Caller) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    await call.ok("set_tank", name="Big", reason="Rename", conversation_id=conversation_id)
    await call.ok("set_water", ph=7.2, reason="Tap", conversation_id=conversation_id)
    elsewhere = await call.ok("set_water", ph=6.8, reason="New report")
    await apply(call, elsewhere)

    assert (
        await call.error(
            "apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id
        )
        == "record_changed"
    )
    tank = await call.ok("get_tank")
    assert dict_of(tank["tank"])["name"] == "Nano"
    assert dict_of(tank["water"])["ph"] == 6.8


async def test_other_conversations_and_records_stay_out_of_the_batch(call: Caller) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    other = await call.ok("set_tank", name="Other", reason="Rename", conversation_id=await _conversation(call))
    plain = await call.ok("set_tank", name="Plain", reason="Rename")
    someone = await Caller(call.hass, user_id="u2").ok(
        "set_tank", name="Theirs", reason="Rename", conversation_id=conversation_id
    )
    recorded = await call.ok("record_test", values={"ammonia": 0}, conversation_id=conversation_id)

    assert {other["proposal_id"], plain["proposal_id"], someone["proposal_id"]}.isdisjoint({batch["proposal_id"]})
    for proposal in (other, plain, someone):
        assert proposal["batch"] is False
    assert recorded["recorded"] is True
    assert dict_of(await call.ok("get_batch", conversation_id=conversation_id))["changes"] == []


async def test_the_code_lasts_while_the_batch_keeps_changing(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    step = BATCH_IDLE - timedelta(minutes=1)
    for index in range(3):
        freezer.tick(step)
        added = await call.ok(
            "add_note", kind="question", topic="Light", text=f"note {index}", conversation_id=conversation_id
        )
        assert added["recorded"] is True
        proposal = await call.ok("set_tank", notes=f"Note {index}", reason="Notes", conversation_id=conversation_id)
        assert proposal["code_expires"] == (dt_util.utcnow() + BATCH_IDLE).isoformat()
    freezer.tick(step)
    await call.ok("apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id)


async def test_an_idle_batch_expires_and_starting_again_carries_it(
    call: Caller, freezer: FrozenDateTimeFactory
) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    await call.ok("set_tank", name="Big", reason="Rename", conversation_id=conversation_id)
    freezer.tick(BATCH_IDLE)

    assert await call.error(
        "apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id
    ) == ("code_expired")
    assert await call.error("set_water", ph=7, reason="Tap", conversation_id=conversation_id) == "batch_expired"
    stale = await call.ok("get_batch", conversation_id=conversation_id)
    assert stale["open"] is False
    assert "code" not in stale

    renewed = await _batch(call, conversation_id)
    assert renewed["proposal_id"] != batch["proposal_id"]
    assert renewed["code"] != batch["code"]
    assert [dict_of(change["after"])["name"] for change in _changes(renewed)] == ["Big"]
    every = list_of((await call.ok("list_proposals", state="all"))["proposals"])
    assert [dict_of(item)["state"] for item in every] == ["pending", "rejected"]
    await call.ok(
        "apply_change", proposal_id=renewed["proposal_id"], code=renewed["code"], conversation_id=conversation_id
    )
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Big"


async def test_a_batch_ends_at_its_maximum_age(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    step = timedelta(minutes=10)
    for index in range(BATCH_MAX_AGE // step - 1):
        freezer.tick(step)
        await call.ok("set_tank", notes=f"Note {index}", reason="Notes", conversation_id=conversation_id)
    latest = await call.ok("get_batch", conversation_id=conversation_id)
    assert latest["code_expires"] == "2026-11-26T14:00:00+00:00"
    freezer.tick(step)
    assert await call.error(
        "apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id
    ) == ("code_expired")


async def test_start_batch_needs_a_conversation_and_returns_the_open_one(call: Caller) -> None:
    assert await call.error("start_batch", summary="s", reason="r") == "invalid_input"
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    assert (await _batch(call, conversation_id))["proposal_id"] == batch["proposal_id"]
    assert await call.error("start_setup", conversation_id=conversation_id) == "batch_open"


async def test_get_batch_needs_a_batch(call: Caller) -> None:
    conversation_id = await _conversation(call)
    assert await call.error("get_batch", conversation_id=conversation_id) == "not_found"
    assert await call.error("get_batch") == "not_found"


async def test_an_empty_batch_does_not_apply(call: Caller) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    assert await call.error(
        "apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id
    ) == ("nothing_to_change")
    rejected = await call.ok("reject_change", proposal_id=batch["proposal_id"])
    assert rejected["rejected"] is True
    assert await call.error("get_batch", conversation_id=conversation_id) == "not_found"


async def test_setup_fills_one_draft(call: Caller) -> None:
    conversation_id = await _conversation(call)
    tank = await call.ok("get_tank")
    assert tank["empty"] is True

    draft = await call.ok("start_setup", conversation_id=conversation_id)
    assert draft["setup"] is True
    assert draft["summary"] == "Set up Nano"
    assert draft["still_empty"] == ["products", "contents", "tasks", "series", "lights", "decisions"]

    await call.ok("set_tank", temperature_c=24, reason="Shrimp", conversation_id=conversation_id)
    await call.ok("add_product", name="Easy Green", reason="Fertiliser", conversation_id=conversation_id)
    task = await call.ok("add_task", text="Easy Green 2 ml", reason="Weekly dose", conversation_id=conversation_id)
    task_id = next(str_of(change["record_id"]) for change in _changes(task) if change["collection"] == "tasks")
    assert dict_of(next(change for change in _changes(task) if change["collection"] == "tasks")["after"])["slot"] == (
        "dose"
    )
    await call.ok(
        "update_task", task_id=task_id, note="Before lights on", reason="Timing", conversation_id=conversation_id
    )
    await call.ok(
        "set_decision",
        action="add",
        title="Dosing",
        decision="Easy Green weekly",
        why="Low tech",
        reason="Setup",
        conversation_id=conversation_id,
    )
    await call.ok(
        "set_decision",
        action="add",
        title="Lights",
        decision="Six hours",
        why="Algae",
        reason="Setup",
        conversation_id=conversation_id,
    )

    read_back = await call.ok("get_batch", conversation_id=conversation_id)
    assert read_back["open"] is True
    assert read_back["code"] == draft["code"]
    assert read_back["still_empty"] == ["contents", "series", "lights"]
    assert len(list_of(read_back["steps"])) == 6
    assert (await call.ok("get_tank"))["empty"] is True

    await call.ok("apply_change", proposal_id=draft["proposal_id"], code=draft["code"], conversation_id=conversation_id)
    decisions = list_of((await call.ok("list_decisions"))["decisions"])
    assert [dict_of(item)["number"] for item in decisions] in ([1, 2], [2, 1])
    plan = await call.ok("get_plan")
    assert [dict_of(item)["note"] for item in list_of(plan["tasks"])] == ["Before lights on"]
    assert (await call.ok("get_tank"))["empty"] is False
    assert await call.error("start_setup", conversation_id=await _conversation(call)) == "tank_not_empty"


async def test_get_batch_reads_back_a_plain_batch(call: Caller) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    read_back = await call.ok("get_batch", conversation_id=conversation_id)
    assert read_back["proposal_id"] == batch["proposal_id"]
    assert "still_empty" not in read_back


async def test_entities_show_the_stored_records_while_a_batch_waits(call: Caller, hass: HomeAssistant) -> None:
    conversation_id = await _conversation(call)
    batch = await _batch(call, conversation_id)
    await call.ok("add_task", text="Water change", reason="Weekly", conversation_id=conversation_id)
    await call.ok("add_task", text="Clean the glass", reason="Algae", conversation_id=conversation_id)
    await hass.async_block_till_done()
    today = hass.states.get(TODAY)
    assert today is not None
    assert today.state == "0"
    waiting = hass.states.get(WAITING)
    assert waiting is not None
    assert waiting.state == "1"

    await call.ok("apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id)
    await hass.async_block_till_done()
    today = hass.states.get(TODAY)
    assert today is not None
    assert today.state == "2"
