import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/overview";
import type { TkOverview } from "../src/views/overview";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const status = {
  status: "watch",
  checked: "2026-11-26T09:00:00+00:00",
  rules: [
    {
      rule: "ammonia",
      level: "watch",
      reason: "Ammonia 3 ppm is over 2 ppm",
      action: "Change 30% of the water",
    },
    { rule: "nitrite", level: "on_course", reason: "Nitrite 0 ppm", action: null },
  ],
  stage: "cycling",
  settings: { nitrogen_watch: 2, nitrogen_act: 4 },
};
const tank = {
  tank: {
    name: "Nano",
    volume_litres: 60,
    dosing_volume_litres: 54,
    temperature_c: 24,
    notes: "",
    stage: "cycling",
  },
  water: { source: "supplier", ph: 7.4, kh: 5 },
  proposals_waiting: 1,
};
const tasks = [
  {
    id: "t1",
    date: "2026-11-26",
    slot: "task",
    time: "09:00",
    text: "Test water",
    state: "open",
    note: null,
  },
  {
    id: "t2",
    date: "2026-11-26",
    slot: "dose",
    time: "12:00",
    text: "Easy Green 1 ml",
    state: "complete",
    note: null,
  },
  {
    id: "t3",
    date: "2026-11-28",
    slot: "task",
    time: "09:00",
    text: "Trim plants",
    state: "open",
    note: null,
  },
];
const log = [
  { id: "l2", kind: "test", time: "2026-11-25T12:00:00+00:00", source: "tap", values: { ph: 7.6 } },
  {
    id: "l1",
    kind: "test",
    time: "2026-11-24T12:00:00+00:00",
    source: "tank",
    values: { ammonia: 3, ph: 7.2 },
  },
];
const light = {
  id: "light1",
  entity_id: "light.tank",
  model: "Chihiros WRGB II",
  control: "dimmable",
  on: "13:00",
  off: "20:00",
  brightness_pct: 60,
  ramp_minutes: 30,
  today: { day: "2026-11-26", on: "14:00", off: "20:00" },
  state: "on",
  problem: null,
  on_periods: [["2026-11-25T13:00:00+00:00", "2026-11-25T20:00:00+00:00"]],
};
const proposal = {
  proposal_id: "p1",
  state: "pending",
  created: "2026-11-26T08:00:00+00:00",
  source: "mcp",
  summary: "Add the product <b>Excel</b>",
  reason: "Carbon for the plants",
  evidence: null,
  changes: [{ collection: "products", record_id: "x", before: null, after: { name: "Excel" } }],
  batch: false,
};

function connection(lights: unknown[] = [light]): FakeConnection {
  return new FakeConnection()
    .on("get_status", status)
    .on("get_tank", tank)
    .on("get_plan", { start: "2026-11-26", end: "2026-12-03", tasks, reminders: {} })
    .on("get_log", { entries: log })
    .on("get_light", {
      today: "2026-11-26",
      lights,
      next_change: { time: "2026-11-26T20:00:00+00:00" },
    })
    .on("list_proposals", { proposals: [proposal] })
    .on("get_camera", {
      camera: null,
      check_time: "14:00",
      after_test: false,
      alerts: true,
      keep_days: 30,
      latest: null,
      open: [],
    })
    .on("get_history", { history: [] })
    .on("skip_task", { applied: true })
    .on("complete_task", { applied: true })
    .on("set_tank", { applied: true })
    .on("set_water", { applied: true })
    .on("set_rules", { applied: true })
    .on("set_light", { applied: true })
    .on("accept_proposal", { state: "accepted" })
    .on("reject_proposal", { state: "declined" });
}

function save(element: Element, selector: string, detail: Record<string, unknown>): void {
  find(element, selector).dispatchEvent(
    new CustomEvent("tk-save", { detail, bubbles: true, composed: true }),
  );
}

async function view(conn: FakeConnection): Promise<TkOverview> {
  const element = mount<TkOverview>("tk-overview", { api: new TankkeeperApi(conn) });
  await settle(element);
  return element;
}

