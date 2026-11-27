"""The panel's websocket commands, against a real Home Assistant."""

import json
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util.json import JsonObjectType
import probatio as p
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, MockUser
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.tankkeeper.tools import SPECS
from custom_components.tankkeeper.websocket import CONVERSATION_ONLY, PANEL_COMMANDS, panel_args

from .agents import CLAUDE, FakeClaude
from .common import Caller, Panel, apply, dict_of, list_of, str_of

pytestmark = pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")
COMMAND_ARGS = Path(__file__).parent.parent / "frontend" / "test" / "commands.json"


@pytest.fixture
async def panel(hass_ws_client: WebSocketGenerator, loaded_entry: MockConfigEntry) -> Panel:
    """The panel, signed in as the admin."""
    return Panel(await hass_ws_client())


async def _latest(panel: Panel) -> JsonObjectType:
    return dict_of(list_of((await panel.ok("get_history", limit=1))["history"])[0])


def test_every_tool_the_panel_can_use_is_a_command() -> None:
    tools = {spec.name for spec in SPECS}

    assert tools >= CONVERSATION_ONLY
    assert {f"tankkeeper/{name}" for name in tools - CONVERSATION_ONLY} <= PANEL_COMMANDS
    assert {"tankkeeper/accept_proposal", "tankkeeper/reject_proposal", "tankkeeper/delete_conversation"} <= (
        PANEL_COMMANDS
    )


def test_the_frontend_tests_check_the_real_command_arguments() -> None:
    expected = {
        spec.name: {
            "required": sorted(str(key) for key in panel_args(spec) if isinstance(key, p.Required)),
            "optional": sorted(str(key) for key in panel_args(spec) if not isinstance(key, p.Required)),
        }
        for spec in SPECS
        if spec.name not in CONVERSATION_ONLY
    }

    assert json.loads(COMMAND_ARGS.read_text()) == expected


async def test_reads_answer_as_the_tools_do(panel: Panel, call: Caller) -> None:
    assert await panel.ok("get_tank") == await call.ok("get_tank")
    assert await panel.ok("list_contents", include_removed=True) == {"contents": []}


async def test_panel_edits_apply_straight_away_as_the_admin(
    panel: Panel, hass_admin_user: MockUser, call: Caller
) -> None:
    result = await panel.ok("set_tank", name="Big")

    assert result["applied"] is True
    assert dict_of(result["history"])["summary"] == "Change the tank details"
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Big"
    history = await _latest(panel)
    assert (history["source"], history["user_id"]) == ("panel", hass_admin_user.id)
    assert (await call.ok("get_tank"))["proposals_waiting"] == 0


async def test_panel_undo_applies_straight_away(panel: Panel, call: Caller) -> None:
    changed = dict_of((await panel.ok("set_tank", name="Big"))["history"])

    undone = await panel.ok("undo_change", history_id=changed["id"])

    assert dict_of(undone["history"])["summary"] == "Undo: Change the tank details"
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Nano"


async def test_panel_records_straight_away(panel: Panel) -> None:
    recorded = await panel.ok("add_note", kind="question", topic="CO2", text="?")
    added = await panel.ok("add_content", type="plant", name="Java fern")

    assert recorded["recorded"] is True
    assert added["recorded"] is True
    assert (await _latest(panel))["source"] == "panel"


async def test_panel_commands_take_no_conversation(panel: Panel) -> None:
    assert await panel.error("add_note", kind="question", topic="CO2", text="?", conversation_id="c1") == (
        "invalid_format"
    )


async def test_args_can_be_left_out(panel: Panel) -> None:
    assert (await panel.ok_message("get_history", {}))["history"] == []


async def test_panel_commands_refuse_unknown_keys(panel: Panel) -> None:
    for command, key in (
        ("accept_proposal", "proposal_id"),
        ("reject_proposal", "proposal_id"),
        ("delete_conversation", "conversation_id"),
    ):
        assert await panel.error_message(command, {key: "x", "extra": 1}) == "invalid_format"


async def test_conversation_tools_are_not_commands(panel: Panel) -> None:
    for name in sorted(CONVERSATION_ONLY):
        assert await panel.error(name) == "unknown_command"


async def test_errors_come_back_with_their_key(panel: Panel) -> None:
    assert await panel.error("set_tank", name="Nano") == "nothing_to_change"
    assert await panel.error("get_decision", number=7) == "not_found"
    assert await panel.error("set_water", ph=15) == "invalid_format"


