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
from .entity import tank_device
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
