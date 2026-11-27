"""Changing the tank, the tap water, the products and the contents in the options, against a real Home Assistant."""

from homeassistant.config_entries import ConfigEntryState, ConfigFlowResult
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.tankkeeper.domain import TANK_ID, WATER_ID, Collection, Record, Source
from custom_components.tankkeeper.service import Actor, TankkeeperService

from .common import Caller, dict_of

TANK_FORM = {"tank_name": "Office", "volume_litres": 80, "dosing_volume_litres": 72, "temperature_c": 25}
WATER_FORM = {"source": "supplier", "ph": 7.4, "kh": 5, "gh": 8, "nitrate": 10, "phosphate": 0.5, "notes": "Thames"}
PRODUCT_FORM = {
    "name": "Easy Green",
    "purpose": "Fertiliser",
    "label_amount_ml": 1,
    "label_per_litres": 50,
    "label_frequency": "weekly",
    "your_dose": "2 pumps",
    "notes": "All in one",
}
PANEL = Actor(source=Source.PANEL, user_id=None, conversation_id=None)
CONTENT_FORM = {"type": "plant", "name": "Java fern", "count": 3, "where": "back left", "notes": "On wood"}


def _service(entry: MockConfigEntry) -> TankkeeperService:
    service: TankkeeperService = entry.runtime_data
    return service


async def _menu(hass: HomeAssistant, entry: MockConfigEntry) -> ConfigFlowResult:
    menu = await hass.config_entries.options.async_init(entry.entry_id)
    assert menu["type"] is FlowResultType.MENU
    return menu


async def _step(hass: HomeAssistant, entry: MockConfigEntry, *steps: str) -> ConfigFlowResult:
    """Open the options and choose each menu step in turn."""
    result = await _menu(hass, entry)
    for step in steps:
        result = await hass.config_entries.options.async_configure(result["flow_id"], {"next_step_id": step})
    return result


async def _submit(hass: HomeAssistant, form: ConfigFlowResult, values: dict[str, object]) -> ConfigFlowResult:
    assert form["type"] is FlowResultType.FORM, form
    return await hass.config_entries.options.async_configure(form["flow_id"], values)


def _suggested(form: ConfigFlowResult) -> dict[str, object]:
    schema = form["data_schema"]
    assert schema is not None
    return {
        str(key): key.description["suggested_value"]
        for key in schema.schema
        if key.description and "suggested_value" in key.description
    }


def _options(form: ConfigFlowResult, field: str) -> list[object]:
    schema = form["data_schema"]
    assert schema is not None
    [selector] = [value for key, value in schema.schema.items() if str(key) == field]
    return list(selector.config["options"])


def _latest(service: TankkeeperService, collection: Collection, record_id: str) -> str:
    [entry] = service.history(collection, record_id, 1)
    assert entry.source is Source.PANEL
    return entry.summary


def _one(service: TankkeeperService, collection: Collection) -> tuple[str, Record]:
    [(record_id, record)] = service.records(collection).items()
    return record_id, record


