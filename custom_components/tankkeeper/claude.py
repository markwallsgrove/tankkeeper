"""Claude settings.

They hold the agent TankKeeper's Assist agent passes chat to, the AI task entity for review comments, what starts a
review and the daily cap on comments.
"""

from contextvars import ContextVar
from dataclasses import dataclass
from datetime import time
from enum import StrEnum

from homeassistant.components.conversation import (
    DOMAIN as CONVERSATION_DOMAIN,
    HOME_ASSISTANT_AGENT,
    async_get_agent_info,
)
from homeassistant.components.conversation.agent_manager import get_agent_manager
from homeassistant.components.conversation.models import AgentInfo
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN
from .domain import InvalidInputError, JsonValue, Record
from .plan import format_time, parse_time

CLAUDE_ID = "claude"
AI_TASK_DOMAIN = "ai_task"
MAX_DAILY_CAP = 50
MODEL_NOTE = (
    "The models are set in the Anthropic integration: the chat model on the conversation agent, the review model on "
    "the AI task entity. TankKeeper never holds an API key."
)

ASSIST_CONVERSATION: ContextVar[tuple[str, str] | None] = ContextVar("tankkeeper_assist_conversation", default=None)
"""The conversation TankKeeper's Assist agent is recording and the id of the request's context, while the chosen
agent answers a message in it. Tools use the conversation only for calls with that same context."""


class Trigger(StrEnum):
    """What starts a review."""

    TEST = "test"
    TASK = "task"
    STATUS = "status"
    DAILY = "daily"


EVENT_TRIGGERS = (Trigger.TEST, Trigger.TASK, Trigger.STATUS)


@dataclass(frozen=True, slots=True, kw_only=True)
class ClaudeSettings:
    """Which agent chats, which AI task entity comments on reviews, and when reviews run."""

    agent: str | None = None
    ai_task: str | None = None
    review_on: tuple[Trigger, ...] = EVENT_TRIGGERS
    comments: bool = False
    daily_time: time | None = None
    daily_cap: int = 5

    def to_json(self) -> Record:
        """Serialise for storage and tools."""
        return {
            "agent": self.agent,
            "ai_task": self.ai_task,
            "review_on": [trigger.value for trigger in self.review_on],
            "comments": self.comments,
            "daily_time": None if self.daily_time is None else format_time(self.daily_time),
            "daily_cap": self.daily_cap,
        }

    @classmethod
    def from_json(cls, data: Record | None) -> ClaudeSettings:
        """Read from storage. Missing settings take their defaults."""
        stored = data or {}
        default = cls()
        review_on = stored.get("review_on")
        daily_time = stored.get("daily_time")
        cap = stored.get("daily_cap")
        return cls(
            agent=_optional_str(stored.get("agent")),
            ai_task=_optional_str(stored.get("ai_task")),
            review_on=default.review_on if not isinstance(review_on, list) else triggers(review_on),
            comments=stored.get("comments") is True,
            daily_time=None if not isinstance(daily_time, str) else parse_time(daily_time),
            daily_cap=default.daily_cap if not isinstance(cap, int) else cap,
        )


def triggers(values: list[JsonValue]) -> tuple[Trigger, ...]:
    """The event triggers in a fixed order, each once."""
    chosen = {str(value) for value in values}
    return tuple(trigger for trigger in EVENT_TRIGGERS if trigger.value in chosen)


def check_settings(hass: HomeAssistant, settings: ClaudeSettings) -> None:
    """Raise InvalidInputError unless the agent and the AI task entity can be used."""
    if settings.agent is not None:
        if async_get_agent_info(hass, settings.agent) is None:
            raise InvalidInputError(f"No conversation agent {settings.agent}")
        entry = er.async_get(hass).async_get(settings.agent)
        if entry is not None and entry.platform == DOMAIN:
            raise InvalidInputError("TankKeeper's agent can't pass chat to itself. Choose the Claude agent")
    if settings.ai_task is not None and (
        not settings.ai_task.startswith(f"{AI_TASK_DOMAIN}.") or hass.states.get(settings.ai_task) is None
    ):
        raise InvalidInputError(f"No AI task entity {settings.ai_task}")


def chat_agents(hass: HomeAssistant) -> list[AgentInfo]:
    """The agents TankKeeper can pass chat to: all but TankKeeper's own and Home Assistant's built-in one."""
    registry = er.async_get(hass)
    ids = [
        *hass.states.async_entity_ids(CONVERSATION_DOMAIN),
        *(info.id for info in get_agent_manager(hass).async_get_agent_info()),
    ]
    found: list[AgentInfo] = []
    for agent_id in ids:
        entry = registry.async_get(agent_id)
        if agent_id == HOME_ASSISTANT_AGENT or (entry is not None and entry.platform == DOMAIN):
            continue
        if (info := async_get_agent_info(hass, agent_id)) is not None:
            found.append(info)
    return found


def chat_agent(hass: HomeAssistant, settings: ClaudeSettings) -> AgentInfo | None:
    """The agent TankKeeper passes chat to: the chosen one, or without a choice the only agent it can use."""
    if settings.agent is not None:
        return async_get_agent_info(hass, settings.agent)
    agents = chat_agents(hass)
    return agents[0] if len(agents) == 1 else None


def _optional_str(value: JsonValue) -> str | None:
    return value if isinstance(value, str) and value else None
