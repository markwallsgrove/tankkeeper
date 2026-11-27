"""todo.tankkeeper_today: today's tasks. Ticking an item completes its task."""

from datetime import datetime

from homeassistant.components.todo.const import TodoItemStatus, TodoListEntityFeature
from homeassistant.components.todo.entity import TodoItem, TodoListEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from . import TankkeeperConfigEntry
from .const import DOMAIN
from .domain import Collection, Source, TankkeeperError
from .entity import change_failed, tank_device
from .plan import TaskStatus, change_summary, parse_todo_description, sort_tasks, todo_description
from .service import Actor

PARALLEL_UPDATES = 0
TRANSLATION_KEY = "today"
PANEL = Actor(source=Source.PANEL, user_id=None, conversation_id=None)


async def async_setup_entry(
    hass: HomeAssistant, entry: TankkeeperConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    """Add the tank's to-do list."""
    async_add_entities([TankkeeperTodo(entry)])


class TankkeeperTodo(TodoListEntity):
    """Today's tasks. Done and skipped tasks show as completed."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = TRANSLATION_KEY
    _attr_supported_features = TodoListEntityFeature.UPDATE_TODO_ITEM | TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM

    def __init__(self, entry: TankkeeperConfigEntry) -> None:
        """Attach the list to the tank's device."""
        self._service = entry.runtime_data
        self.entity_id = f"todo.{DOMAIN}_today"
        self._attr_unique_id = f"{entry.entry_id}_today"
        self._attr_device_info = tank_device(entry.entry_id, entry.title)
        self._attr_todo_items = self._items()

    async def async_added_to_hass(self) -> None:
        """Update when the records change, and at midnight."""
        self.async_on_remove(self._service.async_add_listener(self._async_refresh))
        self.async_on_remove(async_track_time_change(self.hass, self._async_midnight, hour=0, minute=0, second=0))

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Complete, skip, reopen, rename or note a task. A description that starts with Skip skips it."""
        try:
            current = self._service.task(str(item.uid))
            skip, note = parse_todo_description(item.description)
            if item.status == TodoItemStatus.COMPLETED:
                status = TaskStatus.SKIP if skip else TaskStatus.COMPLETE
            else:
                status = TaskStatus.OPEN
            task = current.edit(now=self._service.now(), text=item.summary, status=status, note=note)
            await self._service.async_set([(Collection.TASKS, task.id, task.to_record())], PANEL, change_summary(task))
        except TankkeeperError as err:
            raise change_failed(err) from err

    @callback
    def _async_refresh(self) -> None:
        self._attr_todo_items = self._items()
        self.async_write_ha_state()

    @callback
    def _async_midnight(self, now: datetime) -> None:
        self._async_refresh()

    def _items(self) -> list[TodoItem]:
        today = dt_util.now().date()
        reminders = self._service.reminders_on(today)
        tasks = sort_tasks((task for task in self._service.tasks() if task.day == today), lambda _: reminders)
        return [
            TodoItem(
                uid=task.id,
                summary=task.text,
                status=TodoItemStatus.NEEDS_ACTION if task.status is TaskStatus.OPEN else TodoItemStatus.COMPLETED,
                due=datetime.combine(task.day, reminders.slot_time(task.slot), dt_util.get_default_time_zone()),
                description=todo_description(task),
            )
            for task in tasks
        ]
