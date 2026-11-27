"""With a light, doses are due when the light turns on. Without one they use the dose time setting."""

from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
import pytest
from pytest_homeassistant_custom_component.common import async_fire_time_changed, async_mock_service

from .common import PLUG, Caller, Devices, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

PHONE = "mobile_app_phone"


async def _light(call: Caller) -> str:
    proposal = await call.ok(
        "set_light", action="add", entity_id=PLUG, model="LED 10120", on="11:00", off="20:00", reason="Light"
    )
    applied = await apply(call, proposal)
    await call.hass.async_block_till_done(wait_background_tasks=True)
    light_id = str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])
    await apply(
        call,
        await call.ok("set_light", action="one_day", light_id=light_id, date="2026-11-27", on="10:30", reason="Early"),
    )
    return light_id


async def _doses(call: Caller) -> list[str]:
    await apply(call, await call.ok("add_product", name="Bio-CO2", reason="Fertiliser"))
    ids = []
    for day in ("2026-11-26", "2026-11-27"):
        applied = await apply(call, await call.ok("add_task", text="Bio-CO2 1.5 ml", date=day, reason="Plan"))
        ids.append(str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"]))
    return ids


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def test_the_plan_shows_doses_at_light_on(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    await _doses(call)
    before = await call.ok("get_plan")
    await _light(call)

    after = await call.ok("get_plan")

    assert [dict_of(task)["time"] for task in list_of(before["tasks"])] == ["12:00", "12:00"]
    assert [dict_of(task)["time"] for task in list_of(after["tasks"])] == ["11:00", "10:30"]
    assert dict_of(after["reminders"])["dose_time"] == "12:00"


async def test_the_calendar_and_todo_show_doses_at_light_on(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    await _doses(call)
    await _light(call)

    response = await hass.services.async_call(
        "calendar",
        "get_events",
        {"start_date_time": "2026-11-26T00:00:00+00:00", "end_date_time": "2026-11-28T00:00:00+00:00"},
        target={"entity_id": "calendar.tankkeeper"},
        blocking=True,
        return_response=True,
    )
    assert response is not None
    events: list[Any] = list_of(dict_of(response["calendar.tankkeeper"])["events"])
    items_response = await hass.services.async_call(
        "todo", "get_items", target={"entity_id": "todo.tankkeeper_today"}, blocking=True, return_response=True
    )
    assert items_response is not None
    items: list[Any] = list_of(dict_of(items_response["todo.tankkeeper_today"])["items"])

    assert [event["start"] for event in events] == ["2026-11-26T11:00:00+00:00", "2026-11-27T10:30:00+00:00"]
    assert [item["due"] for item in items] == ["2026-11-26T11:00:00+00:00"]


def _due(phone: list[ServiceCall]) -> list[str]:
    """The message of each first reminder. Follow-ups and resends have a status in the title."""
    return [str(sent.data["message"]) for sent in phone if sent.data.get("title") == "Nano"]


async def test_dose_reminders_follow_the_light(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    phone: list[ServiceCall] = async_mock_service(hass, "notify", PHONE)
    plugs.add(PLUG)
    await apply(call, await call.ok("set_reminders", notify=[PHONE], reason="Phone"))
    await _doses(call)
    light_id = await _light(call)

    await _at(hass, freezer, "2026-11-26T11:00:00+00:00")
    assert _due(phone) == ["Bio-CO2 1.5 ml"]
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert _due(phone) == ["Bio-CO2 1.5 ml"]
    await _at(hass, freezer, "2026-11-27T10:00:00+00:00")
    assert _due(phone) == ["Bio-CO2 1.5 ml"]
    await _at(hass, freezer, "2026-11-27T10:30:00+00:00")
    assert _due(phone) == ["Bio-CO2 1.5 ml", "Bio-CO2 1.5 ml"]

    await apply(call, await call.ok("set_light", action="remove", light_id=light_id, reason="Gone"))
    await hass.async_block_till_done(wait_background_tasks=True)
    await apply(call, await call.ok("add_task", text="Bio-CO2 1.5 ml", date="2026-11-28", reason="Plan"))
    await _at(hass, freezer, "2026-11-27T13:00:00+00:00")
    phone.clear()
    await _at(hass, freezer, "2026-11-28T11:00:00+00:00")
    assert _due(phone) == []
    await _at(hass, freezer, "2026-11-28T12:00:00+00:00")
    assert _due(phone) == ["Bio-CO2 1.5 ml"]
