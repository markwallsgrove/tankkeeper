"""Shared fixtures."""

from collections.abc import AsyncIterator
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, mock_config_flow

from custom_components.tankkeeper.const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME, DOMAIN

from .agents import AnthropicFlow, FakeClaude, async_add_claude
from .common import Caller, Devices

pytest_plugins = ["pytest_homeassistant_custom_component"]


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Let Home Assistant load Tankkeeper from custom_components."""


@pytest.fixture(autouse=True)
def own_config_dir(hass: HomeAssistant, tmp_path: Path) -> None:
    """Keep each test's files, such as photos, in its own folder."""
    hass.config.config_dir = str(tmp_path)


@pytest.fixture(autouse=True)
async def core(hass: HomeAssistant) -> None:
    """Set up Home Assistant's core integration, which the conversation integration needs for exposed entities."""
    assert await async_setup_component(hass, "homeassistant", {})


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


@pytest.fixture(autouse=True)
async def london(hass: HomeAssistant) -> None:
    """Run in the owner's time zone, which is UTC in November."""
    await hass.config.async_set_time_zone("Europe/London")


@pytest.fixture
def plugs(hass: HomeAssistant) -> Devices:
    """Fake light and switch entities."""
    return Devices(hass)


@pytest.fixture
async def claude(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> AsyncIterator[FakeClaude]:
    """The stand-in Anthropic agent and AI task entity, loaded after the tank."""
    with mock_config_flow("test", AnthropicFlow):
        yield await async_add_claude(hass)
