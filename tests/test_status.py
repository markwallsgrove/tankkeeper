"""The status follows the rules, shows on a sensor and notifies the status-alert devices when it changes."""

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util.json import JsonValueType
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from .common import PLUG, Caller, Devices, apply, dict_of, list_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

PHONE = "mobile_app_phone"
TABLET = "mobile_app_tablet"
STATUS = "sensor.nano_status"
BACK = {"title": "Nano: On course", "message": "Back on course.", "data": {"tag": "tankkeeper-status"}}


@pytest.fixture
def phone(hass: HomeAssistant) -> list[ServiceCall]:
    return async_mock_service(hass, "notify", PHONE)


@pytest.fixture
def tablet(hass: HomeAssistant) -> list[ServiceCall]:
    return async_mock_service(hass, "notify", TABLET)


@pytest.fixture
async def alerts(call: Caller, phone: list[ServiceCall], tablet: list[ServiceCall]) -> list[ServiceCall]:
    """Reminders go to the phone and status alerts to the tablet."""
    await apply(call, await call.ok("set_reminders", notify=[PHONE], status_notify=[TABLET], reason="Devices"))
    return tablet


def _alert(level: str, message: str) -> dict[str, object]:
    return {"title": f"Nano: {level}", "message": message, "data": {"tag": "tankkeeper-status"}}


def _sent(calls: list[ServiceCall]) -> list[dict[str, object]]:
    return [dict(call.data) for call in calls]


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def test_the_status_sensor_shows_the_worst_rule(
    hass: HomeAssistant, call: Caller, entity_registry: er.EntityRegistry, loaded_entry: MockConfigEntry
) -> None:
    state = hass.states.get(STATUS)
    assert state is not None
    assert state.state == "on_course"
    assert state.attributes["options"] == ["on_course", "watch", "act"]
    assert state.attributes["rules"] == []
    entity = entity_registry.async_get(STATUS)
    assert entity is not None
    assert entity.unique_id == f"{loaded_entry.entry_id}_status"

    await call.ok("record_test", values={"ammonia": 3, "nitrite": 0.5})
    await hass.async_block_till_done()

    state = hass.states.get(STATUS)
    assert state is not None
    assert state.state == "watch"
    assert state.attributes["rules"] == [
        {
            "rule": "ammonia",
            "level": "watch",
            "reason": "Ammonia 3 ppm on 26 Nov is above the 2 ppm watch limit.",
            "action": "Test again within 2 days. Above 4 ppm, change water to bring it down.",
        },
        {
            "rule": "nitrite",
            "level": "on_course",
            "reason": "Nitrite 0.5 ppm on 26 Nov is inside the 2 ppm limit.",
            "action": None,
        },
    ]


async def test_record_test_returns_the_rules_result(call: Caller) -> None:
    result = await call.ok("record_test", values={"ammonia": 0.5, "nitrite": 0.75})

    status = dict_of(result["status"])
    assert status["status"] == "on_course"
    assert [dict_of(rule)["rule"] for rule in list_of(status["rules"])] == ["ammonia", "nitrite"]
    assert result["recorded"] is True


async def test_tap_tests_do_not_change_the_status(hass: HomeAssistant, call: Caller) -> None:
    result = await call.ok("record_test", values={"ammonia": 8}, source="tap")

    assert dict_of(result["status"])["status"] == "on_course"


async def test_status_changes_notify_the_alert_devices_only(
    hass: HomeAssistant, call: Caller, alerts: list[ServiceCall], phone: list[ServiceCall]
) -> None:
    await call.ok("record_test", values={"ammonia": 3})
    await hass.async_block_till_done()
    watch = (
        "Ammonia 3 ppm on 26 Nov is above the 2 ppm watch limit. "
        "Test again within 2 days. Above 4 ppm, change water to bring it down."
    )
    assert _sent(alerts) == [_alert("Watch", watch)]

    await call.ok("record_test", values={"ammonia": 5})
    await hass.async_block_till_done()
    act = (
        "Ammonia 5 ppm on 26 Nov is above the 4 ppm limit. "
        "Change water to bring it under 4 ppm, then test again the next day."
    )
    assert _sent(alerts)[1:] == [_alert("Act", act)]

    await call.ok("record_test", values={"ammonia": 6})
    await call.ok("add_note", kind="question", topic="Algae", text="Brown dust")
    await hass.async_block_till_done()
    assert len(alerts) == 2

    await call.ok("record_test", values={"ammonia": 0.5})
    await hass.async_block_till_done()
    assert _sent(alerts)[2:] == [BACK]

    await call.ok("record_test", values={"ammonia": 0.25})
    await hass.async_block_till_done()
    assert len(alerts) == 3
    assert phone == []


