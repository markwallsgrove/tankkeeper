"""Setting up a tank and changing its details."""

from homeassistant.config_entries import SOURCE_USER, ConfigFlowResult
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from custom_components.tankkeeper.const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from custom_components.tankkeeper.domain import TANK_ID, Collection, Source
from custom_components.tankkeeper.plan import REMINDERS_ID
from custom_components.tankkeeper.rules import RULES_ID, RuleSettings, Stage
from custom_components.tankkeeper.service import TankkeeperService

NEW_DETAILS = {CONF_TANK_NAME: "Office", CONF_VOLUME: 80, CONF_DOSING_VOLUME: 72}


async def _options_form(hass: HomeAssistant, entry: MockConfigEntry, step: str) -> ConfigFlowResult:
    menu = await hass.config_entries.options.async_init(entry.entry_id)
    assert menu["type"] is FlowResultType.MENU
    return await hass.config_entries.options.async_configure(menu["flow_id"], {"next_step_id": step})


async def _reminders_form(hass: HomeAssistant, entry: MockConfigEntry) -> ConfigFlowResult:
    return await _options_form(hass, entry, "reminders")


def _suggested(form: ConfigFlowResult) -> dict[str, object]:
    schema = form["data_schema"]
    assert schema is not None
    return {str(key): key.description["suggested_value"] for key in schema.schema if key.description}


async def test_user_step_creates_the_tank(hass: HomeAssistant) -> None:
    form = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert form["type"] is FlowResultType.FORM
    assert form["step_id"] == "user"

    menu = await hass.config_entries.flow.async_configure(form["flow_id"], NEW_DETAILS)
    result = await hass.config_entries.flow.async_configure(menu["flow_id"], {"next_step_id": "finish"})
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


async def test_options_suggest_the_reminder_settings(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    async_mock_service(hass, "notify", "mobile_app_phone")
    async_mock_service(hass, "notify", "mobile_app_tablet")

    form = await _reminders_form(hass, loaded_entry)

    assert form["type"] is FlowResultType.FORM
    assert form["step_id"] == "reminders"
    schema = form["data_schema"]
    assert schema is not None
    suggested = {str(key): key.description["suggested_value"] for key in schema.schema}
    assert suggested == {
        "notify": [],
        "task_time": "09:00",
        "dose_time": "12:00",
        "resend_time": "21:00",
        "status_notify": [],
    }
    for name in ("notify", "status_notify"):
        devices = schema.schema[next(key for key in schema.schema if str(key) == name)]
        assert devices.config["options"] == ["mobile_app_phone", "mobile_app_tablet"]


async def test_options_save_the_reminder_settings(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    async_mock_service(hass, "notify", "mobile_app_phone")
    async_mock_service(hass, "notify", "mobile_app_tablet")
    form = await _reminders_form(hass, loaded_entry)

    result = await hass.config_entries.options.async_configure(
        form["flow_id"],
        {
            "notify": ["mobile_app_phone"],
            "task_time": "08:30:00",
            "dose_time": "13:00:00",
            "resend_time": "21:00:00",
            "status_notify": ["mobile_app_tablet"],
        },
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = loaded_entry.runtime_data
    assert service.records(Collection.SETTINGS)[REMINDERS_ID] == {
        "notify": ["mobile_app_phone"],
        "task_time": "08:30",
        "dose_time": "13:00",
        "resend_time": "21:00",
        "status_notify": ["mobile_app_tablet"],
    }
    [latest] = service.history(Collection.SETTINGS, REMINDERS_ID, 1)
    assert latest.source is Source.PANEL


async def test_options_with_the_same_settings_change_nothing(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await _reminders_form(hass, loaded_entry)

    result = await hass.config_entries.options.async_configure(
        form["flow_id"], {"notify": [], "task_time": "09:00:00", "dose_time": "12:00:00", "resend_time": "21:00:00"}
    )

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_options_suggest_the_rule_limits_and_stage(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await _options_form(hass, loaded_entry, "rules")

    assert form["type"] is FlowResultType.FORM
    assert form["step_id"] == "rules"
    assert _suggested(form) == {**RuleSettings().to_json()}


async def test_options_save_the_rule_limits_and_stage(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await _options_form(hass, loaded_entry, "rules")

    result = await hass.config_entries.options.async_configure(
        form["flow_id"], {**RuleSettings().to_json(), "nitrogen_watch": 0.5, "nitrogen_act": 1, "stage": "cycling"}
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = loaded_entry.runtime_data
    assert service.rule_settings() == RuleSettings(nitrogen_watch=0.5, nitrogen_act=1.0)
    assert service.stage() is Stage.CYCLING
    [latest] = service.history(Collection.SETTINGS, RULES_ID, 1)
    assert latest.source is Source.PANEL

    form = await _options_form(hass, loaded_entry, "rules")
    assert _suggested(form)["stage"] == "cycling"


async def test_options_change_only_the_stage(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await _options_form(hass, loaded_entry, "rules")

    result = await hass.config_entries.options.async_configure(
        form["flow_id"], {**RuleSettings().to_json(), "stage": "cycled"}
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    service: TankkeeperService = loaded_entry.runtime_data
    assert service.stage() is Stage.CYCLED
    assert RULES_ID not in service.records(Collection.SETTINGS)


async def test_options_with_the_same_rules_change_nothing(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await _options_form(hass, loaded_entry, "rules")

    result = await hass.config_entries.options.async_configure(form["flow_id"], RuleSettings().to_json())

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_options_keep_act_stricter_than_watch(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await _options_form(hass, loaded_entry, "rules")

    result = await hass.config_entries.options.async_configure(
        form["flow_id"], {**RuleSettings().to_json(), "ph_act": 7.5}
    )

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "invalid_rules"}
    service: TankkeeperService = loaded_entry.runtime_data
    assert service.rule_settings() == RuleSettings()


async def test_options_need_the_tank_loaded(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    assert await hass.config_entries.async_unload(loaded_entry.entry_id)

    result = await hass.config_entries.options.async_init(loaded_entry.entry_id)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "not_loaded"
