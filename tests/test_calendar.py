"""calendar.tankkeeper shows the plan, and calendar edits go through the service layer."""

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.tankkeeper.domain import Collection, Source
from custom_components.tankkeeper.service import TankkeeperService

from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T12:10:00+00:00")]

CALENDAR = "calendar.tankkeeper"


async def _task(call: Caller, text: str, **args: str) -> str:
    applied = await apply(call, await call.ok("add_task", text=text, reason="Plan", **args))
    return str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])


async def _events(hass: HomeAssistant, start: str, end: str) -> list[dict[str, Any]]:
    response = await hass.services.async_call(
        "calendar",
        "get_events",
        {"start_date_time": start, "end_date_time": end},
        target={"entity_id": CALENDAR},
        blocking=True,
        return_response=True,
    )
    assert response is not None
    events = dict_of(response[CALENDAR])["events"]
    assert isinstance(events, list)
    return [dict(dict_of(event)) for event in events]


async def _ws(hass_ws_client: WebSocketGenerator, hass: HomeAssistant, message: dict[str, Any]) -> dict[str, Any]:
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"entity_id": CALENDAR, **message})
    result: dict[str, Any] = await client.receive_json()
    return result


def _service(entry: MockConfigEntry) -> TankkeeperService:
    service: TankkeeperService = entry.runtime_data
    return service


def _tasks(entry: MockConfigEntry) -> list[dict[str, object]]:
    return [dict(record) for record in _service(entry).records(Collection.TASKS).values()]


async def test_calendar_belongs_to_the_tank(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, entity_registry: er.EntityRegistry
) -> None:
    entity = entity_registry.async_get(CALENDAR)

    assert entity is not None
    assert entity.unique_id == "entry1_calendar"
    assert entity.translation_key == "plan"
    state = hass.states.get(CALENDAR)
    assert state is not None
    assert state.state == "off"


async def test_tasks_are_events_at_their_slot_times(hass: HomeAssistant, call: Caller) -> None:
    await _product(call, "Bio-CO2")
    dose = await _task(call, "Bio-CO2 1.5 ml")
    task = await _task(call, "Water change 25%", date="2026-11-27")
    await call.ok("complete_task", task_id=dose, note="Light was on")
    await hass.async_block_till_done()

    events = await _events(hass, "2026-11-26T00:00:00+00:00", "2026-11-28T00:00:00+00:00")

    assert events == [
        {
            "start": "2026-11-26T12:00:00+00:00",
            "end": "2026-11-26T12:30:00+00:00",
            "summary": "Complete: Bio-CO2 1.5 ml",
            "description": "Light was on",
        },
        {
            "start": "2026-11-27T09:00:00+00:00",
            "end": "2026-11-27T09:30:00+00:00",
            "summary": "Water change 25%",
        },
    ]
    state = hass.states.get(CALENDAR)
    assert state is not None
    assert state.state == "on"
    assert state.attributes["message"] == "Complete: Bio-CO2 1.5 ml"
    assert task


async def test_the_next_event_is_shown_when_none_is_on(hass: HomeAssistant, call: Caller) -> None:
    await _task(call, "Earlier", date="2026-11-25")
    await _task(call, "Water change 25%", date="2026-11-27")
    await hass.async_block_till_done()

    state = hass.states.get(CALENDAR)
    assert state is not None
    assert state.state == "off"
    assert state.attributes["message"] == "Water change 25%"
    assert state.attributes["start_time"] == "2026-11-27 09:00:00"


async def test_create_from_the_calendar_ui(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, hass_ws_client: WebSocketGenerator
) -> None:
    await _product(call, "Bio-CO2")

    for event in (
        {"summary": "Trim plants", "dtstart": "2026-11-28", "dtend": "2026-11-29", "description": "Back left"},
        {"summary": "Feed", "dtstart": "2026-11-28T12:00:00+00:00", "dtend": "2026-11-28T12:30:00+00:00"},
        {"summary": "Skip: Bio-CO2 1.5 ml", "dtstart": "2026-11-29", "dtend": "2026-11-30"},
        {"summary": "Test water", "dtstart": "2026-11-29T15:00:00+00:00", "dtend": "2026-11-29T15:30:00+00:00"},
    ):
        result = await _ws(hass_ws_client, hass, {"type": "calendar/event/create", "event": event})
        assert result["success"], result

    tasks = sorted(_tasks(loaded_entry), key=lambda task: (str(task["date"]), str(task["text"])))
    assert [(task["date"], task["slot"], task["text"], task["state"], task["note"]) for task in tasks] == [
        ("2026-11-28", "dose", "Feed", "open", ""),
        ("2026-11-28", "task", "Trim plants", "open", "Back left"),
        ("2026-11-29", "dose", "Bio-CO2 1.5 ml", "skip", ""),
        ("2026-11-29", "task", "Test water", "open", ""),
    ]
    [latest] = _service(loaded_entry).history(Collection.TASKS, None, 1)
    assert latest.source is Source.PANEL


