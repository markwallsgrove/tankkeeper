"""An automation runs the light from helpers. TankKeeper sets the helpers, logs on and off and shows problems."""

from datetime import timedelta
from pathlib import Path

from freezegun.api import FrozenDateTimeFactory
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import (
    EVENT_HOMEASSISTANT_STARTED,
    STATE_OFF,
    STATE_ON,
    STATE_UNAVAILABLE,
    STATE_UNKNOWN,
)
from homeassistant.core import Context, CoreState, Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er, issue_registry as ir
from homeassistant.helpers.event import EventStateChangedData, async_track_state_change_event
from homeassistant.util.json import JsonObjectType, JsonValueType
from homeassistant.util.yaml import dump
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.tankkeeper.calendar import PANEL
from custom_components.tankkeeper.const import DOMAIN
from custom_components.tankkeeper.domain import Collection
from custom_components.tankkeeper.service import TankkeeperService

from .common import (
    LAMP,
    LAMP_HELPERS,
    PLUG,
    PLUG_HELPERS,
    Caller,
    Devices,
    apply,
    dict_of,
    example_package,
    list_of,
    str_of,
)

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

LED: dict[str, JsonValueType] = {"entity_id": PLUG, "model": "LED 10120", "on": "12:00", "off": "20:00", **PLUG_HELPERS}
LAMP_LIGHT: dict[str, JsonValueType] = {
    "entity_id": LAMP,
    "model": "Lamp",
    "control": "dimmable",
    "on": "12:00",
    "off": "20:00",
    **LAMP_HELPERS,
}
PROBLEM = "binary_sensor.nano_light_problem"
NEXT = "sensor.nano_next_light_change"
ON_HELPER = "input_datetime.tank_light_on"
OFF_HELPER = "input_datetime.tank_light_off"
AUTOMATION = "automation.tank_light"


async def _add(call: Caller, light: dict[str, JsonValueType] = LED, **args: JsonValueType) -> str:
    applied = await apply(call, await call.ok("set_light", action="add", reason="The tank light", **(light | args)))
    await call.hass.async_block_till_done(wait_background_tasks=True)
    return str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])


async def _change(call: Caller, light_id: str, action: str, **args: JsonValueType) -> JsonObjectType:
    applied = await apply(call, await call.ok("set_light", action=action, light_id=light_id, reason="Why", **args))
    await call.hass.async_block_till_done(wait_background_tasks=True)
    return applied


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def _set_time(hass: HomeAssistant, helper: str, value: str) -> None:
    await hass.services.async_call(
        "input_datetime", "set_datetime", {"entity_id": helper, "time": value}, blocking=True
    )
    await hass.async_block_till_done(wait_background_tasks=True)


def _log(entry: MockConfigEntry) -> list[tuple[str, str | None]]:
    service: TankkeeperService = entry.runtime_data
    return [(event.kind.value, event.by) for event in service.light_log()]


def _issue_ids(issue_registry: ir.IssueRegistry) -> list[str]:
    return sorted(issue_id for domain, issue_id in issue_registry.issues if domain == DOMAIN)


def _state(hass: HomeAssistant, entity_id: str) -> str:
    state = hass.states.get(entity_id)
    assert state is not None
    return state.state


def _times(hass: HomeAssistant) -> tuple[str, str]:
    return _state(hass, ON_HELPER), _state(hass, OFF_HELPER)


async def _problems(call: Caller) -> list[JsonValueType]:
    result = await call.ok("get_light")
    return list_of(dict_of(list_of(result["lights"])[0])["problems"])


async def test_adding_a_light_sets_its_helpers_and_switches_nothing(
    hass: HomeAssistant, call: Caller, plugs: Devices
) -> None:
    plugs.add(PLUG)
    assert _times(hass) == ("00:00:00", "00:00:00")

    await _add(call)

    assert _times(hass) == ("12:00:00", "20:00:00")
    assert plugs.sent() == []
    assert _state(hass, PROBLEM) == STATE_OFF


