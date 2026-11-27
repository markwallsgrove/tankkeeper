"""The plan and reminder tools end to end, through Home Assistant's LLM API."""

from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.util.json import JsonObjectType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")]

FISH_TANK = "calendar.fish_tank"


async def _task(call: Caller, text: str = "Water change 25%", **args: str) -> str:
    applied = await apply(call, await call.ok("add_task", text=text, reason="Weekly", **args))
    change = dict_of(list_of(dict_of(applied["history"])["changes"])[0])
    return str_of(change["record_id"])


async def _plan(call: Caller, **args: str) -> list[JsonObjectType]:
    return [dict_of(task) for task in list_of((await call.ok("get_plan", **args))["tasks"])]


async def _product(call: Caller, name: str) -> None:
    await apply(call, await call.ok("add_product", name=name, reason="Fertiliser"))


async def _fish_tank(hass: HomeAssistant, config_dir: Path) -> None:
    (config_dir / ".storage").mkdir()
    hass.config.config_dir = str(config_dir)
    entry = MockConfigEntry(domain="local_calendar", data={"calendar_name": "Fish tank"})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    for day, end, summary, description in (
        ("2026-11-24", "2026-11-25", "Complete: Water change 25%", "Complete: done. Notes: cloudy"),
        ("2026-11-25", "2026-11-26", "Skip: Plants Green 2 ml", ""),
        ("2026-11-26", "2026-11-27", "To do: Bio-CO2 1.5 ml, Trim plants", "Why: growth"),
        ("2026-12-20", "2026-12-21", "To do: Clean filter", ""),
    ):
        await hass.services.async_call(
            "calendar",
            "create_event",
            {"summary": summary, "description": description, "start_date": day, "end_date": end},
            target={"entity_id": FISH_TANK},
            blocking=True,
        )


async def test_get_plan_shows_the_next_week_with_slot_times(call: Caller) -> None:
    await _product(call, "Bio-CO2")
    dose = await _task(call, "Bio-CO2 1.5 ml")
    task = await _task(call, "Trim plants", date="2026-11-27")
    await _task(call, "Clean filter", date="2026-12-03")
    await _task(call, "Old task", date="2026-11-25")

    plan = await call.ok("get_plan")

    assert plan["start"] == "2026-11-26"
    assert plan["end"] == "2026-12-02"
    assert plan["tasks"] == [
        {
            "id": dose,
            "date": "2026-11-26",
            "slot": "dose",
            "time": "12:00",
            "text": "Bio-CO2 1.5 ml",
            "state": "open",
            "note": "",
            "done_at": None,
            "series_id": None,
        },
        {
            "id": task,
            "date": "2026-11-27",
            "slot": "task",
            "time": "09:00",
            "text": "Trim plants",
            "state": "open",
            "note": "",
            "done_at": None,
            "series_id": None,
        },
    ]
    assert plan["reminders"] == {
        "notify": [],
        "task_time": "09:00",
        "dose_time": "12:00",
        "resend_time": "21:00",
        "status_notify": [],
    }


async def test_get_plan_takes_a_range(call: Caller) -> None:
    await _task(call, "Old task", date="2026-11-20")
    await _task(call, "Later", date="2026-12-20")

    assert [task["text"] for task in await _plan(call, start="2026-11-01", end="2026-11-30")] == ["Old task"]
    assert await call.error("get_plan", start="2026-12-01", end="2026-11-01") == "invalid_input"
    assert await call.error("get_plan", start="Monday") == "invalid_input"


async def test_add_task_changes_nothing_until_applied(call: Caller) -> None:
    proposal = await call.ok("add_task", text="Trim plants", slot="dose", reason="Overgrown")

    assert proposal["tool"] == "add_task"
    assert proposal["summary"] == "Add the task Trim plants on 2026-11-26"
    assert await _plan(call) == []

    await apply(call, proposal)

    [task] = await _plan(call)
    assert (task["text"], task["slot"], task["state"]) == ("Trim plants", "dose", "open")


