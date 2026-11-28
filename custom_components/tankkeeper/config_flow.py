"""Set up a tank step by step and change its name and volumes later.

The options change the tank, the tap water, the products, the contents, the reminders, the rules,
Claude, the camera and the lights.
"""

from collections.abc import Mapping
from typing import Any, cast

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigEntryState,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers.selector import (
    BooleanSelector,
    ConversationAgentSelector,
    DateSelector,
    EntitySelector,
    EntitySelectorConfig,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
    TimeSelector,
)
from homeassistant.util.ulid import ulid_now
import probatio as p

from .claude import AI_TASK_DOMAIN, CLAUDE_ID, EVENT_TRIGGERS, MAX_DAILY_CAP, ClaudeSettings, check_settings, triggers
from .const import CONF_DOSING_VOLUME, CONF_SETUP, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from .domain import (
    TANK_ID,
    WATER_ID,
    ZONES,
    Collection,
    InvalidInputError,
    NothingToChangeError,
    Record,
    Source,
    TankkeeperError,
    dosing_within_tank,
    merge_record,
)
from .lights import SWITCH_DOMAINS, Control, Light
from .photos import CAMERA_DOMAIN, MAX_KEEP_DAYS, CameraSettings
from .plan import REMINDERS_ID, Reminders, Weekday, format_time, parse_time
from .rules import RuleSettings, Stage
from .service import Actor, TankkeeperService, Target, light_target
from .tools import (
    CONTENT_TYPES,
    TANK_SUMMARY,
    WATER_SUMMARY,
    added_product_summary,
    changed_content_summary,
    changed_product_summary,
    new_content,
    new_light,
    new_product,
    planned_light,
    record_content,
    removal,
    tank_target,
)

NOTIFY_DOMAIN = "notify"
NOT_DEVICES = frozenset({"send_message", "persistent_notification"})
CONF_NOTIFY = "notify"
CONF_TASK_TIME = "task_time"
CONF_DOSE_TIME = "dose_time"
CONF_RESEND_TIME = "resend_time"
CONF_STATUS_NOTIFY = "status_notify"
CONF_STAGE = "stage"
CONF_LIGHT_ID = "light_id"
CONF_ENTITY_ID = "entity_id"
CONF_MODEL = "model"
CONF_AGENT = "agent"
CONF_AI_TASK = "ai_task"
CONF_REVIEW_ON = "review_on"
CONF_COMMENTS = "comments"
CONF_DAILY_TIME = "daily_time"
CONF_DAILY_CAP = "daily_cap"
CONF_CONTROL = "control"
CONF_ON = "on"
CONF_OFF = "off"
CONF_BRIGHTNESS = "brightness_pct"
CONF_RAMP = "ramp_minutes"
CONF_AUTOMATION = "automation"
CONF_ON_HELPER = "on_helper"
CONF_OFF_HELPER = "off_helper"
CONF_BRIGHTNESS_HELPER = "brightness_helper"
CONF_RAMP_HELPER = "ramp_helper"
CONF_DATE = "date"
CONF_TEMPERATURE = "temperature_c"
CONF_NOTES = "notes"
CONF_CAMERA = "camera"
CONF_CHECK_TIME = "check_time"
CONF_AFTER_TEST = "after_test"
CONF_ALERTS = "alerts"
CONF_CHECK_PLANTS = "check_plants"
CONF_CHECK_FISH = "check_fish"
CONF_THOROUGH_DAYS = "thorough_days"
CONF_KEEP_DAYS = "keep_days"
LIGHT_STEPS = ["change_light", "one_day", "remove_light"]
SETTINGS_STEPS = ["tank", "water", "products", "contents", "reminders", "rules", "claude", "camera", "add_light"]
WATER_VALUES = ("source", "ph", "gh", "kh", "nitrate", "phosphate")
PRODUCT_VALUES = ("name", "purpose", "label_dose", "your_dose", "notes", "links")
CONF_PRODUCT_ID = "product_id"
CONF_CONTENT_ID = "content_id"
NONE_ADDED = "-"

