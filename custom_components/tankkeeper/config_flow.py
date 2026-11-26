"""Set up a tank, and change its name and volumes later."""

from typing import Any

from homeassistant.config_entries import ConfigEntryState, ConfigFlow, ConfigFlowResult
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    TextSelector,
)
import probatio as p

from .const import CONF_DOSING_VOLUME, CONF_TANK_NAME, CONF_VOLUME, DOMAIN
from .domain import TANK_ID, Collection, NothingToChangeError, Source, dosing_within_tank, merge_record
from .service import Actor, TankkeeperService

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


def _errors(user_input: dict[str, Any] | None) -> dict[str, str]:
    """Form errors for the entered details."""
    if user_input is None:
        return {}
    tank = {"volume_litres": user_input[CONF_VOLUME], "dosing_volume_litres": user_input[CONF_DOSING_VOLUME]}
    return {} if dosing_within_tank(tank) else {CONF_DOSING_VOLUME: "dosing_above_volume"}