describe("tk-overview", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 26, 10));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the status, today's tasks, the charts and the next 7 days", async () => {
    const conn = connection();
    const element = await view(conn);

    expect(conn.last("get_plan").args).toEqual({ start: "2026-11-26", end: "2026-12-03" });
    expect(conn.last("get_light").args).toEqual({ days: 30 });
    expect(conn.last("list_proposals").args).toEqual({ state: "pending" });
    expect(conn.last("get_log").args).toEqual({ kind: "test", since: "2026-09-27", limit: 500 });

    const statusText = text(find(element, "#status"));
    expect(statusText).toContain("Watch");
    expect(statusText).toContain("Cycling");
    expect(statusText).toContain("Change 30% of the water");
    expect(findAll(element, "#today li").length).toBe(2);
    expect(findAll(element, "#today button.skip").length).toBe(1);
    expect(text(find(element, "#today"))).toContain("complete");
    expect(find(element, "#cycle svg").getAttribute("aria-label")).toBe("Cycle");
    expect(findAll(element, "#chemistry circle.hollow").length).toBe(1);
    expect(findAll(element, "#chemistry line.target").length).toBe(2);
    expect(text(find(element, "#week"))).toContain("Trim plants");
    expect(text(find(element, "#week"))).not.toContain("Test water");
    expect(findAll(element, "tk-camera").length).toBe(1);
  });

  it("skips and completes today's tasks", async () => {
    const conn = connection();
    const element = await view(conn);
    let changes = 0;
    document.body.addEventListener("tk-changed", () => (changes += 1));

    find(element, "#today button.skip").click();
    await settle(element);
    expect(conn.last("skip_task").args).toEqual({ task_id: "t1" });

    find(element, "#today button.complete").click();
    await settle(element);
    expect(conn.last("complete_task").args).toEqual({ task_id: "t1" });
    expect(changes).toBe(2);
  });

  it("edits the tank, the water and the rule limits", async () => {
    const conn = connection();
    const element = await view(conn);

    save(element, "tk-form.tank", { temperature_c: 25 });
    await settle(element);
    expect(conn.last("set_tank").args).toEqual({ temperature_c: 25 });

    save(element, "tk-form.water", { ph: 7.5 });
    await settle(element);
    expect(conn.last("set_water").args).toEqual({ ph: 7.5 });

    save(element, "tk-form.rules", { nitrogen_watch: 1 });
    await settle(element);
    expect(conn.last("set_rules").args).toEqual({ nitrogen_watch: 1 });

    save(element, "tk-form.rules", {});
    await settle(element);
    expect(conn.types().filter((type) => type === "tankkeeper/set_rules").length).toBe(1);

    const histories = findAll(element, "#status tk-history").map((item) => {
      const history = item as unknown as { collection: string; recordId: string };
      return [history.collection, history.recordId];
    });
    expect(histories).toEqual([
      ["tank", "tank"],
      ["water", "water"],
      ["settings", "rules"],
    ]);
  });

  it("shows the lights with their schedule and a 30-day chart, and edits them", async () => {
    const conn = connection();
    const element = await view(conn);

    const lightText = text(find(element, "#light"));
    expect(lightText).toContain("Chihiros WRGB II");
    expect(lightText).toContain("13:00 to 20:00");
    expect(lightText).toContain("Today 14:00 to 20:00");
    expect(find(element, "#light svg").getAttribute("aria-label")).toBe(
      "Light on and off, last 30 days",
    );

    save(element, "#light tk-form", { off: "19:00" });
    await settle(element);
    expect(conn.last("set_light").args).toEqual({
      action: "update",
      light_id: "light1",
      off: "19:00",
    });

    find(element, "#light button.remove").click();
    await settle(element);
    expect(conn.last("set_light").args).toEqual({ action: "remove", light_id: "light1" });
  });

  it("hides the light card when there are no lights", async () => {
    const element = await view(connection([]));
    expect(findAll(element, "#light")).toEqual([]);
  });

  it("accepts, rejects and discusses what is waiting", async () => {
    const conn = connection();
    const element = await view(conn);
    expect(findAll(element, "#waiting b")).toEqual([]);
    expect(text(find(element, "#waiting"))).toContain("Add the product <b>Excel</b>");
    expect(text(find(element, "#waiting"))).toContain("Added to products");

    find(element, "#waiting button.accept").click();
    await settle(element);
    expect(conn.sent).toContainEqual({ type: "tankkeeper/accept_proposal", proposal_id: "p1" });

    find(element, "#waiting button.reject").click();
    await settle(element);
    expect(conn.sent).toContainEqual({ type: "tankkeeper/reject_proposal", proposal_id: "p1" });

    const actions: unknown[] = [];
    document.body.addEventListener("hass-action", (event) =>
      actions.push((event as CustomEvent).detail),
    );
    find(element, "#waiting button.discuss").click();
    expect(actions).toEqual([
      { config: { tap_action: { action: "assist", start_listening: false } }, action: "tap" },
    ]);
  });

  it("shows when nothing is waiting and when there are no tasks today", async () => {
    const conn = connection()
      .on("list_proposals", { proposals: [] })
      .on("get_plan", { start: "2026-11-26", end: "2026-12-03", tasks: [], reminders: {} })
      .on("get_status", { ...status, status: null, stage: null, rules: [] });
    const element = await view(conn);
    expect(text(find(element, "#waiting"))).toContain("Nothing is waiting for you");
    expect(text(find(element, "#today"))).toContain("No tasks today");
    expect(text(find(element, "#week"))).toContain("No tasks");
    expect(text(find(element, "#status"))).toContain("Not checked yet");
  });

  it("shows lights and tasks with missing details", async () => {
    const conn = connection([
      { ...light, state: null, brightness_pct: null, problem: "The light is off but should be on" },
    ])
      .on("get_light", {
        today: "2026-11-26",
        lights: [
          {
            ...light,
            state: null,
            brightness_pct: null,
            problem: "The light is off but should be on",
          },
        ],
        next_change: null,
      })
      .on("get_plan", {
        start: "2026-11-26",
        end: "2026-12-03",
        tasks: [
          { ...tasks[0], time: null, state: "skip" },
          { ...tasks[2], time: null },
        ],
        reminders: {},
      })
      .on("get_status", {
        ...status,
        stage: "cycled",
        rules: [{ rule: "test", level: "act", reason: "No test for 4 days", action: null }],
      });
    const element = await view(conn);
    const lightText = text(find(element, "#light"));
    expect(lightText).toContain("unknown");
    expect(lightText).toContain("13:00 to 20:00 Today");
    expect(lightText).toContain("The light is off but should be on");
    expect(lightText).not.toContain("Next change");
    expect(text(find(element, "#today"))).toContain("Test water skip");
    expect(text(find(element, "#week"))).toContain("2026-11-28 Trim plants");
    expect(text(find(element, "#status"))).toContain("Act No test for 4 days");
    expect(text(find(element, "#status"))).toContain("Cycled");
  });

  it("shows why it cannot load", async () => {
    const element = await view(
      connection().fail("get_status", "not_loaded", "TankKeeper is not loaded"),
    );
    expect(find(element, ".error").textContent).toBe("TankKeeper is not loaded");
  });

  it("shows an error when an action fails", async () => {
    const conn = connection().fail("accept_proposal", "invalid_input", "Already decided");
    const element = await view(conn);
    find(element, "#waiting button.accept").click();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("Already decided");
  });
});