async def test_update_task_changes_the_fields_given(call: Caller) -> None:
    task_id = await _task(call)

    await apply(
        call,
        await call.ok(
            "update_task", task_id=task_id, text="Water change 30%", date="2026-11-27", note="Use RO", reason="Bigger"
        ),
    )

    [task] = await _plan(call)
    assert (task["text"], task["date"], task["note"], task["slot"]) == (
        "Water change 30%",
        "2026-11-27",
        "Use RO",
        "task",
    )
    assert await call.error("update_task", task_id=task_id, reason="Nothing") == "nothing_to_change"
    assert await call.error("update_task", task_id="missing", text="X", reason="Gone") == "not_found"


async def test_update_task_can_reopen_a_done_task(call: Caller) -> None:
    task_id = await _task(call)
    await call.ok("skip_task", task_id=task_id)

    await apply(call, await call.ok("update_task", task_id=task_id, state="open", reason="Skipped by mistake"))

    [task] = await _plan(call)
    assert (task["state"], task["done_at"]) == ("open", None)


async def test_update_task_can_mark_a_task_done(call: Caller) -> None:
    task_id = await _task(call)

    await apply(call, await call.ok("update_task", task_id=task_id, state="complete", reason="Did it yesterday"))

    [task] = await _plan(call)
    assert (task["state"], task["done_at"]) == ("complete", "2026-11-26T12:00:00+00:00")


async def test_remove_task(call: Caller) -> None:
    task_id = await _task(call)

    proposal = await call.ok("remove_task", task_id=task_id, reason="Not needed")
    assert proposal["summary"] == "Remove the task Water change 25% on 2026-11-26"
    await apply(call, proposal)

    assert await _plan(call) == []
    assert await call.error("remove_task", task_id=task_id, reason="Twice") == "not_found"


async def test_complete_task_records_straight_away(call: Caller) -> None:
    task_id = await _task(call)

    result = await call.ok("complete_task", task_id=task_id, note="Water was cloudy")

    assert result["recorded"] is True
    [task] = await _plan(call)
    assert (task["state"], task["note"], task["done_at"]) == (
        "complete",
        "Water was cloudy",
        "2026-11-26T12:00:00+00:00",
    )
    assert await call.error("skip_task", task_id=task_id) == "task_not_open"
    history = list_of((await call.ok("get_history", collection="tasks", record_id=task_id))["history"])
    assert [dict_of(entry)["summary"] for entry in history] == [
        "Complete: Water change 25%",
        "Add the task Water change 25% on 2026-11-26",
    ]


async def test_skip_task_records_straight_away(call: Caller) -> None:
    task_id = await _task(call)

    await call.ok("skip_task", task_id=task_id)

    [task] = await _plan(call)
    assert task["state"] == "skip"
    assert await call.error("complete_task", task_id="missing") == "not_found"


async def test_set_reminders_is_a_proposal(hass: HomeAssistant, call: Caller) -> None:
    async_mock_service(hass, "notify", "mobile_app_phone")
    async_mock_service(hass, "notify", "mobile_app_tablet")

    proposal = await call.ok(
        "set_reminders",
        notify=["mobile_app_phone", "notify.mobile_app_tablet"],
        dose_time="13:30",
        reason="Light comes on later",
    )

    assert dict_of((await call.ok("get_plan"))["reminders"])["dose_time"] == "12:00"
    await apply(call, proposal)
    assert (await call.ok("get_plan"))["reminders"] == {
        "notify": ["mobile_app_phone", "mobile_app_tablet"],
        "task_time": "09:00",
        "dose_time": "13:30",
        "resend_time": "21:00",
        "status_notify": [],
    }


