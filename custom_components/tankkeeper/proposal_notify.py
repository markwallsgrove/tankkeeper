"""Sends proposals still waiting after the conversation to the status-alert devices, with Accept, Reject and Discuss."""

from datetime import datetime, timedelta
import logging

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import async_track_time_interval

from .const import DOMAIN
from .domain import Proposal, TankkeeperError
from .reminders import ACTION_EVENT, CLEAR_MESSAGE
from .service import TankkeeperService

_LOGGER = logging.getLogger(__name__)

NOTIFY_DOMAIN = "notify"
NOTIFY_AFTER = timedelta(minutes=10)
CHECK_EVERY = timedelta(minutes=1)
DISCUSS_URI = f"/config/integrations/integration/{DOMAIN}"
ACCEPT = "TANKKEEPER_ACCEPT"
REJECT = "TANKKEEPER_REJECT"


def tag_for(proposal_id: str) -> str:
    """The notification tag for a proposal, so a later message replaces or clears it."""
    return f"{DOMAIN}-proposal-{proposal_id}"


def message_for(proposal: Proposal) -> str:
    """What the notification says about a proposal."""
    count = len(proposal.changes)
    head = f"{proposal.summary} ({count} change{'' if count == 1 else 's'})" if proposal.batch else proposal.summary
    return f"{head}\n{proposal.reason}"


class ProposalNotifier:
    """Sends each proposal once, NOTIFY_AFTER its last change, and acts on the answer from the notification."""

    def __init__(self, hass: HomeAssistant, service: TankkeeperService) -> None:
        """Remember the proposals already sent that still wait, so a restart can clear them later."""
        self._hass = hass
        self._service = service
        self._shown = {proposal.id for proposal in service.pending_proposals() if proposal.notified}

    @callback
    def start(self) -> CALLBACK_TYPE:
        """Check every minute, clear after every change and listen for answers. Returns a function that stops all."""
        stop_check = async_track_time_interval(self._hass, self._check, CHECK_EVERY)
        stop_records = self._service.async_add_listener(self._changed)
        stop_actions = self._hass.bus.async_listen(ACTION_EVENT, self._async_action)

        @callback
        def stop() -> None:
            stop_check()
            stop_records()
            stop_actions()

        return stop

    @callback
    def _check(self, now: datetime) -> None:
        due = [
            proposal
            for proposal in self._service.pending_proposals()
            if not proposal.notified and proposal.changes and now - proposal.last_change() >= NOTIFY_AFTER
        ]
        if due:
            self._hass.async_create_task(self._async_send(due), eager_start=False)

    @callback
    def _changed(self) -> None:
        waiting = {proposal.id for proposal in self._service.pending_proposals()}
        for proposal_id in sorted(self._shown - waiting):
            self._shown.discard(proposal_id)
            self._hass.async_create_task(
                self._async_notify({"message": CLEAR_MESSAGE, "data": {"tag": tag_for(proposal_id)}}),
                eager_start=False,
            )

    async def _async_send(self, proposals: list[Proposal]) -> None:
        if not self._service.reminders().status_notify:
            return
        await self._service.async_mark_notified(proposal.id for proposal in proposals)
        title = f"{self._service.tank_name()}: change waiting"
        for proposal in proposals:
            self._shown.add(proposal.id)
            await self._async_notify(
                {
                    "title": title,
                    "message": message_for(proposal),
                    "data": {
                        "tag": tag_for(proposal.id),
                        "url": DISCUSS_URI,
                        "actions": [
                            {"action": f"{ACCEPT}|{proposal.id}", "title": "Accept"},
                            {"action": f"{REJECT}|{proposal.id}", "title": "Reject"},
                            {"action": "URI", "title": "Discuss", "uri": DISCUSS_URI},
                        ],
                    },
                }
            )

    async def _async_notify(self, data: dict[str, object]) -> None:
        for device in self._service.reminders().status_notify:
            try:
                await self._hass.services.async_call(NOTIFY_DOMAIN, device, data, blocking=True)
            except HomeAssistantError as err:
                _LOGGER.warning("Could not send the proposal to %s: %s", device, err)

    async def _async_action(self, event: Event) -> None:
        kind, _, proposal_id = str(event.data.get("action", "")).partition("|")
        if kind not in (ACCEPT, REJECT) or not proposal_id:
            return
        user_id = event.context.user_id
        if user_id is None:
            _LOGGER.warning("Ignored %s for proposal %s: no person", kind, proposal_id)
            return
        try:
            if kind == ACCEPT:
                await self._service.async_accept(proposal_id, user_id)
            else:
                await self._service.async_decline(proposal_id, user_id)
        except TankkeeperError as err:
            _LOGGER.warning("Could not act on proposal %s: %s", proposal_id, err)
