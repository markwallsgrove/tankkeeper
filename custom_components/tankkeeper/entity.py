"""What every Tankkeeper entity shares: the tank's device and translated errors."""

from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo

from .const import DOMAIN
from .domain import TankkeeperError


def tank_device(entry_id: str, title: str) -> DeviceInfo:
    """The tank's service device."""
    return DeviceInfo(identifiers={(DOMAIN, entry_id)}, name=title, entry_type=DeviceEntryType.SERVICE)


def change_failed(err: TankkeeperError) -> HomeAssistantError:
    """A translated error for a change the records refused."""
    return HomeAssistantError(
        translation_domain=DOMAIN, translation_key="change_failed", translation_placeholders={"message": err.message}
    )
