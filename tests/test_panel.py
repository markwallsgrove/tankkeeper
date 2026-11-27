"""The TankKeeper panel in the sidebar, against a real Home Assistant."""

from homeassistant.core import HomeAssistant
from homeassistant.util.json import JsonObjectType
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import ClientSessionGenerator, WebSocketGenerator

from custom_components.tankkeeper.panel import BUNDLE, PANEL_PATH

from .common import dict_of


async def _panels(hass: HomeAssistant, hass_ws_client: WebSocketGenerator, token: str | None = None) -> JsonObjectType:
    client = await hass_ws_client(hass, token) if token else await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "get_panels"})
    response = dict_of(await client.receive_json())
    assert response["success"], response
    return dict_of(response["result"])


async def test_the_panel_is_in_the_sidebar_for_admins(
    hass: HomeAssistant, hass_ws_client: WebSocketGenerator, loaded_entry: MockConfigEntry
) -> None:
    panel = dict_of((await _panels(hass, hass_ws_client))[PANEL_PATH])

    assert PANEL_PATH == "tankkeeper"
    assert (panel["title"], panel["icon"], panel["require_admin"]) == ("TankKeeper", "mdi:fishbowl", True)
    custom = dict_of(dict_of(panel["config"])["_panel_custom"])
    assert custom["name"] == "tankkeeper-panel"
    assert str(custom["module_url"]).startswith(f"/tankkeeper_static/{BUNDLE}?v=")


async def test_the_panel_knows_its_entry_for_the_settings_links(
    hass: HomeAssistant, hass_ws_client: WebSocketGenerator, loaded_entry: MockConfigEntry
) -> None:
    panel = dict_of((await _panels(hass, hass_ws_client))[PANEL_PATH])

    assert dict_of(panel["config"])["entry_id"] == loaded_entry.entry_id


async def test_people_who_are_not_admins_do_not_see_the_panel(
    hass: HomeAssistant,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
    loaded_entry: MockConfigEntry,
) -> None:
    assert PANEL_PATH not in await _panels(hass, hass_ws_client, hass_read_only_access_token)


async def test_the_panel_code_is_served(
    hass: HomeAssistant, hass_client: ClientSessionGenerator, loaded_entry: MockConfigEntry
) -> None:
    client = await hass_client()

    response = await client.get(f"/tankkeeper_static/{BUNDLE}")

    assert response.status == 200
    assert "tankkeeper-panel" in await response.text()


async def test_unload_removes_the_panel_and_reload_adds_it_again(
    hass: HomeAssistant, hass_ws_client: WebSocketGenerator, loaded_entry: MockConfigEntry
) -> None:
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    assert PANEL_PATH not in await _panels(hass, hass_ws_client)

    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done()
    assert PANEL_PATH in await _panels(hass, hass_ws_client)
