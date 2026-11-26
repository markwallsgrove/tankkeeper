"""Helpers to call Tankkeeper's tools the way Assist and the MCP server do."""

from homeassistant.core import Context, HomeAssistant
from homeassistant.helpers import llm
from homeassistant.helpers.llm import LLMContext, ToolInput, ToolResult
from homeassistant.util.json import JsonObjectType, JsonValueType

from custom_components.tankkeeper.const import API_ID

MCP = "mcp_server"


class Caller:
    """Calls tools as one person on one platform."""

    def __init__(
        self, hass: HomeAssistant, *, platform: str = MCP, user_id: str | None = "u1", api_id: str = API_ID
    ) -> None:
        """Remember who is calling, and through which API."""
        self.hass = hass
        self.api_id = api_id
        self.platform = platform
        self.user_id = user_id

    def context(self) -> LLMContext:
        """The context a real request carries."""
        return LLMContext(
            platform=self.platform,
            context=Context(user_id=self.user_id),
            language="en",
            assistant="conversation",
            device_id=None,
        )

    async def result(self, tool: str, /, **args: JsonValueType) -> ToolResult:
        """Call a tool and return its result."""
        api = await llm.async_get_api(self.hass, self.api_id, self.context())
        return await api.async_call_tool(ToolInput(tool_name=f"tankkeeper__{tool}", tool_args=dict(args)))

    async def ok(self, tool: str, /, **args: JsonValueType) -> JsonObjectType:
        """Call a tool that must succeed."""
        result = await self.result(tool, **args)
        assert not result.error, result.data
        return result.data

    async def error(self, tool: str, /, **args: JsonValueType) -> str:
        """Call a tool that must fail, and return the error key."""
        result = await self.result(tool, **args)
        assert result.error, result.data
        assert isinstance(result.data["message"], str)
        error = result.data["error"]
        assert isinstance(error, str)
        return error


def dict_of(value: JsonValueType) -> JsonObjectType:
    """A JSON object, checked."""
    assert isinstance(value, dict)
    return value


def list_of(value: JsonValueType) -> list[JsonValueType]:
    """A JSON list, checked."""
    assert isinstance(value, list)
    return value


def str_of(value: JsonValueType) -> str:
    """A JSON string, checked."""
    assert isinstance(value, str)
    return value
