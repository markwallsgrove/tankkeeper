"""Helpers to call TankKeeper's tools the way Assist and the MCP server do."""

from homeassistant.const import STATE_OFF, STATE_ON
from homeassistant.core import Context, HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import llm
from homeassistant.helpers.llm import LLMContext, ToolInput, ToolResult
from homeassistant.util.json import JsonObjectType, JsonValueType
from pytest_homeassistant_custom_component.typing import MockHAClientWebSocket

from custom_components.tankkeeper.const import API_ID

MCP = "mcp_server"
PLUG = "switch.tank_light"
LAMP = "light.tank_lamp"


class Devices:
    """Light and switch entities that follow turn_on and turn_off, as a smart plug or bulb does."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Answer turn_on and turn_off for lights and switches."""
        self.hass = hass
        self.calls: list[ServiceCall] = []
        self.failing: set[str] = set()
        for domain in ("light", "switch"):
            for action in ("turn_on", "turn_off"):
                hass.services.async_register(domain, action, self._async_handle)

    def add(self, entity_id: str, state: str = STATE_OFF) -> None:
        """Make an entity in a state."""
        self.hass.states.async_set(entity_id, state)

    def state(self, entity_id: str) -> str:
        """The entity's state now."""
        state = self.hass.states.get(entity_id)
        assert state is not None
        return state.state

    def sent(self) -> list[tuple[str, dict[str, object]]]:
        """Each call as its action and data."""
        return [(f"{call.domain}.{call.service}", dict(call.data)) for call in self.calls]

    async def _async_handle(self, call: ServiceCall) -> None:
        self.calls.append(call)
        targets = call.data["entity_id"]
        for entity_id in [targets] if isinstance(targets, str) else targets:
            if entity_id in self.failing:
                raise HomeAssistantError(f"{entity_id} did not answer")
            state = STATE_ON if call.service == "turn_on" else STATE_OFF
            self.hass.states.async_set(entity_id, state, context=call.context)


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


async def apply(caller: Caller, proposal: JsonObjectType) -> JsonObjectType:
    """Apply a proposal with its code, as after the owner says yes."""
    return await caller.ok("apply_change", proposal_id=proposal["proposal_id"], code=proposal["code"])


class Panel:
    """Sends commands the way the panel does, one id after another."""

    def __init__(self, client: MockHAClientWebSocket) -> None:
        """Talk over one connection."""
        self.client = client

    async def response(self, command: str, message: JsonObjectType) -> JsonObjectType:
        """Send a command and return the whole response."""
        await self.client.send_json_auto_id({"type": f"tankkeeper/{command}", **message})
        return dict_of(await self.client.receive_json())

    async def ok(self, command: str, /, **args: JsonValueType) -> JsonObjectType:
        """Call a tool that must succeed, and return its result."""
        return await self.ok_message(command, {"args": args})

    async def ok_message(self, command: str, message: JsonObjectType) -> JsonObjectType:
        """Send a panel command that must succeed, and return its result."""
        response = await self.response(command, message)
        assert response["success"], response
        return dict_of(response["result"])

    async def error(self, command: str, /, **args: JsonValueType) -> str:
        """Call a tool that must fail, and return the error code."""
        return await self.error_message(command, {"args": args})

    async def error_message(self, command: str, message: JsonObjectType) -> str:
        """Send a panel command that must fail, and return the error code."""
        response = await self.response(command, message)
        assert not response["success"], response
        error = dict_of(response["error"])
        assert isinstance(error["message"], str)
        return str_of(error["code"])
