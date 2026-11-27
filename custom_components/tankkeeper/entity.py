"""What every TankKeeper entity shares: the tank's device, translated errors and entities that need a light."""

from collections.abc import Callable, Sequence

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import DOMAIN
from .domain import TankkeeperError
from .service import TankkeeperService


def tank_device(entry_id: str, title: str) -> DeviceInfo:
    """The tank's service device."""
    return DeviceInfo(identifiers={(DOMAIN, entry_id)}, name=title, entry_type=DeviceEntryType.SERVICE)


def change_failed(err: TankkeeperError) -> HomeAssistantError:
    """A translated error for a change the records refused."""
    return HomeAssistantError(
        translation_domain=DOMAIN, translation_key="change_failed", translation_placeholders={"message": err.message}
    )


@callback
def async_add_light_entities(
    hass: HomeAssistant,
    entry: ConfigEntry[TankkeeperService],
    async_add_entities: AddConfigEntryEntitiesCallback,
    platform: str,
    make: Callable[[], Sequence[Entity]],
) -> None:
    """Add the entities while a light is set, and remove them from the registry while none is."""
    service = entry.runtime_data
    unique_ids = [entity.unique_id for entity in make()]
    added = False

    @callback
    def refresh() -> None:
        nonlocal added
        if service.has_lights():
            if not added:
                added = True
                async_add_entities(make())
            return
        added = False
        registry = er.async_get(hass)
        for unique_id in unique_ids:
            if unique_id is not None and (entity_id := registry.async_get_entity_id(platform, DOMAIN, unique_id)):
                registry.async_remove(entity_id)

    refresh()
    entry.async_on_unload(service.async_add_listener(refresh))
