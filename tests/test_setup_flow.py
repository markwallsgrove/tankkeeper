"""Setting up a new tank step by step: tank, water, products, contents, light, reminders and Claude."""

from collections.abc import Mapping

from homeassistant.config_entries import SOURCE_USER, ConfigFlowContext, ConfigFlowResult
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from custom_components.tankkeeper.claude import ClaudeSettings, Trigger
from custom_components.tankkeeper.const import CONF_DOSING_VOLUME, CONF_SETUP, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from custom_components.tankkeeper.domain import TANK_ID, WATER_ID, Collection, Source
from custom_components.tankkeeper.plan import REMINDERS_ID
from custom_components.tankkeeper.service import Actor, TankkeeperService

from .common import PLUG_HELPERS, Devices

TANK = {CONF_TANK_NAME: "Office", CONF_VOLUME: 80, CONF_DOSING_VOLUME: 72}
LIGHT = {
    "entity_id": "switch.tank_light",
    "model": "Chihiros C2",
    "control": "on_off",
    "on": "10:00",
    "off": "18:00",
    **PLUG_HELPERS,
}


async def _start(hass: HomeAssistant, tank: Mapping[str, object]) -> ConfigFlowResult:
    form = await hass.config_entries.flow.async_init(DOMAIN, context=ConfigFlowContext(source=SOURCE_USER))
    assert form["step_id"] == "user"
    return await hass.config_entries.flow.async_configure(form["flow_id"], dict(tank))


async def _pick(hass: HomeAssistant, result: ConfigFlowResult, step: str) -> ConfigFlowResult:
    assert result["type"] is FlowResultType.MENU
    return await hass.config_entries.flow.async_configure(result["flow_id"], {"next_step_id": step})


async def _fill(hass: HomeAssistant, result: ConfigFlowResult, data: Mapping[str, object]) -> ConfigFlowResult:
    assert result["type"] is FlowResultType.FORM
    return await hass.config_entries.flow.async_configure(result["flow_id"], dict(data))


def _service(hass: HomeAssistant) -> TankkeeperService:
    [entry] = hass.config_entries.async_entries(DOMAIN)
    service: TankkeeperService = entry.runtime_data
    return service


async def test_the_user_can_leave_the_rest_to_claude(hass: HomeAssistant) -> None:
    menu = await _start(hass, TANK)
    assert menu["step_id"] == "how"
    assert menu["menu_options"] == ["water", "finish"]

    result = await _pick(hass, menu, "finish")
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == TANK
    assert _service(hass).history(None, None, 10) == []


