"""Reviews run after tests, finished tasks, status changes and once a day, against a real Home Assistant."""

import asyncio

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.llm import LLMContext
from homeassistant.util.json import JsonObjectType, JsonValueType
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed, async_mock_service

from custom_components.tankkeeper import reviewer
from custom_components.tankkeeper.reviewer import API_PROMPT, COMMENT, DELAY_SECONDS, MAX_TOOL_CALLS, ReviewAPI
from custom_components.tankkeeper.reviews import MAX_COMMENT
from custom_components.tankkeeper.service import TankkeeperService
from custom_components.tankkeeper.tools import READ, SPECS

from .agents import AI_TASK, Answer, FakeClaude
from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

TABLET = "mobile_app_tablet"
WATCH = (
    "Watch: Ammonia 3 ppm on 26 Nov is above the 2 ppm watch limit. Test again within 2 days. Above 4 ppm, change "
    "water to bring it down."
)


@pytest.fixture
async def tablet(hass: HomeAssistant, call: Caller) -> list[ServiceCall]:
    """Status alerts and reviews go to the tablet."""
    calls = async_mock_service(hass, "notify", TABLET)
    await apply(call, await call.ok("set_reminders", status_notify=[TABLET], reason="Devices"))
    return calls


async def _wait(hass: HomeAssistant, freezer: FrozenDateTimeFactory, seconds: float) -> None:
    freezer.tick(seconds)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def _at(hass: HomeAssistant, freezer: FrozenDateTimeFactory, moment: str) -> None:
    freezer.move_to(moment)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def _reviews(call: Caller, **args: JsonValueType) -> list[JsonObjectType]:
    return [dict_of(item) for item in list_of((await call.ok("get_reviews", **args))["reviews"])]


async def _set_claude(call: Caller, **args: JsonValueType) -> None:
    await apply(call, await call.ok("set_claude", reason="Reviews", **args))


def _reviews_sent(calls: list[ServiceCall]) -> list[dict[str, object]]:
    return [dict(item.data) for item in calls if "url" in dict_of(item.data["data"])]


