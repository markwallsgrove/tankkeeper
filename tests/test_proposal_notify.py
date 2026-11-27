"""Proposals still waiting go to the status-alert devices, where Accept and Reject decide them."""

from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import Context, HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util.json import JsonObjectType
import pytest
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.tankkeeper.proposal_notify import DISCUSS_URI, NOTIFY_AFTER

from .common import Caller, apply, dict_of, list_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

TABLET = "mobile_app_tablet"
ACTION_EVENT = "mobile_app_notification_action"


@pytest.fixture
async def tablet(hass: HomeAssistant, call: Caller) -> list[ServiceCall]:
    """Status alerts, and so proposals, go to the tablet."""
    calls = async_mock_service(hass, "notify", TABLET)
    await apply(call, await call.ok("set_reminders", status_notify=[TABLET], reason="Devices"))
    return calls


def _proposal_sent(calls: list[ServiceCall]) -> list[dict[str, object]]:
    sent: list[dict[str, object]] = []
    for call in calls:
        data = call.data.get("data")
        if isinstance(data, dict) and str(data.get("tag", "")).startswith("tankkeeper-proposal-"):
            sent.append(dict(call.data))
    return sent


async def _wait(hass: HomeAssistant, freezer: FrozenDateTimeFactory, delta: timedelta) -> None:
    freezer.tick(delta)
    async_fire_time_changed(hass)
    await hass.async_block_till_done(wait_background_tasks=True)


async def _action(hass: HomeAssistant, action: str, user_id: str | None) -> None:
    hass.bus.async_fire(ACTION_EVENT, {"action": action}, context=Context(user_id=user_id))
    await hass.async_block_till_done(wait_background_tasks=True)


async def _proposal(call: Caller, proposal_id: object) -> JsonObjectType:
    every = list_of((await call.ok("list_proposals", state="all"))["proposals"])
    return next(dict_of(item) for item in every if dict_of(item)["proposal_id"] == proposal_id)


def _message(proposal: JsonObjectType, text: str) -> dict[str, object]:
    proposal_id = str_of(proposal["proposal_id"])
    return {
        "title": "Nano: change waiting",
        "message": text,
        "data": {
            "tag": f"tankkeeper-proposal-{proposal_id}",
            "url": DISCUSS_URI,
            "actions": [
                {"action": f"TANKKEEPER_ACCEPT|{proposal_id}", "title": "Accept"},
                {"action": f"TANKKEEPER_REJECT|{proposal_id}", "title": "Reject"},
                {"action": "URI", "title": "Discuss", "uri": DISCUSS_URI},
            ],
        },
    }


def test_discuss_opens_the_panel() -> None:
    assert DISCUSS_URI == "/tankkeeper"


async def test_a_proposal_still_waiting_is_sent_once(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="The owner asked")
    await _wait(hass, freezer, NOTIFY_AFTER - timedelta(minutes=1))
    assert _proposal_sent(tablet) == []

    await _wait(hass, freezer, timedelta(minutes=1))
    assert _proposal_sent(tablet) == [_message(proposal, "Change the tank details\nThe owner asked")]

    await _wait(hass, freezer, timedelta(hours=1))
    assert len(_proposal_sent(tablet)) == 1


