"""TankKeeper's tools, as their own LLM API and as part of Assist."""

from typing import override

from homeassistant.components.llm import LLMTools
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.llm import API, LLM_API_ASSIST, APIInstance, LLMContext

from .const import API_ID, API_NAME, DOMAIN
from .service import TankkeeperService
from .tools import PROMPT, build_tools


class TankkeeperAPI(API):
    """Only TankKeeper's tools, for an assistant that looks after the tank."""

    def __init__(self, hass: HomeAssistant, service: TankkeeperService) -> None:
        """Bind the API to one tank."""
        super().__init__(hass=hass, id=API_ID, name=API_NAME)
        self._service = service

    @override
    async def async_get_api_instance(self, llm_context: LLMContext) -> APIInstance:
        """The tools and instructions."""
        return APIInstance(api=self, api_prompt=PROMPT, llm_context=llm_context, tools=build_tools(self._service))


@callback
def async_get_tools(hass: HomeAssistant, llm_context: LLMContext, api_id: str) -> LLMTools | None:
    """Add TankKeeper's tools to Assist while a tank is loaded."""
    if api_id != LLM_API_ASSIST:
        return None
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            service: TankkeeperService = entry.runtime_data
            return LLMTools(tools=build_tools(service), prompt=PROMPT)
    return None