async def test_every_step_is_saved_as_one_panel_change(hass: HomeAssistant, plugs: Devices) -> None:
    plugs.add("switch.tank_light")
    async_mock_service(hass, "notify", "mobile_app_phone")
    result = await _start(hass, {**TANK, "temperature_c": 24, "notes": "Shrimp tank"})
    result = await _fill(hass, await _pick(hass, result, "water"), {"source": "supplier", "ph": 7.4, "kh": 6})
    assert result["step_id"] == "products"
    assert result["menu_options"] == ["add_product", "contents"]
    result = await _fill(
        hass,
        await _pick(hass, result, "add_product"),
        {"name": "Tropica Premium", "purpose": "Plant food", "label_amount_ml": 1, "label_per_litres": 50},
    )
    result = await _fill(hass, await _pick(hass, result, "add_product"), {"name": "Seachem Prime"})
    assert result["description_placeholders"] == {"added": "Tropica Premium, Seachem Prime"}
    result = await _pick(hass, result, "contents")
    assert result["menu_options"] == ["add_content", "light"]
    assert result["description_placeholders"] == {"added": "-"}
    result = await _fill(
        hass, await _pick(hass, result, "add_content"), {"type": "plant", "name": "Java fern", "count": 2}
    )
    assert result["description_placeholders"] == {"added": "Java fern"}
    result = await _pick(hass, result, "light")
    assert result["menu_options"] == ["add_light", "reminders"]
    result = await _fill(hass, await _pick(hass, result, "add_light"), LIGHT)
    assert result["step_id"] == "reminders"
    assert result["menu_options"] == ["set_reminders", "claude"]
    form = await _pick(hass, result, "set_reminders")
    schema = form["data_schema"]
    assert schema is not None
    devices = schema.schema[next(key for key in schema.schema if str(key) == "notify")]
    assert devices.config["options"] == ["mobile_app_phone"]
    result = await _fill(
        hass,
        form,
        {"notify": ["mobile_app_phone"], "task_time": "08:00:00", "dose_time": "12:00:00", "resend_time": "21:00:00"},
    )
    assert result["step_id"] == "claude"
    assert result["menu_options"] == ["set_claude", "finish"]
    result = await _fill(
        hass, await _pick(hass, result, "set_claude"), {"review_on": ["status"], "comments": True, "daily_cap": 2}
    )
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    [config_entry] = hass.config_entries.async_entries(DOMAIN)
    assert config_entry.data == TANK
    service = _service(hass)
    assert service.records(Collection.TANK)[TANK_ID] == {
        "name": "Office",
        "volume_litres": 80,
        "dosing_volume_litres": 72,
        "temperature_c": 24,
        "notes": "Shrimp tank",
    }
    assert service.records(Collection.WATER)[WATER_ID] == {"source": "supplier", "ph": 7.4, "kh": 6}
    products = sorted(service.records(Collection.PRODUCTS).values(), key=lambda product: str(product["name"]))
    assert products == [
        {
            "name": "Seachem Prime",
            "purpose": "",
            "label_dose": None,
            "your_dose": "",
            "notes": "",
            "links": [],
        },
        {
            "name": "Tropica Premium",
            "purpose": "Plant food",
            "label_dose": {"amount_ml": 1, "per_litres": 50},
            "your_dose": "",
            "notes": "",
            "links": [],
        },
    ]
    [content] = service.records(Collection.CONTENTS).values()
    assert (content["type"], content["name"], content["count"], content["removed"]) == ("plant", "Java fern", 2, None)
    [light] = service.active_lights()
    assert (light.entity_id, light.model) == ("switch.tank_light", "Chihiros C2")
    assert service.reminders().notify == ("mobile_app_phone",)
    assert service.records(Collection.SETTINGS)[REMINDERS_ID]["task_time"] == "08:00"
    [entry] = service.history(None, None, 10)
    assert (entry.source, entry.user_id, entry.summary) == (Source.PANEL, None, "Set up Office")
    assert service.claude() == ClaudeSettings(review_on=(Trigger.STATUS,), comments=True, daily_cap=2)
    assert len(entry.changes) == 8


async def test_every_step_can_be_skipped(hass: HomeAssistant) -> None:
    result = await _start(hass, TANK)
    result = await _fill(hass, await _pick(hass, result, "water"), {})
    result = await _pick(hass, result, "contents")
    result = await _pick(hass, result, "light")
    result = await _pick(hass, await _pick(hass, result, "reminders"), "claude")
    result = await _pick(hass, result, "finish")
    await hass.async_block_till_done()

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["data"] == TANK
    service = _service(hass)
    assert service.history(None, None, 10) == []
    assert service.records(Collection.WATER) == {}


async def test_the_setup_change_can_be_undone(hass: HomeAssistant) -> None:
    result = await _start(hass, TANK)
    result = await _fill(hass, await _pick(hass, result, "water"), {"source": "tap_test", "gh": 8})
    result = await _pick(hass, result, "contents")
    result = await _pick(hass, result, "light")
    result = await _pick(hass, await _pick(hass, result, "reminders"), "claude")
    await _pick(hass, result, "finish")
    await hass.async_block_till_done()
    service = _service(hass)
    [entry] = service.history(None, None, 10)

    await service.async_undo(entry.id, Actor(source=Source.PANEL, user_id=None, conversation_id=None), "Undo")

    assert service.records(Collection.WATER) == {}


