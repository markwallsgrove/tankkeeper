"""The tools end to end: through Home Assistant's LLM API, into storage and back."""

from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers.llm import LLM_API_ASSIST
from homeassistant.util.json import JsonValueType
import pytest

from custom_components.tankkeeper.domain import (
    CODE_LIFETIME,
    DELETED_CONVERSATION,
    MAX_CODE_ATTEMPTS,
    MAX_CONVERSATION_MESSAGES,
    NO_DELETE,
)

from .common import Caller, dict_of, list_of, str_of

pytestmark = pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")


async def _conversation(call: Caller, title: str = "Algae") -> str:
    return str_of((await call.ok("save_conversation", title=title))["conversation_id"])


async def _product(call: Caller, name: str = "Easy Green", **args: float | str) -> str:
    proposal = await call.ok("add_product", name=name, reason="New fertiliser", **args)
    applied = await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"])
    change = dict_of(list_of(dict_of(applied["history"])["changes"])[0])
    return str_of(change["record_id"])


async def _content(call: Caller, name: str = "Java fern") -> str:
    return str_of((await call.ok("add_content", type="plant", name=name, count=2))["record_id"])


async def test_get_tank_shows_the_set_up_tank(call: Caller) -> None:
    tank = await call.ok("get_tank")

    assert tank["tank"] == {
        "name": "Nano",
        "volume_litres": 60,
        "dosing_volume_litres": 54,
        "temperature_c": None,
        "notes": "",
    }
    assert tank["water"] is None
    assert dict_of(tank["counts"])["tank"] == 1
    assert tank["proposals_waiting"] == 0


async def test_set_tank_changes_nothing_until_applied(call: Caller) -> None:
    proposal = await call.ok("set_tank", temperature_c=25, reason="Target for the shrimp", evidence="Note 3")

    assert proposal["state"] == "pending"
    assert proposal["evidence"] == "Note 3"
    assert len(str_of(proposal["code"])) == 6
    assert "code_expires" in proposal
    assert dict_of((await call.ok("get_tank"))["tank"])["temperature_c"] is None
    assert (await call.ok("get_tank"))["proposals_waiting"] == 1

    applied = await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=str_of(proposal["code"]).lower())

    assert applied["applied"] is True
    assert dict_of((await call.ok("get_tank"))["tank"])["temperature_c"] == 25
    assert await call.error("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"]) == (
        "proposal_closed"
    )


async def test_set_tank_with_the_same_values_is_refused(call: Caller) -> None:
    assert await call.error("set_tank", name="Nano", reason="Same") == "nothing_to_change"


async def test_set_water_creates_the_water_record(call: Caller) -> None:
    proposal = await call.ok("set_water", source="supplier", ph=7.4, gh="12", reason="Supplier report")
    await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"])

    assert (await call.ok("get_tank"))["water"] == {"source": "supplier", "ph": 7.4, "gh": 12.0}


async def test_schema_errors_come_back_as_invalid_input(call: Caller) -> None:
    assert await call.error("set_water", ph=15, reason="Bad") == "invalid_input"
    assert await call.error("set_tank", name="X") == "invalid_input"
    assert await call.error("record_dose", product="x", amount_ml=0) == "invalid_input"


async def test_wrong_codes_lock_the_proposal(call: Caller) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    for _ in range(MAX_CODE_ATTEMPTS):
        assert await call.error("apply_change", proposal_id=proposal["proposal_id"], code="ZZZZZZ") == "code_wrong"

    assert await call.error("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"]) == (
        "too_many_attempts"
    )


async def test_codes_expire(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    freezer.tick(timedelta(minutes=15))

    assert await call.error("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"]) == (
        "code_expired"
    )


async def test_only_the_proposer_can_apply(hass: HomeAssistant, call: Caller) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    other = Caller(hass, user_id="u2")

    assert await other.error("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"]) == (
        "not_your_proposal"
    )


async def test_proposal_in_a_conversation_applies_only_there(call: Caller) -> None:
    first = await _conversation(call)
    second = await _conversation(call, "Other")
    proposal = await call.ok("set_tank", name="Big", reason="Rename", conversation_id=first)

    assert await call.error(
        "apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"], conversation_id=second
    ) == ("not_your_proposal")
    assert await call.error("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"]) == (
        "not_your_proposal"
    )
    await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"], conversation_id=first)


