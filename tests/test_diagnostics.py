"""Diagnostics help debug without showing what the owner wrote."""

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.components.diagnostics import get_diagnostics_for_config_entry
from pytest_homeassistant_custom_component.typing import ClientSessionGenerator

from .common import Caller

SECRET_TEXT = "Leaves melting near the outlet"


async def test_diagnostics_count_records_without_their_text(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, hass_client: ClientSessionGenerator
) -> None:
    await call.ok("add_note", kind="question", topic="Plants", text=SECRET_TEXT)
    await call.ok("save_conversation", title=SECRET_TEXT)
    await call.ok("set_tank", temperature_c=24, reason=SECRET_TEXT)

    diagnostics = await get_diagnostics_for_config_entry(hass, hass_client, loaded_entry)

    assert diagnostics == {
        "entry": {"version": 1, "volume_litres": 60},
        "records": {
            "tank": 1,
            "water": 0,
            "products": 0,
            "contents": 0,
            "log": 0,
            "notes": 1,
            "tasks": 0,
            "settings": 0,
            "lights": 0,
        },
        "history_entries": 1,
        "proposals": {"pending": 1, "applied": 0, "rejected": 0},
        "conversations": 1,
    }
    assert SECRET_TEXT not in str(diagnostics)