async def test_a_new_problem_notifies_even_when_the_level_stays(
    hass: HomeAssistant, call: Caller, alerts: list[ServiceCall]
) -> None:
    await call.ok("record_test", values={"ammonia": 5})
    await call.ok("record_test", values={"ammonia": 5, "nitrite": 4.5})
    await hass.async_block_till_done()

    assert [sent["title"] for sent in _sent(alerts)] == ["Nano: Act", "Nano: Act"]
    assert "Nitrite 4.5 ppm" in str(_sent(alerts)[1]["message"])


async def test_the_status_is_checked_every_hour(
    hass: HomeAssistant, call: Caller, alerts: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    await apply(call, await call.ok("add_task", text="Clean", date="2026-12-31", reason="Plan"))
    await apply(call, await call.ok("add_task", text="Test ammonia", date="2026-11-26", reason="Plan"))
    await hass.async_block_till_done()
    assert alerts == []

    await _at(hass, freezer, "2026-11-26T23:30:00+00:00")
    assert alerts == []

    await _at(hass, freezer, "2026-11-27T00:00:00+00:00")
    assert _sent(alerts) == [
        _alert("Watch", "The test 'Test ammonia' from 26 Nov is 1 day late. Do the test and record the results.")
    ]
    state = hass.states.get(STATUS)
    assert state is not None
    assert state.state == "watch"


async def test_the_light_problem_is_notified(
    hass: HomeAssistant, call: Caller, alerts: list[ServiceCall], plugs: Devices
) -> None:
    plugs.add(PLUG)
    led: dict[str, JsonValueType] = {"entity_id": PLUG, "model": "LED 10120", "on": "12:00", "off": "20:00"}
    await apply(call, await call.ok("set_light", action="add", reason="The tank light", **led))
    await hass.async_block_till_done(wait_background_tasks=True)
    assert alerts == []

    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _sent(alerts) == [
        _alert(
            "Act",
            "switch.tank_light for LED 10120 is unavailable. "
            "Check the plug has power and is connected to Home Assistant.",
        )
    ]


async def test_a_failing_alert_device_does_not_stop_the_others(
    hass: HomeAssistant, call: Caller, phone: list[ServiceCall], tablet: list[ServiceCall]
) -> None:
    async_mock_service(hass, "notify", "broken", raise_exception=HomeAssistantError("Offline"))
    await apply(call, await call.ok("set_reminders", status_notify=["broken", TABLET], reason="Devices"))

    await call.ok("record_test", values={"nitrite": 3})
    await hass.async_block_till_done()

    assert [sent["title"] for sent in _sent(tablet)] == ["Nano: Watch"]


async def test_get_status_lists_the_rules_and_settings(call: Caller) -> None:
    await call.ok("record_test", values={"ph": 6.8})

    status = await call.ok("get_status")

    assert status["status"] == "on_course"
    assert status["rules"] == []
    assert status["stage"] is None
    assert dict_of(status["settings"])["ph_watch"] == 7.0

    await apply(call, await call.ok("set_tank", stage="cycling", reason="New tank"))

    status = await call.ok("get_status")
    assert status["status"] == "watch"
    assert status["stage"] == "cycling"
    assert [dict_of(rule)["rule"] for rule in list_of(status["rules"])] == ["ph"]


async def test_set_rules_changes_the_limits(hass: HomeAssistant, call: Caller) -> None:
    await call.ok("record_test", values={"ammonia": 0.5})

    proposal = await call.ok("set_rules", nitrogen_watch=0.25, nitrogen_act=1, reason="Fish are in")
    assert proposal["summary"] == "Change the rule limits"
    await apply(call, proposal)

    assert (await call.ok("get_status"))["status"] == "watch"
    assert dict_of((await call.ok("get_status"))["settings"])["nitrogen_act"] == 1.0


async def test_set_rules_checks_the_limits(call: Caller) -> None:
    assert await call.error("set_rules", nitrogen_act=1, reason="Lower") == "invalid_input"
    assert await call.error("set_rules", ph_watch=7.0, reason="Same") == "nothing_to_change"
    assert await call.error("set_rules", reason="Nothing") == "nothing_to_change"


async def test_status_alert_devices_must_exist(call: Caller) -> None:
    assert await call.error("set_reminders", status_notify=["nowhere"], reason="x") == "invalid_input"


async def test_unloading_stops_the_status_checks(
    hass: HomeAssistant,
    call: Caller,
    alerts: list[ServiceCall],
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    await apply(call, await call.ok("add_task", text="Clean", date="2026-12-31", reason="Plan"))
    await apply(call, await call.ok("add_task", text="Test ammonia", date="2026-11-26", reason="Plan"))
    await hass.config_entries.async_unload(loaded_entry.entry_id)

    await _at(hass, freezer, "2026-11-27T01:00:00+00:00")

    assert alerts == []
