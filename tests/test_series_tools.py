"""Repeating tasks end to end: the tools, the calendar, the to-do list, reminders and the plan-ends rule."""

from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import Context, HomeAssistant, ServiceCall
from homeassistant.util.json import JsonValueType
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from custom_components.tankkeeper.domain import Collection
from custom_components.tankkeeper.rules import Rule
from custom_components.tankkeeper.service import TankkeeperService

from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")]

CALENDAR = "calendar.tankkeeper"
TODO = "todo.tankkeeper_today"


async def _repeat(call: Caller, text: str = "Water change 25%", **args: JsonValueType) -> str:
    applied = await apply(call, await call.ok("add_task", text=text, reason="Weekly", **args))
    change = dict_of(list_of(dict_of(applied["history"])["changes"])[0])
    assert change["collection"] == "series"
    return str_of(change["record_id"])


async def _plan(call: Caller, **args: str) -> list[tuple[str, str, str, str]]:
    plan = await call.ok("get_plan", **args)
    return [
        (str_of(task["date"]), str_of(task["text"]), str_of(task["state"]), str_of(task["id"]))
        for task in map(dict_of, list_of(plan["tasks"]))
    ]


def _service(entry: MockConfigEntry) -> TankkeeperService:
    service: TankkeeperService = entry.runtime_data
    return service


async def test_add_task_every_n_days_plans_occurrences(call: Caller) -> None:
    proposal = await call.ok("add_task", text="Water change 25%", every_days=3, note="Use RO", reason="Weekly")
    assert proposal["summary"] == "Add the repeating task Water change 25% every 3 days from 2026-11-26"
    assert await _plan(call) == []

    series_id = await _repeat(call, every_days=3, note="Use RO")
    plan = await call.ok("get_plan")

    assert [dict_of(task) for task in list_of(plan["tasks"])] == [
        {
            "id": f"{series_id}@{day}",
            "date": day,
            "slot": "task",
            "time": "09:00",
            "text": "Water change 25%",
            "state": "open",
            "note": "Use RO",
            "done_at": None,
            "series_id": series_id,
        }
        for day in ("2026-11-26", "2026-11-29", "2026-12-02")
    ]
    assert plan["series"] == [
        {
            "id": series_id,
            "start": "2026-11-26",
            "slot": "task",
            "text": "Water change 25%",
            "note": "Use RO",
            "every_days": 3,
            "weekdays": [],
            "until": None,
            "skipped": [],
            "repeat": "every 3 days",
        }
    ]


async def test_add_task_weekly_until_an_end_day(call: Caller) -> None:
    await _product(call, "Bio-CO2")
    series_id = await _repeat(call, "Bio-CO2 1.5 ml", weekdays=["thu", "mon"], date="2026-11-27", until="2026-12-03")

    plan = await _plan(call, start="2026-11-01", end="2026-12-31")

    assert plan == [
        ("2026-11-30", "Bio-CO2 1.5 ml", "open", f"{series_id}@2026-11-30"),
        ("2026-12-03", "Bio-CO2 1.5 ml", "open", f"{series_id}@2026-12-03"),
    ]
    [task] = list_of((await call.ok("get_plan", start="2026-11-30", end="2026-11-30"))["tasks"])
    assert (dict_of(task)["slot"], dict_of(task)["time"]) == ("dose", "12:00")


@pytest.mark.parametrize(
    "args",
    [
        {"every_days": 2, "weekdays": ["mon"]},
        {"until": "2026-12-31"},
        {"every_days": 2, "until": "2026-11-01"},
        {"every_days": 2, "until": "soon"},
    ],
)
async def test_add_task_refuses_a_repeat_it_cannot_plan(call: Caller, args: dict[str, JsonValueType]) -> None:
    assert await call.error("add_task", text="Feed", reason="Daily", **args) == "invalid_input"


