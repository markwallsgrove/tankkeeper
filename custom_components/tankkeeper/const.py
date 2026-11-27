"""Constants for TankKeeper."""

from typing import Final
from urllib.parse import urlencode

DOMAIN: Final = "tankkeeper"
API_ID: Final = DOMAIN
API_NAME: Final = "TankKeeper"
STORAGE_VERSION: Final = 1
PANEL_URI: Final = f"/{DOMAIN}"


def discuss_action(kind: str, item: str) -> dict[str, str]:
    """A phone notification action that opens the panel's chat about one item, named only by its id."""
    return {"action": "URI", "title": "Discuss", "uri": f"{PANEL_URI}?{urlencode({kind: item})}"}


CONF_TANK_NAME: Final = "tank_name"
CONF_VOLUME: Final = "volume_litres"
CONF_DOSING_VOLUME: Final = "dosing_volume_litres"
CONF_SETUP: Final = "setup"