async def test_accept_and_reject_proposals(panel: Panel, hass_admin_user: MockUser, call: Caller) -> None:
    rename = await call.ok("set_tank", name="Big", reason="Rename")
    warm = await call.ok("set_tank", temperature_c=25, reason="Shrimp")

    accepted = await panel.ok_message("accept_proposal", {"proposal_id": rename["proposal_id"]})
    rejected = await panel.ok_message("reject_proposal", {"proposal_id": warm["proposal_id"]})

    assert (accepted["state"], accepted["decided_by"]) == ("applied", hass_admin_user.id)
    assert (rejected["state"], rejected["decided_by"]) == ("rejected", hass_admin_user.id)
    history = await _latest(panel)
    assert (history["source"], history["proposal_id"]) == ("panel", rename["proposal_id"])
    assert await panel.error_message("accept_proposal", {"proposal_id": warm["proposal_id"]}) == "proposal_closed"
    assert await panel.error_message("reject_proposal", {"proposal_id": "missing"}) == "not_found"


async def test_delete_conversation_keeps_its_changes(panel: Panel, call: Caller) -> None:
    conversation_id = str_of((await call.ok("save_conversation", title="Algae"))["conversation_id"])
    await call.ok("add_note", kind="question", topic="Light", text="?", conversation_id=conversation_id)

    assert (await panel.ok("get_conversation", id=conversation_id))["title"] == "Algae"
    assert await panel.ok_message("delete_conversation", {"conversation_id": conversation_id}) == {"deleted": True}

    assert await panel.ok("list_conversations") == {"conversations": []}
    assert (await _latest(panel))["conversation_id"] == conversation_id
    assert await panel.error_message("delete_conversation", {"conversation_id": conversation_id}) == "not_found"


async def test_proposals_from_a_deleted_conversation_can_still_be_decided(panel: Panel, call: Caller) -> None:
    conversation_id = str_of((await call.ok("save_conversation", title="Rename"))["conversation_id"])
    proposal = await call.ok("set_tank", name="Big", reason="Rename", conversation_id=conversation_id)
    await panel.ok_message("delete_conversation", {"conversation_id": conversation_id})

    accepted = await panel.ok_message("accept_proposal", {"proposal_id": proposal["proposal_id"]})

    assert accepted["state"] == "applied"


async def test_only_admins_can_use_the_panel(
    hass: HomeAssistant,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
    loaded_entry: MockConfigEntry,
) -> None:
    reader = Panel(await hass_ws_client(hass, hass_read_only_access_token))

    assert await reader.error("get_tank") == "unauthorized"
    assert await reader.error_message("delete_conversation", {"conversation_id": "x"}) == "unauthorized"


async def test_commands_need_a_loaded_tank(hass: HomeAssistant, panel: Panel, loaded_entry: MockConfigEntry) -> None:
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    assert await panel.error("get_tank") == "not_loaded"
    assert await panel.error_message("accept_proposal", {"proposal_id": "x"}) == "not_loaded"

    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert dict_of((await panel.ok("get_tank"))["tank"])["name"] == "Nano"


async def test_chat_agent_names_the_tanks_agent_and_whether_it_can_answer(
    hass: HomeAssistant, claude: FakeClaude, panel: Panel, call: Caller
) -> None:
    agent_id = er.async_get(hass).async_get_entity_id("conversation", "tankkeeper", "entry1_agent")

    assert await panel.ok_message("chat_agent", {}) == {"agent_id": agent_id, "ready": False}

    await apply(call, await call.ok("set_claude", agent=CLAUDE, reason="Chat through Claude"))

    assert await panel.ok_message("chat_agent", {}) == {"agent_id": agent_id, "ready": True}
    assert "tankkeeper/chat_agent" in PANEL_COMMANDS


async def test_chat_agent_is_not_ready_when_the_chosen_agent_is_gone(
    hass: HomeAssistant, claude: FakeClaude, panel: Panel, call: Caller
) -> None:
    await apply(call, await call.ok("set_claude", agent=CLAUDE, reason="Chat through Claude"))
    er.async_get(hass).async_remove(CLAUDE)
    await hass.async_block_till_done()

    assert (await panel.ok_message("chat_agent", {}))["ready"] is False