async def test_repeating_events_are_refused(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    event = {"summary": "Feed", "dtstart": "2026-11-28", "dtend": "2026-11-29", "rrule": "FREQ=DAILY"}

    result = await _ws(hass_ws_client, hass, {"type": "calendar/event/create", "event": event})

    assert not result["success"]
    assert result["error"]["message"] == "TankKeeper tasks can't repeat. Add one task for each day"
    assert _tasks(loaded_entry) == []


async def test_update_from_the_calendar_ui(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, hass_ws_client: WebSocketGenerator
) -> None:
    task_id = await _task(call, "Water change 25%")

    result = await _ws(
        hass_ws_client,
        hass,
        {
            "type": "calendar/event/update",
            "uid": task_id,
            "event": {
                "summary": "Complete: Water change 30%",
                "dtstart": "2026-11-27",
                "dtend": "2026-11-28",
                "description": "Cloudy",
            },
        },
    )

    assert result["success"], result
    [task] = _tasks(loaded_entry)
    assert task == {
        "date": "2026-11-27",
        "slot": "task",
        "text": "Water change 30%",
        "state": "complete",
        "note": "Cloudy",
        "done_at": "2026-11-26T12:10:00+00:00",
    }

    reopened = await _ws(
        hass_ws_client,
        hass,
        {
            "type": "calendar/event/update",
            "uid": task_id,
            "event": {"summary": "Water change 30%", "dtstart": "2026-11-27", "dtend": "2026-11-28"},
        },
    )

    assert reopened["success"], reopened
    [task] = _tasks(loaded_entry)
    assert (task["state"], task["done_at"], task["note"]) == ("open", None, "")


async def test_update_keeps_the_done_time_while_the_state_stays(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, hass_ws_client: WebSocketGenerator
) -> None:
    task_id = await _task(call, "Water change 25%")
    await call.ok("skip_task", task_id=task_id, note="Away")
    [before] = _tasks(loaded_entry)

    result = await _ws(
        hass_ws_client,
        hass,
        {
            "type": "calendar/event/update",
            "uid": task_id,
            "event": {
                "summary": "Skip: Water change 25%",
                "dtstart": "2026-11-26T09:00:00+00:00",
                "dtend": "2026-11-26T09:30:00+00:00",
                "description": "Away all day",
            },
        },
    )

    assert result["success"], result
    [task] = _tasks(loaded_entry)
    assert task == {**before, "note": "Away all day"}


async def test_update_errors_are_translated(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, hass_ws_client: WebSocketGenerator
) -> None:
    task_id = await _task(call, "Water change 25%")
    unchanged = {"summary": "Water change 25%", "dtstart": "2026-11-26", "dtend": "2026-11-27"}

    missing = await _ws(hass_ws_client, hass, {"type": "calendar/event/update", "uid": "missing", "event": unchanged})
    same = await _ws(hass_ws_client, hass, {"type": "calendar/event/update", "uid": task_id, "event": unchanged})
    repeat = await _ws(
        hass_ws_client,
        hass,
        {"type": "calendar/event/update", "uid": task_id, "event": {**unchanged, "rrule": "FREQ=WEEKLY"}},
    )

    assert missing["error"]["message"] == "No tasks record with id missing"
    assert same["error"]["message"] == "The records already look like that"
    assert repeat["error"]["message"] == "TankKeeper tasks can't repeat. Add one task for each day"


async def test_delete_from_the_calendar_ui(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, hass_ws_client: WebSocketGenerator
) -> None:
    task_id = await _task(call, "Water change 25%")

    result = await _ws(hass_ws_client, hass, {"type": "calendar/event/delete", "uid": task_id})
    missing = await _ws(hass_ws_client, hass, {"type": "calendar/event/delete", "uid": task_id})

    assert result["success"], result
    assert _tasks(loaded_entry) == []
    assert not missing["success"]
    assert _service(loaded_entry).history(Collection.TASKS, task_id, 1)[0].summary == (
        "Remove the task Water change 25% on 2026-11-26"
    )


async def _product(call: Caller, name: str) -> None:
    await apply(call, await call.ok("add_product", name=name, reason="Fertiliser"))