async def test_a_label_dose_needs_both_values(hass: HomeAssistant) -> None:
    result = await _start(hass, TANK)
    result = await _fill(hass, await _pick(hass, result, "water"), {})
    form = await _pick(hass, result, "add_product")

    result = await _fill(hass, form, {"name": "Tropica Premium", "label_amount_ml": 1})

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "add_product"
    assert result["errors"] == {"base": "label_dose_incomplete"}


async def test_a_light_needs_its_entity(hass: HomeAssistant) -> None:
    result = await _start(hass, TANK)
    result = await _fill(hass, await _pick(hass, result, "water"), {})
    result = await _pick(hass, result, "contents")
    form = await _pick(hass, await _pick(hass, result, "light"), "add_light")

    result = await _fill(hass, form, LIGHT)

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "add_light"
    assert result["errors"] == {"base": "invalid_light"}
    assert result["description_placeholders"] == {"error": "No entity switch.tank_light"}


async def test_a_content_can_have_no_count(hass: HomeAssistant) -> None:
    result = await _start(hass, TANK)
    result = await _fill(hass, await _pick(hass, result, "water"), {})
    result = await _pick(hass, result, "contents")
    result = await _fill(hass, await _pick(hass, result, "add_content"), {"type": "rock", "name": "Seiryu stone"})
    result = await _pick(
        hass, await _pick(hass, await _pick(hass, await _pick(hass, result, "light"), "reminders"), "claude"), "finish"
    )
    await hass.async_block_till_done()

    [content] = _service(hass).records(Collection.CONTENTS).values()
    assert (content["name"], content["count"]) == ("Seiryu stone", None)


async def test_setup_stored_twice_is_one_change(hass: HomeAssistant) -> None:
    draft = [["water", WATER_ID, {"ph": 7.0}]]
    entry = MockConfigEntry(domain=DOMAIN, title="Office", data={**TANK, CONF_SETUP: draft})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.data == TANK

    hass.config_entries.async_update_entry(entry, data={**TANK, CONF_SETUP: draft})
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()

    assert entry.data == TANK
    assert len(_service(hass).history(None, None, 10)) == 1


async def test_a_product_and_a_content_need_a_name(hass: HomeAssistant) -> None:
    result = await _start(hass, TANK)
    result = await _fill(hass, await _pick(hass, result, "water"), {})

    product = await _fill(hass, await _pick(hass, result, "add_product"), {"name": " "})
    assert product["step_id"] == "add_product"
    assert product["errors"] == {"name": "name_required"}

    product = await _fill(hass, product, {"name": "Seachem Prime"})
    contents = await _pick(hass, product, "contents")
    content = await _fill(hass, await _pick(hass, contents, "add_content"), {"type": "rock", "name": ""})
    assert content["step_id"] == "add_content"
    assert content["errors"] == {"name": "name_required"}


@pytest.mark.parametrize(
    ("values", "error"),
    [
        ({"agent": "conversation.gone"}, "No conversation agent conversation.gone"),
        ({"daily_time": "08:30:15"}, "'08:30:15' is not a time in HH:MM"),
    ],
)
async def test_the_claude_step_says_why_its_settings_cannot_be_stored(
    hass: HomeAssistant, values: dict[str, str], error: str
) -> None:
    result = await _start(hass, TANK)
    result = await _fill(hass, await _pick(hass, result, "water"), {})
    result = await _pick(hass, await _pick(hass, await _pick(hass, result, "contents"), "light"), "reminders")
    form = await _pick(hass, await _pick(hass, result, "claude"), "set_claude")
    assert form["step_id"] == "set_claude"

    result = await _fill(hass, form, {**values, "review_on": ["test"], "comments": False, "daily_cap": 5})

    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "set_claude"
    assert result["errors"] == {"base": "invalid_claude"}
    assert result["description_placeholders"] == {"error": error}