async def test_a_proposal_applied_in_the_conversation_is_not_sent(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    await apply(call, await call.ok("set_tank", name="Big", reason="Rename"))
    await _wait(hass, freezer, NOTIFY_AFTER * 2)
    assert _proposal_sent(tablet) == []


async def test_a_batch_is_sent_when_the_conversation_stops_changing_it(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    conversation_id = str_of((await call.ok("save_conversation", title="Setup"))["conversation_id"])
    batch = await call.ok("start_batch", summary="Tidy up", reason="Notes", conversation_id=conversation_id)
    for name in ("Big", "Bigger", "Biggest"):
        await _wait(hass, freezer, NOTIFY_AFTER - timedelta(minutes=1))
        await call.ok("set_tank", name=name, reason="Rename", conversation_id=conversation_id)
    await call.ok("set_water", ph=7, reason="Tap", conversation_id=conversation_id)
    assert _proposal_sent(tablet) == []

    await _wait(hass, freezer, NOTIFY_AFTER)
    assert _proposal_sent(tablet) == [_message(batch, "Tidy up (2 changes)\nNotes")]


async def test_accept_applies_and_records_who(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    await _wait(hass, freezer, NOTIFY_AFTER)

    await _action(hass, f"TANKKEEPER_ACCEPT|{proposal['proposal_id']}", "phone-user")

    decided = await _proposal(call, proposal["proposal_id"])
    assert decided["state"] == "applied"
    assert decided["decided_by"] == "phone-user"
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Big"
    history = dict_of(list_of((await call.ok("get_history", limit=1))["history"])[0])
    assert history["source"] == "notification"
    assert history["proposal_id"] == proposal["proposal_id"]
    tag = f"tankkeeper-proposal-{proposal['proposal_id']}"
    assert _proposal_sent(tablet)[-1] == {"message": "clear_notification", "data": {"tag": tag}}


async def test_reject_closes_and_records_who(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    await _wait(hass, freezer, NOTIFY_AFTER)

    await _action(hass, f"TANKKEEPER_REJECT|{proposal['proposal_id']}", "phone-user")

    decided = await _proposal(call, proposal["proposal_id"])
    assert decided["state"] == "rejected"
    assert decided["decided_by"] == "phone-user"
    assert dict_of((await call.ok("get_tank"))["tank"])["name"] == "Nano"


async def test_actions_without_a_person_or_on_a_closed_proposal_change_nothing(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    await _wait(hass, freezer, NOTIFY_AFTER)

    await _action(hass, f"TANKKEEPER_ACCEPT|{proposal['proposal_id']}", None)
    await _action(hass, f"TANKKEEPER_REJECT|{proposal['proposal_id']}", None)
    await _action(hass, "TANKKEEPER_ACCEPT|unknown", "phone-user")
    await _action(hass, "TANKKEEPER_ACCEPT|", "phone-user")
    await _action(hass, "SOMETHING_ELSE|x", "phone-user")
    assert (await _proposal(call, proposal["proposal_id"]))["state"] == "pending"

    await apply(call, proposal)
    await hass.async_block_till_done()
    tag = f"tankkeeper-proposal-{proposal['proposal_id']}"
    assert _proposal_sent(tablet)[-1] == {"message": "clear_notification", "data": {"tag": tag}}
    await _action(hass, f"TANKKEEPER_REJECT|{proposal['proposal_id']}", "phone-user")
    assert (await _proposal(call, proposal["proposal_id"]))["state"] == "applied"


async def test_nothing_is_sent_without_status_devices(
    hass: HomeAssistant, call: Caller, freezer: FrozenDateTimeFactory
) -> None:
    phone = async_mock_service(hass, "notify", TABLET)
    await call.ok("set_tank", name="Big", reason="Rename")
    await _wait(hass, freezer, NOTIFY_AFTER)
    assert _proposal_sent(phone) == []


async def test_a_failing_device_does_not_stop_the_others(
    hass: HomeAssistant, call: Caller, tablet: list[ServiceCall], freezer: FrozenDateTimeFactory
) -> None:
    async def broken(service_call: ServiceCall) -> None:
        raise HomeAssistantError("offline")

    hass.services.async_register("notify", "mobile_app_broken", broken)
    await apply(call, await call.ok("set_reminders", status_notify=["mobile_app_broken", TABLET], reason="Devices"))
    await call.ok("set_tank", name="Big", reason="Rename")
    await _wait(hass, freezer, NOTIFY_AFTER)
    assert len(_proposal_sent(tablet)) == 1


async def test_a_restart_remembers_what_was_sent(
    hass: HomeAssistant,
    call: Caller,
    tablet: list[ServiceCall],
    freezer: FrozenDateTimeFactory,
    loaded_entry: MockConfigEntry,
) -> None:
    proposal = await call.ok("set_tank", name="Big", reason="Rename")
    await _wait(hass, freezer, NOTIFY_AFTER)
    assert await hass.config_entries.async_reload(loaded_entry.entry_id)
    await hass.async_block_till_done()
    await _wait(hass, freezer, NOTIFY_AFTER)
    assert len(_proposal_sent(tablet)) == 1

    await _action(hass, f"TANKKEEPER_REJECT|{proposal['proposal_id']}", "phone-user")
    tag = f"tankkeeper-proposal-{proposal['proposal_id']}"
    assert _proposal_sent(tablet)[-1] == {"message": "clear_notification", "data": {"tag": tag}}
