"""Stand-ins for the Anthropic integration's conversation agent and AI task entity, so no test calls the real API."""

import asyncio
from dataclasses import dataclass, field
from typing import Literal, override

from homeassistant.components import ai_task, camera, conversation
from homeassistant.components.conversation.models import AbstractConversationAgent
from homeassistant.config_entries import ConfigEntry, ConfigFlow
from homeassistant.const import MATCH_ALL, Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import intent, llm
from homeassistant.setup import async_setup_component
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
CAMERA = "camera.tank_camera"
PHOTO = b"\xff\xd8\xff\xe0 a photo of the tank \xff\xd9"
SIMPLE = "simple_agent"
FAILING = "failing_agent"


@dataclass
class Turn:
    """What the agent does with the next message: the Tankkeeper tools it calls, then its reply."""

    tools: list[tuple[str, JsonObjectType]] = field(default_factory=list)
    reply: str = "Done."


@dataclass
class Answer:
    """What the AI task entity does with the next task: the Tankkeeper tools it calls, then the data it returns."""

    tools: list[tuple[str, JsonObjectType]] = field(default_factory=list)
    data: object = field(default_factory=lambda: {"comment": "The cycle has started."})


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
        self.ai_task = FakeAITask()

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


class FakeAITask(ai_task.AITaskEntity):
    """Answers like the Anthropic AI task entity: it reads the prompt, calls tools in the chat log, then answers."""

    _attr_name = "Claude AI Task"
    _attr_supported_features = (
        ai_task.AITaskEntityFeature.GENERATE_DATA | ai_task.AITaskEntityFeature.SUPPORT_ATTACHMENTS
    )

    def __init__(self) -> None:
        """Start with no answers planned and no tasks seen."""
        self._attr_unique_id = "claude_ai_task"
        self.answers: list[Answer] = []
        self.tasks: list[ai_task.GenDataTask] = []
        self.images: list[tuple[str, bytes]] = []
        self.prompts: list[str] = []
        self.results: list[llm.ToolResult] = []
        self.error: Exception | None = None
        self.gate: asyncio.Event | None = None

    @override
    async def _async_generate_data(
        self, task: ai_task.GenDataTask, chat_log: conversation.ChatLog
    ) -> ai_task.GenDataTaskResult:
        self.tasks.append(task)
        system = chat_log.content[0]
        assert isinstance(system, conversation.SystemContent)
        self.prompts.append(system.content)
        for attachment in task.attachments or []:
            data = await self.hass.async_add_executor_job(attachment.path.read_bytes)
            self.images.append((attachment.mime_type, data))
        if self.gate is not None:
            await self.gate.wait()
        if self.error is not None:
            raise self.error
        answer = self.answers.pop(0) if self.answers else Answer()
        if answer.tools:
            calls = [
                llm.ToolInput(id=f"call{index}", tool_name=f"tankkeeper__{name}", tool_args=args)
                for index, (name, args) in enumerate(answer.tools)
            ]
            async for content in chat_log.async_add_assistant_content(
                conversation.AssistantContent(agent_id=self.entity_id, tool_calls=calls)
            ):
                assert isinstance(content, conversation.ToolResultContent)
                self.results.append(content.result)
        return ai_task.GenDataTaskResult(conversation_id=chat_log.conversation_id, data=answer.data)


class FakeCamera(camera.Camera):
    """A camera that returns a fixed photo, or fails like a camera that is offline."""

    _attr_name = "Tank camera"

    def __init__(self) -> None:
        """Return a JPEG photo until told otherwise."""
        super().__init__()
        self._attr_unique_id = "tank_camera"
        self.photo: bytes | None = PHOTO
        self.error: HomeAssistantError | None = None

    @override
    async def async_camera_image(self, width: int | None = None, height: int | None = None) -> bytes | None:
        if self.error is not None:
            raise self.error
        return self.photo


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
    """Load the stand-in agent and its AI task entity, as the Anthropic integration's entry does."""
    claude = FakeClaude()

    async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
        await hass.config_entries.async_forward_entry_setups(entry, [Platform.AI_TASK, Platform.CONVERSATION])
        return True

    mock_integration(hass, MockModule("test", async_setup_entry=async_setup_entry))
    mock_platform(hass, "test.config_flow")
    setup_test_component_platform(hass, Platform.CONVERSATION, [claude], from_config_entry=True)
    setup_test_component_platform(hass, Platform.AI_TASK, [claude.ai_task], from_config_entry=True)
    entry = MockConfigEntry(domain="test")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert claude.ai_task.entity_id == AI_TASK
    return claude


async def async_add_camera(hass: HomeAssistant) -> FakeCamera:
    """Load a camera entity, as a camera integration such as Tapo does."""
    fake = FakeCamera()
    setup_test_component_platform(hass, Platform.CAMERA, [fake])
    assert await async_setup_component(hass, Platform.CAMERA, {Platform.CAMERA: {"platform": "test"}})
    await hass.async_block_till_done()
    assert fake.entity_id == CAMERA
    return fake


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
