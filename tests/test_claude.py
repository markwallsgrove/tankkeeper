"""The Claude settings: read with get_claude, changed by a set_claude proposal or in the options."""

from datetime import time

from homeassistant.config_entries import ConfigFlowResult
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.claude import CLAUDE_ID, MODEL_NOTE, ClaudeSettings, Trigger
from custom_components.tankkeeper.domain import Collection, Source
from custom_components.tankkeeper.service import TankkeeperService

from .agents import AI_TASK, CLAUDE, SIMPLE, FakeClaude, add_simple_agent
from .common import Caller, apply

DEFAULTS = {
    "agent": None,
    "ai_task": None,
    "review_on": ["test", "task", "status"],
    "comments": False,
    "daily_time": None,
    "daily_cap": 5,
}


async def test_get_claude_shows_the_defaults_and_the_model_note(call: Caller) -> None:
    assert await call.ok("get_claude") == {**DEFAULTS, "chat_agent": None, "model_note": MODEL_NOTE}


async def test_without_a_chosen_agent_the_only_other_agent_chats(call: Caller, claude: FakeClaude) -> None:
    settings = await call.ok("get_claude")

    assert settings["agent"] is None
    assert settings["chat_agent"] == CLAUDE


async def test_without_a_chosen_agent_two_other_agents_leave_the_chat_without_one(
    hass: HomeAssistant, call: Caller, claude: FakeClaude
) -> None:
    add_simple_agent(hass)

    assert (await call.ok("get_claude"))["chat_agent"] is None


async def test_an_agent_that_did_not_load_is_not_counted(hass: HomeAssistant, call: Caller, claude: FakeClaude) -> None:
    hass.states.async_set("conversation.old_agent", "unavailable", {"restored": True})

    assert (await call.ok("get_claude"))["chat_agent"] == CLAUDE


async def test_the_chosen_agent_chats_even_when_others_exist(
    hass: HomeAssistant, call: Caller, claude: FakeClaude
) -> None:
    add_simple_agent(hass)
    await apply(call, await call.ok("set_claude", agent=SIMPLE, reason="Chat simply"))

    assert (await call.ok("get_claude"))["chat_agent"] == SIMPLE


async def test_a_chosen_agent_that_is_gone_leaves_the_chat_without_one(
    hass: HomeAssistant, call: Caller, claude: FakeClaude
) -> None:
    add_simple_agent(hass)
    await apply(call, await call.ok("set_claude", agent=CLAUDE, reason="Chat through Claude"))
    er.async_get(hass).async_remove(CLAUDE)
    await hass.async_block_till_done()

    assert (await call.ok("get_claude"))["chat_agent"] is None


async def test_set_claude_is_a_proposal(call: Caller, claude: FakeClaude) -> None:
    proposal = await call.ok(
        "set_claude",
        agent=CLAUDE,
        ai_task=AI_TASK,
        review_on=["status", "test", "status"],
        comments=True,
        daily_time="20:00",
        daily_cap=3,
        reason="Reviews on",
    )

    assert proposal["summary"] == "Change the Claude settings"
    assert (await call.ok("get_claude"))["agent"] is None
    await apply(call, proposal)
    assert await call.ok("get_claude") == {
        "agent": CLAUDE,
        "ai_task": AI_TASK,
        "review_on": ["test", "status"],
        "comments": True,
        "daily_time": "20:00",
        "daily_cap": 3,
        "chat_agent": CLAUDE,
        "model_note": MODEL_NOTE,
    }


async def test_set_claude_keeps_what_it_is_not_given_and_clears_what_is_empty(call: Caller, claude: FakeClaude) -> None:
    await apply(call, await call.ok("set_claude", agent=CLAUDE, daily_time="20:00", reason="Chat"))

    await apply(call, await call.ok("set_claude", daily_time="", comments=True, reason="No daily review"))

    settings = await call.ok("get_claude")
    assert settings["agent"] == CLAUDE
    assert settings["daily_time"] is None
    assert settings["comments"] is True
    await apply(call, await call.ok("set_claude", agent=None, reason="No agent"))
    assert (await call.ok("get_claude"))["agent"] is None