async def test_a_test_starts_a_review_after_a_short_wait(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    await call.ok("record_test", values={"ammonia": 3})
    await _wait(hass, freezer, DELAY_SECONDS - 1)
    assert await _reviews(call) == []

    await _wait(hass, freezer, 1)

    [review] = await _reviews(call)
    assert review == {
        "id": review["id"],
        "time": "2026-11-26T08:02:00+00:00",
        "triggers": ["test", "status"],
        "level": "watch",
        "result": WATCH,
        "asked": False,
        "comment": None,
        "note": None,
        "proposal_ids": [],
    }
    assert _reviews_sent(tablet) == [
        {
            "title": "Nano: Watch",
            "message": WATCH,
            "data": {
                "tag": "tankkeeper-status",
                "url": "/tankkeeper",
                "clickAction": "/tankkeeper",
                "actions": [{"action": "URI", "title": "Discuss", "uri": f"/tankkeeper?review={review['id']}"}],
            },
        }
    ]


async def test_events_close_together_give_one_review(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    await call.ok("record_test", values={"ammonia": 0})
    await _wait(hass, freezer, 60)
    await call.ok("record_test", values={"ammonia": 1})
    await _wait(hass, freezer, DELAY_SECONDS - 1)
    assert await _reviews(call) == []

    await _wait(hass, freezer, 1)

    [review] = await _reviews(call)
    assert review["triggers"] == ["test"]
    assert review["result"] == "On course. Every rule is inside its limits."


async def test_a_finished_task_starts_a_review_but_a_new_task_does_not(
    hass: HomeAssistant, call: Caller, freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, review_on=["task"])
    proposal = await call.ok("add_task", text="Top up", date="2026-11-26", reason="Plan")
    task_id = str_of(dict_of(list_of(proposal["changes"])[0])["record_id"])
    await apply(call, proposal)
    await _wait(hass, freezer, DELAY_SECONDS)
    assert await _reviews(call) == []

    await call.ok("skip_task", task_id=task_id)
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    assert review["triggers"] == ["task"]


async def test_only_the_chosen_events_start_a_review(
    hass: HomeAssistant, call: Caller, freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, review_on=["status"])
    await call.ok("record_test", values={"ammonia": 1})
    await _wait(hass, freezer, DELAY_SECONDS)
    assert await _reviews(call) == []

    await apply(call, await call.ok("set_rules", nitrogen_watch=0.5, reason="Stricter"))
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    assert review["triggers"] == ["status"]
    assert review["level"] == "watch"


async def test_the_daily_review_runs_at_its_time_and_follows_changes(
    hass: HomeAssistant, call: Caller, freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, daily_time="09:00", review_on=[])
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")
    [review] = await _reviews(call)
    assert review["triggers"] == ["daily"]

    await _set_claude(call, daily_time="10:00")
    await _at(hass, freezer, "2026-11-26T10:00:00+00:00")
    assert len(await _reviews(call)) == 2
    await _at(hass, freezer, "2026-11-27T09:00:00+00:00")
    assert len(await _reviews(call)) == 2

    await _set_claude(call, daily_time="")
    await _at(hass, freezer, "2026-11-27T10:00:00+00:00")
    assert len(await _reviews(call)) == 2


async def test_claude_comments_on_a_review_when_turned_on(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True)

    await call.ok("record_test", values={"ammonia": 3})
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    assert (review["asked"], review["comment"], review["note"]) == (True, "The cycle has started.", None)
    [task] = claude.ai_task.tasks
    assert task.structure is COMMENT
    assert task.instructions.startswith("Review the fish tank Nano after: a test, a status change.")
    assert f"The rules say: {WATCH}" in task.instructions
    assert API_PROMPT in claude.ai_task.prompts[0]
    assert _reviews_sent(tablet)[0]["message"] == f"{WATCH}\nClaude: The cycle has started."


async def test_a_plan_change_from_a_review_waits_for_the_owner(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True)
    claude.ai_task.answers.append(
        Answer(
            tools=[
                ("get_status", {}),
                (
                    "add_task",
                    {"text": "Test pH", "date": "2026-11-28", "reason": "pH may fall", "conversation_id": "x"},
                ),
            ]
        )
    )

    await call.ok("record_test", values={"ph": 6.9})
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    [proposal] = [dict_of(item) for item in list_of((await call.ok("list_proposals"))["proposals"])]
    assert review["proposal_ids"] == [proposal["proposal_id"]]
    assert (proposal["source"], proposal["conversation_id"], proposal["state"]) == ("review", None, "pending")
    assert [result.error for result in claude.ai_task.results] == [False, False]
    assert "code" not in str(claude.ai_task.results[1].data)
    assert str(_reviews_sent(tablet)[0]["message"]).endswith("1 plan change waits for you in the panel.")


async def test_a_review_reads_everything_and_changes_only_the_plan(
    hass: HomeAssistant, loaded_entry: MockConfigEntry
) -> None:
    service: TankkeeperService = loaded_entry.runtime_data
    context = LLMContext(platform="test", context=None, language=None, assistant="ai_task", device_id=None)

    instance = await ReviewAPI(hass, service).async_get_api_instance(context)

    reads = {f"tankkeeper__{spec.name}" for spec in SPECS if spec.annotations is READ}
    plan = {"tankkeeper__add_task", "tankkeeper__update_task", "tankkeeper__remove_task"}
    assert {tool.name for tool in instance.tools} == reads | plan
    assert "tankkeeper__get_reviews" in reads


async def test_the_daily_cap_stops_comments_until_the_next_day(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True, daily_cap=1)
    await call.ok("record_test", values={"nitrate": 10})
    await _wait(hass, freezer, DELAY_SECONDS)

    await call.ok("record_test", values={"nitrate": 15})
    await _wait(hass, freezer, DELAY_SECONDS)

    latest = (await _reviews(call))[0]
    assert (latest["asked"], latest["comment"]) == (False, None)
    assert latest["note"] == "No comment: the daily cap of 1 is reached."
    assert len(claude.ai_task.tasks) == 1

    await _at(hass, freezer, "2026-11-27T08:00:00+00:00")
    await call.ok("record_test", values={"nitrate": 20})
    await _wait(hass, freezer, DELAY_SECONDS)
    assert (await _reviews(call))[0]["comment"] == "The cycle has started."


@pytest.mark.parametrize("error", [HomeAssistantError("Overloaded"), RuntimeError("Overloaded")])
async def test_a_failing_ai_task_entity_is_noted_and_the_review_kept(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, freezer: FrozenDateTimeFactory, error: Exception
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True)
    claude.ai_task.error = error

    await call.ok("record_test", values={"ammonia": 3})
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    assert (review["asked"], review["comment"]) == (True, None)
    assert review["note"] == "Claude could not comment: Overloaded"
    assert review["result"] == WATCH


@pytest.mark.parametrize("data", ["The cycle has started.", {"comment": "  "}, {"comment": 3}, {"other": "x"}])
async def test_an_answer_without_a_comment_is_noted(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, freezer: FrozenDateTimeFactory, data: object
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True)
    claude.ai_task.answers.append(Answer(data=data))

    await call.ok("record_test", values={"nitrate": 10})
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    assert (review["asked"], review["comment"], review["note"]) == (True, None, "Claude's answer had no comment.")


async def test_a_long_comment_is_trimmed_and_cut(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True)
    claude.ai_task.answers.append(Answer(data={"comment": "  " + "a" * (MAX_COMMENT + 10)}))

    await call.ok("record_test", values={"nitrate": 10})
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    assert review["comment"] == "a" * MAX_COMMENT


async def test_comments_need_an_ai_task_entity(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, comments=True)

    await call.ok("record_test", values={"nitrate": 10})
    await _wait(hass, freezer, DELAY_SECONDS)

    [review] = await _reviews(call)
    assert (review["asked"], review["note"]) == (False, None)
    assert claude.ai_task.tasks == []


async def test_a_failing_device_does_not_stop_the_others(
    hass: HomeAssistant, call: Caller, freezer: FrozenDateTimeFactory
) -> None:
    async_mock_service(hass, "notify", "broken", raise_exception=HomeAssistantError("Offline"))
    tablet = async_mock_service(hass, "notify", TABLET)
    await apply(call, await call.ok("set_reminders", status_notify=["broken", TABLET], reason="Devices"))

    await call.ok("record_test", values={"nitrate": 10})
    await _wait(hass, freezer, DELAY_SECONDS)

    assert len(_reviews_sent(tablet)) == 1


async def test_unloading_stops_reviews(
    hass: HomeAssistant,
    call: Caller,
    tablet: list[ServiceCall],
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    await _set_claude(call, daily_time="09:00")
    await call.ok("record_test", values={"nitrate": 10})

    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    await _at(hass, freezer, "2026-11-26T09:00:00+00:00")

    assert _reviews_sent(tablet) == []


async def test_reviews_are_kept_and_listed_newest_first(
    hass: HomeAssistant, call: Caller, loaded_entry: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    for value in (10, 15, 20):
        await call.ok("record_test", values={"nitrate": value})
        await _wait(hass, freezer, DELAY_SECONDS)
    times = [str_of(review["time"]) for review in await _reviews(call)]

    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()

    assert [review["time"] for review in await _reviews(call, limit=2)] == times[:2]
    assert times == sorted(times, reverse=True)
    assert await call.error("get_reviews", limit=0) == "invalid_input"


async def test_unloading_stops_a_review_that_is_running(
    hass: HomeAssistant,
    *,
    call: Caller,
    claude: FakeClaude,
    tablet: list[ServiceCall],
    loaded_entry: MockConfigEntry,
    freezer: FrozenDateTimeFactory,
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True)
    gate = asyncio.Event()
    claude.ai_task.gate = gate
    await call.ok("record_test", values={"nitrate": 10})
    freezer.tick(DELAY_SECONDS)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(claude.ai_task.tasks) == 1

    assert await hass.config_entries.async_unload(loaded_entry.entry_id)
    gate.set()
    await hass.async_block_till_done(wait_background_tasks=True)
    assert await hass.config_entries.async_setup(loaded_entry.entry_id)
    await hass.async_block_till_done()

    assert await _reviews(call) == []
    assert _reviews_sent(tablet) == []


async def test_a_comment_that_takes_too_long_is_noted(
    hass: HomeAssistant,
    call: Caller,
    claude: FakeClaude,
    freezer: FrozenDateTimeFactory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(reviewer, "COMMENT_TIMEOUT", 1)
    await _set_claude(call, ai_task=AI_TASK, comments=True)
    claude.ai_task.gate = asyncio.Event()

    await call.ok("record_test", values={"nitrate": 10})
    freezer.tick(DELAY_SECONDS)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(claude.ai_task.tasks) == 1
    await _wait(hass, freezer, 1)

    [review] = await _reviews(call)
    assert (review["asked"], review["comment"]) == (True, None)
    assert review["note"] == "Claude took too long to comment."


async def test_a_review_stops_answering_tools_after_the_limit(
    hass: HomeAssistant, call: Caller, claude: FakeClaude, freezer: FrozenDateTimeFactory
) -> None:
    await _set_claude(call, ai_task=AI_TASK, comments=True)
    claude.ai_task.answers.append(Answer(tools=[("get_status", {})] * (MAX_TOOL_CALLS + 2)))

    await call.ok("record_test", values={"nitrate": 10})
    await _wait(hass, freezer, DELAY_SECONDS)

    errors = [result.error for result in claude.ai_task.results]
    assert errors == [False] * MAX_TOOL_CALLS + [True, True]
    assert claude.ai_task.results[-1].data == {
        "error": "too_many_calls",
        "message": f"A review may call at most {MAX_TOOL_CALLS} tools. Write the comment now.",
    }
    assert (await _reviews(call))[0]["comment"] == "The cycle has started."
