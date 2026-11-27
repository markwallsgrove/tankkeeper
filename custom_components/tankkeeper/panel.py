"""The TankKeeper panel in the sidebar, for admins only."""

from collections.abc import Callable
from hashlib import sha256
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http.server import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.util.hass_dict import HassKey

PANEL_PATH = "tankkeeper"
STATIC_URL = "/tankkeeper_static"
BUNDLE = "tankkeeper-panel.js"
FRONTEND = Path(__file__).parent / "frontend"
STATIC_REGISTERED: HassKey[bool] = HassKey("tankkeeper_static")


def _version() -> str:
    return sha256((FRONTEND / BUNDLE).read_bytes()).hexdigest()[:12]


async def async_register(hass: HomeAssistant) -> Callable[[], None]:
    """Add the panel to the sidebar. The callback removes it."""
    if not hass.data.get(STATIC_REGISTERED):
        await hass.http.async_register_static_paths([StaticPathConfig(STATIC_URL, str(FRONTEND), True)])
        hass.data[STATIC_REGISTERED] = True
    version = await hass.async_add_executor_job(_version)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="tankkeeper-panel",
        sidebar_title="TankKeeper",
        sidebar_icon="mdi:fishbowl",
        module_url=f"{STATIC_URL}/{BUNDLE}?v={version}",
        require_admin=True,
    )

    def remove() -> None:
        frontend.async_remove_panel(hass, PANEL_PATH, warn_if_unknown=False)

    return remove
