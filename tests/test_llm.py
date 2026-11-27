"""Tankkeeper's tools as their own LLM API, inside Assist, and as the MCP server lists them."""

from homeassistant.components.mcp_server.server import _format_tool
from homeassistant.core import HomeAssistant
from homeassistant.helpers import llm
from homeassistant.helpers.llm import LLM_API_ASSIST
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.const import API_ID, DOMAIN
from custom_components.tankkeeper.llm import async_get_tools
from custom_components.tankkeeper.tools import CAMERA_ONLY, LIGHT_ONLY, PROMPT, SPECS

from .common import Caller

PREFIX = f"{DOMAIN}__"


async def _tool_names(hass: HomeAssistant, api_id: str) -> list[str]:
    api = await llm.async_get_api(hass, api_id, Caller(hass).context())
    return [tool.name for tool in api.tools]


async def test_own_api_has_every_tool_once(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    api = await llm.async_get_api(hass, API_ID, Caller(hass).context())

    names = [tool.name for tool in api.tools]
    assert sorted(names) == sorted(
        f"{PREFIX}{spec.name}" for spec in SPECS if spec.name not in LIGHT_ONLY | CAMERA_ONLY
    )
    assert api.api_prompt == PROMPT


async def test_every_tool_lists_over_mcp(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    api = await llm.async_get_api(hass, API_ID, Caller(hass).context())

    for tool in api.tools:
        listed = _format_tool(tool, api.custom_serializer)
        assert listed.name == tool.name
        assert listed.description
        assert listed.inputSchema["type"] == "object"


async def test_assist_has_the_tools_only_while_loaded(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    assert f"{PREFIX}get_tank" in await _tool_names(hass, LLM_API_ASSIST)

    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    assert not [name for name in await _tool_names(hass, LLM_API_ASSIST) if name.startswith(PREFIX)]


async def test_other_apis_get_no_tools(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    assert async_get_tools(hass, Caller(hass).context(), "another_api") is None
