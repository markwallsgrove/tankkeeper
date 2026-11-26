"""calendar.tankkeeper: the plan's tasks as events. Edits in the calendar go through the service layer."""

from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.components.calendar.const import CalendarEntityFeature
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util
from homeassistant.util.ulid import ulid_now

from . import TankkeeperConfigEntry
from .const import DOMAIN
from .domain import Collection, Source, TankkeeperError
from .entity import change_failed, tank_device
from .plan import (
    Reminders,
    Slot,
    Task,
    add_summary,
    change_summary,
    parse_summary,
    remove_summary,
    slot_for,
    sort_tasks,
    summary_for,
)
from .service import Actor

PARALLEL_UPDATES = 0
TRANSLATION_KEY = "plan"
EVENT_LENGTH = timedelta(minutes=30)
PANEL = Actor(source=Source.PANEL, user_id=None, conversation_id=None)


async def async_setup_entry(
    hass: HomeAssistant, entry: TankkeeperConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    """Add the tank's calendar."""
    async_add_entities([TankkeeperCalendar(entry)])


class TankkeeperCalendar(CalendarEntity):
    """Each task is a 30 minute event at its slot time."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = TRANSLATION_KEY
    _attr_supported_features = (
        CalendarEntityFeature.CREATE_EVENT | CalendarEntityFeature.UPDATE_EVENT | CalendarEntityFeature.DELETE_EVENT
    )

    def __init__(self, entry: TankkeeperConfigEntry) -> None:
        """Attach the calendar to the tank's device."""
        self._service = entry.runtime_data
        self.entity_id = f"calendar.{DOMAIN}"
        self._attr_unique_id = f"{entry.entry_id}_calendar"
        self._attr_device_info = tank_device(entry.entry_id, entry.title)

    async def async_added_to_hass(self) -> None:
        """Update when the records change."""
        self.async_on_remove(self._service.async_add_listener(self.async_write_ha_state))

    @property
    def event(self) -> CalendarEvent | None:
        """The event on now, or else the next one."""
        now = dt_util.now()
        return next((event for event in self._events() if event.end > now), None)

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        """Events that overlap the range."""
        return [event for event in self._events() if event.start < end_date and event.end > start_date]

    async def async_create_event(self, **kwargs: Any) -> None:
        """Add a task. A Complete: or Skip: title adds it done."""
        _refuse_repeats(kwargs)
        reminders = self._service.reminders()
        status, text = parse_summary(str(kwargs["summary"]))
        start: date = kwargs["dtstart"]
        task = Task(
            id=ulid_now(),
            day=_day(start),
            slot=_slot(start, reminders, slot_for(text, self._service.product_names())),
            text=text,
            note=str(kwargs.get("description") or ""),
        ).edit(status=status, now=self._service.now())
        await self._async_set(task.id, task, add_summary(task))

    async def async_update_event(
        self,
        uid: str,
        event: dict[str, Any],
        recurrence_id: str | None = None,
        recurrence_range: str | None = None,
    ) -> None:
        """Change a task. The title prefix sets its state."""
        _refuse_repeats(event)
        try:
            current = self._service.task(uid)
        except TankkeeperError as err:
            raise change_failed(err) from err
        status, text = parse_summary(str(event["summary"]))
        start: date = event["dtstart"]
        task = current.edit(
            now=self._service.now(),
            text=text,
            day=_day(start),
            slot=_slot(start, self._service.reminders(), current.slot),
            status=status,
            note=str(event.get("description") or ""),
        )
        await self._async_set(uid, task, change_summary(task))

    async def async_delete_event(
        self, uid: str, recurrence_id: str | None = None, recurrence_range: str | None = None
    ) -> None:
        """Take a task out of the plan."""
        try:
            task = self._service.task(uid)
        except TankkeeperError as err:
            raise change_failed(err) from err
        await self._async_set(uid, None, remove_summary(task))

    async def _async_set(self, task_id: str, task: Task | None, summary: str) -> None:
        try:
            await self._service.async_set(
                [(Collection.TASKS, task_id, None if task is None else task.to_record())], PANEL, summary
            )
        except TankkeeperError as err:
            raise change_failed(err) from err

    def _events(self) -> list[CalendarEvent]:
        reminders = self._service.reminders()
        return [_event(task, reminders) for task in sort_tasks(self._service.tasks(), reminders)]


def _event(task: Task, reminders: Reminders) -> CalendarEvent:
    start = datetime.combine(task.day, reminders.slot_time(task.slot), dt_util.get_default_time_zone())
    return CalendarEvent(
        start=start,
        end=start + EVENT_LENGTH,
        summary=summary_for(task),
        description=task.note or None,
        uid=task.id,
    )


def _refuse_repeats(event: dict[str, Any]) -> None:
    if event.get("rrule"):
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="repeat_not_supported")


def _day(start: date) -> date:
    return dt_util.as_local(start).date() if isinstance(start, datetime) else start


def _slot(start: date, reminders: Reminders, default: Slot) -> Slot:
    """The slot whose time the event starts at, or the default for an all-day event or another time."""
    if isinstance(start, datetime):
        at = dt_util.as_local(start).time().replace(second=0, microsecond=0)
        for slot in (Slot.DOSE, Slot.TASK):
            if at == reminders.slot_time(slot):
                return slot
    return default
