"""The integration runs the light schedule, logs on and off, and shows a problem when the light does not follow."""

from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import STATE_OFF, STATE_ON, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import Context, HomeAssistant
from homeassistant.helpers import entity_registry as er, issue_registry as ir
from homeassistant.util.json import JsonValueType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.tankkeeper.const import DOMAIN
from custom_components.tankkeeper.lights import LightEventKind
from custom_components.tankkeeper.service import TankkeeperService

from .common import LAMP, PLUG, Caller, Devices, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

LED: dict[str, JsonValueType] = {"entity_id": PLUG, "model": "LED 10120", "on": "12:00", "off": "20:00"}
PROBLEM = "binary_sensor.nano_light_problem"
NEXT = "sensor.nano_next_light_change"


async def _add(call: Caller, **args: JsonValueType) -> str:
    applied = await apply(call, await call.ok("set_light", action="add", reason="The tank light", **(LED | args)))
    await call.hass.async_block_till_done(wait_background_tasks=True)
    return str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
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


async def test_the_schedule_turns_the_plug_on_and_off(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
) -> None:
    plugs.add(PLUG)
    await _add(call)
    assert plugs.sent() == []

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert plugs.state(PLUG) == STATE_ON
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    assert plugs.state(PLUG) == STATE_OFF
    await _at(hass, freezer, "2026-11-27T12:00:00+00:00")

    assert plugs.sent() == [
        ("switch.turn_on", {"entity_id": [PLUG]}),
        ("switch.turn_off", {"entity_id": [PLUG]}),
        ("switch.turn_on", {"entity_id": [PLUG]}),
    ]
    assert _log(loaded_entry) == [("on", "schedule"), ("off", "schedule"), ("on", "schedule")]


