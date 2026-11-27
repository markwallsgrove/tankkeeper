"""Importing the owner's earlier log as doses, tests and events, through Home Assistant's LLM API."""

from homeassistant.util.json import JsonObjectType, JsonValueType
import pytest

from .common import Caller, apply, dict_of, list_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T12:00:00+00:00")]

FILL: dict[str, JsonValueType] = {
    "date": "2026-11-21",
    "tasks": ["Filled the tank with tap water"],
    "water_litres": 180,
    "doses": [{"product": "AquaCare Bio Boost", "ml": 90}, {"product": "Mystery drops", "ml": 2}],
    "why": "Tank set up.",
    "notes": "Copied from the calendar.",
}
FIRST_TEST: dict[str, JsonValueType] = {
    "date": "2026-11-25",
    "time": "09:30",
    "tests": {"ammonia": 0.5, "nitrite": 0.75, "ph": 6.8},
    "why": "First tank test.",
}
TAP_TEST: dict[str, JsonValueType] = {"date": "2026-11-25", "tests": {"nitrate": 20}, "source": "tap"}
SEEN: dict[str, JsonValueType] = {"date": "2026-11-24", "notes": "Brown dust on the glass."}


async def _log(call: Caller) -> list[JsonObjectType]:
    entries = [dict_of(entry) for entry in list_of((await call.ok("get_log"))["entries"])]
    return [{key: value for key, value in entry.items() if key != "id"} for entry in entries]


async def test_import_log_is_a_proposal_that_makes_doses_tests_and_events(call: Caller) -> None:
    await apply(call, await call.ok("add_product", name="AquaCare Bio Boost", reason="Bacteria"))
    [product] = list_of((await call.ok("list_products"))["products"])
    product_id = dict_of(product)["id"]

    proposal = await call.ok("import_log", entries=[FILL, FIRST_TEST, TAP_TEST, SEEN], reason="From the repo")

    assert proposal["summary"] == "Import 6 log records"
    assert await _log(call) == []
    await apply(call, proposal)
    assert await _log(call) == [
        {
            "kind": "test",
            "time": "2026-11-25T12:00:00+00:00",
            "source": "tap",
            "values": {"nitrate": 20},
            "why": None,
            "notes": None,
        },
        {
            "kind": "test",
            "time": "2026-11-25T09:30:00+00:00",
            "source": "tank",
            "values": {"ammonia": 0.5, "nitrite": 0.75, "ph": 6.8},
            "why": "First tank test.",
            "notes": None,
        },
        {
            "kind": "event",
            "time": "2026-11-24T12:00:00+00:00",
            "tasks": [],
            "water_litres": None,
            "water_change_percent": None,
            "why": None,
            "notes": "Brown dust on the glass.",
        },
        {
            "kind": "event",
            "time": "2026-11-21T12:00:00+00:00",
            "tasks": ["Filled the tank with tap water"],
            "water_litres": 180,
            "water_change_percent": None,
            "why": "Tank set up.",
            "notes": "Copied from the calendar.",
        },
        {
            "kind": "dose",
            "time": "2026-11-21T12:00:00+00:00",
            "product_id": product_id,
            "product": "AquaCare Bio Boost",
            "amount_ml": 90,
            "why": "Tank set up.",
            "notes": "Copied from the calendar.",
        },
        {
            "kind": "dose",
            "time": "2026-11-21T12:00:00+00:00",
            "product_id": None,
            "product": "Mystery drops",
            "amount_ml": 2,
            "why": "Tank set up.",
            "notes": "Copied from the calendar.",
        },
    ]
    assert [dict_of(entry)["kind"] for entry in list_of((await call.ok("get_log", kind="event"))["entries"])] == [
        "event",
        "event",
    ]


async def test_imported_tests_count_for_the_status(call: Caller) -> None:
    await apply(
        call, await call.ok("import_log", entries=[{"date": "2026-11-26", "tests": {"ammonia": 3}}], reason="x")
    )

    assert (await call.ok("get_status"))["status"] == "watch"


async def test_records_already_in_the_log_are_left_out(call: Caller) -> None:
    await apply(call, await call.ok("import_log", entries=[FIRST_TEST], reason="First month"))

    proposal = await call.ok("import_log", entries=[FIRST_TEST, SEEN], reason="Whole log")

    assert proposal["summary"] == "Import 1 log record"
    assert proposal["skipped"] == 1
    assert await call.error("import_log", entries=[FIRST_TEST], reason="Again") == "nothing_to_change"


async def test_each_stored_record_leaves_out_one_equal_imported_record(call: Caller) -> None:
    await apply(call, await call.ok("import_log", entries=[SEEN, SEEN], reason="Two notes"))

    proposal = await call.ok("import_log", entries=[SEEN, SEEN, SEEN], reason="Three notes")

    assert proposal["summary"] == "Import 1 log record"
    assert proposal["skipped"] == 2


async def test_a_water_change_is_an_event(call: Caller) -> None:
    entry: dict[str, JsonValueType] = {"date": "2026-11-26", "water_change_percent": 25, "tasks": ["Water change"]}

    await apply(call, await call.ok("import_log", entries=[entry], reason="x"))

    [event] = await _log(call)
    assert event["water_change_percent"] == 25


async def test_import_log_checks_its_input(call: Caller) -> None:
    cases: list[list[JsonValueType]] = [
        [],
        [{"date": "21 Nov"}],
        [{"date": "2026-11-21", "time": "noon"}],
        [{"date": "2026-11-21", "tests": {}}],
        [{"date": "2026-11-21", "tests": {"ammonia": -1}}],
        [{"date": "2026-11-21", "doses": [{"product": "Bio Boost"}]}],
    ]
    for entries in cases:
        assert await call.error("import_log", entries=entries, reason="x") == "invalid_input"
