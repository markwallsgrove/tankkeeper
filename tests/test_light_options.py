"""The options flow can add, change and remove a light, and set a one-day change, without an assistant."""

from typing import Any

from homeassistant.config_entries import ConfigFlowResult
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.domain import Collection, Source
from custom_components.tankkeeper.lights import Control
from custom_components.tankkeeper.service import TankkeeperService

from .common import LAMP, PLUG, Devices

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

PLUG_LIGHT = {"entity_id": PLUG, "model": "LED 10120", "control": "on_off", "on": "11:00:00", "off": "20:00:00"}


async def _step(hass: HomeAssistant, entry: MockConfigEntry, step: str) -> ConfigFlowResult:
    menu = await hass.config_entries.options.async_init(entry.entry_id)
    assert menu["type"] is FlowResultType.MENU
    return await hass.config_entries.options.async_configure(menu["flow_id"], {"next_step_id": step})


async def _submit(hass: HomeAssistant, form: ConfigFlowResult, user_input: dict[str, Any]) -> ConfigFlowResult:
    result = await hass.config_entries.options.async_configure(form["flow_id"], user_input)
    await hass.async_block_till_done(wait_background_tasks=True)
    return result


async def _add(hass: HomeAssistant, entry: MockConfigEntry, user_input: dict[str, Any]) -> str:
    result = await _submit(hass, await _step(hass, entry, "add_light"), user_input)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = entry.runtime_data
    [light] = service.active_lights()
    return light.id


def _suggested(form: ConfigFlowResult) -> dict[str, Any]:
    schema = form["data_schema"]
    assert schema is not None
    return {
        str(key): key.description["suggested_value"]
        for key in schema.schema
        if key.description and "suggested_value" in key.description
    }