async def test_reject_and_list_proposals(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    first = await call.ok("set_tank", name="One", reason="Rename")
    freezer.tick(timedelta(seconds=1))
    second = await call.ok("set_tank", name="Two", reason="Rename")

    rejected = await call.ok("reject_change", proposal_id=first["proposal_id"])

    assert rejected["rejected"] is True
    assert dict_of(rejected["proposal"])["state"] == "rejected"
    assert "code" not in dict_of(rejected["proposal"])
    pending = list_of((await call.ok("list_proposals"))["proposals"])
    assert [dict_of(item)["proposal_id"] for item in pending] == [second["proposal_id"]]
    assert all("code" not in dict_of(item) for item in pending)
    every = list_of((await call.ok("list_proposals", state="all"))["proposals"])
    assert [dict_of(item)["proposal_id"] for item in every] == [second["proposal_id"], first["proposal_id"]]
    assert len(list_of((await call.ok("list_proposals", state="all", limit=1))["proposals"])) == 1
    assert await call.error("reject_change", proposal_id=first["proposal_id"]) == "proposal_closed"
    assert await call.error("reject_change", proposal_id="missing") == "not_found"


async def test_get_log_orders_times_with_different_offsets(call: Caller) -> None:
    later = await call.ok("record_test", values={"nitrate": 10}, time="2026-11-26T10:00:00+00:00")
    earlier = await call.ok("record_test", values={"nitrate": 20}, time="2026-11-26T10:30:00+01:00")

    entries = list_of((await call.ok("get_log"))["entries"])

    assert [dict_of(entry)["id"] for entry in entries] == [later["record_id"], earlier["record_id"]]
    assert dict_of(entries[1])["time"] == "2026-11-26T09:30:00+00:00"


async def test_only_the_person_who_proposed_can_reject(hass: HomeAssistant, call: Caller) -> None:
    proposal = await call.ok("set_tank", name="One", reason="Rename")

    assert await Caller(hass, user_id="u2").error("reject_change", proposal_id=proposal["proposal_id"]) == (
        "not_your_proposal"
    )
    assert (await call.ok("get_tank"))["proposals_waiting"] == 1


@pytest.mark.parametrize(
    "details", [{"dosing_volume_litres": 61}, {"volume_litres": 50}, {"volume_litres": 40, "dosing_volume_litres": 45}]
)
async def test_set_tank_keeps_the_dosing_volume_within_the_tank(call: Caller, details: dict[str, float]) -> None:
    assert await call.error("set_tank", reason="Measured", **details) == "invalid_input"
    assert (await call.ok("get_tank"))["proposals_waiting"] == 0


async def test_record_test_rejects_a_ph_above_14(call: Caller) -> None:
    assert await call.error("record_test", values={"ph": 14.5}) == "invalid_input"


async def test_undo_change_puts_the_record_back(call: Caller) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    applied = await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"])

    undo = await call.ok("undo_change", history_id=dict_of(applied["history"])["id"], reason="Wrong name")
    assert undo["summary"] == "Undo: Change the tank details"
    await call.ok("apply_change", proposal_id=undo["proposal_id"], code=undo["code"])

    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Nano"
    assert await call.error("undo_change", history_id="missing", reason="x") == "not_found"


async def test_undo_after_a_later_change_is_refused_when_applied(call: Caller) -> None:
    first = await call.ok("set_tank", name="Big", reason="Rename")
    applied = await call.ok("apply_change", proposal_id=first["proposal_id"], code=first["code"])
    undo = await call.ok("undo_change", history_id=dict_of(applied["history"])["id"], reason="Wrong name")
    second = await call.ok("set_tank", name="Bigger", reason="Rename again")
    await call.ok("apply_change", proposal_id=second["proposal_id"], code=second["code"])

    assert await call.error("apply_change", proposal_id=undo["proposal_id"], code=undo["code"]) == "record_changed"
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Bigger"


async def test_record_dose_by_name_or_id(call: Caller) -> None:
    product_id = await _product(call)

    by_name = await call.ok("record_dose", product="easy green", amount_ml=1.5, why="Weekly")
    await call.ok("record_dose", product=product_id, amount_ml=2, time="2026-11-25T08:00:00+00:00")

    assert by_name["recorded"] is True
    log = list_of((await call.ok("get_log"))["entries"])
    assert [dict_of(entry)["amount_ml"] for entry in log] == [1.5, 2.0]
    newest = dict_of(log[0])
    assert newest["product_id"] == product_id
    assert newest["product"] == "Easy Green"
    assert newest["time"] == "2026-11-26T12:00:00+00:00"
    assert newest["why"] == "Weekly"


async def test_record_dose_needs_one_matching_product(call: Caller) -> None:
    assert await call.error("record_dose", product="Missing", amount_ml=1) == "invalid_input"
    await _product(call, "Twin")
    await _product(call, "twin")
    assert await call.error("record_dose", product="TWIN", amount_ml=1) == "invalid_input"


async def test_record_test_and_filter_the_log(call: Caller) -> None:
    await _product(call)
    await call.ok("record_dose", product="Easy Green", amount_ml=1, time="2026-11-20T08:00:00+00:00")
    await call.ok("record_test", values={"nitrate": 10, "ph": "7.2"}, time="2026-11-21T08:00")
    await call.ok("record_test", values={"kh": 4}, source="tap")

    tests = list_of((await call.ok("get_log", kind="test"))["entries"])
    assert [dict_of(entry)["source"] for entry in tests] == ["tap", "tank"]
    assert dict_of(tests[1])["values"] == {"nitrate": 10.0, "ph": 7.2}
    window = list_of((await call.ok("get_log", since="2026-11-21", until="2026-11-22T00:00:00Z"))["entries"])
    assert [dict_of(entry)["kind"] for entry in window] == ["test"]
    assert len(list_of((await call.ok("get_log", limit=1))["entries"])) == 1
    assert await call.error("get_log", since="yesterday") == "invalid_input"


async def test_record_test_needs_a_value(call: Caller) -> None:
    assert await call.error("record_test", values={}) == "invalid_input"


async def test_contents_add_change_and_remove(call: Caller) -> None:
    fern = await _content(call)
    await _content(call, "Moss")

    change = await call.ok("update_content", content_id=fern, count=3, added="2026-11-01", reason="Split it")
    await call.ok("apply_change", proposal_id=change["proposal_id"], code=change["code"])
    removal = await call.ok("remove_content", content_id=fern, reason="Melted")
    assert removal["summary"] == "Remove Java fern"
    await call.ok("apply_change", proposal_id=removal["proposal_id"], code=removal["code"])

    current = list_of((await call.ok("list_contents"))["contents"])
    assert [dict_of(item)["name"] for item in current] == ["Moss"]
    every = {
        str_of(dict_of(item)["id"]): dict_of(item)
        for item in list_of((await call.ok("list_contents", include_removed=True))["contents"])
    }
    assert every[fern]["count"] == 3
    assert every[fern]["added"] == "2026-11-01"
    assert every[fern]["removed"] == "2026-11-26"


async def test_contents_dates_must_be_dates(call: Caller) -> None:
    fern = await _content(call)
    assert await call.error("add_content", type="rock", name="Seiryu", added="soon") == "invalid_input"
    assert await call.error("update_content", content_id=fern, added="soon", reason="x") == "invalid_input"
    assert await call.error("remove_content", content_id="missing", reason="x") == "not_found"


async def test_update_content_without_a_date(call: Caller) -> None:
    fern = await _content(call)
    change = await call.ok("update_content", content_id=fern, where="Left", reason="Moved")
    assert dict_of(list_of(change["changes"])[0])["after"] == {
        "type": "plant",
        "name": "Java fern",
        "count": 2,
        "where": "Left",
        "added": "2026-11-26",
        "removed": None,
        "notes": "",
    }


async def test_products_with_label_doses(call: Caller) -> None:
    product_id = await _product(
        call, label_amount_ml=5, label_per_litres=100, label_frequency="weekly", purpose="All in one"
    )
    await _product(call, "Plain")

    change = await call.ok(
        "update_product", product_id=product_id, name="Easy Green+", label_amount_ml=10, reason="New label"
    )
    await call.ok("apply_change", proposal_id=change["proposal_id"], code=change["code"])

    products = {
        str_of(dict_of(item)["name"]): dict_of(item) for item in list_of((await call.ok("list_products"))["products"])
    }
    assert products["Easy Green+"]["label_dose"] == {"amount_ml": 10.0, "per_litres": 100.0, "frequency": "weekly"}
    assert products["Easy Green+"]["label_dose_for_tank_ml"] == 5.4
    assert products["Easy Green+"]["purpose"] == "All in one"

    frequency = await call.ok("update_product", product_id=product_id, label_frequency="daily", reason="New label")
    await call.ok("apply_change", proposal_id=frequency["proposal_id"], code=frequency["code"])
    product = next(
        dict_of(item)
        for item in list_of((await call.ok("list_products"))["products"])
        if dict_of(item)["id"] == product_id
    )
    assert product["label_dose"] == {"amount_ml": 10.0, "per_litres": 100.0, "frequency": "daily"}
    assert "label_dose_for_tank_ml" not in products["Plain"]


async def test_label_dose_needs_amount_and_volume(call: Caller) -> None:
    assert await call.error("add_product", name="Half", label_amount_ml=5, reason="x") == "invalid_input"
    assert await call.error("update_product", product_id="missing", name="x", reason="x") == "not_found"


async def test_notes(call: Caller) -> None:
    await call.ok("add_note", kind="question", topic="CO2", text="Is it needed?", how_to_resolve="Ask the shop")
    notes = list_of((await call.ok("list_notes"))["notes"])
    assert dict_of(notes[0])["topic"] == "CO2"


@pytest.mark.parametrize(
    "args",
    [
        {"messages": [{"role": "user", "text": "x"}] * 21},
        {"messages": [{"role": "user", "text": "x" * 2001}]},
        {"title": "x" * 201},
        {"summary": "x" * 4001},
    ],
)
async def test_save_conversation_limits_what_one_call_saves(call: Caller, args: dict[str, JsonValueType]) -> None:
    assert await call.error("save_conversation", **args) == "invalid_input"


async def test_save_conversation_stops_when_the_conversation_is_full(call: Caller) -> None:
    conversation_id = await _conversation(call)
    batch: list[JsonValueType] = [{"role": "user", "text": "x"}] * 20
    for _ in range(MAX_CONVERSATION_MESSAGES // 20):
        await call.ok("save_conversation", conversation_id=conversation_id, messages=batch)

    full = await call.error("save_conversation", conversation_id=conversation_id, messages=batch[:1])

    assert full == "conversation_full"


async def test_conversations_hold_messages_and_changes(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    conversation_id = await _conversation(call, "Algae on glass")
    await call.ok("add_note", kind="assumption", topic="Light", text="8 hours", conversation_id=conversation_id)
    freezer.tick(timedelta(minutes=1))
    saved = await call.ok(
        "save_conversation",
        conversation_id=conversation_id,
        summary="Cut the light",
        messages=[{"role": "user", "text": "Green dust on the glass"}, {"role": "assistant", "text": "Shorter light"}],
    )
    freezer.tick(timedelta(minutes=1))
    other = await _conversation(call, "Shrimp")

    assert saved == {"conversation_id": conversation_id, "messages": 2}
    listed = list_of((await call.ok("list_conversations"))["conversations"])
    assert [dict_of(item)["id"] for item in listed] == [other, conversation_id]
    found = list_of((await call.ok("search_conversations", query="GREEN DUST"))["conversations"])
    assert [dict_of(item)["id"] for item in found] == [conversation_id]
    detail = await call.ok("get_conversation", id=conversation_id)
    assert detail["summary"] == "Cut the light"
    assert len(list_of(detail["messages"])) == 2
    assert [dict_of(item)["summary"] for item in list_of(detail["changes"])] == ["Note: Light"]
    assert await call.error("get_conversation", id="missing") == "not_found"
    assert await call.error("save_conversation", conversation_id="missing") == "not_found"
    assert await call.error("add_note", kind="question", topic="x", text="y", conversation_id="missing") == "not_found"
    assert await call.error("set_tank", name="x", reason="y", conversation_id="missing") == "not_found"


async def test_history_filters(call: Caller) -> None:
    fern = await _content(call)
    await call.ok("add_note", kind="question", topic="CO2", text="?")

    every = list_of((await call.ok("get_history"))["history"])
    contents = list_of((await call.ok("get_history", collection="contents"))["history"])
    one = list_of((await call.ok("get_history", record_id=fern, limit=1))["history"])

    assert [dict_of(item)["summary"] for item in every] == ["Note: CO2", "Added Java fern"]
    assert [dict_of(item)["summary"] for item in contents] == ["Added Java fern"]
    assert [dict_of(item)["summary"] for item in one] == ["Added Java fern"]
    assert dict_of(every[0])["source"] == "mcp"


async def test_assist_calls_are_marked_as_assist(hass: HomeAssistant, call: Caller) -> None:
    assist = Caller(hass, platform="conversation", user_id=None, api_id=LLM_API_ASSIST)
    result = await assist.result("add_note", kind="question", topic="CO2", text="?")
    assert not result.error

    history = list_of((await call.ok("get_history"))["history"])
    assert dict_of(history[0])["source"] == "assist"


async def test_remove_product_keeps_it_with_the_date(call: Caller) -> None:
    product_id = await _product(call)

    proposal = await call.ok("remove_product", product_id=product_id, removed="2026-11-20", reason="Ran out")
    assert proposal["summary"] == "Remove the product Easy Green"
    await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"])

    assert list_of((await call.ok("list_products"))["products"]) == []
    every = list_of((await call.ok("list_products", include_removed=True))["products"])
    assert dict_of(every[0])["removed"] == "2026-11-20"
    assert await call.error("remove_product", product_id="missing", reason="x") == "not_found"


async def test_a_removed_product_does_not_match_its_name(call: Caller) -> None:
    old_id = await _product(call)
    proposal = await call.ok("remove_product", product_id=old_id, reason="Ran out")
    await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"])
    new_id = await _product(call)

    dose = await call.ok("record_dose", product="Easy Green", amount_ml=1)

    entry = dict_of(list_of((await call.ok("get_log"))["entries"])[0])
    assert dose["recorded"] is True
    assert entry["product_id"] == new_id
    assert (await call.ok("record_dose", product=old_id, amount_ml=1))["recorded"] is True


async def test_update_and_remove_a_note(call: Caller) -> None:
    note_id = str_of((await call.ok("add_note", kind="question", topic="CO2", text="Is it needed?"))["record_id"])

    proposal = await call.ok("update_note", note_id=note_id, text="Not for now", kind="assumption", reason="Settled")
    assert proposal["summary"] == "Change the note CO2"
    await call.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"])
    note = dict_of(list_of((await call.ok("list_notes"))["notes"])[0])
    assert (note["kind"], note["text"], note["how_to_resolve"]) == ("assumption", "Not for now", None)

    removed = await call.ok("remove_note", note_id=note_id, reason="Answered")
    assert removed["summary"] == "Remove the note CO2"
    await call.ok("apply_change", proposal_id=removed["proposal_id"], code=removed["code"])
    assert list_of((await call.ok("list_notes"))["notes"]) == []
    history = list_of((await call.ok("get_history", record_id=note_id))["history"])
    assert dict_of(list_of(dict_of(history[0])["changes"])[0])["after"] is None
    assert await call.error("update_note", note_id="missing", text="x", reason="x") == "not_found"
    assert await call.error("remove_note", note_id="missing", reason="x") == "not_found"


async def test_history_records_who_made_the_change(call: Caller) -> None:
    await call.ok("add_note", kind="question", topic="CO2", text="?")

    history = dict_of(list_of((await call.ok("get_history"))["history"])[0])

    assert history["user_id"] == "u1"


async def test_search_shows_where_each_conversation_matches(call: Caller) -> None:
    conversation_id = await _conversation(call, "Algae")
    await call.ok(
        "save_conversation",
        conversation_id=conversation_id,
        messages=[{"role": "user", "text": "Green dust on the glass"}, {"role": "assistant", "text": "Less light"}],
    )

    found = dict_of(list_of((await call.ok("search_conversations", query="dust"))["conversations"])[0])

    assert found["name"] == "Algae"
    assert found["match"] == {
        "field": "message",
        "index": 0,
        "role": "user",
        "snippet": "Green dust on the glass",
        "start": 6,
        "end": 10,
    }


async def test_an_untitled_conversation_is_named_by_its_first_message(call: Caller) -> None:
    saved = await call.ok("save_conversation", messages=[{"role": "user", "text": "Why is the water green?"}])

    listed = dict_of(list_of((await call.ok("list_conversations"))["conversations"])[0])

    assert (listed["id"], listed["title"], listed["name"]) == (saved["conversation_id"], "", "Why is the water green?")


async def test_rename_conversation(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    first = await _conversation(call, "Algae")
    freezer.tick(timedelta(minutes=1))
    second = await _conversation(call, "Shrimp")
    freezer.tick(timedelta(minutes=1))

    renamed = await call.ok("rename_conversation", id=first, title=" Green algae ")

    assert (renamed["id"], renamed["title"], renamed["name"]) == (first, "Green algae", "Green algae")
    listed = list_of((await call.ok("list_conversations"))["conversations"])
    assert [dict_of(item)["id"] for item in listed] == [second, first]
    assert await call.error("rename_conversation", id=first, title="   ") == "invalid_input"
    assert await call.error("rename_conversation", id=first, title="x" * 201) == "invalid_input"
    assert await call.error("rename_conversation", id="missing", title="x") == "not_found"


async def test_delete_conversation_needs_a_confirm_code(call: Caller) -> None:
    conversation_id = await _conversation(call, "Algae")
    await call.ok("add_note", kind="question", topic="Light", text="?", conversation_id=conversation_id)

    asked = await call.ok("delete_conversation", id=conversation_id)

    assert (asked["conversation_id"], asked["name"], asked["changes"]) == (conversation_id, "Algae", 1)
    assert asked["code_expires"] == "2026-11-26T12:15:00+00:00"
    assert "tankkeeper__delete_conversation" in str_of(asked["next_step"])
    assert await call.error("delete_conversation", id=conversation_id, code="ZZZ999") == "code_wrong"
    assert (
        await Caller(call.hass, user_id="u2").error(
            "delete_conversation", id=conversation_id, code=str_of(asked["code"])
        )
        == "code_expired"
    )
    assert await call.ok("delete_conversation", id=conversation_id, code=str_of(asked["code"])) == {
        "deleted": True,
        "conversation_id": conversation_id,
    }
    assert await call.error("get_conversation", id=conversation_id) == "not_found"
    history = dict_of(list_of((await call.ok("get_history"))["history"])[0])
    assert (history["conversation_id"], history["conversation_name"]) == (conversation_id, DELETED_CONVERSATION)
    assert await call.error("delete_conversation", id=conversation_id) == "not_found"


async def test_a_delete_code_expires_and_stops_after_wrong_codes(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    conversation_id = await _conversation(call, "Algae")
    asked = await call.ok("delete_conversation", id=conversation_id)
    freezer.tick(CODE_LIFETIME)

    assert await call.error("delete_conversation", id=conversation_id, code=str_of(asked["code"])) == "code_expired"

    again = await call.ok("delete_conversation", id=conversation_id)
    for _ in range(MAX_CODE_ATTEMPTS):
        await call.error("delete_conversation", id=conversation_id, code="ZZZ999")
    assert await call.error("delete_conversation", id=conversation_id, code=str_of(again["code"])) == (
        "too_many_attempts"
    )
    assert len(list_of((await call.ok("list_conversations"))["conversations"])) == 1


async def _delete_message(call: Caller, conversation_id: str, code: str) -> str:
    result = await call.result("delete_conversation", id=conversation_id, code=code)
    assert result.error
    return str_of(result.data["message"])


async def test_a_spent_delete_code_is_forgotten(call: Caller, freezer: FrozenDateTimeFactory) -> None:
    first = await _conversation(call, "Algae")
    second = await _conversation(call, "Snails")
    asked = await call.ok("delete_conversation", id=first)
    freezer.tick(CODE_LIFETIME)
    assert await _delete_message(call, first, str_of(asked["code"])) != NO_DELETE
    assert await _delete_message(call, first, str_of(asked["code"])) == NO_DELETE

    again = await call.ok("delete_conversation", id=first)
    for _ in range(MAX_CODE_ATTEMPTS + 1):
        await call.error("delete_conversation", id=first, code="ZZZ999")
    assert await _delete_message(call, first, str_of(again["code"])) == NO_DELETE

    stale = await call.ok("delete_conversation", id=first)
    freezer.tick(CODE_LIFETIME)
    await call.ok("delete_conversation", id=second)
    assert await _delete_message(call, first, str_of(stale["code"])) == NO_DELETE


async def test_history_names_the_conversation_of_each_change(call: Caller) -> None:
    conversation_id = await _conversation(call, "Algae")
    await call.ok("add_note", kind="question", topic="Light", text="?", conversation_id=conversation_id)
    await call.ok("add_note", kind="question", topic="CO2", text="?")

    history = [dict_of(item) for item in list_of((await call.ok("get_history"))["history"])]

    assert [item["conversation_name"] for item in history] == [None, "Algae"]
