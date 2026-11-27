"""get_light and set_light: lights are proposals, and get_light shows the schedule, the log and missed changes."""

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.helpers import llm
from homeassistant.util.json import JsonValueType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.tankkeeper.const import API_ID
from custom_components.tankkeeper.domain import Collection
from custom_components.tankkeeper.service import TankkeeperService

from .common import LAMP, PLUG, Caller, Devices, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

LED: dict[str, JsonValueType] = {"entity_id": PLUG, "model": "LED 10120", "on": "12:00", "off": "20:00"}


async def _add(call: Caller, **args: JsonValueType) -> str:
    applied = await apply(call, await call.ok("set_light", action="add", reason="The tank light", **(LED | args)))
    await call.hass.async_block_till_done(wait_background_tasks=True)
    return str_of(dict_of(list_of(dict_of(applied["history"])["changes"])[0])["record_id"])


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def _tool_names(hass: HomeAssistant, call: Caller) -> list[str]:
    api = await llm.async_get_api(hass, API_ID, call.context())
    return [tool.name for tool in api.tools]


def _light_record(entry: MockConfigEntry, light_id: str) -> dict[str, object]:
    service: TankkeeperService = entry.runtime_data
    return dict(service.records(Collection.LIGHTS)[light_id])


async def test_get_light_is_hidden_until_a_light_is_set(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    assert "tankkeeper__get_light" not in await _tool_names(hass, call)
    assert "tankkeeper__set_light" in await _tool_names(hass, call)

    await _add(call)

    assert "tankkeeper__get_light" in await _tool_names(hass, call)


async def test_adding_a_light_is_a_proposal(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)

    proposal = await call.ok("set_light", action="add", reason="The tank light", **LED)

    assert proposal["summary"] == "Add the light LED 10120 on switch.tank_light, on 12:00, off 20:00"
    [change] = list_of(proposal["changes"])
    assert dict_of(change)["after"] == {
        "entity_id": PLUG,
        "model": "LED 10120",
        "control": "on_off",
        "on": "12:00",
        "off": "20:00",
        "brightness_pct": None,
        "ramp_minutes": 0,
        "rgb_color": None,
        "one_day": None,
        "added": "2026-11-26",
        "removed": None,
    }
    service: TankkeeperService = loaded_entry.runtime_data
    assert service.records(Collection.LIGHTS) == {}

    await apply(call, proposal)

    assert len(service.records(Collection.LIGHTS)) == 1


async def test_a_dimmable_light_has_a_ramp_and_brightness(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(LAMP)

    light_id = await _add(
        call, entity_id=LAMP, control="colour", ramp_minutes=30, brightness_pct=80, rgb_color=[255, 220, 180]
    )

    record = _light_record(loaded_entry, light_id)
    assert (record["control"], record["ramp_minutes"], record["brightness_pct"], record["rgb_color"]) == (
        "colour",
        30,
        80,
        [255, 220, 180],
    )


@pytest.mark.parametrize(
    ("args", "error"),
    [
        ({"entity_id": "switch.missing"}, "invalid_input"),
        ({"entity_id": "fan.tank"}, "invalid_light"),
        ({"control": "dimmable"}, "invalid_light"),
        ({"brightness_pct": 50}, "invalid_light"),
        ({"on": "20:00", "off": "12:00"}, "invalid_light"),
        ({"on": "25:00"}, "invalid_input"),
        ({"control": "sparkly"}, "invalid_input"),
    ],
)
async def test_add_refuses_a_light_it_cannot_run(
    hass: HomeAssistant, call: Caller, plugs: Devices, args: dict[str, JsonValueType], error: str
) -> None:
    plugs.add(PLUG)
    plugs.add("fan.tank")

    assert await call.error("set_light", action="add", reason="Light", **(LED | args)) == error


async def test_add_needs_the_entity_and_times(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)

    assert await call.error("set_light", action="add", model="LED", on="12:00", reason="Light") == "invalid_input"
    assert (
        await call.error("set_light", action="add", entity_id=PLUG, model="LED", on="12:00", reason="Light")
        == "invalid_input"
    )


async def test_one_entity_runs_one_light(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    await _add(call)

    assert await call.error("set_light", action="add", reason="Again", **LED) == "invalid_input"


async def test_update_changes_the_schedule(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    proposal = await call.ok("set_light", action="update", light_id=light_id, off="21:00", reason="Longer day")

    assert proposal["summary"] == "Change the light LED 10120 on switch.tank_light, on 12:00, off 21:00"
    await apply(call, proposal)
    assert _light_record(loaded_entry, light_id)["off"] == "21:00"


async def test_update_to_on_off_drops_the_dimming(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(LAMP)
    light_id = await _add(
        call, entity_id=LAMP, control="colour", ramp_minutes=30, brightness_pct=80, rgb_color=[255, 220, 180]
    )

    await apply(call, await call.ok("set_light", action="update", light_id=light_id, control="dimmable", reason="x"))
    dimmable = _light_record(loaded_entry, light_id)
    await apply(call, await call.ok("set_light", action="update", light_id=light_id, control="on_off", reason="y"))
    plain = _light_record(loaded_entry, light_id)

    assert (dimmable["rgb_color"], dimmable["brightness_pct"], dimmable["ramp_minutes"]) == (None, 80, 30)
    assert (plain["rgb_color"], plain["brightness_pct"], plain["ramp_minutes"]) == (None, None, 0)


async def test_update_can_clear_the_colour_of_a_colour_light(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(LAMP)
    light_id = await _add(call, entity_id=LAMP, control="colour", brightness_pct=80, rgb_color=[255, 220, 180])

    await apply(
        call,
        await call.ok("set_light", action="update", light_id=light_id, rgb_color=None, ramp_minutes=10, reason="x"),
    )
    record = _light_record(loaded_entry, light_id)

    assert (record["control"], record["rgb_color"], record["brightness_pct"], record["ramp_minutes"]) == (
        "colour",
        None,
        80,
        10,
    )


async def test_update_can_clear_the_brightness_and_move_the_light(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(LAMP)
    plugs.add("light.other")
    light_id = await _add(call, entity_id=LAMP, control="dimmable", brightness_pct=80)

    await apply(
        call,
        await call.ok(
            "set_light",
            action="update",
            light_id=light_id,
            brightness_pct=None,
            entity_id="light.other",
            model="Other",
            reason="New lamp",
        ),
    )

    record = _light_record(loaded_entry, light_id)
    assert (record["brightness_pct"], record["entity_id"], record["model"]) == (None, "light.other", "Other")


async def test_update_with_nothing_new_changes_nothing(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    assert await call.error("set_light", action="update", light_id=light_id, on="12:00", reason="x") == (
        "nothing_to_change"
    )


@pytest.mark.parametrize("action", ["update", "remove", "one_day", "cancel_one_day"])
async def test_changing_a_light_needs_its_id(hass: HomeAssistant, call: Caller, plugs: Devices, action: str) -> None:
    plugs.add(PLUG)
    await _add(call)

    assert await call.error("set_light", action=action, reason="x") == "invalid_input"
    assert await call.error("set_light", action=action, light_id="nope", reason="x") == "not_found"


async def test_a_one_day_change_reverts_the_next_day(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    proposal = await call.ok("set_light", action="one_day", light_id=light_id, off="22:00", reason="Guests")

    assert proposal["summary"] == "Light LED 10120 on 2026-11-26 only: on 12:00, off 22:00"
    await apply(call, proposal)
    today = dict_of(list_of((await call.ok("get_light"))["lights"])[0])
    assert today["today"] == {"date": "2026-11-26", "on": "12:00", "off": "22:00", "brightness_pct": None}
    assert today["one_day"] == {"date": "2026-11-26", "on": "12:00", "off": "22:00", "brightness_pct": None}

    await _at(hass, freezer, "2026-11-27T08:00:00+00:00")

    tomorrow = dict_of(list_of((await call.ok("get_light"))["lights"])[0])
    assert tomorrow["today"] == {"date": "2026-11-27", "on": "12:00", "off": "20:00", "brightness_pct": None}


async def test_a_one_day_change_can_be_for_a_later_day_and_cancelled(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(LAMP)
    light_id = await _add(call, entity_id=LAMP, control="dimmable", brightness_pct=80)

    await apply(
        call,
        await call.ok(
            "set_light",
            action="one_day",
            light_id=light_id,
            date="2026-11-28",
            on="13:00",
            brightness_pct=40,
            reason="x",
        ),
    )
    assert _light_record(loaded_entry, light_id)["one_day"] == {
        "date": "2026-11-28",
        "on": "13:00",
        "off": "20:00",
        "brightness_pct": 40,
    }

    proposal = await call.ok("set_light", action="cancel_one_day", light_id=light_id, reason="Plans changed")

    assert proposal["summary"] == "Cancel the one-day change to LED 10120"
    await apply(call, proposal)
    assert _light_record(loaded_entry, light_id)["one_day"] is None
    assert await call.error("set_light", action="cancel_one_day", light_id=light_id, reason="x") == (
        "nothing_to_change"
    )


async def test_a_one_day_change_is_for_today_or_later(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    assert (
        await call.error("set_light", action="one_day", light_id=light_id, date="2026-11-25", reason="x")
        == "invalid_input"
    )
    assert (
        await call.error("set_light", action="one_day", light_id=light_id, date="soon", reason="x") == "invalid_input"
    )
    assert await call.error("set_light", action="one_day", light_id=light_id, on="21:00", reason="x") == "invalid_light"


async def test_removing_a_light_keeps_its_record(
    hass: HomeAssistant, call: Caller, plugs: Devices, loaded_entry: MockConfigEntry
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)

    proposal = await call.ok("set_light", action="remove", light_id=light_id, reason="Broken")

    assert proposal["summary"] == "Remove the light LED 10120"
    await apply(call, proposal)
    assert _light_record(loaded_entry, light_id)["removed"] == "2026-11-26"
    assert "tankkeeper__get_light" not in await _tool_names(hass, call)
    assert await call.error("set_light", action="update", light_id=light_id, off="21:00", reason="x") == "not_found"


async def test_a_removed_lights_entity_can_run_a_new_light(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await apply(call, await call.ok("set_light", action="remove", light_id=light_id, reason="Broken"))

    assert await _add(call, model="LED 2") != light_id


async def test_get_light_shows_the_schedule_history_and_log(
    hass: HomeAssistant, call: Caller, plugs: Devices, freezer: FrozenDateTimeFactory
) -> None:
    plugs.add(PLUG)
    light_id = await _add(call)
    await apply(call, await call.ok("set_light", action="update", light_id=light_id, off="21:00", reason="Longer day"))

    await _at(hass, freezer, "2026-11-26T12:00:00+00:00")
    plugs.failing.add(PLUG)
    await _at(hass, freezer, "2026-11-26T21:00:00+00:00")

    result = await call.ok("get_light", days=1)

    assert result["today"] == "2026-11-26"
    assert result["dose_time"] == "12:00"
    [light] = list_of(result["lights"])
    light = dict_of(light)
    assert (light["id"], light["entity_id"], light["state"], light["problem"]) == (light_id, PLUG, "on", True)
    assert [dict_of(entry)["reason"] for entry in list_of(light["history"])] == ["Longer day", "The tank light"]
    assert [(dict_of(event)["kind"], dict_of(event)["by"]) for event in list_of(light["log"])] == [
        ("on", "schedule"),
        ("missed", None),
    ]
    assert [dict_of(event)["kind"] for event in list_of(light["missed_or_late"])] == ["missed"]
    assert light["on_periods"] == [["2026-11-26T12:00:00+00:00", "2026-11-26T21:00:00+00:00"]]
    assert dict_of(light["status"])["missed"] is not None
    assert result["next_change"] == {"time": "2026-11-27T12:00:00+00:00", "on": [light_id], "off": []}


async def test_get_light_picks_one_light(hass: HomeAssistant, call: Caller, plugs: Devices) -> None:
    plugs.add(PLUG)
    plugs.add(LAMP)
    first = await _add(call)
    await _add(call, entity_id=LAMP, model="Lamp", on="10:00")

    result = await call.ok("get_light", light_id=first)

    assert [dict_of(light)["id"] for light in list_of(result["lights"])] == [first]
    assert result["dose_time"] == "10:00"
    assert await call.error("get_light", light_id="nope") == "not_found"
    assert await call.error("get_light", days=31) == "invalid_input"