async def test_the_menu_has_the_tank_water_products_and_contents(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    menu = await _menu(hass, loaded_entry)

    assert menu["menu_options"] == [
        "tank",
        "water",
        "products",
        "contents",
        "reminders",
        "rules",
        "claude",
        "camera",
        "add_light",
    ]


async def test_the_tank_form_shows_the_tank_and_changes_it_through_the_service(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    service = _service(loaded_entry)
    form = await _step(hass, loaded_entry, "tank")
    assert form["step_id"] == "tank"
    assert _suggested(form) == {"tank_name": "Nano", "volume_litres": 60, "dosing_volume_litres": 54}

    result = await _submit(hass, form, {**TANK_FORM, "notes": "Low tech"})

    assert result["type"] is FlowResultType.CREATE_ENTRY
    tank = service.records(Collection.TANK)[TANK_ID]
    assert (tank["name"], tank["volume_litres"], tank["dosing_volume_litres"]) == ("Office", 80, 72)
    assert (tank["temperature_c"], tank["notes"]) == (25, "Low tech")
    assert _latest(service, Collection.TANK, TANK_ID) == "Change the tank details"
    assert loaded_entry.title == "Office"
    assert loaded_entry.data["tank_name"] == "Office"
    assert dict_of(await call.ok("get_tank"))["tank"] == tank
    await hass.async_block_till_done()


async def test_a_tank_field_left_empty_is_cleared(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    service = _service(loaded_entry)
    await _submit(
        hass, await _step(hass, loaded_entry, "tank"), {**TANK_FORM, "tank_name": "Nano", "notes": "Low tech"}
    )
    await hass.async_block_till_done()
    assert _service(loaded_entry) is service

    form = await _step(hass, loaded_entry, "tank")
    assert _suggested(form)["temperature_c"] == 25
    await _submit(hass, form, {"tank_name": "Nano", "volume_litres": 80, "dosing_volume_litres": 72})

    tank = service.records(Collection.TANK)[TANK_ID]
    assert (tank["temperature_c"], tank["notes"]) == (None, "")
    assert loaded_entry.data["volume_litres"] == 80


async def test_a_new_tank_name_reloads_the_tank(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    service = _service(loaded_entry)

    await _submit(hass, await _step(hass, loaded_entry, "tank"), TANK_FORM)
    await hass.async_block_till_done()

    assert loaded_entry.state is ConfigEntryState.LOADED
    assert _service(loaded_entry) is not service
    assert _service(loaded_entry).records(Collection.TANK)[TANK_ID]["name"] == "Office"


async def test_the_tank_keeps_the_dosing_volume_within_the_tank(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    form = await _step(hass, loaded_entry, "tank")

    result = await _submit(hass, form, {**TANK_FORM, "dosing_volume_litres": 81})

    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"dosing_volume_litres": "dosing_above_volume"}
    assert _service(loaded_entry).records(Collection.TANK)[TANK_ID]["volume_litres"] == 60


async def test_the_same_tank_changes_nothing(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    form = await _step(hass, loaded_entry, "tank")

    result = await _submit(hass, form, {"tank_name": "Nano", "volume_litres": 60, "dosing_volume_litres": 54})

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_the_water_form_sets_and_clears_the_tap_water(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    service = _service(loaded_entry)
    form = await _step(hass, loaded_entry, "water")
    assert form["step_id"] == "water"
    assert _suggested(form) == {}

    result = await _submit(hass, form, WATER_FORM)

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert service.records(Collection.WATER)[WATER_ID] == WATER_FORM
    assert _latest(service, Collection.WATER, WATER_ID) == "Change the water values"

    form = await _step(hass, loaded_entry, "water")
    assert _suggested(form) == WATER_FORM
    await _submit(hass, form, {"ph": 7.6})

    water = service.records(Collection.WATER)[WATER_ID]
    assert water == {"ph": 7.6}
    assert dict_of(await call.ok("get_tank"))["water"] == water


async def test_the_same_water_changes_nothing(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    await _submit(hass, await _step(hass, loaded_entry, "water"), WATER_FORM)

    result = await _submit(hass, await _step(hass, loaded_entry, "water"), WATER_FORM)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_water_from_setup_submitted_unchanged_changes_nothing(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    service = _service(loaded_entry)
    setup: Record = {"source": "supplier", "ph": 7.4}
    await service.async_set([(Collection.WATER, WATER_ID, setup)], PANEL, "Set up")

    result = await _submit(hass, await _step(hass, loaded_entry, "water"), dict(setup))

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"
    assert service.records(Collection.WATER)[WATER_ID] == setup


async def test_an_empty_water_form_with_no_water_changes_nothing(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    result = await _submit(hass, await _step(hass, loaded_entry, "water"), {})

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"
    assert WATER_ID not in _service(loaded_entry).records(Collection.WATER)


async def test_products_offer_only_add_until_there_is_a_product(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    menu = await _step(hass, loaded_entry, "products")

    assert menu["type"] is FlowResultType.MENU
    assert menu["menu_options"] == ["add_product"]
    assert menu["description_placeholders"] == {"listed": "-"}


async def test_a_product_is_added_changed_and_removed(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    service = _service(loaded_entry)

    result = await _submit(hass, await _step(hass, loaded_entry, "products", "add_product"), PRODUCT_FORM)

    assert result["type"] is FlowResultType.CREATE_ENTRY
    product_id, product = _one(service, Collection.PRODUCTS)
    assert product["label_dose"] == {"amount_ml": 1, "per_litres": 50, "frequency": "weekly"}
    assert (product["purpose"], product["your_dose"], product["links"]) == ("Fertiliser", "2 pumps", [])
    assert _latest(service, Collection.PRODUCTS, product_id) == "Add the product Easy Green"

    menu = await _step(hass, loaded_entry, "products")
    assert menu["menu_options"] == ["add_product", "change_product", "remove_product"]
    assert menu["description_placeholders"] == {"listed": "Easy Green"}

    pick = await _step(hass, loaded_entry, "products", "change_product")
    assert _options(pick, "product_id") == [{"value": product_id, "label": "Easy Green"}]
    form = await _submit(hass, pick, {"product_id": product_id})
    assert form["step_id"] == "edit_product"
    assert _suggested(form) == PRODUCT_FORM

    result = await _submit(hass, form, {"name": "Easy Green Plus", "your_dose": "3 pumps"})

    assert result["type"] is FlowResultType.CREATE_ENTRY
    changed = service.records(Collection.PRODUCTS)[product_id]
    assert (changed["name"], changed["your_dose"], changed["purpose"], changed["notes"]) == (
        "Easy Green Plus",
        "3 pumps",
        "",
        "",
    )
    assert changed["label_dose"] is None
    assert _latest(service, Collection.PRODUCTS, product_id) == "Change the product Easy Green Plus"

    pick = await _step(hass, loaded_entry, "products", "remove_product")
    result = await _submit(hass, pick, {"product_id": product_id})

    assert result["type"] is FlowResultType.CREATE_ENTRY
    removed = service.records(Collection.PRODUCTS)[product_id]
    assert removed["removed"] == dt_util.now().date().isoformat()
    assert _latest(service, Collection.PRODUCTS, product_id) == "Remove the product Easy Green Plus"
    assert dict_of(await call.ok("list_products"))["products"] == []
    menu = await _step(hass, loaded_entry, "products")
    assert menu["menu_options"] == ["add_product"]


async def test_a_removed_product_is_not_offered_to_change_or_remove(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    service = _service(loaded_entry)
    await _submit(hass, await _step(hass, loaded_entry, "products", "add_product"), {"name": "Prime"})
    await _submit(hass, await _step(hass, loaded_entry, "products", "add_product"), {"name": "Flourish"})
    ids = {str(product["name"]): product_id for product_id, product in service.records(Collection.PRODUCTS).items()}
    pick = await _step(hass, loaded_entry, "products", "remove_product")
    await _submit(hass, pick, {"product_id": ids["Prime"]})

    for step in ("change_product", "remove_product"):
        pick = await _step(hass, loaded_entry, "products", step)
        assert _options(pick, "product_id") == [{"value": ids["Flourish"], "label": "Flourish"}]


async def test_a_product_has_links_that_can_be_changed(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    service = _service(loaded_entry)
    links = ["https://example.com/prime", "https://example.com/label"]
    await _submit(hass, await _step(hass, loaded_entry, "products", "add_product"), {"name": "Prime", "links": links})
    product_id, product = _one(service, Collection.PRODUCTS)
    assert product["links"] == links

    form = await _submit(
        hass, await _step(hass, loaded_entry, "products", "change_product"), {"product_id": product_id}
    )
    assert _suggested(form) == {"name": "Prime", "links": links}
    await _submit(hass, form, {"name": "Prime", "links": links[:1]})
    assert service.records(Collection.PRODUCTS)[product_id]["links"] == links[:1]

    form = await _submit(
        hass, await _step(hass, loaded_entry, "products", "change_product"), {"product_id": product_id}
    )
    await _submit(hass, form, {"name": "Prime", "purpose": "Conditioner"})
    assert service.records(Collection.PRODUCTS)[product_id]["links"] == []


async def test_a_product_needs_a_name_and_a_whole_label_dose(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    service = _service(loaded_entry)
    form = await _step(hass, loaded_entry, "products", "add_product")

    nameless = await _submit(hass, form, {"name": "  "})
    assert nameless["errors"] == {"name": "name_required"}
    half = await _submit(hass, nameless, {"name": "Easy Green", "label_amount_ml": 1})
    assert half["errors"] == {"base": "label_dose_incomplete"}
    assert _suggested(half)["label_amount_ml"] == 1
    assert service.records(Collection.PRODUCTS) == {}

    await _submit(hass, half, {"name": "Easy Green"})
    product_id, _ = _one(service, Collection.PRODUCTS)
    form = await _submit(
        hass, await _step(hass, loaded_entry, "products", "change_product"), {"product_id": product_id}
    )
    nameless = await _submit(hass, form, {"name": ""})
    assert nameless["errors"] == {"name": "name_required"}
    half = await _submit(hass, nameless, {"name": "Easy Green", "label_per_litres": 40})
    assert half["errors"] == {"base": "label_dose_incomplete"}


async def test_the_same_product_changes_nothing(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    service = _service(loaded_entry)
    await _submit(hass, await _step(hass, loaded_entry, "products", "add_product"), PRODUCT_FORM)
    product_id, _ = _one(service, Collection.PRODUCTS)
    form = await _submit(
        hass, await _step(hass, loaded_entry, "products", "change_product"), {"product_id": product_id}
    )

    result = await _submit(hass, form, PRODUCT_FORM)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_contents_offer_only_add_until_there_is_something_in_the_tank(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    menu = await _step(hass, loaded_entry, "contents")

    assert menu["menu_options"] == ["add_content"]
    assert menu["description_placeholders"] == {"listed": "-"}


async def test_contents_are_added_changed_and_removed(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    service = _service(loaded_entry)
    today = dt_util.now().date().isoformat()

    result = await _submit(hass, await _step(hass, loaded_entry, "contents", "add_content"), CONTENT_FORM)

    assert result["type"] is FlowResultType.CREATE_ENTRY
    content_id, content = _one(service, Collection.CONTENTS)
    assert content == {**CONTENT_FORM, "added": today, "removed": None}
    assert _latest(service, Collection.CONTENTS, content_id) == "Added Java fern"

    menu = await _step(hass, loaded_entry, "contents")
    assert menu["menu_options"] == ["add_content", "change_content", "remove_content"]
    assert menu["description_placeholders"] == {"listed": "Java fern"}

    pick = await _step(hass, loaded_entry, "contents", "change_content")
    assert _options(pick, "content_id") == [{"value": content_id, "label": "Java fern"}]
    form = await _submit(hass, pick, {"content_id": content_id})
    assert form["step_id"] == "edit_content"
    assert _suggested(form) == {**CONTENT_FORM, "added": today}

    result = await _submit(hass, form, {"type": "plant", "name": "Java fern", "where": "front"})

    assert result["type"] is FlowResultType.CREATE_ENTRY
    changed = service.records(Collection.CONTENTS)[content_id]
    assert changed == {**CONTENT_FORM, "count": None, "where": "front", "notes": "", "added": today, "removed": None}
    assert _latest(service, Collection.CONTENTS, content_id) == "Change Java fern"

    result = await _submit(
        hass, await _step(hass, loaded_entry, "contents", "remove_content"), {"content_id": content_id}
    )

    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert service.records(Collection.CONTENTS)[content_id]["removed"] == today
    assert _latest(service, Collection.CONTENTS, content_id) == "Remove Java fern"
    assert dict_of(await call.ok("list_contents"))["contents"] == []


async def test_contents_have_the_date_they_went_in(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    service = _service(loaded_entry)
    await _submit(
        hass, await _step(hass, loaded_entry, "contents", "add_content"), {**CONTENT_FORM, "added": "2026-11-01"}
    )
    content_id, content = _one(service, Collection.CONTENTS)
    assert content["added"] == "2026-11-01"

    form = await _submit(
        hass, await _step(hass, loaded_entry, "contents", "change_content"), {"content_id": content_id}
    )
    await _submit(hass, form, {**CONTENT_FORM, "added": "2026-10-30"})

    assert service.records(Collection.CONTENTS)[content_id]["added"] == "2026-10-30"


async def test_contents_need_a_name(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    service = _service(loaded_entry)
    form = await _step(hass, loaded_entry, "contents", "add_content")

    nameless = await _submit(hass, form, {"type": "rock", "name": " "})
    assert nameless["errors"] == {"name": "name_required"}
    assert service.records(Collection.CONTENTS) == {}

    await _submit(hass, nameless, {"type": "rock", "name": "Seiryu"})
    content_id, _ = _one(service, Collection.CONTENTS)
    form = await _submit(
        hass, await _step(hass, loaded_entry, "contents", "change_content"), {"content_id": content_id}
    )
    nameless = await _submit(hass, form, {"type": "rock", "name": ""})
    assert nameless["errors"] == {"name": "name_required"}


async def test_the_same_content_changes_nothing(hass: HomeAssistant, loaded_entry: MockConfigEntry) -> None:
    service = _service(loaded_entry)
    await _submit(hass, await _step(hass, loaded_entry, "contents", "add_content"), CONTENT_FORM)
    content_id, _ = _one(service, Collection.CONTENTS)
    form = await _submit(
        hass, await _step(hass, loaded_entry, "contents", "change_content"), {"content_id": content_id}
    )

    result = await _submit(hass, form, CONTENT_FORM)

    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "nothing_changed"


async def test_an_options_change_can_be_undone(
    hass: HomeAssistant, loaded_entry: MockConfigEntry, call: Caller
) -> None:
    service = _service(loaded_entry)
    await _submit(hass, await _step(hass, loaded_entry, "water"), WATER_FORM)
    [entry] = service.history(Collection.WATER, WATER_ID, 1)

    await service.async_undo(entry.id, PANEL, "Wrong values")

    assert WATER_ID not in service.records(Collection.WATER)
