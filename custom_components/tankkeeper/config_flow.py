"""Set up a tank, change its name and volumes later, and set the reminders and lights in the options."""

from typing import Any, cast

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigEntryState,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    ColorRGBSelector,
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
    TimeSelector,
)
import probatio as p

from .const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from .domain import (
    TANK_ID,
    Collection,
    NothingToChangeError,
    Record,
    Source,
    TankkeeperError,
    dosing_within_tank,
    merge_record,
)
from .lights import SWITCH_DOMAINS, Control, Light
from .plan import Reminders, format_time, parse_time
from .service import Actor, TankkeeperService
from .tools import planned_light

NOTIFY_DOMAIN = "notify"
NOT_DEVICES = frozenset({"send_message", "persistent_notification"})
CONF_NOTIFY = "notify"
CONF_TASK_TIME = "task_time"
CONF_DOSE_TIME = "dose_time"
CONF_RESEND_TIME = "resend_time"
CONF_LIGHT_ID = "light_id"
CONF_ENTITY_ID = "entity_id"
CONF_MODEL = "model"
CONF_CONTROL = "control"
CONF_ON = "on"
CONF_OFF = "off"
CONF_BRIGHTNESS = "brightness_pct"
CONF_RAMP = "ramp_minutes"
CONF_RGB = "rgb_color"
CONF_DATE = "date"
LIGHT_STEPS = ["change_light", "one_day", "remove_light"]

VOLUME = NumberSelector(
    NumberSelectorConfig(min=1, max=100000, step=1, unit_of_measurement="L", mode=NumberSelectorMode.BOX)
)
BRIGHTNESS = NumberSelector(
    NumberSelectorConfig(min=1, max=100, step=1, unit_of_measurement="%", mode=NumberSelectorMode.BOX)
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


class TankkeeperConfigFlow(ConfigFlow, domain=DOMAIN):
    """Ask for the tank's name and volumes."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Set the reminders."""
        return TankkeeperOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Start a new tank."""
        errors = _errors(user_input)
        if user_input is not None and not errors:
            return self.async_create_entry(title=user_input[CONF_TANK_NAME], data=user_input)
        return self.async_show_form(
            step_id="user", data_schema=self.add_suggested_values_to_schema(SCHEMA, user_input or {}), errors=errors
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
        steps = ["reminders", "add_light", *(LIGHT_STEPS if service.has_lights() else [])]
        return self.async_show_menu(step_id="init", menu_options=steps)

    async def async_step_reminders(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the reminder settings, and store them through the service layer."""
        service = self._service()
        current = service.reminders()
        if user_input is not None:
            reminders = Reminders(
                notify=tuple(user_input[CONF_NOTIFY]),
                task_time=parse_time(user_input[CONF_TASK_TIME]),
                dose_time=parse_time(user_input[CONF_DOSE_TIME]),
                resend_time=parse_time(user_input[CONF_RESEND_TIME]),
            )
            try:
                await service.async_set(service.reminder_targets(reminders), _panel(), "Change the reminders")
            except NothingToChangeError:
                return self.async_abort(reason="nothing_changed")
            return self.async_create_entry(data={})
        devices = sorted(
            set(self.hass.services.async_services_for_domain(NOTIFY_DOMAIN)) - NOT_DEVICES | set(current.notify)
        )
        schema = p.Schema(
            {
                p.Required(CONF_NOTIFY): SelectSelector(
                    SelectSelectorConfig(options=devices, multiple=True, mode=SelectSelectorMode.DROPDOWN)
                ),
                p.Required(CONF_TASK_TIME): TimeSelector(),
                p.Required(CONF_DOSE_TIME): TimeSelector(),
                p.Required(CONF_RESEND_TIME): TimeSelector(),
            }
        )
        suggested = {
            CONF_NOTIFY: list(current.notify),
            CONF_TASK_TIME: format_time(current.task_time),
            CONF_DOSE_TIME: format_time(current.dose_time),
            CONF_RESEND_TIME: format_time(current.resend_time),
        }
        return self.async_show_form(
            step_id="reminders", data_schema=self.add_suggested_values_to_schema(schema, suggested)
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