async def test_an_occurrence_is_completed_or_skipped_on_its_own(call: Caller) -> None:
    series_id = await _repeat(call, every_days=3)

    await call.ok("complete_task", task_id=f"{series_id}@2026-11-26", note="Cloudy after")
    await call.ok("skip_task", task_id=f"{series_id}@2026-11-29")

    assert [(day, state) for day, _, state, _ in await _plan(call)] == [
        ("2026-11-26", "complete"),
        ("2026-11-29", "skip"),
        ("2026-12-02", "open"),
    ]
    assert await call.error("complete_task", task_id=f"{series_id}@2026-11-27") == "not_found"
    assert await call.error("complete_task", task_id="missing@2026-11-26") == "not_found"


async def test_update_this_one_moves_only_that_occurrence(call: Caller) -> None:
    series_id = await _repeat(call, every_days=3)
    occurrence = f"{series_id}@2026-11-29"

    proposal = await call.ok("update_task", task_id=occurrence, date="2026-11-30", reason="Busy")
    assert proposal["summary"] == "Change the task Water change 25% on 2026-11-30"
    await apply(call, proposal)

    assert await _plan(call) == [
        ("2026-11-26", "Water change 25%", "open", f"{series_id}@2026-11-26"),
        ("2026-11-30", "Water change 25%", "open", occurrence),
        ("2026-12-02", "Water change 25%", "open", f"{series_id}@2026-12-02"),
    ]
    assert await call.error("update_task", task_id=f"{series_id}@2026-12-02", reason="Same") == "nothing_to_change"


async def test_update_this_and_future_changes_later_occurrences(call: Caller) -> None:
    series_id = await _repeat(call, every_days=3)

    proposal = await call.ok(
        "update_task", task_id=f"{series_id}@2026-12-02", scope="future", text="Water change 30%", reason="Bigger"
    )
    assert proposal["summary"] == "Change the repeating task Water change 30% from 2026-12-02"
    await apply(call, proposal)

    plan = await _plan(call, end="2026-12-08")
    assert [(day, text) for day, text, _, _ in plan] == [
        ("2026-11-26", "Water change 25%"),
        ("2026-11-29", "Water change 25%"),
        ("2026-12-02", "Water change 30%"),
        ("2026-12-05", "Water change 30%"),
        ("2026-12-08", "Water change 30%"),
    ]
    series = [dict_of(item) for item in list_of((await call.ok("get_plan"))["series"])]
    assert [(item["start"], item["until"]) for item in series] == [
        ("2026-11-26", "2026-12-01"),
        ("2026-12-02", None),
    ]


async def test_update_this_and_future_from_the_first_changes_the_repeat(call: Caller) -> None:
    series_id = await _repeat(call, every_days=3)

    await apply(
        call,
        await call.ok(
            "update_task",
            task_id=f"{series_id}@2026-11-26",
            scope="future",
            weekdays=["sat"],
            until="2026-12-31",
            reason="Weekends",
        ),
    )
    assert [day for day, _, _, _ in await _plan(call, end="2026-12-10")] == ["2026-11-28", "2026-12-05"]

    await apply(
        call,
        await call.ok(
            "update_task", task_id=f"{series_id}@2026-11-28", scope="future", until="", every_days=7, reason="Weekly"
        ),
    )
    [series] = [dict_of(item) for item in list_of((await call.ok("get_plan"))["series"])]
    assert (series["every_days"], series["weekdays"], series["until"]) == (7, [], None)


@pytest.mark.parametrize(
    ("scope", "args"),
    [
        ("this", {"every_days": 2}),
        ("this", {"until": "2026-12-31"}),
        ("future", {"state": "complete"}),
    ],
)
async def test_update_refuses_a_change_the_scope_cannot_make(
    call: Caller, scope: str, args: dict[str, JsonValueType]
) -> None:
    series_id = await _repeat(call, every_days=3)

    error = await call.error("update_task", task_id=f"{series_id}@2026-11-29", scope=scope, reason="No", **args)

    assert error == "invalid_input"


