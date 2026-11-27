"""The tools Claude uses, through Assist and the MCP server."""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, replace
from datetime import date, datetime, time, timedelta
from typing import cast, override

from homeassistant.core import HomeAssistant
from homeassistant.helpers.llm import LLMContext, Tool, ToolAnnotations, ToolInput, ToolResult
from homeassistant.util import dt as dt_util
from homeassistant.util.json import JsonObjectType
from homeassistant.util.ulid import ulid_now
import probatio as p

from .const import DOMAIN
from .domain import (
    TANK_ID,
    WATER_ID,
    Change,
    Collection,
    Conversation,
    HistoryEntry,
    InvalidInputError,
    JsonValue,
    Message,
    NothingToChangeError,
    Proposal,
    ProposalState,
    Record,
    Source,
    TankkeeperError,
    dose_for_volume,
    dosing_within_tank,
    merge_record,
)
from .lights import (
    Control,
    Light,
    LightEvent,
    LightEventKind,
    OneDayChange,
    Schedule,
    add_summary as light_add_summary,
    cancel_one_day_summary,
    change_summary as light_change_summary,
    next_change,
    on_periods,
    one_day_summary,
    remove_summary as light_remove_summary,
    with_control,
)
from .plan import (
    PlanEvent,
    Reminders,
    Slot,
    Task,
    TaskStatus,
    add_summary,
    change_summary,
    format_time,
    import_tasks,
    parse_time,
    remove_summary,
    slot_for,
    sort_tasks,
)
from .rules import RuleSettings, Stage
from .service import Actor, TankkeeperService, Target

MCP_PLATFORM = "mcp_server"

PROMPT = """Tankkeeper holds the records of the owner's fish tank: the tank, water, products, \
contents, a log of doses and tests, notes, the history of every change and past conversations.
- Record doses, tests, new contents and notes as soon as the owner tells you about them.
- Every other change is a proposal. Call the change tool, read its summary and changes back to the \
owner, and call tankkeeper__apply_change with the confirm code only after the owner says yes. Never \
apply a change the owner has not seen.
- At the start of a conversation call tankkeeper__save_conversation with a title, and pass the \
conversation_id it returns to every other Tankkeeper tool. Before you finish, call it again with a \
summary and the key messages.
- Before you answer, search past conversations for what the owner already said.
- The plan is a list of tasks, each on a day in the task slot or the dose slot. When the owner says \
a task is done or skipped, call tankkeeper__complete_task or tankkeeper__skip_task straight away. Adding, \
changing and removing tasks, reminder settings and importing a plan are proposals.
- The integration switches the tank lights on their schedule. Adding, changing and removing a light, \
and a one-day change, are proposals made with tankkeeper__set_light. No tool switches a light directly.
- The status is the worst rule result: on course, watch or act. Each rule gives its reason and what to \
do. Read it with tankkeeper__get_status; tankkeeper__record_test returns it too. Change the limits with \
tankkeeper__set_rules and whether the tank is cycling with tankkeeper__set_tank.
- Decisions are numbered and keep their history. Adding, accepting and replacing a decision are proposals.
- Mark guesses as assumptions. Never invent a dose: use the product's label and the tank's records."""

READ = ToolAnnotations(read_only=True, destructive=False, idempotent=True, open_world=False)
RECORD = ToolAnnotations(destructive=False, open_world=False)
PROPOSE = ToolAnnotations(destructive=False, open_world=False)
APPLY = ToolAnnotations(open_world=False)

type Handler = Callable[[TankkeeperService, Record, Actor], Awaitable[JsonObjectType]]

NON_EMPTY = p.All(str, p.Length(min=1))
LIGHT_ONLY = frozenset({"get_light"})
LIGHT_HISTORY = 20
LIGHT_ACTIONS = ["add", "update", "remove", "one_day", "cancel_one_day"]
PLAN_DAYS = 7
IMPORT_DAYS_BEFORE = 7
IMPORT_DAYS_AFTER = 30
NOTIFY_DOMAIN = "notify"
POSITIVE = p.All(p.Coerce(float), p.Range(min=0, min_included=False))
NOT_NEGATIVE = p.All(p.Coerce(float), p.Range(min=0))
PH = p.All(p.Coerce(float), p.Range(min=0, max=14))
CONVERSATION: dict[p.Marker, object] = {
    p.Optional(
        "conversation_id", description="The id from tankkeeper__save_conversation for this conversation"
    ): NON_EMPTY
}
REASON: dict[p.Marker, object] = {
    p.Required("reason", description="Why this change, in a sentence the owner will read"): NON_EMPTY,
    p.Optional("evidence", description="The test, decision or note the change rests on"): NON_EMPTY,
}
LIMIT: dict[p.Marker, object] = {p.Optional("limit", default=20): p.All(int, p.Range(min=1, max=200))}
CONTENT_TYPES = ["plant", "rock", "wood", "substrate", "decoration", "fish", "other"]
DAYS = p.All(int, p.Range(min=0, max=365))
PPM = p.All(p.Coerce(float), p.Range(min=0, min_included=False))
RULE_FIELDS: dict[p.Marker, object] = {
    p.Optional("nitrogen_watch", description="Ammonia or nitrite above this, in ppm, is Watch"): PPM,
    p.Optional("nitrogen_act", description="Ammonia or nitrite above this, in ppm, is Act"): PPM,
    p.Optional("ph_watch", description="pH under this while cycling is Watch"): PH,
    p.Optional("ph_act", description="pH under this while cycling is Act"): PH,
    p.Optional("stall_watch_days", description="Days of the same ammonia and no nitrite that are Watch"): DAYS,
    p.Optional("stall_act_days", description="Days of the same ammonia and no nitrite that are Act"): DAYS,
    p.Optional("test_watch_days", description="Days a planned test is late for Watch"): p.All(
        int, p.Range(min=1, max=365)
    ),
    p.Optional("test_act_days", description="Days a planned test is late for Act"): p.All(int, p.Range(min=1, max=365)),
    p.Optional("skip_watch", description="Doses of one product skipped in a row for Watch"): p.All(
        int, p.Range(min=1, max=30)
    ),
    p.Optional("skip_act", description="Doses of one product skipped in a row for Act"): p.All(
        int, p.Range(min=1, max=30)
    ),
    p.Optional("plan_watch_days", description="Days left in the plan for Watch"): DAYS,
    p.Optional("plan_act_days", description="Days left in the plan for Act"): DAYS,
}
TEST_VALUES = ["ammonia", "nitrite", "nitrate", "ph", "kh", "gh", "phosphate", "temperature_c"]
TANK_FIELDS: dict[p.Marker, object] = {
    p.Optional("name"): NON_EMPTY,
    p.Optional("volume_litres", description="The volume of the tank, in litres"): POSITIVE,
    p.Optional(
        "dosing_volume_litres", description="The volume of water in the tank, in litres. Doses are worked out for it"
    ): POSITIVE,
    p.Optional("temperature_c", description="The target temperature"): NOT_NEGATIVE,
    p.Optional("notes", description="Notes for Claude, in the owner's words"): str,
    p.Optional("stage", description="cycling while the tank cycles, cycled after"): p.In(list(Stage)),
}
WATER_FIELDS: dict[p.Marker, object] = {
    p.Optional("source", description="Where the values come from"): p.In(["supplier", "tap_test"]),
    p.Optional("ph"): PH,
    p.Optional("gh", description="General hardness in dGH"): NOT_NEGATIVE,
    p.Optional("kh", description="Carbonate hardness in dKH"): NOT_NEGATIVE,
    p.Optional("nitrate", description="mg/l"): NOT_NEGATIVE,
    p.Optional("phosphate", description="mg/l"): NOT_NEGATIVE,
    p.Optional("notes"): str,
}
PRODUCT_FIELDS: dict[p.Marker, object] = {
    p.Optional("purpose", description="What the product is for"): NON_EMPTY,
    p.Optional("label_amount_ml", description="The label dose, in ml"): NOT_NEGATIVE,
    p.Optional("label_per_litres", description="The volume of water the label dose is for"): POSITIVE,
    p.Optional("label_frequency", description="How often the label says to dose"): NON_EMPTY,
    p.Optional("your_dose", description="The dose the owner uses, in their words"): str,
    p.Optional("notes", description="Notes for Claude, in the owner's words"): str,
    p.Optional("links"): [NON_EMPTY],
}
CONTENT_FIELDS: dict[p.Marker, object] = {
    p.Optional("type"): p.In(CONTENT_TYPES),
    p.Optional("name"): NON_EMPTY,
    p.Optional("count"): p.All(int, p.Range(min=0)),
    p.Optional("where", description="Where it sits in the tank"): str,
    p.Optional("added", description="ISO date it went in"): NON_EMPTY,
    p.Optional("notes", description="Notes for Claude, in the owner's words"): str,
}


