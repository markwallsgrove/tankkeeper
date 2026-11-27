import { describe, expect, it } from "vitest";
import "../src/tankkeeper-panel";
import type { TankkeeperPanel } from "../src/tankkeeper-panel";
import { FakeConnection, find, findAll, hassWith, mount, settle } from "./fake";

function connection(): FakeConnection {
  return new FakeConnection()
    .on("get_status", { status: null, checked: null, rules: [], stage: null, settings: {} })
    .on("get_tank", { tank: { name: "Nano" }, water: null, proposals_waiting: 0 })
    .on("get_plan", { start: "", end: "", tasks: [], reminders: {} })
    .on("get_log", { entries: [] })
    .on("get_light", { today: "2026-11-26", lights: [], next_change: null })
    .on("list_proposals", { proposals: [] })
    .on("get_history", { history: [] })
    .on("list_products", { products: [] })
    .on("list_contents", { contents: [] })
    .on("list_notes", { notes: [] })
    .on("list_decisions", { decisions: [] })
    .on("list_conversations", { conversations: [] });
}

const TABS: [string, string][] = [
  ["overview", "tk-overview"],
  ["plan", "tk-plan"],
  ["log", "tk-log"],
  ["contents", "tk-records"],
  ["products", "tk-records"],
  ["decisions", "tk-decisions"],
  ["notes", "tk-records"],
  ["conversations", "tk-conversations"],
];

describe("tankkeeper-panel", () => {
  it("has a tab for each part of the tank and opens on the overview", async () => {
    const conn = connection();
    const element = mount<TankkeeperPanel>("tankkeeper-panel", {
      hass: hassWith(conn),
      narrow: false,
    });
    await settle(element);

    expect(findAll(element, "button.tab").map((tab) => tab.getAttribute("data-tab"))).toEqual(
      TABS.map(([tab]) => tab),
    );
    expect(find(element, "button.tab[aria-selected=true]").getAttribute("data-tab")).toBe(
      "overview",
    );
    expect(findAll(element, "tk-overview").length).toBe(1);
    expect(findAll(element, "ha-menu-button")).toEqual([]);
  });

  it("shows each tab's view", async () => {
    const element = mount<TankkeeperPanel>("tankkeeper-panel", {
      hass: hassWith(connection()),
      narrow: true,
    });
    await settle(element);
    expect(findAll(element, "ha-menu-button").length).toBe(1);

    for (const [tab, tag] of TABS) {
      find(element, `button.tab[data-tab=${tab}]`).click();
      await settle(element);
      expect(findAll(element, "main > *").map((view) => view.tagName.toLowerCase())).toEqual([tag]);
      const view = find(element, tag) as unknown as { kind?: string };
      if (tag === "tk-records") expect(view.kind).toBe(tab);
    }
  });

  it("gives each records tab its own view, so typed text stays on its tab", async () => {
    const element = mount<TankkeeperPanel>("tankkeeper-panel", {
      hass: hassWith(connection()),
      narrow: false,
    });
    await settle(element);
    find(element, "button.tab[data-tab=products]").click();
    await settle(element);
    const products = find(element, "tk-records");

    find(element, "button.tab[data-tab=notes]").click();
    await settle(element);

    expect(find(element, "tk-records")).not.toBe(products);
  });

  it("uses Home Assistant's time zone for today", async () => {
    const conn = connection();
    const element = mount<TankkeeperPanel>("tankkeeper-panel", {
      hass: { ...hassWith(conn), config: { time_zone: "Pacific/Kiritimati" } },
      narrow: false,
    });
    await settle(element);

    expect(element.api?.timeZone).toBe("Pacific/Kiritimati");
  });

  it("keeps one connection while Home Assistant updates hass", async () => {
    const conn = connection();
    const element = mount<TankkeeperPanel>("tankkeeper-panel", {
      hass: hassWith(conn),
      narrow: false,
    });
    await settle(element);
    const before = conn.sent.length;

    element.hass = { connection: conn };
    await settle(element);
    expect(conn.sent.length).toBe(before);

    element.hass = hassWith(connection());
    await settle(element);
    expect(conn.sent.length).toBe(before);
  });
});
