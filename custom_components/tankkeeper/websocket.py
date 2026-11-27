"""Websocket commands for the Tankkeeper panel: every tool it can use, plus the actions only the owner takes.

A tool command takes the tool's arguments under args, as some are called id or type.
"""

from collections.abc import Awaitable, Callable
from typing import Any, cast

from homeassistant.components.websocket_api import async_register_command
from homeassistant.components.websocket_api.connection import ActiveConnection
from homeassistant.components.websocket_api.const import WebSocketCommandHandler
from homeassistant.components.websocket_api.decorators import async_response, require_admin, websocket_command
from homeassistant.components.websocket_api.messages import BASE_COMMAND_MESSAGE_SCHEMA
from homeassistant.core import HomeAssistant, callback
from homeassistant.util.json import JsonObjectType
import probatio as p

from .const import DOMAIN
from .domain import Record, Source, TankkeeperError
from .service import Actor, TankkeeperService
from .tools import NON_EMPTY, SPECS, Spec, proposal_json

type Message = dict[str, Any]
type Command = Callable[[TankkeeperService, Message, Actor], Awaitable[JsonObjectType]]

CONVERSATION_ONLY = frozenset(
    {"save_conversation", "start_batch", "start_setup", "get_batch", "apply_change", "reject_change"}
)
PANEL_REASON = "Changed in the Tankkeeper panel"
PANEL_ONLY = ("accept_proposal", "reject_proposal", "delete_conversation")
PANEL_COMMANDS = frozenset(
    f"{DOMAIN}/{name}" for name in (*(spec.name for spec in SPECS if spec.name not in CONVERSATION_ONLY), *PANEL_ONLY)
)
NOT_LOADED = "not_loaded"


@callback
def async_register(hass: HomeAssistant) -> None:
    """Register every panel command. Each finds the loaded tank when it runs."""
    for spec in SPECS:
        if spec.name not in CONVERSATION_ONLY:
            async_register_command(hass, f"{DOMAIN}/{spec.name}", _tool_command(spec), _schema(spec))
    async_register_command(hass, accept_proposal)
    async_register_command(hass, reject_proposal)
    async_register_command(hass, delete_conversation)


def panel_args(spec: Spec) -> dict[p.Marker, object]:
    """The tool's own arguments, without a conversation, and with a reason the panel need not give."""
    fields: dict[p.Marker, object] = {
        key: value for key, value in spec.schema.items() if str(key) not in ("conversation_id", "reason")
    }
    if any(str(key) == "reason" for key in spec.schema):
        fields[p.Optional("reason", default=PANEL_REASON)] = NON_EMPTY
    return fields


def _schema(spec: Spec) -> p.Schema:
    return BASE_COMMAND_MESSAGE_SCHEMA.extend(
        {p.Required("type"): f"{DOMAIN}/{spec.name}", p.Optional("args", default=dict): panel_args(spec)}
    )


def _tool_command(spec: Spec) -> WebSocketCommandHandler:
    async def run(service: TankkeeperService, msg: Message, actor: Actor) -> JsonObjectType:
        return await spec.handler(service, cast(Record, msg["args"]), actor)

    return _command(run)


def _command(run: Command) -> WebSocketCommandHandler:
    """Run as the signed-in admin, with the panel as the source. Errors come back with their key."""

    @require_admin
    @async_response
    async def handle(hass: HomeAssistant, connection: ActiveConnection, msg: Message) -> None:
        entries = hass.config_entries.async_loaded_entries(DOMAIN)
        if not entries:
            connection.send_error(msg["id"], NOT_LOADED, "Tankkeeper is not loaded")
            return
        service: TankkeeperService = entries[0].runtime_data
        actor = Actor(source=Source.PANEL, user_id=connection.user.id, conversation_id=None)
        try:
            result = await run(service, msg, actor)
        except TankkeeperError as err:
            connection.send_error(msg["id"], err.key, err.message)
            return
        connection.send_result(msg["id"], result)

    return handle


async def _accept(service: TankkeeperService, msg: Message, actor: Actor) -> JsonObjectType:
    await service.async_accept(msg["proposal_id"], actor.user_id, Source.PANEL)
    return proposal_json(service.state.proposal(msg["proposal_id"]))


async def _reject(service: TankkeeperService, msg: Message, actor: Actor) -> JsonObjectType:
    return proposal_json(await service.async_decline(msg["proposal_id"], actor.user_id))


async def _delete(service: TankkeeperService, msg: Message, actor: Actor) -> JsonObjectType:
    await service.async_delete_conversation(msg["conversation_id"])
    return {"deleted": True}


accept_proposal = websocket_command(
    {p.Required("type"): f"{DOMAIN}/accept_proposal", p.Required("proposal_id"): NON_EMPTY}
)(_command(_accept))
reject_proposal = websocket_command(
    {p.Required("type"): f"{DOMAIN}/reject_proposal", p.Required("proposal_id"): NON_EMPTY}
)(_command(_reject))
delete_conversation = websocket_command(
    {p.Required("type"): f"{DOMAIN}/delete_conversation", p.Required("conversation_id"): NON_EMPTY}
)(_command(_delete))
