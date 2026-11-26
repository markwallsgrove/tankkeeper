"""Loading, unloading, reloading and removing the tank."""

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import llm
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.const import API_ID, DOMAIN

from .common import Caller, dict_of, list_of, str_of


def _state(entry: MockConfigEntry) -> ConfigEntryState:
    return entry.state


def _api_ids(hass: HomeAssistant) -> set[str]:
    return {api.id for api in llm.async_get_apis(hass)}


async def test_setup_shares_the_tools_and_unload_stops(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    assert _state(loaded_entry) is ConfigEntryState.LOADED
    assert API_ID in _api_ids(hass)

    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    assert _state(loaded_entry) is ConfigEntryState.NOT_LOADED
    assert API_ID not in _api_ids(hass)
    state = hass.states.get("sensor.nano_proposals_waiting")
    assert state is not None
    assert state.state == "unavailable"


async def test_reload_keeps_the_records(hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller) -> None:
    record_id = str_of((await call.ok("add_note", kind="assumption", topic="Filter", text="Outlet moved"))["record_id"])

    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()

    notes = await Caller(hass).ok("list_notes")
    assert [dict_of(note)["id"] for note in list_of(notes["notes"])] == [record_id]


async def test_removing_the_tank_deletes_its_records(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, hass_storage: dict[str, object]
) -> None:
    key = f"{DOMAIN}.{loaded_entry.entry_id}"
    assert key in hass_storage

    await hass.config_entries.async_remove(loaded_entry.entry_id)
    await hass.async_block_till_done()

    assert key not in hass_storage
    assert API_ID not in _api_ids(hass)
