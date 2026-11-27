"""get_light's on periods come from Home Assistant's recorded state history of the light."""

from pathlib import Path

from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.recorder.core import Recorder
from homeassistant.const import STATE_ON, STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
from homeassistant.util.json import JsonValueType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed
from pytest_homeassistant_custom_component.components.recorder.common import (
    async_wait_purge_done,
    async_wait_recording_done,
)

from .common import PLUG, PLUG_HELPERS, Caller, Devices, apply, dict_of, list_of

pytestmark = [pytest.mark.freeze_time("2026-11-25T20:00:00+00:00")]

LED: dict[str, JsonValueType] = {
    "entity_id": PLUG,
    "model": "LED 10120",
    "on": "07:00",
    "off": "22:00",
    **PLUG_HELPERS,
}


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(recorder_mock: Recorder, enable_custom_integrations: None) -> None:
    """Start the recorder before Home Assistant, then let it load TankKeeper from custom_components."""


@pytest.fixture(autouse=True)
def own_config_dir(recorder_mock: Recorder, hass: HomeAssistant, tmp_path: Path) -> None:
    """Keep each test's files in its own folder, with the recorder started first."""
    hass.config.config_dir = str(tmp_path)


@pytest.fixture(autouse=True)
async def core(recorder_mock: Recorder, hass: HomeAssistant) -> None:
    """Set up Home Assistant's core integration after the recorder."""
    assert await async_setup_component(hass, "homeassistant", {})


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def _periods(call: Caller, days: int = 2) -> list[JsonValueType]:
    [light] = list_of((await call.ok("get_light", days=days))["lights"])
    return list_of(dict_of(light)["on_periods"])


@pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")
async def test_a_light_added_while_on_shows_its_recorded_on_periods_from_the_day_it_was_added(
    recorder_mock: Recorder,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
) -> None:
    call = Caller(hass)
    plugs.add(PLUG, STATE_ON)
    await async_wait_recording_done(hass)

    await _at(hass, freezer, "2026-11-26T10:00:00+00:00")
    await apply(call, await call.ok("set_light", action="add", reason="The tank light", **LED))
    await hass.async_block_till_done(wait_background_tasks=True)

    await _at(hass, freezer, "2026-11-26T15:00:00+00:00")
    plugs.add(PLUG, STATE_UNAVAILABLE)
    await async_wait_recording_done(hass)
    await _at(hass, freezer, "2026-11-26T16:00:00+00:00")
    plugs.add(PLUG, STATE_ON)
    await async_wait_recording_done(hass)
    await _at(hass, freezer, "2026-11-26T18:00:00+00:00")

    assert await _periods(call) == [
        ["2026-11-26T08:00:00+00:00", "2026-11-26T15:00:00+00:00"],
        ["2026-11-26T16:00:00+00:00", "2026-11-26T18:00:00+00:00"],
    ]


@pytest.mark.parametrize("persistent_database", [True])
async def test_a_change_the_recorder_has_not_written_yet_still_shows(
    recorder_mock: Recorder,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
) -> None:
    call = Caller(hass)
    await _at(hass, freezer, "2026-11-26T06:00:00+00:00")
    plugs.add(PLUG)
    await apply(call, await call.ok("set_light", action="add", reason="The tank light", **LED))
    await async_wait_recording_done(hass)
    await _at(hass, freezer, "2026-11-26T07:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")
    await async_wait_recording_done(hass)
    recorder_mock.commit_interval = 3600
    freezer.move_to("2026-11-26T09:30:00+00:00")
    plugs.add(PLUG, STATE_UNAVAILABLE)
    freezer.move_to("2026-11-26T10:00:00+00:00")

    assert await _periods(call) == [["2026-11-26T07:00:00+00:00", "2026-11-26T09:30:00+00:00"]]


@pytest.mark.parametrize("recorder_config", [{"exclude": {"entities": [PLUG]}}])
async def test_a_light_the_recorder_leaves_out_uses_the_on_off_log(
    recorder_mock: Recorder,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
) -> None:
    call = Caller(hass)
    await _at(hass, freezer, "2026-11-26T06:00:00+00:00")
    plugs.add(PLUG)
    await apply(call, await call.ok("set_light", action="add", reason="The tank light", **LED))
    await async_wait_recording_done(hass)
    await _at(hass, freezer, "2026-11-26T07:00:00+00:00")
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")
    await async_wait_recording_done(hass)

    assert await _periods(call) == [["2026-11-26T07:00:00+00:00", "2026-11-26T09:00:00+00:00"]]


@pytest.mark.freeze_time("2026-11-23T05:00:00+00:00")
async def test_days_before_the_recorder_kept_history_come_from_the_on_off_log(
    recorder_mock: Recorder,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
) -> None:
    call = Caller(hass)
    await _at(hass, freezer, "2026-11-23T06:00:00+00:00")
    plugs.add(PLUG)
    await apply(call, await call.ok("set_light", action="add", reason="The tank light", **LED))
    await hass.async_block_till_done(wait_background_tasks=True)
    for moment in ("23T07", "23T22", "24T07", "24T22", "25T07", "25T22", "26T07"):
        await _at(hass, freezer, f"2026-11-{moment}:00:00+00:00")
        await async_wait_recording_done(hass)
    await hass.services.async_call("recorder", "purge", {"keep_days": 1}, blocking=True)
    await async_wait_purge_done(hass)
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert await _periods(call, days=7) == [
        ["2026-11-23T07:00:00+00:00", "2026-11-23T22:00:00+00:00"],
        ["2026-11-24T07:00:00+00:00", "2026-11-24T22:00:00+00:00"],
        ["2026-11-25T07:00:00+00:00", "2026-11-25T22:00:00+00:00"],
        ["2026-11-26T07:00:00+00:00", "2026-11-26T09:00:00+00:00"],
    ]


async def test_a_light_off_all_day_has_no_on_periods(
    recorder_mock: Recorder,
    hass: HomeAssistant,
    freezer: FrozenDateTimeFactory,
    plugs: Devices,
    loaded_entry: MockConfigEntry,
) -> None:
    call = Caller(hass)
    await _at(hass, freezer, "2026-11-26T06:00:00+00:00")
    plugs.add(PLUG)
    await apply(call, await call.ok("set_light", action="add", reason="The tank light", **(LED | {"on": "07:00"})))
    plugs.failing.add(PLUG)
    await async_wait_recording_done(hass)
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert await _periods(call) == []
