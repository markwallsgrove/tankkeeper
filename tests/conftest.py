"""Shared fixtures."""

from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME, DOMAIN

from .common import Caller

pytest_plugins = ["pytest_homeassistant_custom_component"]


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Let Home Assistant load Tankkeeper from custom_components."""


@pytest.fixture
def config_entry() -> MockConfigEntry:
    """A tank that is not set up yet."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Nano",
        entry_id="entry1",
        data={CONF_TANK_NAME: "Nano", CONF_VOLUME: 60, CONF_DOSING_VOLUME: 54},
    )


@pytest.fixture
async def loaded_entry(hass: HomeAssistant, config_entry: MockConfigEntry) -> MockConfigEntry:
    """A tank that is set up."""
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    return config_entry


@pytest.fixture
def call(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> Caller:
    """Call tools over MCP as user u1."""
    return Caller(hass)
