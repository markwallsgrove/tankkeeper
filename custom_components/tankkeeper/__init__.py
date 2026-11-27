"""Tankkeeper: the fish tank's records, plan, reminders, lights and status, MCP first."""

from contextlib import suppress
from typing import cast

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.llm import async_register_api
from homeassistant.helpers.typing import ConfigType

from . import panel, websocket
from .const import CONF_DOSING_VOLUME, CONF_SETUP, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from .domain import Collection, NothingToChangeError, Record, Source
from .light_control import LightRunner
from .llm import TankkeeperAPI
from .proposal_notify import ProposalNotifier
from .reminders import ReminderSender
from .reviewer import ReviewRunner
from .service import Actor, TankkeeperService, Target
from .status import StatusRunner

PLATFORMS: list[Platform] = [
    Platform.BINARY_SENSOR,
    Platform.CALENDAR,
    Platform.CONVERSATION,
    Platform.SENSOR,
    Platform.TODO,
]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type TankkeeperConfigEntry = ConfigEntry[TankkeeperService]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the panel's websocket commands."""
    websocket.async_register(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: TankkeeperConfigEntry) -> bool:
    """Load the tank's records and share its tools."""
    service = TankkeeperService(hass, entry.entry_id)
    await service.async_load(
        {
            "name": entry.data[CONF_TANK_NAME],
            "volume_litres": entry.data[CONF_VOLUME],
            "dosing_volume_litres": entry.data[CONF_DOSING_VOLUME],
            "temperature_c": None,
            "notes": "",
        }
    )
    await _async_finish_setup(hass, entry, service)
    entry.runtime_data = service
    entry.async_on_unload(async_register_api(hass, TankkeeperAPI(hass, service)))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(ReminderSender(hass, service).start())
    entry.async_on_unload(LightRunner(hass, service).start())
    entry.async_on_unload(StatusRunner(hass, service).start())
    entry.async_on_unload(ReviewRunner(hass, service).start())
    entry.async_on_unload(ProposalNotifier(hass, service).start())
    entry.async_on_unload(await panel.async_register(hass))
    return True


async def _async_finish_setup(hass: HomeAssistant, entry: TankkeeperConfigEntry, service: TankkeeperService) -> None:
    """Store what the setup steps entered as one panel change, then drop the draft from the entry.

    Home Assistant does not tell a config flow who runs it, so the change has no user.
    """
    setup = entry.data.get(CONF_SETUP)
    if not isinstance(setup, list):
        return
    targets: list[Target] = [
        (Collection(collection), str(record_id), cast(Record | None, record)) for collection, record_id, record in setup
    ]
    actor = Actor(source=Source.PANEL, user_id=None, conversation_id=None)
    with suppress(NothingToChangeError):
        await service.async_set(targets, actor, f"Set up {entry.data[CONF_TANK_NAME]}")
    hass.config_entries.async_update_entry(
        entry, data={key: value for key, value in entry.data.items() if key != CONF_SETUP}
    )


async def async_unload_entry(hass: HomeAssistant, entry: TankkeeperConfigEntry) -> bool:
    """Stop sharing the tools, remove the panel and unload the entities."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: TankkeeperConfigEntry) -> None:
    """Delete the stored records when the integration is removed."""
    await TankkeeperService(hass, entry.entry_id).async_remove()