async def test_the_menu_offers_light_steps_only_with_a_light(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(PLUG)
    menu = await hass.config_entries.options.async_init(loaded_entry.entry_id)
    assert menu["type"] is FlowResultType.MENU
    assert menu["menu_options"] == ["reminders", "add_light"]

    await _add(hass, loaded_entry, PLUG_LIGHT)
    menu = await hass.config_entries.options.async_init(loaded_entry.entry_id)

    assert menu["type"] is FlowResultType.MENU
    assert menu["menu_options"] == ["reminders", "add_light", "change_light", "one_day", "remove_light"]


async def test_add_light_stores_it_from_the_panel(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(PLUG)

    light_id = await _add(hass, loaded_entry, PLUG_LIGHT)

    service: TankkeeperService = loaded_entry.runtime_data
    light = service.light(light_id)
    assert (light.entity_id, light.model, light.control) == (PLUG, "LED 10120", Control.ON_OFF)
    assert (light.schedule.on.isoformat(), light.schedule.off.isoformat()) == ("11:00:00", "20:00:00")
    [latest] = service.history(Collection.LIGHTS, light_id, 1)
    assert latest.source is Source.PANEL
    assert service.reminders_on(light.added).dose_time.isoformat() == "11:00:00"


async def test_add_light_keeps_the_form_when_the_light_cannot_run(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(PLUG)
    form = await _step(hass, loaded_entry, "add_light")

    result = await _submit(hass, form, PLUG_LIGHT | {"off": "10:00:00"})

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "add_light"
    assert result["errors"] == {"base": "invalid_light"}
    assert result["description_placeholders"] == {"error": "The light turns off after it turns on, on the same day"}
    service: TankkeeperService = loaded_entry.runtime_data
    assert not service.has_lights()


async def test_add_a_colour_light_with_its_ramp_brightness_and_colour(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(LAMP)

    light_id = await _add(
        hass,
        loaded_entry,
        PLUG_LIGHT
        | {
            "entity_id": LAMP,
            "control": "colour",
            "ramp_minutes": 30.0,
            "brightness_pct": 80.0,
            "rgb_color": [1, 2, 3],
        },
    )

    service: TankkeeperService = loaded_entry.runtime_data
    schedule = service.light(light_id).schedule
    assert (schedule.ramp_minutes, schedule.brightness_pct, schedule.rgb_color) == (30, 80, (1, 2, 3))


async def test_change_light_suggests_the_current_settings_and_saves_the_change(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(LAMP)
    light_id = await _add(
        hass, loaded_entry, PLUG_LIGHT | {"entity_id": LAMP, "control": "dimmable", "brightness_pct": 80.0}
    )
    pick = await _step(hass, loaded_entry, "change_light")
    assert pick["step_id"] == "change_light"

    form = await _submit(hass, pick, {"light_id": light_id})

    assert form["step_id"] == "edit_light"
    assert _suggested(form) == {
        "entity_id": LAMP,
        "model": "LED 10120",
        "control": "dimmable",
        "on": "11:00",
        "off": "20:00",
        "brightness_pct": 80,
        "ramp_minutes": 0,
    }
    edited = {key: value for key, value in _suggested(form).items() if key != "brightness_pct"}
    result = await _submit(hass, form, edited | {"off": "21:00:00"})

    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = loaded_entry.runtime_data
    schedule = service.light(light_id).schedule
    assert (schedule.off.isoformat(), schedule.brightness_pct) == ("21:00:00", None)


async def test_change_light_with_the_same_settings_changes_nothing(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(PLUG)
    light_id = await _add(hass, loaded_entry, PLUG_LIGHT)
    form = await _submit(hass, await _step(hass, loaded_entry, "change_light"), {"light_id": light_id})

    result = await _submit(hass, form, PLUG_LIGHT)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_change_light_keeps_the_form_when_the_light_cannot_run(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(PLUG)
    light_id = await _add(hass, loaded_entry, PLUG_LIGHT)
    form = await _submit(hass, await _step(hass, loaded_entry, "change_light"), {"light_id": light_id})

    result = await _submit(hass, form, PLUG_LIGHT | {"control": "dimmable"})

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "edit_light"
    assert result["errors"] == {"base": "invalid_light"}


async def test_one_day_sets_a_change_for_that_day(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(PLUG)
    light_id = await _add(hass, loaded_entry, PLUG_LIGHT)
    form = await _step(hass, loaded_entry, "one_day")

    result = await _submit(
        hass, form, {"light_id": light_id, "date": "2026-11-27", "on": "10:30:00", "off": "20:00:00"}
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = loaded_entry.runtime_data
    change = service.light(light_id).one_day
    assert change is not None
    assert (change.day.isoformat(), change.on.isoformat(), change.brightness_pct) == ("2026-11-27", "10:30:00", None)


async def test_one_day_refuses_a_past_day(hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices) -> None:
    plugs.add(PLUG)
    light_id = await _add(hass, loaded_entry, PLUG_LIGHT)
    form = await _step(hass, loaded_entry, "one_day")

    result = await _submit(
        hass, form, {"light_id": light_id, "date": "2026-11-25", "on": "10:30:00", "off": "20:00:00"}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_light"}
    assert result["description_placeholders"] == {"error": "A one-day change is for today or a later day"}


async def test_remove_light_removes_it_and_its_entities(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(PLUG)
    light_id = await _add(hass, loaded_entry, PLUG_LIGHT)
    form = await _step(hass, loaded_entry, "remove_light")
    schema = form["data_schema"]
    assert schema is not None
    [key] = schema.schema
    assert schema.schema[key].config["options"] == [{"value": light_id, "label": f"LED 10120 ({PLUG})"}]

    result = await _submit(hass, form, {"light_id": light_id})

    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = loaded_entry.runtime_data
    assert not service.has_lights()
    assert hass.states.get("binary_sensor.nano_light_problem") is None


async def test_change_light_suggests_the_colour_of_a_colour_light(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, plugs: Devices
) -> None:
    plugs.add(LAMP)
    light_id = await _add(
        hass, loaded_entry, PLUG_LIGHT | {"entity_id": LAMP, "control": "colour", "rgb_color": [1, 2, 3]}
    )

    form = await _submit(hass, await _step(hass, loaded_entry, "change_light"), {"light_id": light_id})

    assert _suggested(form)["rgb_color"] == [1, 2, 3]
