"""Set up a tank step by step and change its name and volumes later.

The options set the reminders, the rules, Claude and the lights.
"""

from typing import Any, cast

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigEntryState,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.selector import (
    BooleanSelector,
    ColorRGBSelector,
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
    TimeSelector,
)
from homeassistant.util.ulid import ulid_now
import probatio as p

from .claude import AI_TASK_DOMAIN, CLAUDE_ID, EVENT_TRIGGERS, MAX_DAILY_CAP, ClaudeSettings, check_settings, triggers
from .const import CONF_DOSING_VOLUME, CONF_SETUP, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from .domain import (
    TANK_ID,
    WATER_ID,
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
from .plan import REMINDERS_ID, Reminders, format_time, parse_time
from .rules import RuleSettings, Stage
from .service import Actor, TankkeeperService, light_target
from .tools import CONTENT_TYPES, new_content, new_light, new_product, planned_light

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
CONF_RGB = "rgb_color"
CONF_DATE = "date"
CONF_TEMPERATURE = "temperature_c"
CONF_NOTES = "notes"
LIGHT_STEPS = ["change_light", "one_day", "remove_light"]
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
        p.Optional(CONF_RGB): ColorRGBSelector(),
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
        p.Optional(CONF_NOTES): NOTES,
    }
)


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
        if user_input is not None and not str(user_input["name"]).strip():
            return self._name_required("add_product", PRODUCT_SCHEMA, user_input)
        if user_input is not None:
            try:
                product = new_product(dict(user_input))
            except TankkeeperError:
                return self.async_show_form(
                    step_id="add_product",
                    data_schema=self.add_suggested_values_to_schema(PRODUCT_SCHEMA, user_input),
                    errors={"base": "label_dose_incomplete"},
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
            data = dict(user_input)
            if "count" in data:
                data["count"] = int(data["count"])
            content = new_content(data)
            self._add(Collection.CONTENTS, ulid_now(), content)
            self._contents.append(str(content["name"]))
            return await self.async_step_contents()
        return self.async_show_form(step_id="add_content", data_schema=CONTENT_SCHEMA)

    async def async_step_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Offer to add the tank light."""
        return self.async_show_menu(step_id="light", menu_options=["add_light", "reminders"])

    async def async_step_add_light(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Add the tank light. Tankkeeper switches it on its schedule."""
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
        """Offer to choose the agent Tankkeeper chats through, and when Claude reviews the tank."""
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
    """Set the reminders, and add, change or remove a light. Changes apply straight away, with no proposal."""

    def __init__(self) -> None:
        """No light is picked yet."""
        self._light_id: str | None = None

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show what can be changed. The light steps show only when a light is set."""
        if self.config_entry.state is not ConfigEntryState.LOADED:
            return self.async_abort(reason="not_loaded")
        service: TankkeeperService = self.config_entry.runtime_data
        steps = ["reminders", "rules", "claude", "add_light", *(LIGHT_STEPS if service.has_lights() else [])]
        return self.async_show_menu(step_id="init", menu_options=steps)

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
        if light.schedule.rgb_color is not None:
            suggested[CONF_RGB] = list(light.schedule.rgb_color)
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


def _panel() -> Actor:
    return Actor(source=Source.PANEL, user_id=None, conversation_id=None)


def _light_option(light: Light) -> SelectOptionDict:
    return SelectOptionDict(value=light.id, label=f"{light.model} ({light.entity_id})")


def _optional_int(value: object) -> int | None:
    return None if value is None else int(cast(float, value))


def _light_data(user_input: dict[str, Any]) -> Record:
    """The set_light arguments from the light form. A field left empty clears it."""
    rgb = user_input.get(CONF_RGB)
    return {
        "entity_id": user_input[CONF_ENTITY_ID],
        "model": user_input[CONF_MODEL],
        "control": user_input[CONF_CONTROL],
        "on": user_input[CONF_ON],
        "off": user_input[CONF_OFF],
        "brightness_pct": _optional_int(user_input.get(CONF_BRIGHTNESS)),
        "ramp_minutes": _optional_int(user_input.get(CONF_RAMP)) or 0,
        "rgb_color": None if rgb is None else [int(part) for part in rgb],
    }


def _errors(user_input: dict[str, Any] | None) -> dict[str, str]:
    """Form errors for the entered details."""
    if user_input is None:
        return {}
    tank = {"volume_litres": user_input[CONF_VOLUME], "dosing_volume_litres": user_input[CONF_DOSING_VOLUME]}
    return {} if dosing_within_tank(tank) else {CONF_DOSING_VOLUME: "dosing_above_volume"}
