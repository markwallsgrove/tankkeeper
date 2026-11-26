"""Set up a tank, change its name and volumes later, and set the reminders in the options."""

from typing import Any

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigEntryState,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TimeSelector,
)
import probatio as p

from .const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from .domain import TANK_ID, Collection, NothingToChangeError, Source, dosing_within_tank, merge_record
from .plan import Reminders, format_time, parse_time
from .service import Actor, TankkeeperService

NOTIFY_DOMAIN = "notify"
NOT_DEVICES = frozenset({"send_message", "persistent_notification"})
CONF_NOTIFY = "notify"
CONF_TASK_TIME = "task_time"
CONF_DOSE_TIME = "dose_time"
CONF_RESEND_TIME = "resend_time"

VOLUME = NumberSelector(
    NumberSelectorConfig(min=1, max=100000, step=1, unit_of_measurement="L", mode=NumberSelectorMode.BOX)
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
    """Pick the devices that get reminders, and the times they are sent."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """Show the reminder settings, and store them through the service layer."""
        if self.config_entry.state is not ConfigEntryState.LOADED:
            return self.async_abort(reason="not_loaded")
        service: TankkeeperService = self.config_entry.runtime_data
        current = service.reminders()
        if user_input is not None:
            reminders = Reminders(
                notify=tuple(user_input[CONF_NOTIFY]),
                task_time=parse_time(user_input[CONF_TASK_TIME]),
                dose_time=parse_time(user_input[CONF_DOSE_TIME]),
                resend_time=parse_time(user_input[CONF_RESEND_TIME]),
            )
            actor = Actor(source=Source.PANEL, user_id=None, conversation_id=None)
            try:
                await service.async_set(service.reminder_targets(reminders), actor, "Change the reminders")
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
        return self.async_show_form(step_id="init", data_schema=self.add_suggested_values_to_schema(schema, suggested))


def _errors(user_input: dict[str, Any] | None) -> dict[str, str]:
    """Form errors for the entered details."""
    if user_input is None:
        return {}
    tank = {"volume_litres": user_input[CONF_VOLUME], "dosing_volume_litres": user_input[CONF_DOSING_VOLUME]}
    return {} if dosing_within_tank(tank) else {CONF_DOSING_VOLUME: "dosing_above_volume"}