@pytest.mark.parametrize(
    "args",
    [
        {"agent": "conversation.gone"},
        {"ai_task": "sensor.claude"},
        {"ai_task": "ai_task.gone"},
        {"daily_time": "25:00"},
        {"daily_cap": 51},
        {"review_on": ["daily"]},
    ],
)
async def test_set_claude_checks_the_settings(call: Caller, claude: FakeClaude, args: dict[str, str]) -> None:
    assert await call.error("set_claude", reason="Change", **args) == "invalid_input"


async def test_the_agent_cannot_pass_chat_to_itself(hass: HomeAssistant, call: Caller, claude: FakeClaude) -> None:
    own = er.async_get(hass).async_get_entity_id("conversation", "tankkeeper", "entry1_agent")
    assert own is not None

    assert await call.error("set_claude", agent=own, reason="Loop") == "invalid_input"


async def test_set_claude_needs_a_change(call: Caller) -> None:
    assert await call.error("set_claude", comments=False, reason="Same") == "nothing_to_change"


def test_stored_settings_fill_in_defaults() -> None:
    assert ClaudeSettings.from_json(None) == ClaudeSettings()
    assert ClaudeSettings.from_json({"review_on": "test", "daily_cap": "3", "agent": ""}) == ClaudeSettings()
    assert ClaudeSettings.from_json({"review_on": ["daily", "task"], "daily_time": "07:30", "daily_cap": 0}) == (
        ClaudeSettings(review_on=(Trigger.TASK,), daily_time=time(7, 30), daily_cap=0)
    )


async def _options_form(hass: HomeAssistant, entry: MockConfigEntry) -> ConfigFlowResult:
    menu = await hass.config_entries.options.async_init(entry.entry_id)
    return await hass.config_entries.options.async_configure(menu["flow_id"], {"next_step_id": "claude"})


def _suggested(form: ConfigFlowResult) -> dict[str, object]:
    schema = form["data_schema"]
    assert schema is not None
    return {str(key): key.description["suggested_value"] for key in schema.schema if key.description}


async def test_options_suggest_the_claude_settings(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await _options_form(hass, loaded_entry)

    assert form["step_id"] == "claude"
    assert _suggested(form) == {"review_on": ["test", "task", "status"], "comments": False, "daily_cap": 5}


async def test_options_save_the_claude_settings(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, claude: FakeClaude
) -> None:
    form = await _options_form(hass, loaded_entry)

    result = await hass.config_entries.options.async_configure(
        form["flow_id"],
        {
            "agent": CLAUDE,
            "ai_task": AI_TASK,
            "review_on": ["task"],
            "comments": True,
            "daily_time": "20:00:00",
            "daily_cap": 3,
        },
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = loaded_entry.runtime_data
    assert service.claude() == ClaudeSettings(
        agent=CLAUDE, ai_task=AI_TASK, review_on=(Trigger.TASK,), comments=True, daily_time=time(20), daily_cap=3
    )
    [latest] = service.history(Collection.SETTINGS, CLAUDE_ID, 1)
    assert latest.source is Source.PANEL
    assert _suggested(await _options_form(hass, loaded_entry))["agent"] == CLAUDE


async def test_options_with_the_same_claude_settings_change_nothing(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await _options_form(hass, loaded_entry)

    result = await hass.config_entries.options.async_configure(
        form["flow_id"], {"review_on": ["test", "task", "status"], "comments": False, "daily_cap": 5}
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_options_say_why_the_claude_settings_cannot_be_stored(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await _options_form(hass, loaded_entry)

    result = await hass.config_entries.options.async_configure(
        form["flow_id"], {"ai_task": "ai_task.gone", "review_on": [], "comments": False, "daily_cap": 5}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_claude"}
    assert result["description_placeholders"] == {"error": "No AI task entity ai_task.gone"}


async def test_options_say_a_time_with_seconds_cannot_be_stored(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await _options_form(hass, loaded_entry)

    result = await hass.config_entries.options.async_configure(
        form["flow_id"], {"daily_time": "08:30:15", "review_on": [], "comments": False, "daily_cap": 5}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_claude"}
    assert result["description_placeholders"] == {"error": "'08:30:15' is not a time in HH:MM"}
