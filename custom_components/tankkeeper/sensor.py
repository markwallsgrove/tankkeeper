"""Sensors for proposals waiting and the last water test."""

from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import TankkeeperConfigEntry
from .domain import Collection
from .entity import async_add_light_entities, tank_device
from .lights import LightChange, next_change
from .service import TankkeeperService

PARALLEL_UPDATES = 0


@dataclass(frozen=True, kw_only=True)
class TankkeeperSensorDescription(SensorEntityDescription):
    """A sensor and how it reads the records."""

    value: Callable[[TankkeeperService], int | datetime | None]


def _last_test(service: TankkeeperService) -> datetime | None:
    times = [
        moment
        for entry in service.records(Collection.LOG).values()
        if entry.get("kind") == "test"
        and entry.get("source") == "tank"
        and (moment := dt_util.parse_datetime(str(entry["time"]))) is not None
    ]
    return max(times, default=None)


SENSORS: tuple[TankkeeperSensorDescription, ...] = (
    TankkeeperSensorDescription(
        key="proposals_waiting",
        translation_key="proposals_waiting",
        state_class=SensorStateClass.MEASUREMENT,
        value=lambda service: len(service.pending_proposals()),
    ),
    TankkeeperSensorDescription(
        key="last_test",
        translation_key="last_test",
        device_class=SensorDeviceClass.TIMESTAMP,
        value=_last_test,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant, entry: TankkeeperConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    """Add the tank's sensors."""
    async_add_entities(TankkeeperSensor(entry, description) for description in SENSORS)
    async_add_light_entities(hass, entry, async_add_entities, "sensor", lambda: [NextLightChange(entry)])


class TankkeeperSensor(SensorEntity):
    """A sensor that updates whenever the records change."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    entity_description: TankkeeperSensorDescription

    def __init__(self, entry: TankkeeperConfigEntry, description: TankkeeperSensorDescription) -> None:
        """Attach the sensor to the tank's device."""
        self.entity_description = description
        self._service = entry.runtime_data
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = tank_device(entry.entry_id, entry.title)

    async def async_added_to_hass(self) -> None:
        """Update when the records change."""
        self.async_on_remove(self._service.async_add_listener(self.async_write_ha_state))

    @property
    def native_value(self) -> int | datetime | None:
        """The value from the records."""
        return self.entity_description.value(self._service)


class NextLightChange(SensorEntity):
    """When the schedule next turns a light on or off, and which lights."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = "next_light_change"
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, entry: TankkeeperConfigEntry) -> None:
        """Attach the sensor to the tank's device."""
        self._service = entry.runtime_data
        self._attr_unique_id = f"{entry.entry_id}_next_light_change"
        self._attr_device_info = tank_device(entry.entry_id, entry.title)

    async def async_added_to_hass(self) -> None:
        """Update when the records or the lights change."""
        self.async_on_remove(self._service.async_add_listener(self.async_write_ha_state))

    @property
    def native_value(self) -> datetime | None:
        """The time of the next change."""
        change = self._change()
        return None if change is None else change.time

    @property
    def extra_state_attributes(self) -> dict[str, list[str]]:
        """The entities the next change turns on and off."""
        change = self._change()
        return {
            "turns_on": [] if change is None else [light.entity_id for light in change.on],
            "turns_off": [] if change is None else [light.entity_id for light in change.off],
        }

    def _change(self) -> LightChange | None:
        return next_change(self._service.active_lights(), dt_util.now())
