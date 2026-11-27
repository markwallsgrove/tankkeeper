"""Reminders to the notify services at the task times, with Complete and Skip actions."""

from collections.abc import Awaitable, Callable, Iterable
from datetime import datetime, time
import logging

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .domain import Source, TankkeeperError
from .plan import (
    Slot,
    Task,
    TaskStatus,
    action_for,
    parse_action,
    tasks_due,
    tasks_open_on,
    tasks_overdue,
)
from .service import Actor, TankkeeperService

_LOGGER = logging.getLogger(__name__)

NOTIFY_DOMAIN = "notify"
ACTION_EVENT = "mobile_app_notification_action"
CLEAR_MESSAGE = "clear_notification"
TODO_URL = f"/todo?entity_id=todo.{DOMAIN}_today"
NOT_COMPLETE = "not complete yet"
NOT_CONFIRMED = "not confirmed"


def tag_for(task_id: str) -> str:
    """The notification tag for a task. A newer notification with the same tag replaces the old one."""
    return f"{DOMAIN}-{task_id}"


class ReminderSender:
    """Sends reminders at the set times and records the Complete and Skip actions."""

    def __init__(self, hass: HomeAssistant, service: TankkeeperService) -> None:
        """Keep what the sender needs. Nothing runs until start."""
        self._hass = hass
        self._service = service
        self._reminders = service.reminders_on(dt_util.now().date())
        self._timers: list[CALLBACK_TYPE] = []
        self._sent: set[str] = set()

    @callback
    def start(self) -> CALLBACK_TYPE:
        """Start the timers and listeners. Returns a function that stops them all."""
        self._schedule()
        stop_records = self._service.async_add_listener(self._records_changed)
        stop_actions = self._hass.bus.async_listen(ACTION_EVENT, self._async_action)
        stop_midnight = async_track_time_change(self._hass, self._midnight, hour=0, minute=0, second=0)

        @callback
        def stop() -> None:
            stop_records()
            stop_actions()
            stop_midnight()
            self._cancel_timers()

        return stop

    @callback
    def _schedule(self) -> None:
        self._cancel_timers()
        reminders = self._reminders
        for at, handler in (
            (reminders.task_time, self._async_task_time),
            (reminders.dose_time, self._async_dose_time),
            (reminders.resend_time, self._async_resend_time),
        ):
            self._timers.append(_track(self._hass, at, handler))

    @callback
    def _cancel_timers(self) -> None:
        for cancel in self._timers:
            cancel()
        self._timers.clear()

    async def _async_task_time(self, now: datetime) -> None:
        today = dt_util.as_local(now).date()
        tasks = self._service.tasks()
        await self._async_send(tasks_due(tasks, today, Slot.TASK), None)
        await self._async_send(tasks_overdue(tasks, today, self._service.reminders_on), NOT_CONFIRMED)

    async def _async_dose_time(self, now: datetime) -> None:
        await self._async_send(tasks_due(self._service.tasks(), dt_util.as_local(now).date(), Slot.DOSE), None)

    async def _async_resend_time(self, now: datetime) -> None:
        await self._async_send(
            tasks_open_on(self._service.tasks(), dt_util.as_local(now).date(), self._reminders), NOT_COMPLETE
        )

    async def _async_send(self, tasks: Iterable[Task], status: str | None) -> None:
        name = self._service.tank_name()
        title = name if status is None else f"{name}: {status}"
        for task in tasks:
            self._sent.add(task.id)
            await self._async_notify(
                {
                    "message": task.text,
                    "title": title,
                    "data": {
                        "tag": tag_for(task.id),
                        "url": TODO_URL,
                        "actions": [
                            {"action": action_for(TaskStatus.COMPLETE, task.id), "title": "Complete"},
                            {"action": action_for(TaskStatus.SKIP, task.id), "title": "Skip"},
                        ],
                    },
                }
            )

    async def _async_clear(self, task_id: str) -> None:
        self._sent.discard(task_id)
        await self._async_notify({"message": CLEAR_MESSAGE, "data": {"tag": tag_for(task_id)}})

    async def _async_notify(self, data: dict[str, object]) -> None:
        for device in self._reminders.notify:
            try:
                await self._hass.services.async_call(NOTIFY_DOMAIN, device, data, blocking=True)
            except HomeAssistantError as err:
                _LOGGER.warning("Could not notify %s: %s", device, err)

    @callback
    def _midnight(self, now: datetime) -> None:
        self._reschedule()

    @callback
    def _reschedule(self) -> None:
        """Move the timers when today's times differ, as when a light sets the dose time."""
        reminders = self._service.reminders_on(dt_util.now().date())
        if reminders != self._reminders:
            self._reminders = reminders
            self._schedule()

    @callback
    def _records_changed(self) -> None:
        self._reschedule()
        open_ids = {task.id for task in self._service.tasks() if task.status is TaskStatus.OPEN}
        for task_id in sorted(self._sent - open_ids):
            self._sent.discard(task_id)
            self._hass.async_create_task(self._async_clear(task_id), eager_start=False)

    async def _async_action(self, event: Event) -> None:
        parsed = parse_action(str(event.data.get("action") or ""))
        if parsed is None:
            return
        status, task_id = parsed
        note = event.data.get("reply_text")
        actor = Actor(source=Source.PANEL, user_id=event.context.user_id, conversation_id=None)
        self._sent.add(task_id)
        try:
            await self._service.async_finish_task(task_id, status, None if note is None else str(note), actor)
        except TankkeeperError:
            await self._async_clear(task_id)


def _track(hass: HomeAssistant, at: time, handler: Callable[[datetime], Awaitable[None]]) -> CALLBACK_TYPE:
    async def run(now: datetime) -> None:
        await handler(now)

    return async_track_time_change(hass, run, hour=at.hour, minute=at.minute, second=0)
