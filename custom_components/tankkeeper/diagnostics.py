"""Diagnostics: counts and settings, without conversation text or notes."""

from homeassistant.core import HomeAssistant
from homeassistant.util.json import JsonObjectType

from . import TankkeeperConfigEntry
from .domain import TANK_ID, Collection, ProposalState


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: TankkeeperConfigEntry) -> JsonObjectType:
    """What helps to debug a problem, leaving out what the owner wrote."""
    service = entry.runtime_data
    state = service.state
    tank = service.records(Collection.TANK).get(TANK_ID, {})
    return {
        "entry": {"version": entry.version, "volume_litres": tank.get("volume_litres")},
        "records": {collection.value: len(service.records(collection)) for collection in Collection},
        "history_entries": len(state.history),
        "proposals": {
            proposal_state.value: sum(1 for item in state.proposals.values() if item.state is proposal_state)
            for proposal_state in ProposalState
        },
        "conversations": len(state.conversations),
        "photo_checks": len(state.photo_checks),
    }
