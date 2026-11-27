"""Checks the status after every change and every hour, and alerts the status-alert devices when it changes."""

from datetime import datetime
import logging

from homeassistant.core import CALLBACK_TYPE, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_track_time_change

from .const import DOMAIN, discuss_action
from .rules import LEVEL_TITLES, Level, alert
from .service import TankkeeperService

_LOGGER = logging.getLogger(__name__)

NOTIFY_DOMAIN = "notify"
TAG = f"{DOMAIN}-status"


class StatusRunner:
    """Keeps the last status and sends an alert when it changes."""

    def __init__(self, hass: HomeAssistant, service: TankkeeperService) -> None:
        """Take the status now as the starting point, so a restart sends nothing."""
        self._hass = hass
        self._service = service
        self._last = service.status()

    @callback
    def start(self) -> CALLBACK_TYPE:
        """Check after every change and every hour. Returns a function that stops both."""
        stop_records = self._service.async_add_listener(self._check)
        stop_hourly = async_track_time_change(self._hass, self._hourly, minute=0, second=0)

        @callback
        def stop() -> None:
            stop_records()
            stop_hourly()

        return stop

    @callback
    def _hourly(self, now: datetime) -> None:
        if self._update():
            self._service.notify()

    @callback
    def _check(self) -> None:
        self._update()

    @callback
    def _update(self) -> bool:
        """Check the status and alert on a change. Returns whether any rule result changed."""
        before, after = self._last, self._service.status()
        self._last = after
        found = alert(before, after)
        if found is not None:
            self._hass.async_create_task(self._async_send(*found), eager_start=False)
        return before.results != after.results

    async def _async_send(self, level: Level, message: str) -> None:
        data = {
            "title": f"{self._service.tank_name()}: {LEVEL_TITLES[level]}",
            "message": message,
            "data": {"tag": TAG, "actions": [discuss_action("status", "now")]},
        }
        for device in self._service.reminders().status_notify:
            try:
                await self._hass.services.async_call(NOTIFY_DOMAIN, device, data, blocking=True)
            except HomeAssistantError as err:
                _LOGGER.warning("Could not send the status to %s: %s", device, err)