VOLUME = NumberSelector(
    NumberSelectorConfig(min=1, max=100000, step=1, unit_of_measurement="L", mode=NumberSelectorMode.BOX)
)
BRIGHTNESS = NumberSelector(
    NumberSelectorConfig(min=1, max=100, step=1, unit_of_measurement="%", mode=NumberSelectorMode.BOX)
)
PPM = NumberSelector(
    NumberSelectorConfig(min=0.05, max=100, step=0.05, unit_of_measurement="ppm", mode=NumberSelectorMode.BOX)
)
PH = NumberSelector(NumberSelectorConfig(min=0, max=14, step=0.1, mode=NumberSelectorMode.BOX))
DAYS = NumberSelector(
    NumberSelectorConfig(min=0, max=365, step=1, unit_of_measurement="d", mode=NumberSelectorMode.BOX)
)
LATE_DAYS = NumberSelector(
    NumberSelectorConfig(min=1, max=365, step=1, unit_of_measurement="d", mode=NumberSelectorMode.BOX)
)
TIMES = NumberSelector(NumberSelectorConfig(min=1, max=30, step=1, mode=NumberSelectorMode.BOX))
RULES_SCHEMA = p.Schema(
    {
        p.Optional(CONF_STAGE): SelectSelector(SelectSelectorConfig(options=list(Stage), translation_key=CONF_STAGE)),
        p.Required("nitrogen_watch"): PPM,
        p.Required("nitrogen_act"): PPM,
        p.Required("ph_watch"): PH,
        p.Required("ph_act"): PH,
        p.Required("stall_watch_days"): DAYS,
        p.Required("stall_act_days"): DAYS,
        p.Required("test_watch_days"): LATE_DAYS,
        p.Required("test_act_days"): LATE_DAYS,
        p.Required("skip_watch"): TIMES,
        p.Required("skip_act"): TIMES,
        p.Required("plan_watch_days"): DAYS,
        p.Required("plan_act_days"): DAYS,
    }
)
LIGHT_SCHEMA = p.Schema(
    {
        p.Required(CONF_ENTITY_ID): EntitySelector(EntitySelectorConfig(domain=sorted(SWITCH_DOMAINS))),
        p.Required(CONF_MODEL): TextSelector(),
        p.Required(CONF_CONTROL): SelectSelector(
            SelectSelectorConfig(options=[control.value for control in Control], translation_key=CONF_CONTROL)
        ),
        p.Required(CONF_ON): TimeSelector(),
        p.Required(CONF_OFF): TimeSelector(),
        p.Optional(CONF_BRIGHTNESS): BRIGHTNESS,
        p.Optional(CONF_RAMP): NumberSelector(
            NumberSelectorConfig(min=0, max=1440, step=1, unit_of_measurement="min", mode=NumberSelectorMode.BOX)
        ),
        p.Required(CONF_AUTOMATION): EntitySelector(EntitySelectorConfig(domain="automation")),
        p.Required(CONF_ON_HELPER): EntitySelector(EntitySelectorConfig(domain="input_datetime")),
        p.Required(CONF_OFF_HELPER): EntitySelector(EntitySelectorConfig(domain="input_datetime")),
        p.Optional(CONF_BRIGHTNESS_HELPER): EntitySelector(EntitySelectorConfig(domain="input_number")),
        p.Optional(CONF_RAMP_HELPER): EntitySelector(EntitySelectorConfig(domain="input_number")),
    }
)
SCHEMA = p.Schema(
    {
        p.Required(CONF_TANK_NAME): TextSelector(),
        p.Required(CONF_VOLUME): VOLUME,
        p.Required(CONF_DOSING_VOLUME): VOLUME,
    }
)
NOTES = TextSelector(TextSelectorConfig(multiline=True))
USER_SCHEMA = SCHEMA.extend(
    {
        p.Optional(CONF_TEMPERATURE): NumberSelector(
            NumberSelectorConfig(min=0, max=40, step=0.5, unit_of_measurement="°C", mode=NumberSelectorMode.BOX)
        ),
        p.Optional(CONF_NOTES): NOTES,
    }
)
NOT_NEGATIVE = NumberSelector(NumberSelectorConfig(min=0, max=1000, step="any", mode=NumberSelectorMode.BOX))
WATER_SCHEMA = p.Schema(
    {
        p.Optional("source"): SelectSelector(
            SelectSelectorConfig(options=["supplier", "tap_test"], translation_key="water_source")
        ),
        p.Optional("ph"): PH,
        p.Optional("gh"): NOT_NEGATIVE,
        p.Optional("kh"): NOT_NEGATIVE,
        p.Optional("nitrate"): NOT_NEGATIVE,
        p.Optional("phosphate"): NOT_NEGATIVE,
        p.Optional(CONF_NOTES): NOTES,
    }
)
PRODUCT_SCHEMA = p.Schema(
    {
        p.Required("name"): TextSelector(),
        p.Optional("purpose"): TextSelector(),
        p.Optional("label_amount_ml"): NumberSelector(
            NumberSelectorConfig(min=0, max=1000, step="any", unit_of_measurement="ml", mode=NumberSelectorMode.BOX)
        ),
        p.Optional("label_per_litres"): NumberSelector(
            NumberSelectorConfig(min=1, max=100000, step="any", unit_of_measurement="L", mode=NumberSelectorMode.BOX)
        ),
        p.Optional("label_frequency"): TextSelector(),
        p.Optional("your_dose"): TextSelector(),
        p.Optional(CONF_NOTES): NOTES,
    }
)
CONTENT_SCHEMA = p.Schema(
    {
        p.Required("type"): SelectSelector(SelectSelectorConfig(options=CONTENT_TYPES, translation_key="content_type")),
        p.Required("name"): TextSelector(),
        p.Optional("count"): NumberSelector(
            NumberSelectorConfig(min=0, max=10000, step=1, mode=NumberSelectorMode.BOX)
        ),
        p.Optional("where"): TextSelector(),
        p.Optional("zone"): SelectSelector(SelectSelectorConfig(options=list(ZONES), translation_key="zone")),
        p.Optional("aliases"): TextSelector(TextSelectorConfig(multiple=True)),
        p.Optional(CONF_NOTES): NOTES,
    }
)

PRODUCT_OPTIONS_SCHEMA = PRODUCT_SCHEMA.extend(
    {p.Optional("links"): TextSelector(TextSelectorConfig(type=TextSelectorType.URL, multiple=True))}
)
CONTENT_OPTIONS_SCHEMA = CONTENT_SCHEMA.extend({p.Optional("added"): DateSelector()})


class TankkeeperConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up a tank in steps: tank, water, products, contents, light and reminders.

    Every step after the tank can be skipped, and Claude can fill in the rest in a conversation.
    The steps are kept as a draft in the entry, and setup stores them as one panel change.
    """

    VERSION = 1

    def __init__(self) -> None:
        """Nothing is entered yet."""
        self._tank: dict[str, Any] = {}
        self._targets: list[list[Any]] = []
        self._products: list[str] = []
        self._contents: list[str] = []

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Set the reminders."""
        return TankkeeperOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Start a new tank."""
        errors = _errors(user_input)
        if user_input is not None and not errors:
            self._tank = {key: user_input[key] for key in (CONF_TANK_NAME, CONF_VOLUME, CONF_DOSING_VOLUME)}
            extra = {key: user_input[key] for key in (CONF_TEMPERATURE, CONF_NOTES) if key in user_input}
            if extra:
                tank: Record = {
                    "name": self._tank[CONF_TANK_NAME],
                    "volume_litres": self._tank[CONF_VOLUME],
                    "dosing_volume_litres": self._tank[CONF_DOSING_VOLUME],
                    "temperature_c": None,
                    "notes": "",
                    **extra,
                }
                self._add(Collection.TANK, TANK_ID, tank)
            return await self.async_step_how()
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(USER_SCHEMA, user_input or {}),
            errors=errors,
        )

    async def async_step_how(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Go on step by step, or leave the rest to Claude."""
        return self.async_show_menu(step_id="how", menu_options=["water", "finish"])

    async def async_step_water(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The tap water values, from the supplier or a test. Leave it empty to skip."""
        if user_input is None:
            return self.async_show_form(step_id="water", data_schema=WATER_SCHEMA)
        if user_input:
            self._add(Collection.WATER, WATER_ID, dict(user_input))
        return await self.async_step_products()

    async def async_step_products(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the products added so far."""
        return self._menu("products", "add_product", "contents", self._products)

    async def async_step_add_product(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add a product the tank gets."""
        if user_input is not None:
            product, errors = _product_from(user_input)
            if product is None:
                return self.async_show_form(
                    step_id="add_product",
                    data_schema=self.add_suggested_values_to_schema(PRODUCT_SCHEMA, user_input),
                    errors=errors,
                )
            self._add(Collection.PRODUCTS, ulid_now(), product)
            self._products.append(str(product["name"]))
            return await self.async_step_products()
        return self.async_show_form(step_id="add_product", data_schema=PRODUCT_SCHEMA)

    async def async_step_contents(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the contents added so far."""
        return self._menu("contents", "add_content", "light", self._contents)

    async def async_step_add_content(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add a plant, fish, rock or anything else in the tank."""
        if user_input is not None and not str(user_input["name"]).strip():
            return self._name_required("add_content", CONTENT_SCHEMA, user_input)
        if user_input is not None:
            content = {**new_content(_content_data(user_input)), "number": len(self._contents) + 1}
            self._add(Collection.CONTENTS, ulid_now(), content)
            self._contents.append(str(content["name"]))
            return await self.async_step_contents()
        return self.async_show_form(step_id="add_content", data_schema=CONTENT_SCHEMA)

    async def async_step_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Offer to add the tank light."""
        return self.async_show_menu(step_id="light", menu_options=["add_light", "reminders"])

    async def async_step_add_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add the tank light. TankKeeper switches it on its schedule."""
        if user_input is not None:
            try:
                target = light_target(self.hass, new_light(_light_data(user_input)), [])
            except TankkeeperError as err:
                return self.async_show_form(
                    step_id="add_light",
                    data_schema=self.add_suggested_values_to_schema(LIGHT_SCHEMA, user_input),
                    errors={"base": "invalid_light"},
                    description_placeholders={"error": err.message},
                )
            self._add(*target)
            return await self.async_step_reminders()
        return self.async_show_form(step_id="add_light", data_schema=LIGHT_SCHEMA)

    async def async_step_reminders(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Offer to set the reminders."""
        return self.async_show_menu(step_id="reminders", menu_options=["set_reminders", "claude"])

    async def async_step_set_reminders(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Which devices get reminders, and when."""
        if user_input is not None:
            self._add(Collection.SETTINGS, REMINDERS_ID, _reminders_from(user_input).to_json())
            return await self.async_step_claude()
        current = Reminders()
        return self.async_show_form(
            step_id="set_reminders",
            data_schema=self.add_suggested_values_to_schema(
                _reminders_schema(_notify_devices(self.hass, current)), _reminder_values(current)
            ),
        )

    async def async_step_claude(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Offer to choose the agent TankKeeper chats through, and when Claude reviews the tank."""
        return self.async_show_menu(step_id="claude", menu_options=["set_claude", "finish"])

    async def async_step_set_claude(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The agent, the AI task entity and the reviews."""
        if user_input is not None:
            try:
                settings = _claude_from(user_input)
                check_settings(self.hass, settings)
            except TankkeeperError as err:
                return _claude_form(self, "set_claude", user_input, err)
            self._add(Collection.SETTINGS, CLAUDE_ID, settings.to_json())
            return await self.async_step_finish()
        return _claude_form(self, "set_claude", _claude_values(ClaudeSettings()))

    async def async_step_finish(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Create the tank. Setup stores the steps as one change."""
        data = dict(self._tank)
        if self._targets:
            data[CONF_SETUP] = self._targets
        return self.async_create_entry(title=self._tank[CONF_TANK_NAME], data=data)

    def _name_required(self, step_id: str, schema: p.Schema, user_input: dict[str, Any]) -> ConfigFlowResult:
        return self.async_show_form(
            step_id=step_id,
            data_schema=self.add_suggested_values_to_schema(schema, user_input),
            errors={"name": "name_required"},
        )

    def _add(self, collection: Collection, record_id: str, record: Record | None) -> None:
        self._targets.append([collection.value, record_id, record])

    def _menu(self, step_id: str, add: str, next_step: str, added: list[str]) -> ConfigFlowResult:
        return self.async_show_menu(
            step_id=step_id,
            menu_options=[add, next_step],
            description_placeholders={"added": ", ".join(added) or NONE_ADDED},
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the tank's name and volumes. The old values stay in the history."""
        entry = self._get_reconfigure_entry()
        if entry.state is not ConfigEntryState.LOADED:
            return self.async_abort(reason="not_loaded")
        service: TankkeeperService = entry.runtime_data
        tank = service.records(Collection.TANK).get(TANK_ID, {})
        errors = _errors(user_input)
        if user_input is not None and not errors:
            updates = {
                "name": user_input[CONF_TANK_NAME],
                "volume_litres": user_input[CONF_VOLUME],
                "dosing_volume_litres": user_input[CONF_DOSING_VOLUME],
            }
            user_id = self.context.get("user_id")
            actor = Actor(
                source=Source.PANEL, user_id=user_id if isinstance(user_id, str) else None, conversation_id=None
            )
            try:
                await service.async_set(
                    [(Collection.TANK, TANK_ID, merge_record(tank, updates))], actor, "Change the tank details"
                )
            except NothingToChangeError:
                return self.async_abort(reason="nothing_changed")
            return self.async_update_reload_and_abort(entry, title=user_input[CONF_TANK_NAME], data_updates=user_input)
        suggested = user_input or {
            CONF_TANK_NAME: tank.get("name"),
            CONF_VOLUME: tank.get("volume_litres"),
            CONF_DOSING_VOLUME: tank.get("dosing_volume_litres"),
        }
        return self.async_show_form(
            step_id="reconfigure", data_schema=self.add_suggested_values_to_schema(SCHEMA, suggested), errors=errors
        )


class TankkeeperOptionsFlow(OptionsFlow):
    """Change the tank's settings. Changes apply straight away, with no proposal, and stay in the history."""

    def __init__(self) -> None:
        """No light, product or contents item is picked yet."""
        self._light_id: str | None = None
        self._record_id: str | None = None

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show what can be changed. The light steps show only when a light is set."""
        if self.config_entry.state is not ConfigEntryState.LOADED:
            return self.async_abort(reason="not_loaded")
        service: TankkeeperService = self.config_entry.runtime_data
        steps = [*SETTINGS_STEPS, *(LIGHT_STEPS if service.has_lights() else [])]
        return self.async_show_menu(step_id="init", menu_options=steps)

    async def async_step_tank(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the tank details, and store them through the service layer. A field left empty is cleared."""
        service = self._service()
        errors = _errors(user_input)
        if user_input is not None and not errors:
            updates: Record = {
                "name": user_input[CONF_TANK_NAME],
                "volume_litres": user_input[CONF_VOLUME],
                "dosing_volume_litres": user_input[CONF_DOSING_VOLUME],
                "temperature_c": user_input.get(CONF_TEMPERATURE),
                "notes": user_input.get(CONF_NOTES, ""),
            }
            result = await self._async_set([tank_target(service, updates)], TANK_SUMMARY)
            if result["type"] is FlowResultType.CREATE_ENTRY:
                self._rename(user_input)
            return result
        tank = service.records(Collection.TANK).get(TANK_ID, {})
        suggested = user_input or _filled(
            {
                CONF_TANK_NAME: tank.get("name"),
                CONF_VOLUME: tank.get("volume_litres"),
                CONF_DOSING_VOLUME: tank.get("dosing_volume_litres"),
                CONF_TEMPERATURE: tank.get("temperature_c"),
                CONF_NOTES: tank.get("notes"),
            }
        )
        return self.async_show_form(
            step_id="tank", data_schema=self.add_suggested_values_to_schema(USER_SCHEMA, suggested), errors=errors
        )

    async def async_step_water(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the tap water values, and store them through the service layer. A field left empty is removed."""
        service = self._service()
        water = service.records(Collection.WATER).get(WATER_ID, {})
        if user_input is not None:
            fields = (*WATER_VALUES, CONF_NOTES)
            record: Record = {key: value for key, value in water.items() if key not in fields}
            record.update({key: user_input[key] for key in fields if user_input.get(key) not in (None, "")})
            if record == water:
                return self.async_abort(reason="nothing_changed")
            return await self._async_set([(Collection.WATER, WATER_ID, record)], WATER_SUMMARY)
        return self.async_show_form(
            step_id="water", data_schema=self.add_suggested_values_to_schema(WATER_SCHEMA, _filled(water))
        )

    async def async_step_products(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the products in use, and offer to add, change or remove one."""
        return self._list_menu("products", Collection.PRODUCTS, "product")

    async def async_step_add_product(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add a product the tank gets."""
        if user_input is None:
            return self.async_show_form(step_id="add_product", data_schema=PRODUCT_OPTIONS_SCHEMA)
        product, errors = _product_from(user_input)
        if product is None:
            return self._form_again("add_product", PRODUCT_OPTIONS_SCHEMA, user_input, errors)
        target = (Collection.PRODUCTS, ulid_now(), product)
        return await self._async_set([target], added_product_summary(product))

    async def async_step_change_product(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Pick the product to change."""
        if user_input is not None:
            self._record_id = user_input[CONF_PRODUCT_ID]
            return await self.async_step_edit_product()
        return self.async_show_form(step_id="change_product", data_schema=self._pick(Collection.PRODUCTS))

    async def async_step_edit_product(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the picked product. A field left empty is cleared."""
        product_id = self._record_id
        assert product_id is not None
        current = self._service().state.require(Collection.PRODUCTS, product_id)
        if user_input is None:
            return self.async_show_form(
                step_id="edit_product",
                data_schema=self.add_suggested_values_to_schema(PRODUCT_OPTIONS_SCHEMA, _product_values(current)),
            )
        fresh, errors = _product_from(user_input)
        if fresh is None:
            return self._form_again("edit_product", PRODUCT_OPTIONS_SCHEMA, user_input, errors)
        product = merge_record(current, {key: fresh[key] for key in PRODUCT_VALUES})
        return await self._async_set([(Collection.PRODUCTS, product_id, product)], changed_product_summary(product))

    async def async_step_remove_product(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Mark a product as no longer used. It stays in the records with the date."""
        if user_input is not None:
            target, summary = removal(self._service(), Collection.PRODUCTS, user_input[CONF_PRODUCT_ID], {})
            return await self._async_set([target], summary)
        return self.async_show_form(step_id="remove_product", data_schema=self._pick(Collection.PRODUCTS))

    async def async_step_contents(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show what is in the tank, and offer to add, change or remove an item."""
        return self._list_menu("contents", Collection.CONTENTS, "content")

    async def async_step_add_content(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add a plant, fish, rock or anything else in the tank."""
        if user_input is None:
            return self.async_show_form(step_id="add_content", data_schema=CONTENT_OPTIONS_SCHEMA)
        if not str(user_input["name"]).strip():
            return self._form_again("add_content", CONTENT_OPTIONS_SCHEMA, user_input, {"name": "name_required"})
        await record_content(self._service(), _content_data(user_input), _panel())
        return self.async_create_entry(data={})

    async def async_step_change_content(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Pick the contents item to change."""
        if user_input is not None:
            self._record_id = user_input[CONF_CONTENT_ID]
            return await self.async_step_edit_content()
        return self.async_show_form(step_id="change_content", data_schema=self._pick(Collection.CONTENTS))

    async def async_step_edit_content(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the picked contents item. A field left empty is cleared, except the date it went in, which stays."""
        content_id = self._record_id
        assert content_id is not None
        current = self._service().state.require(Collection.CONTENTS, content_id)
        if user_input is None:
            fields = ("type", "name", "count", "where", "zone", "aliases", "added", CONF_NOTES)
            values = _filled({key: current.get(key) for key in fields})
            return self.async_show_form(
                step_id="edit_content", data_schema=self.add_suggested_values_to_schema(CONTENT_OPTIONS_SCHEMA, values)
            )
        if not str(user_input["name"]).strip():
            return self._form_again("edit_content", CONTENT_OPTIONS_SCHEMA, user_input, {"name": "name_required"})
        fresh = new_content({"added": current.get("added"), **_content_data(user_input)})
        content = merge_record(fresh, {key: current[key] for key in ("removed", "number") if key in current})
        return await self._async_set([(Collection.CONTENTS, content_id, content)], changed_content_summary(content))

    async def async_step_remove_content(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Take an item out of the tank. It stays in the records with the date it went."""
        if user_input is not None:
            target, summary = removal(self._service(), Collection.CONTENTS, user_input[CONF_CONTENT_ID], {})
            return await self._async_set([target], summary)
        return self.async_show_form(step_id="remove_content", data_schema=self._pick(Collection.CONTENTS))

    def _list_menu(self, step_id: str, collection: Collection, kind: str) -> ConfigFlowResult:
        """A menu that lists the active records and offers to add one, and to change or remove one if any."""
        names = [str(record.get("name")) for record in self._active(collection).values()]
        options = [f"add_{kind}", *([f"change_{kind}", f"remove_{kind}"] if names else [])]
        return self.async_show_menu(
            step_id=step_id, menu_options=options, description_placeholders={"listed": ", ".join(names) or NONE_ADDED}
        )

    def _active(self, collection: Collection) -> dict[str, Record]:
        return {
            record_id: record
            for record_id, record in self._service().records(collection).items()
            if record.get("removed") is None
        }

    def _pick(self, collection: Collection) -> p.Schema:
        field = CONF_PRODUCT_ID if collection is Collection.PRODUCTS else CONF_CONTENT_ID
        options = [
            SelectOptionDict(value=record_id, label=str(record.get("name")))
            for record_id, record in self._active(collection).items()
        ]
        return p.Schema({p.Required(field): SelectSelector(SelectSelectorConfig(options=options))})

    def _form_again(
        self, step_id: str, schema: p.Schema, user_input: dict[str, Any], errors: dict[str, str]
    ) -> ConfigFlowResult:
        return self.async_show_form(
            step_id=step_id, data_schema=self.add_suggested_values_to_schema(schema, user_input), errors=errors
        )

    async def _async_set(self, targets: list[Target], summary: str) -> ConfigFlowResult:
        """Store the change through the service layer."""
        try:
            await self._service().async_set(targets, _panel(), summary)
        except NothingToChangeError:
            return self.async_abort(reason="nothing_changed")
        return self.async_create_entry(data={})

    def _rename(self, user_input: dict[str, Any]) -> None:
        """Keep the entry's title and data the same as the tank, and reload for a new name, as reconfigure does."""
        entry = self.config_entry
        renamed = entry.title != user_input[CONF_TANK_NAME]
        self.hass.config_entries.async_update_entry(
            entry,
            title=user_input[CONF_TANK_NAME],
            data={**entry.data, **{key: user_input[key] for key in (CONF_TANK_NAME, CONF_VOLUME, CONF_DOSING_VOLUME)}},
        )
        if renamed:
            self.hass.config_entries.async_schedule_reload(entry.entry_id)

    async def async_step_reminders(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the reminder settings, and store them through the service layer."""
        service = self._service()
        current = service.reminders()
        if user_input is not None:
            reminders = _reminders_from(user_input)
            try:
                await service.async_set(service.reminder_targets(reminders), _panel(), "Change the reminders")
            except NothingToChangeError:
                return self.async_abort(reason="nothing_changed")
            return self.async_create_entry(data={})
        schema = _reminders_schema(_notify_devices(self.hass, current))
        return self.async_show_form(
            step_id="reminders", data_schema=self.add_suggested_values_to_schema(schema, _reminder_values(current))
        )

    async def async_step_rules(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the rule limits and whether the tank is cycling, and store them through the service layer."""
        service = self._service()
        if user_input is not None:
            settings = RuleSettings.from_json(user_input)
            stage = user_input.get(CONF_STAGE)
            try:
                targets = service.stage_targets(None if stage is None else Stage(stage))
                if settings != service.rule_settings():
                    targets += service.rule_targets(settings)
                await service.async_set(targets, _panel(), "Change the rule limits")
            except NothingToChangeError:
                return self.async_abort(reason="nothing_changed")
            except TankkeeperError as err:
                return self.async_show_form(
                    step_id="rules",
                    data_schema=self.add_suggested_values_to_schema(RULES_SCHEMA, user_input),
                    errors={"base": "invalid_rules"},
                    description_placeholders={"error": err.message},
                )
            return self.async_create_entry(data={})
        suggested: dict[str, Any] = dict(service.rule_settings().to_json())
        if (stage := service.stage()) is not None:
            suggested[CONF_STAGE] = stage.value
        return self.async_show_form(
            step_id="rules", data_schema=self.add_suggested_values_to_schema(RULES_SCHEMA, suggested)
        )

    async def async_step_add_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add a light."""
        if user_input is not None:
            data: Record = {"action": "add", **_light_data(user_input)}
            return await self._async_apply("add_light", LIGHT_SCHEMA, data, user_input)
        return self.async_show_form(step_id="add_light", data_schema=LIGHT_SCHEMA)

    async def async_step_change_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Pick the light to change."""
        if user_input is not None:
            self._light_id = user_input[CONF_LIGHT_ID]
            return await self.async_step_edit_light()
        return self.async_show_form(step_id="change_light", data_schema=self._pick_light())

    async def async_step_edit_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the picked light. A field left empty is cleared."""
        light_id = self._light_id
        assert light_id is not None
        if user_input is not None:
            data: Record = {"action": "update", "light_id": light_id, **_light_data(user_input)}
            return await self._async_apply("edit_light", LIGHT_SCHEMA, data, user_input)
        light = self._service().light(light_id)
        suggested: dict[str, Any] = {
            CONF_ENTITY_ID: light.entity_id,
            CONF_MODEL: light.model,
            CONF_CONTROL: light.control.value,
            CONF_ON: format_time(light.schedule.on),
            CONF_OFF: format_time(light.schedule.off),
            CONF_RAMP: light.schedule.ramp_minutes,
        }
        if light.schedule.brightness_pct is not None:
            suggested[CONF_BRIGHTNESS] = light.schedule.brightness_pct
        if (helpers := light.helpers) is not None:
            suggested |= _filled(
                {
                    CONF_AUTOMATION: helpers.automation,
                    CONF_ON_HELPER: helpers.on,
                    CONF_OFF_HELPER: helpers.off,
                    CONF_BRIGHTNESS_HELPER: helpers.brightness,
                    CONF_RAMP_HELPER: helpers.ramp,
                }
            )
        return self.async_show_form(
            step_id="edit_light", data_schema=self.add_suggested_values_to_schema(LIGHT_SCHEMA, suggested)
        )

    async def async_step_one_day(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Change the times, and maybe the brightness, of a light for one day."""
        schema = self._pick_light().extend(
            {
                p.Required(CONF_DATE): DateSelector(),
                p.Required(CONF_ON): TimeSelector(),
                p.Required(CONF_OFF): TimeSelector(),
                p.Optional(CONF_BRIGHTNESS): BRIGHTNESS,
            }
        )
        if user_input is not None:
            data: Record = {
                "action": "one_day",
                "light_id": user_input[CONF_LIGHT_ID],
                "date": user_input[CONF_DATE],
                "on": user_input[CONF_ON],
                "off": user_input[CONF_OFF],
                "brightness_pct": _optional_int(user_input.get(CONF_BRIGHTNESS)),
            }
            return await self._async_apply("one_day", schema, data, user_input)
        return self.async_show_form(step_id="one_day", data_schema=schema)

    async def async_step_remove_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Remove a light. Its records and history stay."""
        if user_input is not None:
            data: Record = {"action": "remove", "light_id": user_input[CONF_LIGHT_ID]}
            return await self._async_apply("remove_light", self._pick_light(), data, user_input)
        return self.async_show_form(step_id="remove_light", data_schema=self._pick_light())

    async def async_step_claude(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the Claude settings, and store them through the service layer."""
        service = self._service()
        if user_input is None:
            return _claude_form(self, "claude", _claude_values(service.claude()))
        try:
            await service.async_set(
                service.claude_targets(_claude_from(user_input)), _panel(), "Change the Claude settings"
            )
        except NothingToChangeError:
            return self.async_abort(reason="nothing_changed")
        except TankkeeperError as err:
            return _claude_form(self, "claude", user_input, err)
        return self.async_create_entry(data={})

    async def async_step_camera(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the camera settings, and store them through the service layer."""
        service = self._service()
        if user_input is None:
            return self._camera_form(_camera_values(service.camera()))
        try:
            await service.async_set(
                service.camera_targets(_camera_from(user_input)), _panel(), "Change the camera settings"
            )
        except NothingToChangeError:
            return self.async_abort(reason="nothing_changed")
        except TankkeeperError as err:
            return self._camera_form(user_input, err)
        return self.async_create_entry(data={})

    def _camera_form(self, values: dict[str, Any], error: TankkeeperError | None = None) -> ConfigFlowResult:
        return self.async_show_form(
            step_id="camera",
            data_schema=self.add_suggested_values_to_schema(CAMERA_SCHEMA, values),
            errors=None if error is None else {"base": "invalid_camera"},
            description_placeholders=None if error is None else {"error": error.message},
        )

    def _service(self) -> TankkeeperService:
        service: TankkeeperService = self.config_entry.runtime_data
        return service

    def _pick_light(self) -> p.Schema:
        options = [_light_option(light) for light in self._service().active_lights()]
        return p.Schema({p.Required(CONF_LIGHT_ID): SelectSelector(SelectSelectorConfig(options=options))})

    async def _async_apply(
        self, step_id: str, schema: p.Schema, data: Record, user_input: dict[str, Any]
    ) -> ConfigFlowResult:
        """Store the light change, or show the form again with the reason it can't be stored."""
        service = self._service()
        try:
            light, summary = planned_light(service, data)
            await service.async_set(service.light_targets(light), _panel(), summary)
        except NothingToChangeError:
            return self.async_abort(reason="nothing_changed")
        except TankkeeperError as err:
            return self.async_show_form(
                step_id=step_id,
                data_schema=self.add_suggested_values_to_schema(schema, user_input),
                errors={"base": "invalid_light"},
                description_placeholders={"error": err.message},
            )
        return self.async_create_entry(data={})


def _notify_devices(hass: HomeAssistant, current: Reminders) -> list[str]:
    """The notify services that can get reminders, and the ones already picked."""
    return sorted(
        set(hass.services.async_services_for_domain(NOTIFY_DOMAIN)) - NOT_DEVICES
        | set(current.notify)
        | set(current.status_notify)
    )


def _reminders_schema(devices: list[str]) -> p.Schema:
    pick_devices = SelectSelector(
        SelectSelectorConfig(options=devices, multiple=True, mode=SelectSelectorMode.DROPDOWN)
    )
    return p.Schema(
        {
            p.Required(CONF_NOTIFY): pick_devices,
            p.Required(CONF_TASK_TIME): TimeSelector(),
            p.Required(CONF_DOSE_TIME): TimeSelector(),
            p.Required(CONF_RESEND_TIME): TimeSelector(),
            p.Optional(CONF_STATUS_NOTIFY): pick_devices,
        }
    )


def _reminder_values(current: Reminders) -> dict[str, Any]:
    return {
        CONF_NOTIFY: list(current.notify),
        CONF_TASK_TIME: format_time(current.task_time),
        CONF_DOSE_TIME: format_time(current.dose_time),
        CONF_RESEND_TIME: format_time(current.resend_time),
        CONF_STATUS_NOTIFY: list(current.status_notify),
    }


def _reminders_from(user_input: dict[str, Any]) -> Reminders:
    return Reminders(
        notify=tuple(user_input[CONF_NOTIFY]),
        task_time=parse_time(user_input[CONF_TASK_TIME]),
        dose_time=parse_time(user_input[CONF_DOSE_TIME]),
        resend_time=parse_time(user_input[CONF_RESEND_TIME]),
        status_notify=tuple(user_input.get(CONF_STATUS_NOTIFY, [])),
    )


CLAUDE_SCHEMA = p.Schema(
    {
        p.Optional(CONF_AGENT): ConversationAgentSelector(),
        p.Optional(CONF_AI_TASK): EntitySelector(EntitySelectorConfig(domain=AI_TASK_DOMAIN)),
        p.Required(CONF_REVIEW_ON): SelectSelector(
            SelectSelectorConfig(
                options=[trigger.value for trigger in EVENT_TRIGGERS],
                multiple=True,
                mode=SelectSelectorMode.LIST,
                translation_key=CONF_REVIEW_ON,
            )
        ),
        p.Required(CONF_COMMENTS): BooleanSelector(),
        p.Optional(CONF_DAILY_TIME): TimeSelector(),
        p.Required(CONF_DAILY_CAP): NumberSelector(
            NumberSelectorConfig(min=0, max=MAX_DAILY_CAP, step=1, mode=NumberSelectorMode.BOX)
        ),
    }
)


def _claude_form(
    flow: ConfigFlow | OptionsFlow, step_id: str, values: dict[str, Any], error: TankkeeperError | None = None
) -> ConfigFlowResult:
    """The Claude settings form, with the reason they can't be stored when there is one."""
    return flow.async_show_form(
        step_id=step_id,
        data_schema=flow.add_suggested_values_to_schema(CLAUDE_SCHEMA, values),
        errors=None if error is None else {"base": "invalid_claude"},
        description_placeholders=None if error is None else {"error": error.message},
    )


def _claude_values(settings: ClaudeSettings) -> dict[str, Any]:
    """The settings as form values. Settings not set are left out, so their fields show empty."""
    return {key: value for key, value in settings.to_json().items() if value is not None}


def _claude_from(user_input: dict[str, Any]) -> ClaudeSettings:
    """The settings in the form. Raises InvalidInputError for a time that is not in HH:MM."""
    daily_time = user_input.get(CONF_DAILY_TIME)
    try:
        when = parse_time(daily_time) if daily_time else None
    except ValueError as err:
        raise InvalidInputError(str(err)) from None
    return ClaudeSettings(
        agent=user_input.get(CONF_AGENT) or None,
        ai_task=user_input.get(CONF_AI_TASK) or None,
        review_on=triggers(user_input[CONF_REVIEW_ON]),
        comments=bool(user_input[CONF_COMMENTS]),
        daily_time=when,
        daily_cap=int(user_input[CONF_DAILY_CAP]),
    )


CAMERA_SCHEMA = p.Schema(
    {
        p.Optional(CONF_CAMERA): EntitySelector(EntitySelectorConfig(domain=CAMERA_DOMAIN)),
        p.Optional(CONF_CHECK_TIME): TimeSelector(),
        p.Required(CONF_AFTER_TEST): BooleanSelector(),
        p.Required(CONF_ALERTS): BooleanSelector(),
        p.Required(CONF_KEEP_DAYS): NumberSelector(
            NumberSelectorConfig(min=1, max=MAX_KEEP_DAYS, step=1, mode=NumberSelectorMode.BOX)
        ),
        p.Required(CONF_CHECK_PLANTS): BooleanSelector(),
        p.Required(CONF_CHECK_FISH): BooleanSelector(),
        p.Optional(CONF_THOROUGH_DAYS): SelectSelector(
            SelectSelectorConfig(options=list(Weekday), multiple=True, translation_key="weekday")
        ),
    }
)


def _camera_values(settings: CameraSettings) -> dict[str, Any]:
    """The settings as form values. Settings not set are left out, so their fields show empty."""
    return {key: value for key, value in settings.to_json().items() if value is not None}


def _camera_from(user_input: dict[str, Any]) -> CameraSettings:
    """The settings in the form. Raises InvalidInputError for a time that is not in HH:MM."""
    check_time = user_input.get(CONF_CHECK_TIME)
    try:
        when = parse_time(check_time) if check_time else None
    except ValueError as err:
        raise InvalidInputError(str(err)) from None
    return CameraSettings(
        camera=user_input.get(CONF_CAMERA) or None,
        check_time=when,
        after_test=bool(user_input[CONF_AFTER_TEST]),
        alerts=bool(user_input[CONF_ALERTS]),
        keep_days=int(user_input[CONF_KEEP_DAYS]),
        check_plants=bool(user_input[CONF_CHECK_PLANTS]),
        check_fish=bool(user_input[CONF_CHECK_FISH]),
        thorough_days=tuple(Weekday(day) for day in user_input.get(CONF_THOROUGH_DAYS, [])),
    )


def _panel() -> Actor:
    return Actor(source=Source.PANEL, user_id=None, conversation_id=None)


def _light_option(light: Light) -> SelectOptionDict:
    return SelectOptionDict(value=light.id, label=f"{light.model} ({light.entity_id})")


def _optional_int(value: object) -> int | None:
    return None if value is None else int(cast(float, value))


def _light_data(user_input: dict[str, Any]) -> Record:
    """The set_light arguments from the light form. A field left empty clears it."""
    return {
        "entity_id": user_input[CONF_ENTITY_ID],
        "model": user_input[CONF_MODEL],
        "control": user_input[CONF_CONTROL],
        "on": user_input[CONF_ON],
        "off": user_input[CONF_OFF],
        "brightness_pct": _optional_int(user_input.get(CONF_BRIGHTNESS)),
        "ramp_minutes": _optional_int(user_input.get(CONF_RAMP)) or 0,
        "automation": user_input[CONF_AUTOMATION],
        "on_helper": user_input[CONF_ON_HELPER],
        "off_helper": user_input[CONF_OFF_HELPER],
        "brightness_helper": user_input.get(CONF_BRIGHTNESS_HELPER) or None,
        "ramp_helper": user_input.get(CONF_RAMP_HELPER) or None,
    }


def _filled(values: Mapping[str, Any]) -> dict[str, Any]:
    """The values that are set, as form values. Values not set are left out, so their fields show empty."""
    return {key: value for key, value in values.items() if value not in (None, "", [])}


def _product_from(user_input: dict[str, Any]) -> tuple[Record | None, dict[str, str]]:
    """A product from the form, or the form errors."""
    if not str(user_input["name"]).strip():
        return None, {"name": "name_required"}
    try:
        return new_product(dict(user_input)), {}
    except TankkeeperError:
        return None, {"base": "label_dose_incomplete"}


def _product_values(product: Record) -> dict[str, Any]:
    """A product as form values."""
    label = product.get("label_dose")
    label_values = {f"label_{key}": value for key, value in label.items()} if isinstance(label, dict) else {}
    return _filled({key: product.get(key) for key in PRODUCT_VALUES if key != "label_dose"} | label_values)


def _content_data(user_input: dict[str, Any]) -> Record:
    """The add_content arguments from the contents form. The count is a whole number."""
    data: Record = dict(user_input)
    if "count" in data:
        data["count"] = int(cast(float, data["count"]))
    return data


def _errors(user_input: dict[str, Any] | None) -> dict[str, str]:
    """Form errors for the entered details."""
    if user_input is None:
        return {}
    tank = {"volume_litres": user_input[CONF_VOLUME], "dosing_volume_litres": user_input[CONF_DOSING_VOLUME]}
    return {} if dosing_within_tank(tank) else {CONF_DOSING_VOLUME: "dosing_above_volume"}
