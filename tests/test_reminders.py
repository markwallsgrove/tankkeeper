"""Reminders go to the notify services at the task times, with Complete and Skip actions."""

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import Context, HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.tankkeeper.domain import Collection, Source
from custom_components.tankkeeper.service import TankkeeperService

from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

PHONE = "mobile_app_phone"
TABLET = "mobile_app_tablet"


@pytest.fixture
def phone(hass: HomeAssistant) -> list[ServiceCall]:
    return async_mock_service(hass, "notify", PHONE)


@pytest.fixture
def tablet(hass: HomeAssistant) -> list[ServiceCall]:
    return async_mock_service(hass, "notify", TABLET)


@pytest.fixture
async def devices(call: Caller, phone: list[ServiceCall], tablet: list[ServiceCall]) -> None:
    await apply(call, await call.ok("set_reminders", notify=[PHONE, TABLET], reason="Both devices"))


async def _task(call: Caller, text: str, **args: str) -> str:
    applied = await apply(call, await call.ok("add_task", text=text, reason="Plan", **args))
    return str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


def _reminder(task_id: str, text: str, title: str = "Nano") -> dict[str, object]:
    return {
        "message": text,
        "title": title,
        "data": {
            "tag": f"tankkeeper-{task_id}",
            "url": "/todo?entity_id=todo.tankkeeper_today",
            "actions": [
                {"action": f"TANKKEEPER_COMPLETE|{task_id}", "title": "Complete"},
                {"action": f"TANKKEEPER_SKIP|{task_id}", "title": "Skip"},
            ],
        },
    }


def _clear(task_id: str) -> dict[str, object]:
    return {"message": "clear_notification", "data": {"tag": f"tankkeeper-{task_id}"}}


def _sent(calls: list[ServiceCall]) -> list[dict[str, object]]:
    return [dict(call.data) for call in calls]


def _task_record(entry: MockConfigEntry, task_id: str) -> dict[str, object]:
    service: TankkeeperService = entry.runtime_data
    return dict(service.records(Collection.TASKS)[task_id])


async def _action(hass: HomeAssistant, action: str, **data: str) -> None:
    hass.bus.async_fire("mobile_app_notification_action", {"action": action, **data}, context=Context(user_id="u2"))
    await hass.async_block_till_done()


@pytest.mark.usefixtures("devices")
async def test_tasks_are_sent_at_the_task_time_and_doses_at_the_dose_time(
    hass: HomeAssistant,
    call: Caller,
    phone: list[ServiceCall],
    tablet: list[ServiceCall],
    freezer: FrozenDateTimeFactory,
) -> None:
    await apply(call, await call.ok("add_product", name="Bio-CO2", reason="Fertiliser"))
    water = await _task(call, "Water change 25%")
    dose = await _task(call, "Bio-CO2 1.5 ml")
    await _task(call, "Tomorrow", date="2026-11-27")

    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert _sent(phone) == [_reminder(water, "Water change 25%")]
    assert _sent(tablet) == [_reminder(water, "Water change 25%")]

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")

    assert _sent(phone) == [_reminder(water, "Water change 25%"), _reminder(dose, "Bio-CO2 1.5 ml")]