async def test_a_plain_task_does_not_repeat(call: Caller) -> None:
    applied = await apply(call, await call.ok("add_task", text="Trim plants", reason="Overgrown"))
    task_id = str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])

    assert await call.error("update_task", task_id=task_id, every_days=2, reason="No") == "invalid_input"
    assert await call.error("update_task", task_id=task_id, scope="future", text="X", reason="No") == "invalid_input"
    assert await call.error("remove_task", task_id=task_id, scope="future", reason="No") == "invalid_input"


async def test_remove_this_one_leaves_the_others(call: Caller) -> None:
    series_id = await _repeat(call, every_days=3)

    proposal = await call.ok("remove_task", task_id=f"{series_id}@2026-11-29", reason="Away")
    assert proposal["summary"] == "Remove the task Water change 25% on 2026-11-29"
    await apply(call, proposal)

    assert [day for day, _, _, _ in await _plan(call)] == ["2026-11-26", "2026-12-02"]
    assert await call.error("remove_task", task_id=f"{series_id}@2026-11-29", reason="Twice") == "not_found"


async def test_remove_this_and_future_ends_the_repeat(call: Caller) -> None:
    series_id = await _repeat(call, every_days=3)
    await call.ok("complete_task", task_id=f"{series_id}@2026-11-29")

    await apply(call, await call.ok("remove_task", task_id=f"{series_id}@2026-11-29", scope="future", reason="Done"))

    assert [(day, state) for day, _, state, _ in await _plan(call)] == [
        ("2026-11-26", "open"),
        ("2026-11-29", "complete"),
    ]

    await apply(call, await call.ok("remove_task", task_id=f"{series_id}@2026-11-26", scope="future", reason="Stop"))

    plan = await call.ok("get_plan")
    assert [dict_of(task)["state"] for task in list_of(plan["tasks"])] == ["complete"]
    assert plan["series"] == []


async def test_changes_to_one_repeating_task_in_a_batch_build_on_each_other(call: Caller) -> None:
    conversation_id = str_of((await call.ok("save_conversation", title="Plan"))["conversation_id"])
    await call.ok("start_batch", summary="Plan", reason="Notes", conversation_id=conversation_id)
    proposal = await call.ok(
        "add_task", text="Water change 25%", every_days=3, reason="Weekly", conversation_id=conversation_id
    )
    series_id = str_of(dict_of(list_of(proposal["changes"])[0])["record_id"])
    await call.ok(
        "update_task", task_id=f"{series_id}@2026-11-26", note="First", reason="Note", conversation_id=conversation_id
    )
    await call.ok("remove_task", task_id=f"{series_id}@2026-11-29", reason="Away", conversation_id=conversation_id)
    batch = await call.ok(
        "remove_task", task_id=f"{series_id}@2026-12-02", reason="Away", conversation_id=conversation_id
    )
    await call.ok("apply_change", proposal_id=batch["proposal_id"], code=batch["code"], conversation_id=conversation_id)

    plan = await call.ok("get_plan", end="2026-12-08")
    assert [(str_of(dict_of(task)["date"]), dict_of(task)["note"]) for task in list_of(plan["tasks"])] == [
        ("2026-11-26", "First"),
        ("2026-12-05", ""),
        ("2026-12-08", ""),
    ]


async def test_a_series_with_no_end_keeps_the_plan_from_running_out(
    loaded_entry: MockConfigEntry, call: Caller
) -> None:
    await _repeat(call, every_days=7)

    [result] = [result for result in _service(loaded_entry).status().results if result.rule is Rule.PLAN_ENDS]

    assert result.reason == "A repeating task has no end day, so the plan never runs out."


async def test_a_repeating_task_counts_as_setup(loaded_entry: MockConfigEntry, call: Caller) -> None:
    assert _service(loaded_entry).tank_is_empty()

    await _repeat(call, every_days=7)

    assert not _service(loaded_entry).tank_is_empty()


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


