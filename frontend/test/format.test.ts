import { describe, expect, it } from "vitest";
import { addDays, changeText, isoDate, logText, shortTime, sourceText } from "../src/format";

describe("format", () => {
  it("adds days to an ISO date", () => {
    expect(addDays("2026-11-30", 2)).toBe("2026-12-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("gives today's local date", () => {
    expect(isoDate(new Date(2026, 10, 5, 23, 30))).toBe("2026-11-05");
  });

  it("gives the date in a time zone", () => {
    const noon = new Date("2026-11-26T12:00:00Z");
    expect(isoDate(noon, "Pacific/Kiritimati")).toBe("2026-11-27");
    expect(isoDate(noon, "Pacific/Pago_Pago")).toBe("2026-11-26");
  });

  it("shows a time without seconds", () => {
    expect(shortTime("2026-11-26T09:05:00+00:00")).toMatch(/^2026-11-26 \d\d:05$/);
  });

  it("describes where a change came from", () => {
    expect(sourceText("panel")).toBe("Panel");
    expect(sourceText("mcp")).toBe("Claude (MCP)");
    expect(sourceText("assist")).toBe("Assist");
    expect(sourceText("notification")).toBe("Notification");
    expect(sourceText("rule")).toBe("Rule");
    expect(sourceText("review")).toBe("Review");
    expect(sourceText("other")).toBe("other");
  });

  it("describes a change", () => {
    expect(
      changeText({ collection: "notes", record_id: "n1", before: null, after: { topic: "CO2" } }),
    ).toBe("Added to notes");
    expect(
      changeText({ collection: "notes", record_id: "n1", before: { topic: "CO2" }, after: null }),
    ).toBe("Removed from notes");
    expect(
      changeText({
        collection: "tank",
        record_id: "tank",
        before: { name: "Nano", notes: "" },
        after: { name: "Big", notes: "" },
      }),
    ).toBe("tank: name Nano → Big");
    expect(
      changeText({
        collection: "tank",
        record_id: "tank",
        before: { links: ["a"] },
        after: { links: [] },
      }),
    ).toBe('tank: links ["a"] → []');
  });

  it("describes log entries", () => {
    expect(
      logText({
        id: "1",
        kind: "dose",
        time: "t",
        product: "Easy Green",
        amount_ml: 1.5,
        why: "Weekly",
      }),
    ).toBe("Dose: Easy Green 1.5 ml. Weekly");
    expect(
      logText({ id: "2", kind: "test", time: "t", source: "tap", values: { ph: 7.6, kh: 4 } }),
    ).toBe("Tap test: ph 7.6, kh 4");
    expect(
      logText({
        id: "3",
        kind: "test",
        time: "t",
        source: "tank",
        values: { nitrite: 0 },
        notes: "Clear",
      }),
    ).toBe("Tank test: nitrite 0. Clear");
    expect(
      logText({
        id: "4",
        kind: "event",
        time: "t",
        tasks: ["Water change"],
        water_change_percent: 30,
      }),
    ).toBe("Water change. 30% water change");
    expect(logText({ id: "5", kind: "event", time: "t", water_litres: 10 })).toBe("10 l water");
  });
});
