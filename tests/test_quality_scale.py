"""Every quality scale rule is done or exempt with a reason, and the done rules hold.

hassfest skips quality_scale.yaml for custom integrations, so this test checks it instead.
"""

import json
from pathlib import Path

from homeassistant.util.yaml import load_yaml_dict
from PIL import Image

from custom_components.tankkeeper import calendar, sensor, todo
from custom_components.tankkeeper.config_flow import TankkeeperConfigFlow

EXCEPTION_KEYS = {"change_failed", "repeat_not_supported"}
ROOT = Path(__file__).parent.parent
INTEGRATION = ROOT / "custom_components" / "tankkeeper"

RULES = {
    "bronze": [
        "action-setup",
        "appropriate-polling",
        "brands",
        "common-modules",
        "config-flow",
        "config-flow-test-coverage",
        "dependency-transparency",
        "docs-actions",
        "docs-conditions",
        "docs-high-level-description",
        "docs-installation-instructions",
        "docs-removal-instructions",
        "docs-triggers",
        "entity-event-setup",
        "entity-unique-id",
        "has-entity-name",
        "runtime-data",
        "test-before-configure",
        "test-before-setup",
        "unique-config-entry",
    ],
    "silver": [
        "action-exceptions",
        "config-entry-unloading",
        "docs-configuration-parameters",
        "docs-installation-parameters",
        "entity-unavailable",
        "integration-owner",
        "log-when-unavailable",
        "parallel-updates",
        "reauthentication-flow",
        "test-coverage",
    ],
    "gold": [
        "devices",
        "diagnostics",
        "discovery",
        "discovery-update-info",
        "docs-data-update",
        "docs-examples",
        "docs-known-limitations",
        "docs-supported-devices",
        "docs-supported-functions",
        "docs-troubleshooting",
        "docs-use-cases",
        "dynamic-devices",
        "entity-category",
        "entity-device-class",
        "entity-disabled-by-default",
        "entity-translations",
        "exception-translations",
        "icon-translations",
        "reconfiguration-flow",
        "repair-issues",
        "stale-devices",
    ],
    "platinum": ["async-dependency", "inject-websession", "strict-typing"],
}


def _rules() -> dict[str, object]:
    rules = load_yaml_dict(INTEGRATION / "quality_scale.yaml")["rules"]
    assert isinstance(rules, dict)
    return rules


def _status(value: object) -> str:
    if isinstance(value, str):
        return value
    assert isinstance(value, dict)
    assert isinstance(value["comment"], str)
    assert value["comment"].strip()
    status = value["status"]
    assert isinstance(status, str)
    return status


def test_every_platinum_rule_is_done_or_exempt() -> None:
    rules = _rules()

    assert sorted(rules) == sorted(rule for tier in RULES.values() for rule in tier)
    not_met = {name: _status(value) for name, value in rules.items() if _status(value) not in {"done", "exempt"}}
    assert not not_met
    exempt_without_reason = [name for name, value in rules.items() if value == "exempt"]
    assert not exempt_without_reason


def test_manifest_backs_the_done_rules() -> None:
    manifest = json.loads((INTEGRATION / "manifest.json").read_text())

    assert manifest["config_flow"] is True
    assert manifest["single_config_entry"] is True
    assert manifest["codeowners"]
    assert manifest["requirements"] == []


def test_code_backs_the_done_rules() -> None:
    assert (INTEGRATION / "py.typed").is_file()
    assert sensor.PARALLEL_UPDATES == 0
    assert calendar.PARALLEL_UPDATES == 0
    assert todo.PARALLEL_UPDATES == 0
    assert hasattr(TankkeeperConfigFlow, "async_step_reconfigure")
    assert all(description.translation_key for description in sensor.SENSORS)
    icons = json.loads((INTEGRATION / "icons.json").read_text())
    assert set(icons["entity"]["sensor"]) == {description.key for description in sensor.SENSORS}
    assert set(icons["entity"]["calendar"]) == {calendar.TRANSLATION_KEY}
    assert set(icons["entity"]["todo"]) == {todo.TRANSLATION_KEY}
    strings = json.loads((INTEGRATION / "strings.json").read_text())
    assert set(strings["exceptions"]) == EXCEPTION_KEYS
    assert json.loads((INTEGRATION / "translations" / "en.json").read_text())["exceptions"] == strings["exceptions"]


def test_brand_icons_have_the_expected_sizes() -> None:
    for name, size in (("icon.png", 256), ("icon@2x.png", 512)):
        with Image.open(INTEGRATION / "brand" / name) as image:
            assert image.size == (size, size)
