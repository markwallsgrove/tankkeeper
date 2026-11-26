"""The to-do list shows today's tasks. Ticking an item completes its task."""

from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.tankkeeper.domain import Collection, Source
from custom_components.tankkeeper.service import TankkeeperService

from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")]

TODO = "todo.tankkeeper_today"


async def _task(call: Caller, text: str, **args: str) -> str:
    applied = await apply(call, await call.ok("add_task", text=text, reason="Plan", **args))
    return str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])


async def _items(hass: HomeAssistant) -> list[dict[str, Any]]:
    response = await hass.services.async_call(
        "todo", "get_items", target={"entity_id": TODO}, blocking=True, return_response=True
    )
    assert response is not None
    items = dict_of(response[TODO])["items"]
    assert isinstance(items, list)
    return [dict(dict_of(item)) for item in items]


async def _update(hass: HomeAssistant, item: str, **data: str) -> None:
    await hass.services.async_call(
        "todo", "update_item", {"item": item, **data}, target={"entity_id": TODO}, blocking=True
    )


def _task_record(entry: MockConfigEntry, task_id: str) -> dict[str, object]:
    service: TankkeeperService = entry.runtime_data
    return dict(service.records(Collection.TASKS)[task_id])


def _state(hass: HomeAssistant) -> str:
    state = hass.states.get(TODO)
    assert state is not None
    return state.state


async def test_todo_belongs_to_the_tank(loaded_entry: MockConfigEntry, entity_registry: er.EntityRegistry) -> None:
    entity = entity_registry.async_get(TODO)

    assert entity is not None
    assert entity.unique_id == "entry1_today"
    assert entity.translation_key == "today"


async def test_shows_todays_tasks_only(hass: HomeAssistant, call: Caller) -> None:
    water = await _task(call, "Water change 25%")
    skipped = await _task(call, "Trim plants")
    done = await _task(call, "Test water")
    await _task(call, "Tomorrow", date="2026-11-27")
    await call.ok("skip_task", task_id=skipped, note="Away")
    await call.ok("complete_task", task_id=done)
    await hass.async_block_till_done()

    items = await _items(hass)

    assert items == [
        {"uid": done, "summary": "Test water", "status": "completed", "due": "2026-11-26T09:00:00+00:00"},
        {
            "uid": skipped,
            "summary": "Trim plants",
            "status": "completed",
            "due": "2026-11-26T09:00:00+00:00",
            "description": "Skip: Away",
        },
        {"uid": water, "summary": "Water change 25%", "status": "needs_action", "due": "2026-11-26T09:00:00+00:00"},
    ]
    assert _state(hass) == "1"


async def test_ticking_an_item_completes_its_task(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    task_id = await _task(call, "Water change 25%")
    await hass.async_block_till_done()

    await _update(hass, task_id, status="completed")

    task = _task_record(loaded_entry, task_id)
    assert (task["state"], task["done_at"]) == ("complete", "2026-11-26T12:00:00+00:00")
    service: TankkeeperService = loaded_entry.runtime_data
    [latest] = service.history(Collection.TASKS, task_id, 1)
    assert latest.source is Source.PANEL
    assert _state(hass) == "0"


async def test_a_skip_description_skips_the_task(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    task_id = await _task(call, "Water change 25%")
    await hass.async_block_till_done()

    await _update(hass, "Water change 25%", status="completed", description="skip: away all day")

    task = _task_record(loaded_entry, task_id)
    assert (task["state"], task["note"]) == ("skip", "away all day")


async def test_unticking_reopens_and_renaming_changes_the_text(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    task_id = await _task(call, "Water change 25%")
    await call.ok("complete_task", task_id=task_id, note="Cloudy")
    await hass.async_block_till_done()

    await _update(hass, task_id, status="needs_action", rename="Water change 30%")

    task = _task_record(loaded_entry, task_id)
    assert (task["state"], task["done_at"], task["text"], task["note"]) == ("open", None, "Water change 30%", "Cloudy")


async def test_editing_a_done_item_keeps_it_done(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    task_id = await _task(call, "Water change 25%")
    await call.ok("skip_task", task_id=task_id, note="Away")
    await hass.async_block_till_done()
    before = _task_record(loaded_entry, task_id)

    await _update(hass, task_id, description="Skip: Away all week")

    assert _task_record(loaded_entry, task_id) == {**before, "note": "Away all week"}
    with pytest.raises(HomeAssistantError, match="The records already look like that"):
        await _update(hass, task_id, description="Skip: Away all week")


async def test_the_list_moves_to_the_next_day_at_midnight(
    hass: HomeAssistant, call: Caller, freezer: FrozenDateTimeFactory
) -> None:
    await _task(call, "Today")
    await _task(call, "Tomorrow", date="2026-11-27")
    await hass.async_block_till_done()
    assert [item["summary"] for item in await _items(hass)] == ["Today"]

    freezer.move_to("2026-11-27T00:00:00+00:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()

    assert [item["summary"] for item in await _items(hass)] == ["Tomorrow"]