async def test_a_dimmable_light_ramps_to_its_brightness_and_colour(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(LAMP)
    await _add(call, entity_id=LAMP, control="colour", ramp_minutes=30, brightness_pct=80, rgb_color=[255, 220, 180])

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")

    assert plugs.sent() == [
        (
            "light.turn_on",
            {"entity_id": [LAMP], "transition": 1800, "brightness_pct": 80, "rgb_color": [255, 220, 180]},
        ),
        ("light.turn_off", {"entity_id": [LAMP], "transition": 1800}),
    ]


async def test_a_dimmable_light_without_ramp_or_brightness_just_turns_on(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(LAMP)
    await _add(call, entity_id=LAMP, control="dimmable")

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")

    assert plugs.sent() == [("light.turn_on", {"entity_id": [LAMP]}), ("light.turn_off", {"entity_id": [LAMP]})]


async def test_the_one_day_change_runs_on_its_day_only(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await apply(call, await call.ok("set_light", action="one_day", light_id=light_id, off="22:00", reason="Guests"))

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    assert plugs.state(PLUG) == STATE_ON
    await _at(hass, freezer, "2026-11-26T22:00:00+00:00")
    assert plugs.state(PLUG) == STATE_OFF
    await _at(hass, freezer, "2026-11-27T12:00:00+00:00")
    await _at(hass, freezer, "2026-11-27T20:00:00+00:00")
    assert plugs.state(PLUG) == STATE_OFF


async def test_a_new_schedule_takes_effect_straight_away(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    await apply(call, await call.ok("set_light", action="update", light_id=light_id, on="07:00", reason="Earlier"))
    await hass.async_block_till_done()

    assert plugs.state(PLUG) == STATE_ON
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert len(plugs.calls) == 1


async def test_switching_by_hand_is_logged_and_kept_until_the_next_change(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
) -> None:
    plugs.add(PLUG)
    await _add(call)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")

    hass.states.async_set(PLUG, STATE_OFF, context=Context())
    hass.states.async_set(PLUG, STATE_OFF, {"brightness": 1})
    await _at(hass, freezer, "2026-11-26T13:00:00+00:00")

    assert plugs.state(PLUG) == STATE_OFF
    assert _log(loaded_entry) == [("on", "schedule"), ("off", "other")]
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    assert plugs.sent()[-1] == ("switch.turn_off", {"entity_id": [PLUG]})


async def test_an_unavailable_plug_misses_the_change_and_catches_up(
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
    assert _state(hass, PROBLEM) == STATE_OFF

    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done()
    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]
    issue = issue_registry.async_get_issue(DOMAIN, f"light_{light_id}")
    assert issue is not None
    assert (issue.translation_key, issue.translation_placeholders) == (
        "light_problem",
        {"model": "LED 10120", "entity_id": PLUG},
    )

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    problem = hass.states.get(PROBLEM)
    assert problem is not None
    [listed] = problem.attributes["problems"]
    assert listed["light_id"] == light_id
    assert listed["missed"]["kind"] == "missed"
    assert plugs.sent() == []

    await _at(hass, freezer, "2026-11-26T12:30:00+00:00")
    plugs.add(PLUG, STATE_OFF)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert plugs.state(PLUG) == STATE_ON
    assert _state(hass, PROBLEM) == STATE_OFF
    assert _issue_ids(issue_registry) == []
    service: TankkeeperService = loaded_entry.runtime_data
    kinds = [(event.kind, event.minutes_late) for event in service.light_log()]
    assert kinds == [
        (LightEventKind.UNAVAILABLE, None),
        (LightEventKind.MISSED, None),
        (LightEventKind.OFF, None),
        (LightEventKind.ON, None),
        (LightEventKind.LATE, 30),
    ]


async def test_a_plug_back_in_the_right_state_clears_the_problem(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    await _add(call)
    plugs.add(PLUG, STATE_UNAVAILABLE)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")

    plugs.add(PLUG, STATE_ON)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert plugs.sent() == []
    assert _state(hass, PROBLEM) == STATE_OFF
    assert _issue_ids(issue_registry) == []


async def test_unavailable_then_unknown_is_still_one_problem(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)
    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done()
    problem = hass.states.get(PROBLEM)
    assert problem is not None
    since = problem.attributes["problems"][0]["unavailable_since"]

    plugs.add(PLUG, STATE_UNKNOWN)
    await hass.async_block_till_done()

    problem = hass.states.get(PROBLEM)
    assert problem is not None
    assert problem.attributes["problems"][0]["unavailable_since"] == since
    assert _log(loaded_entry) == [("unavailable", None)]


async def test_a_state_other_than_on_or_off_is_not_logged(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)

    plugs.add(PLUG, "standby")
    await hass.async_block_till_done()

    assert _log(loaded_entry) == []
    assert _state(hass, PROBLEM) == STATE_OFF


async def test_a_hand_change_to_the_wrong_state_keeps_a_missed_change(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    plugs.calls.clear()

    plugs.add(PLUG, "standby")
    plugs.add(PLUG, STATE_OFF)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert plugs.sent() == []
    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]


async def test_a_plug_that_does_not_answer_misses_the_change(
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

    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]
    assert _log(loaded_entry) == [("missed", None)]

    plugs.failing.clear()
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")

    assert _state(hass, PROBLEM) == STATE_OFF
    assert _issue_ids(issue_registry) == []


async def test_a_missing_entity_is_a_problem(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
) -> None:
    plugs.add(PLUG)
    await _add(call)

    hass.states.async_remove(PLUG)
    await hass.async_block_till_done()

    assert _state(hass, PROBLEM) == STATE_ON
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert _log(loaded_entry) == [("unavailable", None), ("missed", None)]


async def test_startup_puts_the_light_in_the_scheduled_state(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
) -> None:
    plugs.add(PLUG)
    await _add(call)
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    freezer.move_to("2026-11-26T13:00:00+00:00")
    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert plugs.sent() == [("switch.turn_on", {"entity_id": [PLUG]})]
    assert _log(loaded_entry) == [("on", "schedule")]


async def test_startup_with_an_unavailable_plug_shows_the_problem(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    assert _issue_ids(issue_registry) == []
    plugs.add(PLUG, STATE_UNAVAILABLE)

    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done(wait_background_tasks=True)

    assert _state(hass, PROBLEM) == STATE_ON
    assert _issue_ids(issue_registry) == [f"light_{light_id}"]
    assert _log(loaded_entry) == []


async def test_removing_the_light_stops_the_schedule_and_its_problem(
    hass: HomeAssistant,
    call: Caller,
    plugs: Devices,
    freezer: FrozenDateTimeFactory,
    issue_registry: ir.IssueRegistry,
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done()

    await apply(call, await call.ok("set_light", action="remove", light_id=light_id, reason="Gone"))
    await hass.async_block_till_done(wait_background_tasks=True)
    plugs.add(PLUG, STATE_OFF)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")

    assert _issue_ids(issue_registry) == []
    assert plugs.sent() == []


async def test_two_lights_change_together(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    plugs.add(LAMP)
    await _add(call)
    await _add(call, entity_id=LAMP, model="Lamp", on="06:00", off="12:00")
    plugs.calls.clear()

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")

    assert sorted(plugs.sent()) == [
        ("light.turn_off", {"entity_id": [LAMP]}),
        ("switch.turn_on", {"entity_id": [PLUG]}),
    ]


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

    assert _log(loaded_entry) == [("on", "schedule")]


async def test_unloading_stops_the_schedule(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    await _add(call)

    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    plugs.add(PLUG, STATE_UNAVAILABLE)
    await hass.async_block_till_done()

    assert plugs.sent() == []


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
    await hass.async_block_till_done(wait_background_tasks=True)

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

    await apply(call, await call.ok("set_light", action="remove", light_id=light_id, reason="Gone"))
    await hass.async_block_till_done(wait_background_tasks=True)

    assert hass.states.get(PROBLEM) is None
    assert hass.states.get(NEXT) is None
    assert entity_registry.async_get(PROBLEM) is None
    assert entity_registry.async_get(NEXT) is None


async def test_the_next_change_moves_on_after_each_change(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    await _add(call)
    await hass.async_block_till_done(wait_background_tasks=True)

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    assert _state(hass, NEXT) == "2026-11-26T20:00:00+00:00"
    plugs.add(PLUG, STATE_ON)
    await _at(hass, freezer, "2026-11-26T20:00:00+00:00")
    assert _state(hass, NEXT) == "2026-11-27T12:00:00+00:00"
