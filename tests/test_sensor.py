"""The sensors follow the records as they change."""

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.const import DOMAIN

from .common import Caller

pytestmark = pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")

WAITING = "sensor.nano_proposals_waiting"
LAST_TEST = "sensor.nano_last_water_test"


def _state(hass: HomeAssistant, entity_id: str) -> str:
    state = hass.states.get(entity_id)
    assert state is not None
    return state.state


async def test_sensors_belong_to_the_tank_device(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    device_registry: dr.DeviceRegistry,
    entity_registry: er.EntityRegistry,
) -> None:
    device = device_registry.async_get_device_by_identifier((DOMAIN, loaded_entry.entry_id), loaded_entry.entry_id)
    assert device is not None
    assert device.name == "Nano"
    assert device.entry_type is dr.DeviceEntryType.SERVICE
    for entity_id, key in ((WAITING, "proposals_waiting"), (LAST_TEST, "last_test")):
        entity = entity_registry.async_get(entity_id)
        assert entity is not None
        assert entity.unique_id == f"{loaded_entry.entry_id}_{key}"
        assert entity.device_id == device.id


async def test_proposals_waiting_counts_open_proposals(hass: HomeAssistant, call: Caller) -> None:
    assert _state(hass, WAITING) == "0"

    first = await call.ok("set_tank", temperature_c=24, reason="Heater set")
    await call.ok("set_tank", notes="Planted", reason="New plants")
    await hass.async_block_till_done()
    assert _state(hass, WAITING) == "2"

    await call.ok("apply_change", proposal_id=first["proposal_id"], code=first["code"])
    await hass.async_block_till_done()
    assert _state(hass, WAITING) == "1"


async def test_last_test_is_the_newest_tank_test(hass: HomeAssistant, call: Caller) -> None:
    assert _state(hass, LAST_TEST) == "unknown"

    await call.ok("record_test", values={"nitrate": 10}, time="2026-11-25T08:00:00+00:00")
    await call.ok("record_test", values={"nitrate": 5}, time="2026-11-21T08:00:00+00:00")
    await call.ok("record_test", values={"kh": 4}, source="tap")
    await hass.async_block_till_done()

    assert _state(hass, LAST_TEST) == "2026-11-25T08:00:00+00:00"