async def test_the_automation_runs_the_light_on_the_helper_times(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
) -> None:
    plugs.add(PLUG)
    await _add(call)

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert plugs.state(PLUG) == STATE_ON
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    assert plugs.state(PLUG) == STATE_OFF
    await _at(hass, freezer, "2026-11-26T20:10:00+00:00")

    assert plugs.sent() == [("switch.turn_on", {"entity_id": [PLUG]}), ("switch.turn_off", {"entity_id": [PLUG]})]
    assert _log(loaded_entry) == [("on", "automation"), ("off", "automation")]
    assert _state(hass, PROBLEM) == STATE_OFF


async def test_a_lamp_gets_its_brightness_and_ramp_through_the_example_package(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(LAMP)
    await _add(call, LAMP_LIGHT, brightness_pct=80, ramp_minutes=30)
    assert _state(hass, "input_number.tank_lamp_brightness") == "80.0"
    assert _state(hass, "input_number.tank_lamp_ramp") == "30.0"

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")

    assert plugs.sent() == [
        ("light.turn_on", {"entity_id": [LAMP], "brightness_pct": 80, "transition": 1800}),
        ("light.turn_off", {"entity_id": [LAMP], "transition": 1800}),
    ]


async def test_a_lamp_without_brightness_keeps_its_brightness_helper(
    hass: HomeAssistant, call: Caller, plugs: Devices
) -> None:
    plugs.add(LAMP)
    await hass.services.async_call(
        "input_number", "set_value", {"entity_id": "input_number.tank_lamp_brightness", "value": 55}, blocking=True
    )

    await _add(call, LAMP_LIGHT)

    assert _state(hass, "input_number.tank_lamp_brightness") == "55.0"
    assert _state(hass, "input_number.tank_lamp_ramp") == "0.0"


async def test_a_change_and_its_undo_set_the_helpers(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    applied = await _change(call, light_id, "update", on="13:00", off="21:30")
    assert _times(hass) == ("13:00:00", "21:30:00")

    await apply(
        call, await call.ok("undo_change", history_id=str_of(dict_of(applied["history"])["id"]), reason="Too late")
    )
    await hass.async_block_till_done(wait_background_tasks=True)
    assert _times(hass) == ("12:00:00", "20:00:00")


async def test_renaming_the_light_keeps_a_helper_changed_by_hand(
    hass: HomeAssistant, call: Caller, plugs: Devices
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await _set_time(hass, ON_HELPER, "11:00:00")

    await _change(call, light_id, "update", model="LED 10121")

    assert _times(hass) == ("11:00:00", "20:00:00")


async def test_a_one_day_change_sets_the_helpers_on_its_day_and_back_after(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    await _change(call, light_id, "one_day", date="2026-11-27", on="14:00", off="18:00")
    assert _times(hass) == ("12:00:00", "20:00:00")

    await _at(hass, freezer, "2026-11-27T00:00:00+00:00")
    assert _times(hass) == ("14:00:00", "18:00:00")
    await _at(hass, freezer, "2026-11-27T14:00:00+00:00")
    assert plugs.state(PLUG) == STATE_ON

    await _at(hass, freezer, "2026-11-28T00:00:00+00:00")
    assert _times(hass) == ("12:00:00", "20:00:00")


async def test_a_one_day_change_for_today_sets_the_helpers_straight_away(
    hass: HomeAssistant, call: Caller, plugs: Devices
) -> None:
    plugs.add(LAMP)
    light_id = await _add(call, LAMP_LIGHT, brightness_pct=80)

    await _change(call, light_id, "one_day", date="2026-11-26", on="10:00", off="16:00", brightness_pct=40)

    assert _state(hass, "input_datetime.tank_lamp_on") == "10:00:00"
    assert _state(hass, "input_datetime.tank_lamp_off") == "16:00:00"
    assert _state(hass, "input_number.tank_lamp_brightness") == "40.0"


async def test_a_one_day_change_is_set_and_put_back_at_startup(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await _change(call, light_id, "one_day", date="2026-11-27", on="14:00", off="18:00")
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    await _at(hass, freezer, "2026-11-27T08:00:00+00:00")
    assert _times(hass) == ("12:00:00", "20:00:00")
    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert _times(hass) == ("14:00:00", "18:00:00")
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    await _at(hass, freezer, "2026-11-28T08:00:00+00:00")
    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert _times(hass) == ("12:00:00", "20:00:00")


async def test_a_helper_changed_by_hand_on_the_one_day_is_kept_after_it(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await _change(call, light_id, "one_day", date="2026-11-27", on="14:00", off="18:00")
    await _at(hass, freezer, "2026-11-27T00:00:00+00:00")
    await _set_time(hass, ON_HELPER, "15:00:00")

    await _at(hass, freezer, "2026-11-28T00:00:00+00:00")

    assert _times(hass) == ("15:00:00", "18:00:00")


async def test_a_helper_that_cannot_be_set_is_a_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, issue_registry: ir.IssueRegistry, tmp_path: Path
) -> None:
    plugs.add(LAMP)
    light_id = await _add(call, LAMP_LIGHT, brightness_pct=80)
    proposal = await call.ok("set_light", action="update", light_id=light_id, brightness_pct=60, reason="Why")
    package = example_package()
    package["input_number"]["tank_lamp_brightness"]["max"] = 50
    hass.config.config_dir = str(tmp_path)
    (tmp_path / "configuration.yaml").write_text(dump({"input_number": package["input_number"]}))
    await hass.services.async_call("input_number", "reload", blocking=True)

    await apply(call, proposal)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]
    assert _state(hass, LAMP_HELPERS["brightness_helper"]) == "50.0"
    assert await _problems(call) == [
        "Lamp: the helper input_number.tank_lamp_brightness goes from 1 to 50, so it can't hold 60."
    ]


async def test_a_helper_set_once_its_range_can_hold_the_value(
    hass: HomeAssistant, call: Caller, plugs: Devices, issue_registry: ir.IssueRegistry, tmp_path: Path
) -> None:
    plugs.add(LAMP)
    light_id = await _add(call, LAMP_LIGHT, brightness_pct=80)
    proposal = await call.ok("set_light", action="update", light_id=light_id, brightness_pct=60, reason="Why")
    package = example_package()
    package["input_number"]["tank_lamp_brightness"]["max"] = 50
    await _reload_numbers(hass, tmp_path, package["input_number"])
    await apply(call, proposal)
    await hass.async_block_till_done(wait_background_tasks=True)

    package["input_number"]["tank_lamp_brightness"]["max"] = 100
    await _reload_numbers(hass, tmp_path, package["input_number"])
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, LAMP_HELPERS["brightness_helper"]) == "60.0"
    assert _state(hass, PROBLEM) == STATE_OFF
    assert _issue_ids(issue_registry) == []


async def test_a_helper_set_once_it_comes_back(
    hass: HomeAssistant, call: Caller, plugs: Devices, tmp_path: Path
) -> None:
    plugs.add(LAMP)
    light_id = await _add(call, LAMP_LIGHT, brightness_pct=80)
    proposal = await call.ok("set_light", action="update", light_id=light_id, brightness_pct=60, reason="Why")
    package = example_package()
    brightness = package["input_number"].pop("tank_lamp_brightness")
    await _reload_numbers(hass, tmp_path, package["input_number"])
    await apply(call, proposal)
    await hass.async_block_till_done(wait_background_tasks=True)

    package["input_number"]["tank_lamp_brightness"] = brightness
    await _reload_numbers(hass, tmp_path, package["input_number"])
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, LAMP_HELPERS["brightness_helper"]) == "60.0"
    assert _state(hass, PROBLEM) == STATE_OFF


async def _reload_numbers(hass: HomeAssistant, config_dir: Path, numbers: object) -> None:
    hass.config.config_dir = str(config_dir)
    (config_dir / "configuration.yaml").write_text(dump({"input_number": numbers}))
    await hass.services.async_call("input_number", "reload", blocking=True)


async def test_a_light_that_fades_out_has_its_ramp_to_turn_off(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(LAMP)
    await _add(call, LAMP_LIGHT, ramp_minutes=30)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")
    plugs.failing.add(LAMP)

    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T20:05:00+00:00")
    await _at(hass, freezer, "2026-11-26T20:20:00+00:00")
    plugs.failing.clear()
    await hass.services.async_call("light", "turn_off", {"entity_id": LAMP}, blocking=True, context=Context())
    await _at(hass, freezer, "2026-11-26T20:40:00+00:00")

    assert [kind for kind, _ in _log(loaded_entry)] == ["on", "off"]
    assert _state(hass, PROBLEM) == STATE_OFF


async def test_switching_by_hand_is_logged(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)

    await hass.services.async_call("switch", "turn_on", {"entity_id": PLUG}, blocking=True, context=Context())
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _log(loaded_entry) == [("on", "other")]
    assert _state(hass, PROBLEM) == STATE_OFF


async def test_a_light_that_did_not_follow_the_helper_times_is_a_problem_until_it_does(
    hass: HomeAssistant,
    *,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    plugs.failing.add(PLUG)

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert _state(hass, PROBLEM) == STATE_OFF
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")

    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]
    assert await _problems(call) == ["LED 10120 did not turn on at 12:00."]

    plugs.failing.clear()
    freezer.move_to("2026-11-26T12:30:00+00:00")
    await hass.services.async_call("switch", "turn_on", {"entity_id": PLUG}, blocking=True, context=Context())
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_OFF
    assert _issue_ids(issue_registry) == []
    assert _log(loaded_entry) == [("missed", None), ("on", "other"), ("late", "other")]
    service: TankkeeperService = loaded_entry.runtime_data
    assert service.light_log()[-1].minutes_late == 30


async def test_the_light_in_the_wanted_state_at_the_next_change_clears_the_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")
    assert _state(hass, PROBLEM) == STATE_ON

    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T20:05:00+00:00")

    assert _state(hass, PROBLEM) == STATE_OFF


async def test_a_light_changed_to_the_wrong_state_keeps_the_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")

    plugs.add(PLUG, STATE_UNAVAILABLE)
    plugs.add(PLUG, STATE_OFF)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_ON
    assert await _problems(call) == ["LED 10120 did not turn on at 12:00."]


async def test_new_helper_times_move_the_check(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)
    await _set_time(hass, ON_HELPER, "13:00:00")

    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")
    assert _state(hass, PROBLEM) == STATE_OFF
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T13:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T13:05:00+00:00")

    assert _state(hass, PROBLEM) == STATE_ON
    assert await _problems(call) == ["LED 10120 did not turn on at 13:00."]


async def test_helpers_that_hold_overnight_times_are_followed(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)
    await _set_time(hass, ON_HELPER, "22:00:00")
    await _set_time(hass, OFF_HELPER, "06:00:00")

    await _at(hass, freezer, "2026-11-26T22:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T22:05:00+00:00")
    assert plugs.state(PLUG) == STATE_ON
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-27T06:00:00+00:00")
    await _at(hass, freezer, "2026-11-27T06:05:00+00:00")

    assert await _problems(call) == ["LED 10120 did not turn off at 06:00."]


async def test_helpers_at_the_same_time_are_not_checked(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)
    await _set_time(hass, ON_HELPER, "12:00:00")
    await _set_time(hass, OFF_HELPER, "12:00:00")
    plugs.failing.add(PLUG)

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")

    assert _state(hass, PROBLEM) == STATE_OFF


async def test_an_automation_that_is_off_is_a_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, issue_registry: ir.IssueRegistry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    await hass.services.async_call("automation", "turn_off", {"entity_id": AUTOMATION}, blocking=True)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]
    assert await _problems(call) == ["The automation automation.tank_light for LED 10120 is off."]

    await hass.services.async_call("automation", "turn_on", {"entity_id": AUTOMATION}, blocking=True)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_OFF
    assert _issue_ids(issue_registry) == []


async def test_a_missing_automation_or_helper_is_a_problem(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    await _add(call)

    hass.states.async_remove(AUTOMATION)
    hass.states.async_remove(OFF_HELPER)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_ON
    assert await _problems(call) == [
        "The automation automation.tank_light for LED 10120 is missing.",
        "LED 10120: no helper input_datetime.tank_light_off.",
    ]


async def test_an_unavailable_light_is_a_problem_until_it_is_back(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]
    assert await _problems(call) == ["switch.tank_light for LED 10120 is unavailable."]

    plugs.add(PLUG, STATE_OFF)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_OFF
    assert _log(loaded_entry) == [("unavailable", None), ("off", "other")]


async def test_an_unavailable_light_at_a_change_misses_it(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)
    plugs.add(PLUG, STATE_UNAVAILABLE)

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")

    assert await _problems(call) == [
        "switch.tank_light for LED 10120 is unavailable.",
        "LED 10120 did not turn on at 12:00.",
    ]


async def test_unavailable_then_unknown_is_still_one_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)

    plugs.add(PLUG, STATE_UNAVAILABLE)
    plugs.add(PLUG, STATE_UNKNOWN)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _log(loaded_entry) == [("unavailable", None)]
    assert _state(hass, PROBLEM) == STATE_ON


async def test_a_state_other_than_on_or_off_is_not_logged(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)

    plugs.add(PLUG, "dimming")
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _log(loaded_entry) == []


async def test_a_missing_entity_is_a_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, issue_registry: ir.IssueRegistry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    hass.states.async_remove(PLUG)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]


async def test_a_light_without_helpers_needs_them_and_nothing_is_set(
    hass: HomeAssistant,
    *,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
    hass_storage: dict[str, dict[str, dict[str, dict[str, dict[str, dict[str, object]]]]]],
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    await _set_time(hass, ON_HELPER, "00:00:00")
    await _set_time(hass, OFF_HELPER, "00:00:00")
    del hass_storage[f"{DOMAIN}.{loaded_entry.entry_id}"]["data"]["records"]["lights"][light_id]["helpers"]

    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")

    assert _times(hass) == ("00:00:00", "00:00:00")
    assert _state(hass, PROBLEM) == STATE_ON
    light = dict_of(list_of((await call.ok("get_light"))["lights"])[0])
    assert light["needs_helpers"] is True
    assert light["schedule"] is None
    assert light["automation"] is None
    assert light["problems"] == [
        "LED 10120 needs helpers: give it an automation and its on and off time helpers, then TankKeeper sets them."
    ]

    await _change(call, light_id, "update", **PLUG_HELPERS)

    assert _times(hass) == ("12:00:00", "20:00:00")
    assert _state(hass, PROBLEM) == STATE_OFF


async def test_removing_the_light_clears_its_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, issue_registry: ir.IssueRegistry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done(wait_background_tasks=True)

    await _change(call, light_id, "remove")

    assert _issue_ids(issue_registry) == []
    assert hass.states.get(PROBLEM) is None


async def test_a_light_removed_while_its_helpers_are_set_leaves_no_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, issue_registry: ir.IssueRegistry
) -> None:
    plugs.add(PLUG)
    added = await call.ok("set_light", action="add", reason="The tank light", **LED)
    applied = await apply(call, added)
    light_id = str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])

    await apply(call, await call.ok("set_light", action="remove", light_id=light_id, reason="Gone"))
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _times(hass) == ("00:00:00", "00:00:00")
    assert _issue_ids(issue_registry) == []
    assert hass.states.get(PROBLEM) is None


