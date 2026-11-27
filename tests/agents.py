"""A stand-in for the Anthropic integration's conversation agent, so no test calls the real API."""

from dataclasses import dataclass, field
from typing import Literal, override

from homeassistant.components import conversation
from homeassistant.components.conversation.models import AbstractConversationAgent
from homeassistant.config_entries import ConfigEntry, ConfigFlow
from homeassistant.const import MATCH_ALL, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import intent, llm
from homeassistant.util.json import JsonObjectType
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    MockModule,
    mock_integration,
    mock_platform,
    setup_test_component_platform,
)

from custom_components.tankkeeper.const import API_ID

CLAUDE = "conversation.claude_conversation"
AI_TASK = "ai_task.claude_ai_task"
SIMPLE = "simple_agent"
FAILING = "failing_agent"


@dataclass
class Turn:
    """What the agent does with the next message: the Tankkeeper tools it calls, then its reply."""

    tools: list[tuple[str, JsonObjectType]] = field(default_factory=list)
    reply: str = "Done."


class AnthropicFlow(ConfigFlow):
    """The stand-in integration's config flow, which its entries need to load."""

    VERSION = 1


class FakeClaude(conversation.ConversationEntity):
    """Answers like the Anthropic agent: it reads the Tankkeeper prompt, calls tools in the chat log, then replies."""

    _attr_name = "Claude conversation"

    def __init__(self) -> None:
        """Start with no turns planned and no prompts seen."""
        self._attr_unique_id = "claude_conversation"
        self.turns: list[Turn] = []
        self.prompts: list[str] = []

    @property
    @override
    def supported_languages(self) -> list[str] | Literal["*"]:
        return MATCH_ALL

    @override
    async def _async_handle_message(
        self, user_input: conversation.ConversationInput, chat_log: conversation.ChatLog
    ) -> conversation.ConversationResult:
        await chat_log.async_provide_llm_data(
            user_input.as_llm_context("test"), API_ID, None, user_input.extra_system_prompt
        )
        system = chat_log.content[0]
        assert isinstance(system, conversation.SystemContent)
        self.prompts.append(system.content)
        turn = self.turns.pop(0) if self.turns else Turn()
        if turn.tools:
            calls = [
                llm.ToolInput(id=f"call{index}", tool_name=f"tankkeeper__{name}", tool_args=args)
                for index, (name, args) in enumerate(turn.tools)
            ]
            async for _result in chat_log.async_add_assistant_content(
                conversation.AssistantContent(agent_id=user_input.agent_id, tool_calls=calls)
            ):
                pass
        chat_log.async_add_assistant_content_without_tools(
            conversation.AssistantContent(agent_id=user_input.agent_id, content=turn.reply)
        )
        return conversation.async_get_result_from_chat_log(user_input, chat_log)


class SimpleAgent(AbstractConversationAgent):
    """An agent with no chat log, which only answers with speech."""

    @property
    @override
    def supported_languages(self) -> list[str] | Literal["*"]:
        return MATCH_ALL

    @override
    async def async_process(self, user_input: conversation.ConversationInput) -> conversation.ConversationResult:
        response = intent.IntentResponse(language=user_input.language)
        response.async_set_speech("Simple answer.")
        return conversation.ConversationResult(response=response, conversation_id=user_input.conversation_id)


class FailingAgent(AbstractConversationAgent):
    """An agent that fails with the given error."""

    def __init__(self, error: Exception) -> None:
        """Remember the error to raise."""
        self.error = error

    @property
    @override
    def supported_languages(self) -> list[str] | Literal["*"]:
        return MATCH_ALL

    @override
    async def async_process(self, user_input: conversation.ConversationInput) -> conversation.ConversationResult:
        raise self.error


async def async_add_claude(hass: HomeAssistant) -> FakeClaude:
    """Load the stand-in agent and an AI task entity, as the Anthropic integration's entry does."""
    claude = FakeClaude()

    async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
        await hass.config_entries.async_forward_entry_setups(entry, [Platform.CONVERSATION])
        return True

    mock_integration(hass, MockModule("test", async_setup_entry=async_setup_entry))
    mock_platform(hass, "test.config_flow")
    setup_test_component_platform(hass, Platform.CONVERSATION, [claude], from_config_entry=True)
    entry = MockConfigEntry(domain="test")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    hass.states.async_set(AI_TASK, "unknown")
    return claude


def add_simple_agent(hass: HomeAssistant) -> None:
    """Add an agent with no chat log, under its config entry id."""
    entry = MockConfigEntry(domain="test", entry_id=SIMPLE)
    entry.add_to_hass(hass)
    conversation.async_set_agent(hass, entry, SimpleAgent())


def add_failing_agent(hass: HomeAssistant, error: Exception) -> None:
    """Add an agent that fails, under its config entry id."""
    entry = MockConfigEntry(domain="test", entry_id=FAILING)
    entry.add_to_hass(hass)
    conversation.async_set_agent(hass, entry, FailingAgent(error))
