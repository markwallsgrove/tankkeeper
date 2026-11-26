"""Setting up a tank and changing its details."""

from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from custom_components.tankkeeper.domain import TANK_ID, Collection, Source
from custom_components.tankkeeper.service import TankkeeperService

NEW_DETAILS = {CONF_TANK_NAME: "Office", CONF_VOLUME: 80, CONF_DOSING_VOLUME: 72}


async def test_user_step_creates_the_tank(hass: HomeAssistant) -> None:
    form = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert form["type"] is FlowResultType.FORM
    assert form["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(form["flow_id"], NEW_DETAILS)
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Office"
    assert result["data"] == NEW_DETAILS
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    service: TankkeeperService = entry.runtime_data
    assert service.records(Collection.TANK)[TANK_ID]["volume_litres"] == 80


async def test_user_step_keeps_the_dosing_volume_within_the_tank(hass: HomeAssistant) -> None:
    form = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})

    result = await hass.config_entries.flow.async_configure(form["flow_id"], {**NEW_DETAILS, CONF_DOSING_VOLUME: 81})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_DOSING_VOLUME: "dosing_above_volume"}
    assert not hass.config_entries.async_entries(DOMAIN)


async def test_only_one_tank_can_be_set_up(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "single_instance_allowed"


async def test_reconfigure_suggests_the_current_details(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await loaded_entry.start_reconfigure_flow(hass)

    assert form["type"] is FlowResultType.FORM
    assert form["step_id"] == "reconfigure"
    schema = form["data_schema"]
    assert schema is not None
    suggested = {str(key): key.description["suggested_value"] for key in schema.schema}
    assert suggested == {CONF_TANK_NAME: "Nano", CONF_VOLUME: 60, CONF_DOSING_VOLUME: 54}


async def test_reconfigure_changes_the_tank_and_keeps_the_old_values(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await loaded_entry.start_reconfigure_flow(hass)

    result = await hass.config_entries.flow.async_configure(form["flow_id"], NEW_DETAILS)
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "reconfigure_successful"
    assert loaded_entry.title == "Office"
    assert loaded_entry.data == NEW_DETAILS
    service: TankkeeperService = loaded_entry.runtime_data
    tank = service.records(Collection.TANK)[TANK_ID]
    assert (tank["name"], tank["volume_litres"], tank["dosing_volume_litres"]) == ("Office", 80, 72)
    assert tank["notes"] == ""
    [latest] = service.history(Collection.TANK, TANK_ID, 1)
    assert latest.source is Source.PANEL
    before = latest.changes[0].before
    assert before is not None
    assert before["volume_litres"] == 60


async def test_reconfigure_with_the_same_details_changes_nothing(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await loaded_entry.start_reconfigure_flow(hass)

    result = await hass.config_entries.flow.async_configure(
        form["flow_id"], {CONF_TANK_NAME: "Nano", CONF_VOLUME: 60, CONF_DOSING_VOLUME: 54}
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_reconfigure_keeps_the_dosing_volume_within_the_tank(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await loaded_entry.start_reconfigure_flow(hass)

    result = await hass.config_entries.flow.async_configure(form["flow_id"], {**NEW_DETAILS, CONF_VOLUME: 70})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {CONF_DOSING_VOLUME: "dosing_above_volume"}
    assert loaded_entry.data[CONF_VOLUME] == 60


async def test_reconfigure_needs_the_tank_loaded(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    result = await loaded_entry.start_reconfigure_flow(hass)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "not_loaded"