async def test_unloading_while_the_helpers_are_set_leaves_no_issue(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await hass.services.async_call("automation", "turn_off", {"entity_id": AUTOMATION}, blocking=True)
    proposal = await call.ok("set_light", action="update", light_id=light_id, on="13:00", reason="Why")

    @callback
    def unload(event: Event[EventStateChangedData]) -> None:
        hass.async_create_task(hass.config_entries.async_unload(loaded_entry.entry_id))

    async_track_state_change_event(hass, ON_HELPER, unload)
    await apply(call, proposal)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert loaded_entry.state is ConfigEntryState.NOT_LOADED
    assert _issue_ids(issue_registry) == []


async def test_two_lights_get_their_own_helpers(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    plugs.add(LAMP)

    await _add(call)
    await _add(call, LAMP_LIGHT, on="09:00", off="17:00")

    assert _times(hass) == ("12:00:00", "20:00:00")
    assert _state(hass, "input_datetime.tank_lamp_on") == "09:00:00"


async def test_the_log_keeps_30_days(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
) -> None:
    plugs.add(PLUG)
    await _add(call)
    service: TankkeeperService = loaded_entry.runtime_data
    start = service.now()
    for day in range(40):
        await _at(hass, freezer, (start + timedelta(days=day, hours=4)).isoformat())
        await _at(hass, freezer, (start + timedelta(days=day, hours=12)).isoformat())

    log = service.light_log()

    assert log[0].time >= service.now() - timedelta(days=31)
    assert len(log) == 62


async def test_the_log_survives_a_restart(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")

    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _log(loaded_entry) == [("on", "automation")]


async def test_unloading_stops_watching_the_light(
    hass: HomeAssistant,
    *,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    await _add(call)

    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T12:05:00+00:00")
    await _at(hass, freezer, "2026-11-27T00:00:00+00:00")
    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done()

    assert _issue_ids(issue_registry) == []


async def test_light_entities_exist_only_with_a_light(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
    entity_registry: er.EntityRegistry,
) -> None:
    plugs.add(PLUG)
    assert hass.states.get(PROBLEM) is None
    assert hass.states.get(NEXT) is None

    light_id = await _add(call)

    assert _state(hass, PROBLEM) == STATE_OFF
    assert _state(hass, NEXT) == "2026-11-26T12:00:00+00:00"
    next_change = hass.states.get(NEXT)
    assert next_change is not None
    assert next_change.attributes["turns_on"] == [PLUG]
    assert next_change.attributes["turns_off"] == []
    for entity_id, key in ((PROBLEM, "light_problem"), (NEXT, "next_light_change")):
        entity = entity_registry.async_get(entity_id)
        assert entity is not None
        assert entity.unique_id == f"{loaded_entry.entry_id}_{key}"

    await _change(call, light_id, "remove")

    assert hass.states.get(PROBLEM) is None
    assert hass.states.get(NEXT) is None
    assert entity_registry.async_get(PROBLEM) is None
    assert entity_registry.async_get(NEXT) is None


async def test_the_next_change_moves_on_after_each_change(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert _state(hass, NEXT) == "2026-11-26T20:00:00+00:00"
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    assert _state(hass, NEXT) == "2026-11-27T12:00:00+00:00"


async def test_a_light_added_before_home_assistant_has_started_is_set_once_it_starts(
    hass: HomeAssistant, plugs: Devices, config_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    hass.set_state(CoreState.not_running)
    config_entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(config_entry.entry_id)
    await hass.async_block_till_done()
    call = Caller(hass)

    await _add(call)
    assert _times(hass) == ("00:00:00", "00:00:00")

    hass.set_state(CoreState.running)
    hass.bus.async_fire(EVENT_HOMEASSISTANT_STARTED)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert _times(hass) == ("12:00:00", "20:00:00")


async def test_a_change_missed_while_home_assistant_was_down_is_a_problem_after_it_starts(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T14:00:00+00:00")
    plugs.failing.clear()
    assert _state(hass, PLUG) == STATE_OFF

    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert _state(hass, PROBLEM) == STATE_OFF
    await _at(hass, freezer, "2026-11-26T14:05:00+00:00")

    assert _state(hass, PROBLEM) == STATE_ON
    assert await _problems(call) == ["LED 10120 did not turn on at 12:00."]


async def test_a_one_day_change_missed_while_home_assistant_was_down_is_a_problem_after_it_starts(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await _change(call, light_id, "one_day", date="2026-11-27", on="09:00", off="18:00")
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-27T10:00:00+00:00")
    plugs.failing.clear()
    plugs.add(PLUG)

    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    assert _times(hass) == ("09:00:00", "18:00:00")
    await _at(hass, freezer, "2026-11-27T10:05:00+00:00")

    assert _state(hass, PROBLEM) == STATE_ON
    assert await _problems(call) == ["LED 10120 did not turn on at 09:00."]


async def test_a_light_removed_just_after_start_is_not_checked(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T14:00:00+00:00")
    plugs.failing.clear()
    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    await apply(call, await call.ok("set_light", action="remove", light_id=light_id, reason="Gone"))
    await _at(hass, freezer, "2026-11-26T14:05:00+00:00")

    assert _log(loaded_entry) == []
    assert hass.states.get(PROBLEM) is None


async def test_a_light_removed_during_the_startup_push_is_not_checked(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await _change(call, light_id, "one_day", date="2026-11-27", on="09:00", off="18:00")
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-27T10:00:00+00:00")
    plugs.failing.clear()
    plugs.add(PLUG)

    @callback
    def remove(event: Event[EventStateChangedData]) -> None:
        service: TankkeeperService = loaded_entry.runtime_data
        hass.async_create_task(service.async_set([(Collection.LIGHTS, light_id, None)], PANEL, "Gone"))

    stop_listening = async_track_state_change_event(hass, ON_HELPER, remove)
    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)
    stop_listening()
    await _at(hass, freezer, "2026-11-27T10:05:00+00:00")

    assert [kind for kind, _ in _log(loaded_entry)] == []
    assert hass.states.get(PROBLEM) is None


async def test_a_light_that_followed_while_home_assistant_was_down_is_fine_after_it_starts(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T14:00:00+00:00")
    plugs.failing.clear()
    plugs.add(PLUG, STATE_ON)

    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await _at(hass, freezer, "2026-11-26T14:05:00+00:00")

    assert _state(hass, PROBLEM) == STATE_OFF
    assert await _problems(call) == []


async def test_helpers_that_hold_no_value_show_as_none(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(LAMP)
    await _add(call, LAMP_LIGHT, brightness_pct=60)

    hass.states.async_set(LAMP_HELPERS["off_helper"], "unknown", {"has_time": True, "has_date": False})
    hass.states.async_set(LAMP_HELPERS["ramp_helper"], "unknown", {"min": 0, "max": 120})
    hass.states.async_remove(LAMP_HELPERS["brightness_helper"])
    await hass.async_block_till_done()

    [light] = list_of((await call.ok("get_light"))["lights"])
    assert dict_of(light)["schedule"] == {"on": "12:00", "off": None, "brightness_pct": None, "ramp_minutes": None}


async def test_a_light_without_helpers_is_watched_but_not_set(
    hass: HomeAssistant,
    *,
    call: Caller,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
    hass_storage: dict[str, dict[str, dict[str, dict[str, dict[str, dict[str, object]]]]]],
) -> None:
    plugs.add(PLUG)
    plugs.add(LAMP)
    light_id = await _add(call)
    await _add(call, LAMP_LIGHT)
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    del hass_storage[f"{DOMAIN}.{loaded_entry.entry_id}"]["data"]["records"]["lights"][light_id]["helpers"]
    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    await _change(call, light_id, "update", model="LED 2", off="21:00")
    await _set_time(hass, LAMP_HELPERS["on_helper"], "11:00:00")
    plugs.add(PLUG, STATE_ON)
    hass.states.async_set(PLUG, STATE_ON, {"friendly_name": "Plug"})
    await hass.async_block_till_done()

    assert _times(hass) == ("12:00:00", "20:00:00")
    assert _log(loaded_entry)[-1] == ("on", "other")