@dataclass(frozen=True, slots=True, kw_only=True)
class Spec:
    """What a tool is called, what it takes and what it does."""

    name: str
    title: str
    description: str
    schema: dict[p.Marker, object]
    annotations: ToolAnnotations
    handler: Handler


class TankkeeperTool(Tool):
    """A Tankkeeper tool. It checks its arguments, then calls the service."""

    integration = DOMAIN

    def __init__(self, spec: Spec, service: TankkeeperService) -> None:
        """Make the tool from its spec."""
        self.name = f"{DOMAIN}__{spec.name}"
        self.title = spec.title
        self.description = spec.description
        self.parameters = p.Schema(spec.schema)
        self.annotations = spec.annotations
        self._handler = spec.handler
        self._service = service

    @override
    async def async_call(self, hass: HomeAssistant, tool_input: ToolInput, llm_context: LLMContext) -> ToolResult:
        """Run the tool. Problems come back as error results the assistant can explain."""
        try:
            data = cast(Record, self.parameters(tool_input.tool_args))
        except p.Invalid as err:
            return ToolResult(data={"error": "invalid_input", "message": str(err)}, error=True)
        actor = Actor(
            source=Source.MCP if llm_context.platform == MCP_PLATFORM else Source.ASSIST,
            user_id=None if llm_context.context is None else llm_context.context.user_id,
            conversation_id=_optional_str(data, "conversation_id"),
        )
        try:
            return ToolResult(data=await self._handler(self._service, data, actor))
        except TankkeeperError as err:
            return ToolResult(data={"error": err.key, "message": err.message}, error=True)


def build_tools(service: TankkeeperService) -> list[Tool]:
    """Every Tankkeeper tool, bound to one tank. get_light is only there when a light is set."""
    return [TankkeeperTool(spec, service) for spec in SPECS if spec.name not in LIGHT_ONLY or service.has_lights()]


