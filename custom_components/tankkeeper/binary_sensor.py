"""A problem sensor that is on while a light does not follow its schedule."""

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.components.binary_sensor.const import BinarySensorDeviceClass
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import TankkeeperConfigEntry
from .entity import async_add_light_entities, tank_device

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant, entry: TankkeeperConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    """Add the light problem sensor while a light is set."""
    async_add_light_entities(hass, entry, async_add_entities, "binary_sensor", lambda: [LightProblem(entry)])


class LightProblem(BinarySensorEntity):
    """On while a light's entity is unavailable or the schedule missed a change."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = "light_problem"
    _attr_device_class = BinarySensorDeviceClass.PROBLEM

    def __init__(self, entry: TankkeeperConfigEntry) -> None:
        """Attach the sensor to the tank's device."""
        self._service = entry.runtime_data
        self._attr_unique_id = f"{entry.entry_id}_light_problem"
        self._attr_device_info = tank_device(entry.entry_id, entry.title)

    async def async_added_to_hass(self) -> None:
        """Update when the records or the lights change."""
        self.async_on_remove(self._service.async_add_listener(self.async_write_ha_state))

    @property
    def is_on(self) -> bool:
        """Whether a light is not following its schedule."""
        return bool(self._problems())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Each light with a problem, and what the problem is."""
        return {"problems": self._problems()}

    def _problems(self) -> list[dict[str, Any]]:
        return [
            {"light_id": light.id, "entity_id": light.entity_id, "model": light.model, **status.to_json()}
            for light in self._service.active_lights()
            if (status := self._service.light_status(light.id)).problem
        ]