async def test_set_reminders_checks_services_and_times(hass: HomeAssistant, call: Caller) -> None:
    assert await call.error("set_reminders", notify=["mobile_app_gone"], reason="Phone") == "invalid_input"
    assert await call.error("set_reminders", task_time="25:00", reason="Late") == "invalid_input"
    assert await call.error("set_reminders", resend_time="21:00", reason="Same") == "nothing_to_change"


async def test_import_plan_keeps_complete_and_skip(hass: HomeAssistant, call: Caller, tmp_path: Path) -> None:
    await _fish_tank(hass, tmp_path)

    proposal = await call.ok(
        "import_plan", calendar=FISH_TANK, dose_products=["Bio-CO2", "Plants Green"], reason="Move to TankKeeper"
    )

    assert proposal["summary"] == "Import 5 tasks from calendar.fish_tank"
    assert await _plan(call, start="2026-11-01", end="2026-12-31") == []
    await apply(call, proposal)
    plan = await _plan(call, start="2026-11-01", end="2026-12-31")
    assert [(task["date"], task["slot"], task["text"], task["state"], task["note"]) for task in plan] == [
        ("2026-11-24", "task", "Water change 25%", "complete", "Complete: done. Notes: cloudy"),
        ("2026-11-25", "dose", "Plants Green 2 ml", "skip", ""),
        ("2026-11-26", "task", "Trim plants", "open", "Why: growth"),
        ("2026-11-26", "dose", "Bio-CO2 1.5 ml", "open", "Why: growth"),
        ("2026-12-20", "task", "Clean filter", "open", ""),
    ]
    assert await call.error("import_plan", calendar=FISH_TANK, reason="Again") == "nothing_to_change"


async def test_import_plan_uses_the_products_for_doses(hass: HomeAssistant, call: Caller, tmp_path: Path) -> None:
    await _fish_tank(hass, tmp_path)
    await _product(call, "Bio-CO2")

    await apply(
        call, await call.ok("import_plan", calendar=FISH_TANK, start="2026-11-26", end="2026-12-31", reason="Move")
    )

    plan = await _plan(call, end="2026-12-31")
    assert [(task["text"], task["slot"]) for task in plan] == [
        ("Trim plants", "task"),
        ("Bio-CO2 1.5 ml", "dose"),
        ("Clean filter", "task"),
    ]


async def test_import_plan_needs_a_calendar(hass: HomeAssistant, call: Caller) -> None:
    assert await call.error("import_plan", calendar="calendar.missing", reason="Move") == "invalid_input"
    assert await call.error("import_plan", calendar="light.kitchen", reason="Move") == "invalid_input"
    assert (
        await call.error(
            "import_plan", calendar="calendar.tankkeeper", start="2026-12-01", end="2026-11-01", reason="X"
        )
        == "invalid_input"
    )


async def test_import_plan_keeps_the_day_of_all_day_and_timed_events(
    hass: HomeAssistant, call: Caller, tmp_path: Path
) -> None:
    await hass.config.async_set_time_zone("America/Los_Angeles")
    await _fish_tank(hass, tmp_path)
    await hass.services.async_call(
        "calendar",
        "create_event",
        {
            "summary": "To do: Test water",
            "start_date_time": "2026-11-27T23:00:00-08:00",
            "end_date_time": "2026-11-27T23:30:00-08:00",
        },
        target={"entity_id": FISH_TANK},
        blocking=True,
    )

    await apply(call, await call.ok("import_plan", calendar=FISH_TANK, reason="Move"))

    plan = await _plan(call, start="2026-11-01", end="2026-12-31")
    assert [(task["date"], task["text"]) for task in plan] == [
        ("2026-11-24", "Water change 25%"),
        ("2026-11-25", "Plants Green 2 ml"),
        ("2026-11-26", "Bio-CO2 1.5 ml"),
        ("2026-11-26", "Trim plants"),
        ("2026-11-27", "Test water"),
        ("2026-12-20", "Clean filter"),
    ]
