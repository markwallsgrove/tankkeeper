import { afterEach, describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import { addDays, isoDate } from "../src/format";
import "../src/tk-embed";
import type { TkEmbed } from "../src/tk-embed";
import type { LightInfo, LogEntry, PhotoCheck } from "../src/types";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const ID = "01JD0000000000000000000000";
const URL = `/api/tankkeeper/photos/${ID}?authSig=abc`;

const check: PhotoCheck = {
  id: ID,
  time: "2026-11-26T14:00:00+00:00",
  reason: "chat",
  content_type: "image/jpeg",
  asked: true,
  summary: "Clear water.",
  issue: false,
  suggestion: null,
  seen: {},
  note: null,
  state: null,
  proposal_ids: [],
  photo_url: URL,
  embed: `![The tank](tankkeeper:photo/${ID})`,
};

const log: LogEntry[] = [
  {
    id: "2",
    kind: "test",
    time: "2026-11-25T12:00:00+00:00",
    source: "tank",
    values: { nitrate: 20 },
  },
  {
    id: "1",
    kind: "test",
    time: "2026-11-24T12:00:00+00:00",
    source: "tank",
    values: { ammonia: 1 },
  },
];

const lights: LightInfo = {
  today: "2026-11-26",
  next_change: null,
  lights: [
    {
      id: "l1",
      entity_id: "switch.light",
      model: "Chihiros",
      control: "plug",
      on: "14:00",
      off: "20:00",
      brightness_pct: null,
      ramp_minutes: 0,
      today: { day: "2026-11-26", on: "14:00", off: "20:00" },
      state: "on",
      problem: null,
      on_periods: [["2026-11-26T14:00:00+00:00", "2026-11-26T20:00:00+00:00"]],
    },
  ],
};

function connection(): FakeConnection {
  return new FakeConnection()
    .on("get_photo_check", check)
    .on("get_log", { entries: log })
    .on("get_status", { status: null, checked: null, rules: [], stage: null, settings: {} })
    .on("get_tank", {
      tank: { name: "Nano", temperature_c: 24 },
      water: { nitrate: 5 },
      proposals_waiting: 0,
    })
    .on("get_light", lights);
}

async function embed(conn: FakeConnection, address: string, alt = "Shown"): Promise<TkEmbed> {
  const element = mount<TkEmbed>("tk-embed", {
    api: new TankkeeperApi(conn, "UTC"),
    address,
    alt,
  });
  await settle(element);
  return element;
}

describe("tk-embed", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("shows a photo through the signed link the panel's own sign-in gets", async () => {
    const conn = connection();
    const element = await embed(conn, `tankkeeper:photo/${ID}`, "The tank now");

    expect(conn.last("get_photo_check").args).toEqual({ check_id: ID });
    const image = find(element, "img") as HTMLImageElement;
    expect(image.getAttribute("src")).toBe(URL);
    expect(image.getAttribute("alt")).toBe("The tank now");
    expect(text(element)).toContain("The tank now");
  });

  it("names the photo when the reply gives no text for it", async () => {
    const element = await embed(connection(), `tankkeeper:photo/${ID}`, "");

    expect(find(element, "img").getAttribute("alt")).toBe("The tank");
    expect(text(find(element, "figcaption"))).toBe("The tank");
  });

  it("opens the photo larger when clicked, and closes it with a click or Escape", async () => {
    const element = await embed(connection(), `tankkeeper:photo/${ID}`);

    find(element, "button.photo").click();
    await settle(element);
    const large = find(element, ".large");
    expect(large.getAttribute("role")).toBe("dialog");
    expect(find(element, ".large img").getAttribute("src")).toBe(URL);

    large.click();
    await settle(element);
    expect(findAll(element, ".large")).toEqual([]);

    find(element, "button.photo").click();
    await settle(element);
    expect(element.shadowRoot?.activeElement).toBe(find(element, ".large"));
    const tab = new KeyboardEvent("keydown", { key: "Tab", cancelable: true });
    find(element, ".large").dispatchEvent(tab);
    await settle(element);
    expect(tab.defaultPrevented).toBe(true);
    expect(findAll(element, ".large").length).toBe(1);
    find(element, ".large").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settle(element);
    expect(findAll(element, ".large")).toEqual([]);
    expect(element.shadowRoot?.activeElement).toBe(find(element, "button.photo"));
  });

  it("says when the photo is no longer kept", async () => {
    const conn = connection().on("get_photo_check", { ...check, photo_url: null, embed: null });
    const element = await embed(conn, `tankkeeper:photo/${ID}`, "Last week");

    expect(findAll(element, "img")).toEqual([]);
    expect(text(element)).toContain("Last week");
    expect(text(element)).toContain("The photo is no longer kept.");
  });

  it.each([
    "https://example.com/tank.jpg",
    "//example.com/tank.jpg",
    `/api/tankkeeper/photos/01JD0000000000000000000001?authSig=abc`,
    `/api/tankkeeper/photos/${ID}/../../../config?authSig=abc`,
    "javascript:alert(1)",
  ])("loads no image from a link that is not the photo's own: %s", async (photoUrl) => {
    const conn = connection().on("get_photo_check", { ...check, photo_url: photoUrl });
    const element = await embed(conn, `tankkeeper:photo/${ID}`);

    expect(findAll(element, "img")).toEqual([]);
    expect(text(element)).toContain("The photo is no longer kept.");
  });

  it("says a photo whose check is gone is no longer kept", async () => {
    const conn = connection().fail("get_photo_check", "not_found", "No photo check with id x");
    const element = await embed(conn, `tankkeeper:photo/${ID}`, "Long ago");

    expect(findAll(element, "img, .error")).toEqual([]);
    expect(text(element)).toContain("Long ago");
    expect(text(element)).toContain("The photo is no longer kept.");
  });

  it("says it is no longer kept when the photo does not load", async () => {
    const element = await embed(connection(), `tankkeeper:photo/${ID}`);

    find(element, "img").dispatchEvent(new Event("error"));
    await settle(element);
    expect(findAll(element, "img")).toEqual([]);
    expect(text(element)).toContain("The photo is no longer kept.");
  });

  it("says why a photo could not be shown", async () => {
    const conn = connection().fail("get_photo_check", "not_loaded", "No photo check with id x");
    const element = await embed(conn, `tankkeeper:photo/${ID}`, "Gone");

    expect(findAll(element, "img")).toEqual([]);
    expect(text(element)).toContain("Gone");
    expect(text(element)).toContain("No photo check with id x");
  });

  it("charts one test value for the days asked, with its tap water line", async () => {
    const conn = connection();
    const element = await embed(conn, "tankkeeper:chart/nitrate?days=7", "Nitrate this week");

    const today = isoDate(new Date(), "UTC");
    expect(conn.last("get_log").args).toEqual({
      kind: "test",
      since: addDays(today, -7),
      limit: 500,
    });
    expect(find(element, "svg.chart").getAttribute("aria-label")).toBe("Nitrate (mg/l)");
    expect(findAll(element, "polyline").length).toBe(1);
    expect(text(element)).toContain("Nitrate this week");
    expect(text(element)).toContain("Tap water");
  });

  it("reads every test in the days asked, past one page of the log", async () => {
    const start = Date.now() - 86_400_000;
    const page = Array.from({ length: 500 }, (_, at): LogEntry => ({
      id: `p${String(at)}`,
      kind: "test",
      time: new Date(start - at * 3_600_000).toISOString(),
      source: "tank",
      values: { nitrate: 10 },
    }));
    const oldest = page[499]?.time ?? "";
    const older: LogEntry = {
      id: "older",
      kind: "test",
      time: new Date(start - 600 * 3_600_000).toISOString(),
      source: "tank",
      values: { nitrate: 40 },
    };
    const conn = connection().on("get_log", (message) =>
      (message.args as { until?: string }).until === undefined
        ? { entries: page }
        : { entries: [page[499], older] },
    );
    const element = await embed(conn, "tankkeeper:chart/nitrate?days=30");

    const today = isoDate(new Date(), "UTC");
    expect(conn.last("get_log").args).toEqual({
      kind: "test",
      since: addDays(today, -30),
      until: oldest,
      limit: 500,
    });
    const points = find(element, "polyline").getAttribute("points")?.trim().split(/\s+/) ?? [];
    expect(points.length).toBe(501);
  });

  it("stops reading the log when a page brings no new test", async () => {
    const time = new Date(Date.now() - 86_400_000).toISOString();
    const page = Array.from({ length: 500 }, (_, at): LogEntry => ({
      id: `s${String(at)}`,
      kind: "test",
      time,
      source: "tank",
      values: { nitrate: 10 },
    }));
    const conn = connection().on("get_log", { entries: page });
    const element = await embed(conn, "tankkeeper:chart/nitrate");

    expect(conn.types().filter((type) => type === "tankkeeper/get_log").length).toBe(2);
    expect(findAll(element, "polyline").length).toBe(1);
  });

  it("asks once for what charts shown together share", async () => {
    const conn = connection();
    const api = new TankkeeperApi(conn, "UTC");
    const elements = ["nitrate", "nitrate", "ammonia"].map((chart) =>
      mount<TkEmbed>("tk-embed", { api, address: `tankkeeper:chart/${chart}?days=7`, alt: "" }),
    );
    await Promise.all(elements.map((element) => settle(element)));

    const count = (command: string): number =>
      conn.types().filter((type) => type === `tankkeeper/${command}`).length;
    expect([count("get_log"), count("get_status"), count("get_tank")]).toEqual([1, 1, 1]);
    expect(elements.map((element) => findAll(element, "svg.chart").length)).toEqual([1, 1, 1]);
  });

  it("names the chart when the reply gives no text for it", async () => {
    const element = await embed(connection(), "tankkeeper:chart/temperature_c", "");

    expect(text(element)).toContain("Temperature (°C), last 30 days");
    expect(text(element)).toContain("No readings yet");
  });

  it("charts the cycle", async () => {
    const conn = connection();
    const element = await embed(conn, "tankkeeper:chart/cycle?days=90");

    expect(conn.last("get_log").args).toMatchObject({
      since: addDays(isoDate(new Date(), "UTC"), -90),
    });
    expect(find(element, "svg.chart").getAttribute("aria-label")).toBe("Cycle");
    expect(findAll(element, "polyline").length).toBe(2);
  });

  it("charts when each light was on", async () => {
    const conn = connection();
    const element = await embed(conn, "tankkeeper:chart/light?days=14");

    expect(conn.last("get_light").args).toEqual({ days: 14 });
    expect(find(element, "svg.light").getAttribute("aria-label")).toBe(
      "Light on and off, last 14 days",
    );
    expect(text(element)).toContain("Chihiros");
  });

  it("says when there are no lights to chart", async () => {
    const conn = connection().on("get_light", { ...lights, lights: [] });
    const element = await embed(conn, "tankkeeper:chart/light");

    expect(text(element)).toContain("No lights yet");
  });

  it("shows an address it does not know as text, without loading anything", async () => {
    const conn = connection();
    const element = await embed(conn, "tankkeeper:chart/salinity", "Salt");

    expect(conn.sent).toEqual([]);
    expect(text(element)).toBe("![Salt](tankkeeper:chart/salinity)");
  });
});