async def get_tank(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """The tank, its water and how many records it has."""
    return {
        "tank": service.records(Collection.TANK).get(TANK_ID),
        "water": service.records(Collection.WATER).get(WATER_ID),
        "counts": {collection.value: len(service.records(collection)) for collection in Collection},
        "proposals_waiting": len(service.pending_proposals()),
    }


async def list_products(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Every product, with the label dose worked out for the tank."""
    tank = service.records(Collection.TANK).get(TANK_ID, {})
    volume = tank.get("dosing_volume_litres") or tank.get("volume_litres")
    products: list[JsonValue] = []
    for product_id, product in service.records(Collection.PRODUCTS).items():
        item: Record = {"id": product_id, **product}
        label = product.get("label_dose")
        if (
            isinstance(label, dict)
            and isinstance(volume, int | float)
            and isinstance(amount := label.get("amount_ml"), int | float)
            and isinstance(per := label.get("per_litres"), int | float)
        ):
            item["label_dose_for_tank_ml"] = dose_for_volume(amount, per, volume)
        products.append(item)
    return {"products": products, "dosing_volume_litres": volume}


async def list_contents(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """What is in the tank, and with include_removed what was taken out."""
    include_removed = data["include_removed"] is True
    return {
        "contents": [
            {"id": content_id, **content}
            for content_id, content in service.records(Collection.CONTENTS).items()
            if include_removed or content.get("removed") is None
        ]
    }


async def get_log(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Doses and tests, newest first."""
    kind = data["kind"]
    since = _optional_moment(data, "since")
    until = _optional_moment(data, "until")
    entries = sorted(
        (
            {"id": entry_id, **entry}
            for entry_id, entry in service.records(Collection.LOG).items()
            if kind in ("all", entry.get("kind"))
        ),
        key=lambda entry: str(entry["time"]),
        reverse=True,
    )
    picked = [
        entry
        for entry in entries
        if (since is None or _moment(str(entry["time"])) >= since)
        and (until is None or _moment(str(entry["time"])) <= until)
    ]
    return {"entries": cast(list[JsonValue], picked[: _int(data, "limit")])}


async def list_notes(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Open questions and assumptions."""
    return {"notes": [{"id": note_id, **note} for note_id, note in service.records(Collection.NOTES).items()]}


async def list_proposals(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Proposals, newest first, without their confirm codes."""
    state = data["state"]
    proposals = [proposal for proposal in service.state.proposals.values() if state in ("all", proposal.state.value)]
    proposals.sort(key=lambda proposal: proposal.created, reverse=True)
    return {"proposals": [_proposal_json(proposal) for proposal in proposals[: _int(data, "limit")]]}


async def get_history(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """The newest changes, optionally for one collection or record."""
    collection = _optional_str(data, "collection")
    entries = service.history(
        None if collection is None else Collection(collection), _optional_str(data, "record_id"), _int(data, "limit")
    )
    return {"history": [_history_json(entry) for entry in entries]}


async def list_conversations(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """The newest conversations, without their messages."""
    return {"conversations": [_conversation_summary(item) for item in service.conversations(_int(data, "limit"))]}


async def get_conversation(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """A conversation, its messages and the changes made in it."""
    conversation, changes = service.conversation(_str(data, "id"))
    return {
        **_conversation_summary(conversation),
        "messages": [message.to_json() for message in conversation.messages],
        "changes": [_history_json(entry) for entry in changes],
    }


async def search_conversations(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Conversations that mention the query."""
    found = service.search_conversations(_str(data, "query"), _int(data, "limit"))
    return {"conversations": [_conversation_summary(item) for item in found]}


async def record_dose(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Add a dose to the log."""
    product_id, product = _find_product(service, _str(data, "product"))
    entry: Record = {
        "kind": "dose",
        "time": _time_or_now(data),
        "product_id": product_id,
        "product": product.get("name"),
        "amount_ml": data["amount_ml"],
        "why": data.get("why"),
        "notes": data.get("notes"),
    }
    return _recorded(await service.async_record(Collection.LOG, entry, actor, f"Dose: {product.get('name')}"))


async def record_test(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Add a water test to the log."""
    values = cast(Record, data["values"])
    if not values:
        raise InvalidInputError("A test needs at least one value")
    entry: Record = {
        "kind": "test",
        "time": _time_or_now(data),
        "source": data["source"],
        "values": values,
        "notes": data.get("notes"),
    }
    recorded = _recorded(await service.async_record(Collection.LOG, entry, actor, f"Test ({data['source']})"))
    return {**recorded, "status": service.status().to_json()}


async def add_content(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Add a plant, rock or anything else that went into the tank."""
    content: Record = {
        "type": data["type"],
        "name": data["name"],
        "count": data.get("count"),
        "where": data.get("where", ""),
        "added": _date_or_today(data, "added"),
        "removed": None,
        "notes": data.get("notes", ""),
    }
    return _recorded(await service.async_record(Collection.CONTENTS, content, actor, f"Added {data['name']}"))


async def add_note(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Add an open question or an assumption."""
    note: Record = {
        "kind": data["kind"],
        "topic": data["topic"],
        "text": data["text"],
        "how_to_resolve": data.get("how_to_resolve"),
    }
    return _recorded(await service.async_record(Collection.NOTES, note, actor, f"Note: {data['topic']}"))


async def save_conversation(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Start a conversation, or add a summary and messages to it."""
    messages = [Message.from_json(cast(Record, item)) for item in cast(list[JsonValue], data["messages"])]
    conversation = await service.async_save_conversation(
        actor.conversation_id,
        actor,
        title=_optional_str(data, "title"),
        summary=_optional_str(data, "summary"),
        messages=messages,
    )
    return {"conversation_id": conversation.id, "messages": len(conversation.messages)}


async def set_tank(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose new tank details."""
    current = service.records(Collection.TANK).get(TANK_ID, {})
    tank = merge_record(current, _fields(data, TANK_FIELDS))
    if not dosing_within_tank(tank):
        raise InvalidInputError("The volume of water can't be larger than the volume of the tank")
    return await _propose(
        service,
        data,
        actor,
        tool="set_tank",
        summary="Change the tank details",
        targets=[(Collection.TANK, TANK_ID, tank)],
    )


async def set_water(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose new tap water values."""
    current = service.records(Collection.WATER).get(WATER_ID, {})
    updates = _fields(data, WATER_FIELDS)
    return await _propose(
        service,
        data,
        actor,
        tool="set_water",
        summary="Change the water values",
        targets=[(Collection.WATER, WATER_ID, merge_record(current, updates))],
    )


async def add_product(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose a new product."""
    product: Record = {
        "name": data["name"],
        "purpose": "",
        "label_dose": None,
        "your_dose": "",
        "notes": "",
        "links": [],
    }
    product = _product_with(product, data)
    return await _propose(
        service,
        data,
        actor,
        tool="add_product",
        summary=f"Add the product {data['name']}",
        targets=[(Collection.PRODUCTS, ulid_now(), product)],
    )


async def update_product(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose changes to a product."""
    product_id = _str(data, "product_id")
    current = service.state.require(Collection.PRODUCTS, product_id)
    product = _product_with(merge_record(current, _fields(data, {p.Optional("name"): NON_EMPTY})), data)
    return await _propose(
        service,
        data,
        actor,
        tool="update_product",
        summary=f"Change the product {product.get('name')}",
        targets=[(Collection.PRODUCTS, product_id, product)],
    )


async def update_content(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose changes to a contents item."""
    content_id = _str(data, "content_id")
    current = service.state.require(Collection.CONTENTS, content_id)
    updates = _fields(data, CONTENT_FIELDS)
    if "added" in updates:
        updates["added"] = _date_or_today(updates, "added")
    content = merge_record(current, updates)
    return await _propose(
        service,
        data,
        actor,
        tool="update_content",
        summary=f"Change {content.get('name')}",
        targets=[(Collection.CONTENTS, content_id, content)],
    )


async def remove_content(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose taking an item out. It stays in the records with the date it went."""
    content_id = _str(data, "content_id")
    current = service.state.require(Collection.CONTENTS, content_id)
    content = merge_record(current, {"removed": _date_or_today(data, "removed")})
    return await _propose(
        service,
        data,
        actor,
        tool="remove_content",
        summary=f"Remove {current.get('name')}",
        targets=[(Collection.CONTENTS, content_id, content)],
    )


async def undo_change(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose putting back what an earlier change did."""
    proposal = await service.async_propose_undo(_str(data, "history_id"), actor, _str(data, "reason"))
    return _proposal_json(proposal, with_code=True)


async def apply_change(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Apply a proposal the owner said yes to."""
    entry = await service.async_apply(_str(data, "proposal_id"), _str(data, "code"), actor)
    return {"applied": True, "history": _history_json(entry)}


async def reject_change(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Close a proposal the owner said no to."""
    proposal = await service.async_reject(_str(data, "proposal_id"), actor)
    return {"rejected": True, "proposal": _proposal_json(proposal)}


async def get_plan(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Tasks from start to end, by day and slot time, and the reminder settings."""
    start = _day(data, "start", dt_util.now().date())
    end = _day(data, "end", start + timedelta(days=PLAN_DAYS - 1))
    _check_range(start, end)
    reminders_on = service.reminders_on
    tasks = sort_tasks((task for task in service.tasks() if start <= task.day <= end), reminders_on)
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "tasks": [_task_json(task, reminders_on(task.day)) for task in tasks],
        "reminders": service.reminders().to_json(),
    }


async def add_task(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose a new task. The slot defaults to dose for a product and amount in ml."""
    text = _str(data, "text").strip()
    slot = _optional_str(data, "slot")
    task = Task(
        id=ulid_now(),
        day=_day(data, "date", dt_util.now().date()),
        slot=slot_for(text, service.product_names()) if slot is None else Slot(slot),
        text=text,
        note=_optional_str(data, "note") or "",
    )
    return await _propose(
        service, data, actor, tool="add_task", summary=add_summary(task), targets=[_task_target(task)]
    )


async def update_task(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose changes to a task."""
    current = service.task(_str(data, "task_id"))
    slot = _optional_str(data, "slot")
    state = _optional_str(data, "state")
    text = _optional_str(data, "text")
    task = current.edit(
        now=service.now(),
        text=None if text is None else text.strip(),
        day=None if "date" not in data else _day(data, "date", current.day),
        slot=None if slot is None else Slot(slot),
        status=None if state is None else TaskStatus(state),
        note=_optional_str(data, "note"),
    )
    return await _propose(
        service, data, actor, tool="update_task", summary=change_summary(task), targets=[_task_target(task)]
    )


async def remove_task(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose taking a task out of the plan."""
    task = service.task(_str(data, "task_id"))
    return await _propose(
        service,
        data,
        actor,
        tool="remove_task",
        summary=remove_summary(task),
        targets=[(Collection.TASKS, task.id, None)],
    )


async def complete_task(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Mark a task complete, straight away."""
    return _recorded(
        await service.async_finish_task(_str(data, "task_id"), TaskStatus.COMPLETE, _optional_str(data, "note"), actor)
    )


async def skip_task(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Mark a task skipped, straight away."""
    return _recorded(
        await service.async_finish_task(_str(data, "task_id"), TaskStatus.SKIP, _optional_str(data, "note"), actor)
    )


async def set_reminders(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose new reminder devices or times."""
    current = service.reminders()
    reminders = Reminders(
        notify=_notify_services(service, data, "notify", current.notify),
        status_notify=_notify_services(service, data, "status_notify", current.status_notify),
        task_time=_time(data, "task_time", current.task_time),
        dose_time=_time(data, "dose_time", current.dose_time),
        resend_time=_time(data, "resend_time", current.resend_time),
    )
    return await _propose(
        service,
        data,
        actor,
        tool="set_reminders",
        summary="Change the reminders",
        targets=service.reminder_targets(reminders),
    )


async def get_status(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """The status, each rule's result, the rule limits and whether the tank is cycling."""
    stage = service.stage()
    return {
        **service.status().to_json(),
        "stage": None if stage is None else stage.value,
        "settings": service.rule_settings().to_json(),
    }


async def set_rules(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose new rule limits."""
    current = service.rule_settings().to_json()
    settings = RuleSettings.from_json(merge_record(current, _fields(data, RULE_FIELDS)))
    return await _propose(
        service,
        data,
        actor,
        tool="set_rules",
        summary="Change the rule limits",
        targets=service.rule_targets(settings),
    )


async def import_plan(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose importing tasks from another calendar, keeping Complete: and Skip:."""
    calendar = _str(data, "calendar")
    if not calendar.startswith("calendar.") or service.hass.states.get(calendar) is None:
        raise InvalidInputError(f"No calendar {calendar}")
    today = dt_util.now().date()
    start = _day(data, "start", today - timedelta(days=IMPORT_DAYS_BEFORE))
    end = _day(data, "end", today + timedelta(days=IMPORT_DAYS_AFTER))
    _check_range(start, end)
    response = await service.hass.services.async_call(
        "calendar",
        "get_events",
        {"start_date_time": _local_midnight(start), "end_date_time": _local_midnight(end + timedelta(days=1))},
        target={"entity_id": calendar},
        blocking=True,
        return_response=True,
    )
    events = [
        PlanEvent(
            day=_event_day(str(event["start"])),
            summary=str(event.get("summary") or ""),
            description=str(event.get("description") or ""),
        )
        for event in cast(list[dict[str, object]], cast(dict[str, object], (response or {})[calendar])["events"])
    ]
    products = data.get("dose_products")
    names = [str(name) for name in cast(list[JsonValue], products)] if products is not None else service.product_names()
    tasks = import_tasks(service.tasks(), events, names, ulid_now)
    return await _propose(
        service,
        data,
        actor,
        tool="import_plan",
        summary=f"Import {len(tasks)} tasks from {calendar}",
        targets=[_task_target(task) for task in tasks],
    )


async def get_light(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """The lights, today's schedule, the on/off log and the changes missed or made late."""
    light_id = _optional_str(data, "light_id")
    lights = service.active_lights() if light_id is None else [service.light(light_id)]
    now = dt_util.now()
    since = service.now() - timedelta(days=_int(data, "days"))
    log = service.light_log()
    change = next_change(service.active_lights(), now)
    return {
        "today": now.date().isoformat(),
        "dose_time": format_time(service.reminders_on(now.date()).dose_time),
        "lights": [_light_json(service, light, log, since) for light in lights],
        "next_change": None
        if change is None
        else {
            "time": change.time.isoformat(),
            "on": [light.id for light in change.on],
            "off": [light.id for light in change.off],
        },
    }


async def set_light(service: TankkeeperService, data: Record, actor: Actor) -> JsonObjectType:
    """Propose adding, changing or removing a light, or a change for one day."""
    light, summary = planned_light(service, data)
    return await _propose(service, data, actor, tool="set_light", summary=summary, targets=service.light_targets(light))


def planned_light(service: TankkeeperService, data: Record) -> tuple[Light, str]:
    """The light after a set_light action, and the summary of the change. The options flow uses it too."""
    action = _str(data, "action")
    if action == "add":
        light = _new_light(data)
        return light, light_add_summary(light)
    light_id = _optional_str(data, "light_id")
    if light_id is None:
        raise InvalidInputError(f"{action} needs the light_id")
    return _changed_light(service.light(light_id), action, data)


def _new_light(data: Record) -> Light:
    missing = [key for key in ("entity_id", "model", "on", "off") if key not in data]
    if missing:
        raise InvalidInputError(f"A new light needs {', '.join(missing)}")
    control = Control(_optional_str(data, "control") or Control.ON_OFF)
    schedule = Schedule(on=_time(data, "on", time()), off=_time(data, "off", time()))
    return Light(
        id=ulid_now(),
        entity_id=_str(data, "entity_id"),
        model=_str(data, "model"),
        control=control,
        schedule=_schedule_with(schedule, data),
        added=dt_util.now().date(),
    )


def _changed_light(current: Light, action: str, data: Record) -> tuple[Light, str]:
    today = dt_util.now().date()
    if action == "remove":
        return replace(current, removed=today), light_remove_summary(current)
    if action == "cancel_one_day":
        if current.one_day is None:
            raise NothingToChangeError(f"{current.model} has no one-day change")
        return replace(current, one_day=None), cancel_one_day_summary(current)
    if action == "one_day":
        day = _day(data, "date", today)
        if day < today:
            raise InvalidInputError("A one-day change is for today or a later day")
        brightness = data.get("brightness_pct")
        change = OneDayChange(
            day=day,
            on=_time(data, "on", current.schedule.on),
            off=_time(data, "off", current.schedule.off),
            brightness_pct=brightness if isinstance(brightness, int) else None,
        )
        return replace(current, one_day=change), one_day_summary(current, change)
    control = Control(_optional_str(data, "control") or current.control)
    light = replace(
        current,
        entity_id=_optional_str(data, "entity_id") or current.entity_id,
        model=_optional_str(data, "model") or current.model,
        control=control,
        schedule=_schedule_with(with_control(current.schedule, control), data),
    )
    return light, light_change_summary(light)


def _schedule_with(schedule: Schedule, data: Record) -> Schedule:
    brightness = data.get("brightness_pct", schedule.brightness_pct)
    return replace(
        schedule,
        on=_time(data, "on", schedule.on),
        off=_time(data, "off", schedule.off),
        brightness_pct=brightness if isinstance(brightness, int) else None,
        ramp_minutes=_int(data, "ramp_minutes") if "ramp_minutes" in data else schedule.ramp_minutes,
        rgb_color=_rgb(data["rgb_color"]) if "rgb_color" in data else schedule.rgb_color,
    )


def _rgb(value: JsonValue) -> tuple[int, int, int] | None:
    if not isinstance(value, list):
        return None
    red, green, blue = (cast(int, part) for part in value)
    return red, green, blue


def _light_json(service: TankkeeperService, light: Light, log: list[LightEvent], since: datetime) -> JsonObjectType:
    today = dt_util.now().date()
    schedule = light.schedule_on(today)
    state = service.hass.states.get(light.entity_id)
    status = service.light_status(light.id)
    events = [event for event in log if event.light_id == light.id and event.time >= since]
    return {
        "id": light.id,
        **light.to_record(),
        "today": OneDayChange(
            day=today, on=schedule.on, off=schedule.off, brightness_pct=schedule.brightness_pct
        ).to_json(),
        "state": None if state is None else state.state,
        "problem": status.problem,
        "status": status.to_json(),
        "history": [
            {**_history_json(entry), "reason": service.reason_for(entry)}
            for entry in service.history(Collection.LIGHTS, light.id, LIGHT_HISTORY)
        ],
        "log": [event.to_json() for event in events],
        "missed_or_late": [
            event.to_json() for event in events if event.kind in (LightEventKind.MISSED, LightEventKind.LATE)
        ],
        "on_periods": [
            [start.isoformat(), end.isoformat()] for start, end in on_periods(log, light.id, since, service.now())
        ],
    }


async def _propose(
    service: TankkeeperService, data: Record, actor: Actor, *, tool: str, summary: str, targets: list[Target]
) -> JsonObjectType:
    proposal = await service.async_propose(
        targets,
        actor,
        tool=tool,
        summary=summary,
        reason=_str(data, "reason"),
        evidence=_optional_str(data, "evidence"),
    )
    return _proposal_json(proposal, with_code=True)


def _task_target(task: Task) -> Target:
    return (Collection.TASKS, task.id, task.to_record())


def _task_json(task: Task, reminders: Reminders) -> JsonObjectType:
    record = task.to_record()
    return {
        "id": task.id,
        "date": record["date"],
        "slot": record["slot"],
        "time": reminders.to_json()[f"{task.slot.value}_time"],
        "text": record["text"],
        "state": record["state"],
        "note": record["note"],
        "done_at": record["done_at"],
    }


def _day(data: Record, key: str, default: date) -> date:
    value = _optional_str(data, key)
    if value is None:
        return default
    day = dt_util.parse_date(value)
    if day is None:
        raise InvalidInputError(f"{value} is not an ISO date")
    return day


def _check_range(start: date, end: date) -> None:
    if start > end:
        raise InvalidInputError("The start must not be after the end")


def _time(data: Record, key: str, default: time) -> time:
    value = _optional_str(data, key)
    if value is None:
        return default
    try:
        return parse_time(value)
    except ValueError as err:
        raise InvalidInputError(str(err)) from None


def _notify_services(service: TankkeeperService, data: Record, key: str, default: tuple[str, ...]) -> tuple[str, ...]:
    if key not in data:
        return default
    return tuple(_notify_service(service, str(name)) for name in cast(list[JsonValue], data[key]))


def _notify_service(service: TankkeeperService, name: str) -> str:
    action = name.removeprefix(f"{NOTIFY_DOMAIN}.")
    if not service.hass.services.has_service(NOTIFY_DOMAIN, action):
        raise InvalidInputError(f"No notify service {action}")
    return action


def _local_midnight(day: date) -> str:
    return datetime.combine(day, time(), dt_util.get_default_time_zone()).isoformat()


def _event_day(start: str) -> date:
    """The local day of an event start. An all-day start has no time and is read as local midnight."""
    return dt_util.as_local(dt_util.parse_datetime(start, raise_on_error=True)).date()


def _product_with(product: Record, data: Record) -> Record:
    updates = _fields(data, {key: value for key, value in PRODUCT_FIELDS.items() if not str(key).startswith("label")})
    label_updates = {
        str(key).removeprefix("label_"): data[str(key)]
        for key in ("label_amount_ml", "label_per_litres", "label_frequency")
        if str(key) in data
    }
    result = merge_record(product, updates)
    if label_updates:
        current = product.get("label_dose")
        label = merge_record(current if isinstance(current, dict) else {}, label_updates)
        if not isinstance(label.get("amount_ml"), int | float) or not isinstance(label.get("per_litres"), int | float):
            raise InvalidInputError("A label dose needs label_amount_ml and label_per_litres")
        result["label_dose"] = label
    return result


def _find_product(service: TankkeeperService, product: str) -> tuple[str, Record]:
    products = service.records(Collection.PRODUCTS)
    if product in products:
        return product, products[product]
    matches = [
        (pid, item) for pid, item in products.items() if str(item.get("name", "")).casefold() == product.casefold()
    ]
    if len(matches) != 1:
        raise InvalidInputError(f"No single product called {product}. Use list_products for the ids")
    return matches[0]


def _fields(data: Record, schema: dict[p.Marker, object]) -> Record:
    return {str(key): data[str(key)] for key in schema if str(key) in data}


def _recorded(entry: HistoryEntry) -> JsonObjectType:
    return {"recorded": True, "record_id": entry.changes[0].record_id, "history_id": entry.id}


def _change_json(change: Change) -> JsonObjectType:
    return {
        "collection": change.collection.value,
        "record_id": change.record_id,
        "before": change.before,
        "after": change.after,
    }


def _history_json(entry: HistoryEntry) -> JsonObjectType:
    return {
        "id": entry.id,
        "time": entry.time.isoformat(),
        "source": entry.source.value,
        "conversation_id": entry.conversation_id,
        "summary": entry.summary,
        "proposal_id": entry.proposal_id,
        "changes": [_change_json(change) for change in entry.changes],
    }


def _proposal_json(proposal: Proposal, *, with_code: bool = False) -> JsonObjectType:
    result: JsonObjectType = {
        "proposal_id": proposal.id,
        "state": proposal.state.value,
        "created": proposal.created.isoformat(),
        "source": proposal.source.value,
        "conversation_id": proposal.conversation_id,
        "tool": proposal.tool,
        "summary": proposal.summary,
        "reason": proposal.reason,
        "evidence": proposal.evidence,
        "changes": [_change_json(change) for change in proposal.changes],
    }
    if with_code and proposal.state is ProposalState.PENDING:
        result["code"] = proposal.code
        result["code_expires"] = proposal.code_expires().isoformat()
        result["next_step"] = (
            "Read the changes back to the owner. Call tankkeeper__apply_change with the code only after they say yes."
        )
    return result


def _conversation_summary(conversation: Conversation) -> JsonObjectType:
    return {
        "id": conversation.id,
        "source": conversation.source.value,
        "started": conversation.started.isoformat(),
        "updated": conversation.updated.isoformat(),
        "title": conversation.title,
        "summary": conversation.summary,
    }


def _str(data: Record, key: str) -> str:
    return cast(str, data[key])


def _optional_str(data: Record, key: str) -> str | None:
    return cast(str | None, data.get(key))


def _int(data: Record, key: str) -> int:
    return cast(int, data[key])


def _moment(value: str) -> datetime:
    parsed = dt_util.parse_datetime(value)
    if parsed is None:
        raise InvalidInputError(f"{value} is not an ISO date or time")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt_util.get_default_time_zone())
    return dt_util.as_utc(parsed)


def _optional_moment(data: Record, key: str) -> datetime | None:
    value = _optional_str(data, key)
    return None if value is None else _moment(value)


def _time_or_now(data: Record) -> str:
    value = _optional_str(data, "time")
    return (dt_util.utcnow() if value is None else _moment(value)).isoformat()


def _date_or_today(data: Record, key: str) -> str:
    value = _optional_str(data, key)
    if value is None:
        return dt_util.now().date().isoformat()
    day = dt_util.parse_date(value)
    if day is None:
        raise InvalidInputError(f"{value} is not an ISO date")
    return date.isoformat(day)


SPECS: tuple[Spec, ...] = (
    Spec(
        name="get_tank",
        title="Get the tank",
        annotations=READ,
        handler=get_tank,
        description="The tank's details, the water values, how many records there are and how many proposals wait.",
        schema={},
    ),
    Spec(
        name="list_products",
        title="List products",
        annotations=READ,
        handler=list_products,
        description="Every product with its label dose, the owner's dose, notes, and the label dose worked out for "
        "the volume of water in the tank.",
        schema={},
    ),
    Spec(
        name="list_contents",
        title="List contents",
        annotations=READ,
        handler=list_contents,
        description="Plants, rocks, wood, substrate, decorations and fish in the tank.",
        schema={p.Optional("include_removed", default=False): bool},
    ),
    Spec(
        name="get_log",
        title="Get the log",
        annotations=READ,
        handler=get_log,
        description="Doses and water tests, newest first. since and until are ISO dates or times.",
        schema={
            p.Optional("kind", default="all"): p.In(["all", "dose", "test"]),
            p.Optional("since"): NON_EMPTY,
            p.Optional("until"): NON_EMPTY,
            p.Optional("limit", default=50): p.All(int, p.Range(min=1, max=500)),
        },
    ),
    Spec(
        name="list_notes",
        title="List notes",
        annotations=READ,
        handler=list_notes,
        description="Open questions and assumptions about the tank.",
        schema={},
    ),
    Spec(
        name="list_proposals",
        title="List proposals",
        annotations=READ,
        handler=list_proposals,
        description="Proposed changes, newest first. Confirm codes are only given to the conversation that made "
        "the proposal.",
        schema={p.Optional("state", default="pending"): p.In(["all", *ProposalState]), **LIMIT},
    ),
    Spec(
        name="get_history",
        title="Get the history",
        annotations=READ,
        handler=get_history,
        description="The newest changes to the records, with the record before and after, who made each change "
        "and in which conversation. Use a history id with tankkeeper__undo_change.",
        schema={p.Optional("collection"): p.In(list(Collection)), p.Optional("record_id"): NON_EMPTY, **LIMIT},
    ),
    Spec(
        name="list_conversations",
        title="List conversations",
        annotations=READ,
        handler=list_conversations,
        description="Past conversations about the tank, newest first.",
        schema={**LIMIT},
    ),
    Spec(
        name="get_conversation",
        title="Get a conversation",
        annotations=READ,
        handler=get_conversation,
        description="A past conversation, its key messages and the changes made in it.",
        schema={p.Required("id"): NON_EMPTY},
    ),
    Spec(
        name="search_conversations",
        title="Search conversations",
        annotations=READ,
        handler=search_conversations,
        description="Find past conversations that mention some words, newest first.",
        schema={p.Required("query"): NON_EMPTY, p.Optional("limit", default=10): p.All(int, p.Range(min=1, max=50))},
    ),
    Spec(
        name="record_dose",
        title="Record a dose",
        annotations=RECORD,
        handler=record_dose,
        description="Record a dose the owner gave, straight away.",
        schema={
            p.Required("product", description="The product id or exact name"): NON_EMPTY,
            p.Required("amount_ml"): POSITIVE,
            p.Optional("time", description="ISO time of the dose. Defaults to now"): NON_EMPTY,
            p.Optional("why"): str,
            p.Optional("notes"): str,
            **CONVERSATION,
        },
    ),
    Spec(
        name="record_test",
        title="Record a test",
        annotations=RECORD,
        handler=record_test,
        description="Record water test results, straight away. ammonia, nitrite, nitrate and phosphate are in "
        "mg/l (ppm), kh in dKH, gh in dGH.",
        schema={
            p.Required("values"): {p.Optional(name): NOT_NEGATIVE for name in TEST_VALUES} | {p.Optional("ph"): PH},
            p.Optional("source", default="tank"): p.In(["tank", "tap"]),
            p.Optional("time", description="ISO time of the test. Defaults to now"): NON_EMPTY,
            p.Optional("notes"): str,
            **CONVERSATION,
        },
    ),
    Spec(
        name="add_content",
        title="Add contents",
        annotations=RECORD,
        handler=add_content,
        description="Record something the owner put in the tank, straight away.",
        schema={
            p.Required("type"): p.In(CONTENT_TYPES),
            p.Required("name"): NON_EMPTY,
            **{key: value for key, value in CONTENT_FIELDS.items() if str(key) not in ("type", "name")},
            **CONVERSATION,
        },
    ),
    Spec(
        name="add_note",
        title="Add a note",
        annotations=RECORD,
        handler=add_note,
        description="Record an open question or an assumption, straight away.",
        schema={
            p.Required("kind"): p.In(["question", "assumption"]),
            p.Required("topic"): NON_EMPTY,
            p.Required("text"): NON_EMPTY,
            p.Optional("how_to_resolve"): str,
            **CONVERSATION,
        },
    ),
    Spec(
        name="save_conversation",
        title="Save the conversation",
        annotations=RECORD,
        handler=save_conversation,
        description="Without conversation_id, start a conversation and get its id. With it, update the title or "
        "summary and add messages.",
        schema={
            p.Optional("title"): p.All(NON_EMPTY, p.Length(max=200)),
            p.Optional("summary"): p.All(str, p.Length(max=4000)),
            p.Optional("messages", default=list, description="Up to 20 key messages, not the whole transcript"): p.All(
                [
                    {
                        p.Required("role"): p.In(["user", "assistant"]),
                        p.Required("text"): p.All(NON_EMPTY, p.Length(max=2000)),
                    }
                ],
                p.Length(max=20),
            ),
            **CONVERSATION,
        },
    ),
    Spec(
        name="set_tank",
        title="Propose tank details",
        annotations=PROPOSE,
        handler=set_tank,
        description="Propose new tank details. Returns a confirm code; nothing changes until tankkeeper__apply_change.",
        schema={**TANK_FIELDS, **REASON, **CONVERSATION},
    ),
    Spec(
        name="set_water",
        title="Propose water values",
        annotations=PROPOSE,
        handler=set_water,
        description="Propose new tap water values. Returns a confirm code; nothing changes until "
        "tankkeeper__apply_change.",
        schema={**WATER_FIELDS, **REASON, **CONVERSATION},
    ),
    Spec(
        name="add_product",
        title="Propose a product",
        annotations=PROPOSE,
        handler=add_product,
        description="Propose a new product. A label dose needs label_amount_ml and label_per_litres. Returns a "
        "confirm code; nothing changes until tankkeeper__apply_change.",
        schema={p.Required("name"): NON_EMPTY, **PRODUCT_FIELDS, **REASON, **CONVERSATION},
    ),
    Spec(
        name="update_product",
        title="Propose product changes",
        annotations=PROPOSE,
        handler=update_product,
        description="Propose changes to a product. Returns a confirm code; nothing changes until "
        "tankkeeper__apply_change.",
        schema={
            p.Required("product_id"): NON_EMPTY,
            p.Optional("name"): NON_EMPTY,
            **PRODUCT_FIELDS,
            **REASON,
            **CONVERSATION,
        },
    ),
    Spec(
        name="update_content",
        title="Propose contents changes",
        annotations=PROPOSE,
        handler=update_content,
        description="Propose changes to a contents item, such as a new count. Returns a confirm code; nothing "
        "changes until tankkeeper__apply_change.",
        schema={p.Required("content_id"): NON_EMPTY, **CONTENT_FIELDS, **REASON, **CONVERSATION},
    ),
    Spec(
        name="remove_content",
        title="Propose removing contents",
        annotations=PROPOSE,
        handler=remove_content,
        description="Propose taking an item out of the tank. It stays in the records with the date it went. "
        "Returns a confirm code; nothing changes until tankkeeper__apply_change.",
        schema={
            p.Required("content_id"): NON_EMPTY,
            p.Optional("removed", description="ISO date it came out. Defaults to today"): NON_EMPTY,
            **REASON,
            **CONVERSATION,
        },
    ),
    Spec(
        name="undo_change",
        title="Propose an undo",
        annotations=PROPOSE,
        handler=undo_change,
        description="Propose putting back what an earlier change did, by its history id. Returns a confirm code; "
        "nothing changes until tankkeeper__apply_change.",
        schema={
            p.Required("history_id"): NON_EMPTY,
            p.Required("reason", description="Why undo it, in a sentence the owner will read"): NON_EMPTY,
            **CONVERSATION,
        },
    ),
    Spec(
        name="apply_change",
        title="Apply a change",
        annotations=APPLY,
        handler=apply_change,
        description="Apply a proposal after the owner said yes to it in this conversation. Needs the proposal's "
        "confirm code.",
        schema={p.Required("proposal_id"): NON_EMPTY, p.Required("code"): NON_EMPTY, **CONVERSATION},
    ),
    Spec(
        name="reject_change",
        title="Reject a change",
        annotations=PROPOSE,
        handler=reject_change,
        description="Close a proposal the owner said no to.",
        schema={p.Required("proposal_id"): NON_EMPTY, **CONVERSATION},
    ),
    Spec(
        name="get_plan",
        title="Get the plan",
        annotations=READ,
        handler=get_plan,
        description="Tasks from start to end, by day and slot time, with their state and note, and the reminder "
        "settings. start defaults to today and end to six days later.",
        schema={
            p.Optional("start", description="ISO date"): NON_EMPTY,
            p.Optional("end", description="ISO date"): NON_EMPTY,
        },
    ),
    Spec(
        name="complete_task",
        title="Complete a task",
        annotations=RECORD,
        handler=complete_task,
        description="Mark a task complete, straight away, with an optional note.",
        schema={p.Required("task_id"): NON_EMPTY, p.Optional("note"): str, **CONVERSATION},
    ),
    Spec(
        name="skip_task",
        title="Skip a task",
        annotations=RECORD,
        handler=skip_task,
        description="Mark a task skipped, straight away, with an optional note on why.",
        schema={p.Required("task_id"): NON_EMPTY, p.Optional("note"): str, **CONVERSATION},
    ),
    Spec(
        name="add_task",
        title="Propose a task",
        annotations=PROPOSE,
        handler=add_task,
        description="Propose a task on a day. The slot defaults to dose for a product name and an amount in ml, "
        "such as Bio-CO2 1.5 ml, and to task for anything else. Returns a confirm code; nothing changes until "
        "tankkeeper__apply_change.",
        schema={
            p.Required("text"): NON_EMPTY,
            p.Optional("date", description="ISO date. Defaults to today"): NON_EMPTY,
            p.Optional("slot"): p.In(list(Slot)),
            p.Optional("note"): str,
            **REASON,
            **CONVERSATION,
        },
    ),
    Spec(
        name="update_task",
        title="Propose task changes",
        annotations=PROPOSE,
        handler=update_task,
        description="Propose changes to a task, such as a new day, text or state. Returns a confirm code; nothing "
        "changes until tankkeeper__apply_change.",
        schema={
            p.Required("task_id"): NON_EMPTY,
            p.Optional("text"): NON_EMPTY,
            p.Optional("date", description="ISO date"): NON_EMPTY,
            p.Optional("slot"): p.In(list(Slot)),
            p.Optional("state"): p.In(list(TaskStatus)),
            p.Optional("note"): str,
            **REASON,
            **CONVERSATION,
        },
    ),
    Spec(
        name="remove_task",
        title="Propose removing a task",
        annotations=PROPOSE,
        handler=remove_task,
        description="Propose taking a task out of the plan. Returns a confirm code; nothing changes until "
        "tankkeeper__apply_change.",
        schema={p.Required("task_id"): NON_EMPTY, **REASON, **CONVERSATION},
    ),
    Spec(
        name="set_reminders",
        title="Propose reminder settings",
        annotations=PROPOSE,
        handler=set_reminders,
        description="Propose which notify services get reminders and status alerts, and the reminder times, in "
        "HH:MM: task_time for tasks, dose_time for doses and resend_time to send open tasks again. Returns a confirm "
        "code; nothing changes until tankkeeper__apply_change.",
        schema={
            p.Optional("notify", description="Notify services for reminders, such as mobile_app_phone"): [NON_EMPTY],
            p.Optional("status_notify", description="Notify services that get an alert when the status changes"): [
                NON_EMPTY
            ],
            p.Optional("task_time"): NON_EMPTY,
            p.Optional("dose_time"): NON_EMPTY,
            p.Optional("resend_time"): NON_EMPTY,
            **REASON,
            **CONVERSATION,
        },
    ),
    Spec(
        name="get_status",
        title="Get the status",
        annotations=READ,
        handler=get_status,
        description="The status, the worst rule result: on_course, watch or act. Each rule that has the data it "
        "needs gives its level, its reason and what to do. Also the rule limits and whether the tank is cycling. "
        "Tap tests never count.",
        schema={},
    ),
    Spec(
        name="set_rules",
        title="Propose rule limits",
        annotations=PROPOSE,
        handler=set_rules,
        description="Propose new limits for the rules. Each Act limit must be at least as strict as its Watch "
        "limit. Returns a confirm code; nothing changes until tankkeeper__apply_change.",
        schema={**RULE_FIELDS, **REASON, **CONVERSATION},
    ),
    Spec(
        name="import_plan",
        title="Propose importing a plan",
        annotations=PROPOSE,
        handler=import_plan,
        description="Propose importing tasks from another calendar entity, such as calendar.fish_tank. Titles "
        "that start Complete: or Skip: keep that state, and a title that lists tasks split on comma and space "
        "makes one task each. Tasks already in the plan are left out. start defaults to a week ago and end to 30 "
        "days ahead. Returns a confirm code; nothing changes until tankkeeper__apply_change.",
        schema={
            p.Required("calendar"): NON_EMPTY,
            p.Optional("start", description="ISO date"): NON_EMPTY,
            p.Optional("end", description="ISO date"): NON_EMPTY,
            p.Optional(
                "dose_products", description="Product names that make a task a dose. Defaults to the products"
            ): [NON_EMPTY],
            **REASON,
            **CONVERSATION,
        },
    ),
    Spec(
        name="get_light",
        title="Get the lights",
        annotations=READ,
        handler=get_light,
        description="Each light with its schedule, today's schedule after any one-day change, its state, whether it "
        "follows the schedule, the changes to it with their reasons, the on/off log, the changes missed or made "
        "late, and when it was on, for the last days (default 7). Also the next change and today's dose time.",
        schema={
            p.Optional("light_id"): NON_EMPTY,
            p.Optional("days", default=7): p.All(int, p.Range(min=1, max=30)),
        },
    ),
    Spec(
        name="set_light",
        title="Propose a light change",
        annotations=PROPOSE,
        handler=set_light,
        description="Propose a light the integration switches on a schedule: add one, update or remove it, or make "
        "a one_day change that reverts by itself the next day, or cancel_one_day. add needs entity_id (a light or "
        "switch entity), model, on and off. A dimmable or colour light needs a light entity and can have "
        "brightness_pct and ramp_minutes; only a colour light has rgb_color. Times are HH:MM, and the light turns "
        "off after it turns on on the same day. Doses are due when the first light turns on. No tool switches the "
        "light directly. Returns a confirm code; nothing changes until tankkeeper__apply_change.",
        schema={
            p.Required("action"): p.In(LIGHT_ACTIONS),
            p.Optional("light_id", description="The light to change. Not for add"): NON_EMPTY,
            p.Optional("entity_id"): NON_EMPTY,
            p.Optional("model", description="The light's make and model"): NON_EMPTY,
            p.Optional("control"): p.In(list(Control)),
            p.Optional("on", description="HH:MM"): NON_EMPTY,
            p.Optional("off", description="HH:MM"): NON_EMPTY,
            p.Optional("brightness_pct", description="1 to 100, or null for none"): p.Maybe(int),
            p.Optional("ramp_minutes", description="Minutes to fade in at on and out at off"): p.All(
                int, p.Range(min=0)
            ),
            p.Optional("rgb_color", description="Red, green and blue, each 0 to 255, or null for none"): p.Maybe(
                p.All([int], p.Length(min=3, max=3))
            ),
            p.Optional("date", description="ISO date of a one_day change. Defaults to today"): NON_EMPTY,
            **REASON,
            **CONVERSATION,
        },
    ),
)
