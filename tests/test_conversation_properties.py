"""Hegel properties for recording conversations."""

import hegel
from hegel import generators as gs
from homeassistant.components import conversation
from homeassistant.helpers import llm
from homeassistant.util.json import JsonObjectType

from custom_components.tankkeeper.conversation import MAX_TEXT, messages_of

words = gs.text(alphabet="abc XYZ019:{}\"'", min_size=0, max_size=MAX_TEXT + 50)
names = gs.sampled_from(["tankkeeper__add_task", "tankkeeper__get_tank", "GetLiveContext"])


@hegel.composite
def chat(tc: hegel.TestCase) -> list[conversation.Content]:
    """Replies and tool calls, each call followed by its result."""
    content: list[conversation.Content] = []
    for index in range(tc.draw(gs.integers(min_value=0, max_value=6))):
        if tc.draw(gs.booleans()):
            content.append(conversation.AssistantContent(agent_id="a", content=tc.draw(words) or None))
            continue
        name = tc.draw(names)
        call = llm.ToolInput(id=f"c{index}", tool_name=name, tool_args={"text": tc.draw(words)})
        content.append(conversation.AssistantContent(agent_id="a", tool_calls=[call]))
        result: JsonObjectType = {"code": "ABC234", "proposal": {"code": "ABC234", "text": tc.draw(words)}}
        content.append(
            conversation.ToolResultContent(
                agent_id="a", tool_call_id=call.id, tool_name=name, result=llm.ToolResult(result)
            )
        )
    return content


@hegel.test
def test_each_reply_and_tool_call_is_one_short_message_without_codes(tc: hegel.TestCase) -> None:
    content = tc.draw(chat())

    messages = messages_of(content)

    replies = [item for item in content if isinstance(item, conversation.AssistantContent) and item.content]
    results = [item for item in content if isinstance(item, conversation.ToolResultContent)]
    assert [message.role for message in messages].count("assistant") == len(replies)
    assert [message.role for message in messages].count("tool") == len(results)
    assert all(len(message.text) <= MAX_TEXT for message in messages)
    assert all("ABC234" not in message.text for message in messages)