async def test_the_calendar_shows_occurrences_in_any_range(hass: HomeAssistant, call: Caller) -> None:
    await _repeat(call, every_days=30)

    near = await _events(hass, "2026-11-20T00:00:00+00:00", "2026-12-31T00:00:00+00:00")
    far = await _events(hass, "2027-03-01T00:00:00+00:00", "2027-03-31T00:00:00+00:00")

    assert [event["start"] for event in near] == ["2026-11-26T09:00:00+00:00", "2026-12-26T09:00:00+00:00"]
    assert [event["start"] for event in far] == ["2027-03-26T09:00:00+00:00"]


async def test_calendar_edits_change_one_occurrence(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, hass_ws_client: WebSocketGenerator
) -> None:
    series_id = await _repeat(call, every_days=3)
    first, second = f"{series_id}@2026-11-26", f"{series_id}@2026-11-29"
    event = {"summary": "Complete: Water change 25%", "dtstart": "2026-11-26", "dtend": "2026-11-27"}

    updated = await _ws(hass_ws_client, hass, {"type": "calendar/event/update", "uid": first, "event": event})
    deleted = await _ws(hass_ws_client, hass, {"type": "calendar/event/delete", "uid": second})

    assert updated["success"], updated
    assert deleted["success"], deleted
    assert [(day, state) for day, _, state, _ in await _plan(call)] == [
        ("2026-11-26", "complete"),
        ("2026-12-02", "open"),
    ]
    assert _service(loaded_entry).records(Collection.SERIES)[series_id]["skipped"] == ["2026-11-29"]


async def test_the_todo_list_shows_and_completes_todays_occurrence(hass: HomeAssistant, call: Caller) -> None:
    series_id = await _repeat(call, every_days=3)
    await hass.async_block_till_done()

    response = await hass.services.async_call(
        "todo", "get_items", target={"entity_id": TODO}, blocking=True, return_response=True
    )
    assert response is not None
    [item] = list_of(dict_of(response[TODO])["items"])
    assert dict_of(item)["uid"] == f"{series_id}@2026-11-26"

    await hass.services.async_call(
        "todo",
        "update_item",
        {"item": f"{series_id}@2026-11-26", "status": "completed"},
        target={"entity_id": TODO},
        blocking=True,
    )

    assert (await _plan(call))[0][2] == "complete"


async def test_reminders_go_out_for_occurrences_and_their_actions_work(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory, call: Caller
) -> None:
    phone: list[ServiceCall] = async_mock_service(hass, "notify", "mobile_app_phone")
    await apply(call, await call.ok("set_reminders", notify=["mobile_app_phone"], reason="Phone"))
    series_id = await _repeat(call, every_days=1)

    for moment in ("2026-11-26T21:00:00+00:00", "2026-11-27T09:00:00+00:00"):
        freezer.move_to(moment)
        async_fire_time_changed(hass)
        await hass.async_block_till_done(wait_background_tasks=True)

    first, occurrence = f"{series_id}@2026-11-26", f"{series_id}@2026-11-27"
    assert [(call.data.get("title"), dict_of(call.data["data"])["tag"]) for call in phone] == [
        ("Nano: not complete yet", f"tankkeeper-{first}"),
        ("Nano", f"tankkeeper-{occurrence}"),
        ("Nano: not confirmed", f"tankkeeper-{first}"),
    ]
    hass.bus.async_fire(
        "mobile_app_notification_action", {"action": f"TANKKEEPER_COMPLETE|{occurrence}"}, context=Context(user_id="u")
    )
    await hass.async_block_till_done()

    assert (await _plan(call, start="2026-11-27", end="2026-11-27"))[0][2] == "complete"


async def _product(call: Caller, name: str) -> None:
    await apply(call, await call.ok("add_product", name=name, reason="Fertiliser"))