@pytest.mark.usefixtures("devices")
async def test_open_tasks_are_sent_again_at_the_resend_time(
    hass: HomeAssistant, call: Caller, phone: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    open_task = await _task(call, "Water change 25%")
    done = await _task(call, "Trim plants")
    await call.ok("complete_task", task_id=done)
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")
    phone.clear()

    await _at(hass, freezer, "2026-11-26T21:00:00+00:00")

    assert _sent(phone) == [_reminder(open_task, "Water change 25%", "Nano: not complete yet")]


@pytest.mark.usefixtures("devices")
async def test_open_tasks_from_earlier_days_are_followed_up_at_the_task_time(
    hass: HomeAssistant, call: Caller, phone: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    old = await _task(call, "Water change 25%", date="2026-11-24")
    await _task(call, "Too old", date="2026-11-10")

    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert _sent(phone) == [_reminder(old, "Water change 25%", "Nano: not confirmed")]


async def test_nothing_is_sent_without_devices(
    hass: HomeAssistant, call: Caller, phone: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    await _task(call, "Water change 25%")

    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert phone == []


@pytest.mark.usefixtures("devices")
async def test_new_times_take_effect_straight_away(
    hass: HomeAssistant, call: Caller, phone: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    task_id = await _task(call, "Water change 25%")
    await apply(call, await call.ok("set_reminders", task_time="08:30", reason="Earlier"))

    await _at(hass, freezer, "2026-11-26T08:30:00+00:00")
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert _sent(phone) == [_reminder(task_id, "Water change 25%")]


@pytest.mark.usefixtures("devices")
async def test_complete_action_records_the_task_and_clears_every_device(
    hass: HomeAssistant,
    *,
    loaded_entry: MockConfigEntry,
    call: Caller,
    phone: list[ServiceCall],
    tablet: list[ServiceCall],
    freezer: FrozenDateTimeFactory,
) -> None:
    task_id = await _task(call, "Water change 25%")
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    await _action(hass, f"TANKKEEPER_COMPLETE|{task_id}", reply_text="Cloudy water")

    task = _task_record(loaded_entry, task_id)
    assert (task["state"], task["note"], task["done_at"]) == ("complete", "Cloudy water", "2026-11-26T09:00:00+00:00")
    assert _sent(phone)[1:] == [_clear(task_id)]
    assert _sent(tablet)[1:] == [_clear(task_id)]
    service: TankkeeperService = loaded_entry.runtime_data
    [latest] = service.history(Collection.TASKS, task_id, 1)
    assert latest.source is Source.PANEL


@pytest.mark.usefixtures("devices")
async def test_skip_action_skips_the_task(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, phone: list[ServiceCall]
) -> None:
    task_id = await _task(call, "Water change 25%")

    await _action(hass, f"TANKKEEPER_SKIP|{task_id}")

    assert _task_record(loaded_entry, task_id)["state"] == "skip"
    assert _sent(phone) == [_clear(task_id)]


@pytest.mark.usefixtures("devices")
async def test_an_action_for_a_done_task_only_clears(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller, phone: list[ServiceCall]
) -> None:
    task_id = await _task(call, "Water change 25%")
    await call.ok("skip_task", task_id=task_id)

    await _action(hass, f"TANKKEEPER_COMPLETE|{task_id}")
    await _action(hass, "TANKKEEPER_COMPLETE|missing")

    assert _task_record(loaded_entry, task_id)["state"] == "skip"
    assert _sent(phone) == [_clear(task_id), _clear("missing")]


@pytest.mark.usefixtures("devices")
async def test_other_actions_are_ignored(hass: HomeAssistant, call: Caller, phone: list[ServiceCall]) -> None:
    await _action(hass, "FISH_COMPLETE|abc")
    hass.bus.async_fire("mobile_app_notification_action", {"tag": "no action"})
    await hass.async_block_till_done()

    assert phone == []


@pytest.mark.usefixtures("devices")
async def test_completing_elsewhere_clears_sent_reminders(
    hass: HomeAssistant,
    call: Caller,
    phone: list[ServiceCall],
    tablet: list[ServiceCall],
    freezer: FrozenDateTimeFactory,
) -> None:
    task_id = await _task(call, "Water change 25%")
    other = await _task(call, "Trim plants")
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    await call.ok("complete_task", task_id=task_id)
    await hass.async_block_till_done()
    await call.ok("add_note", kind="question", topic="Filter", text="Noisy")
    await hass.async_block_till_done()

    assert _sent(tablet)[2:] == [_clear(task_id)]
    assert other


@pytest.mark.usefixtures("devices")
async def test_a_failing_device_does_not_stop_the_others(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    async_mock_service(hass, "notify", PHONE, raise_exception=HomeAssistantError("Offline"))
    task_id = await _task(call, "Water change 25%")

    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert _sent(tablet) == [_reminder(task_id, "Water change 25%")]


async def test_unloading_stops_the_reminders(
    hass: HomeAssistant,
    loaded_entry: MockConfigEntry,
    call: Caller,
    phone: list[ServiceCall],
    freezer: FrozenDateTimeFactory,
) -> None:
    await apply(call, await call.ok("set_reminders", notify=[PHONE], reason="Phone"))
    task_id = await _task(call, "Water change 25%")
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")
    await _action(hass, f"TANKKEEPER_COMPLETE|{task_id}")

    assert phone == []
