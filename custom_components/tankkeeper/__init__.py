"""Tankkeeper: the fish tank's records, plan, reminders, lights and status, MCP first."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.llm import async_register_api

from .const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME
from .light_control import LightRunner
from .llm import TankkeeperAPI
from .reminders import ReminderSender
from .service import TankkeeperService
from .status import StatusRunner

PLATFORMS: list[Platform] = [Platform.BINARY_SENSOR, Platform.CALENDAR, Platform.SENSOR, Platform.TODO]

type TankkeeperConfigEntry = ConfigEntry[TankkeeperService]


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
    entry.runtime_data = service
    entry.async_on_unload(async_register_api(hass, TankkeeperAPI(hass, service)))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(ReminderSender(hass, service).start())
    entry.async_on_unload(LightRunner(hass, service).start())
    entry.async_on_unload(StatusRunner(hass, service).start())
    return True


async def async_unload_entry(hass: HomeAssistant, entry: TankkeeperConfigEntry) -> bool:
    """Stop sharing the tools and unload the entities."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: TankkeeperConfigEntry) -> None:
    """Delete the stored records when the integration is removed."""
    await TankkeeperService(hass, entry.entry_id).async_remove()
