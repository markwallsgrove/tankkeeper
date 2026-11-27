import { render } from "lit";
import { describe, expect, it } from "vitest";
import {
  chemistryChart,
  cycleChart,
  lightRows,
  renderChart,
  renderLightChart,
} from "../src/charts";
import type { LogEntry } from "../src/types";

const log: LogEntry[] = [
  { id: "3", kind: "test", time: "2026-11-26T12:00:00+00:00", source: "tap", values: { ph: 7.6 } },
  {
    id: "2",
    kind: "test",
    time: "2026-11-25T12:00:00+00:00",
    source: "tank",
    values: { ammonia: 1, ph: 7.2, kh: 4 },
  },
  {
    id: "1",
    kind: "test",
    time: "2026-11-24T12:00:00+00:00",
    source: "tank",
    values: { ammonia: 2, nitrite: 0.5 },
  },
  { id: "0", kind: "dose", time: "2026-11-24T12:00:00+00:00", product: "Easy Green", amount_ml: 1 },
];

describe("cycleChart", () => {
  it("plots ammonia, nitrite and nitrate in time order with the rule limits", () => {
    const chart = cycleChart(log, { nitrogen_watch: 2, nitrogen_act: 4 });

    expect(
      chart.series.map((series) => [series.name, series.points.map((point) => point.value)]),
    ).toEqual([
      ["Ammonia", [2, 1]],
      ["Nitrite", [0.5]],
      ["Nitrate", []],
    ]);
    expect(chart.lines.map((line) => [line.label, line.value])).toEqual([
      ["Watch", 2],
      ["Act", 4],
    ]);
    expect(chart.min).toBe(0);
    expect(chart.max).toBe(4);
  });
});

describe("chemistryChart", () => {
  it("draws tap readings hollow and the water values as targets", () => {
    const chart = chemistryChart(log, { ph: 7.4, gh: null, kh: 5 });

    const ph = chart.series.find((series) => series.name === "pH");
    expect(ph?.points.map((point) => [point.value, point.hollow])).toEqual([
      [7.2, false],
      [7.6, true],
    ]);
    expect(chart.lines.map((line) => [line.label, line.value])).toEqual([
      ["pH target", 7.4],
      ["KH target", 5],
    ]);
  });

  it("has no targets without water values", () => {
    expect(chemistryChart(log, null).lines).toEqual([]);
  });
});

describe("renderChart", () => {
  it("draws points, hollow points and dashed target lines", () => {
    const host = document.createElement("div");
    render(renderChart(chemistryChart(log, { ph: 7.4 }), "Water chemistry"), host);

    expect(host.querySelector("svg")?.getAttribute("aria-label")).toBe("Water chemistry");
    expect(host.querySelectorAll("circle.hollow").length).toBe(1);
    expect(host.querySelectorAll("circle.solid").length).toBe(2);
    expect(host.querySelectorAll("line.target").length).toBe(1);
    expect(host.textContent).toContain("pH");
  });

  it("says when there are no readings", () => {
    const host = document.createElement("div");
    render(renderChart(cycleChart([], {}), "Cycle"), host);

    expect(host.textContent).toContain("No readings yet");
    expect(host.querySelector("svg")).toBeNull();
  });

  it("draws one reading in the middle", () => {
    const host = document.createElement("div");
    const one = log.filter((entry) => entry.id === "1");
    render(renderChart(cycleChart(one, {}), "Cycle"), host);

    expect(host.querySelectorAll("circle").length).toBe(2);
  });
});

describe("lightRows", () => {
  it("splits on periods into days, newest last", () => {
    const rows = lightRows(
      [
        ["2026-11-25T20:00:00", "2026-11-26T02:00:00"],
        ["2026-11-26T12:00:00", "2026-11-26T18:00:00"],
      ],
      "2026-11-26",
      2,
    );

    expect(rows).toEqual([
      { day: "2026-11-25", segments: [{ start: 20 / 24, end: 1 }] },
      {
        day: "2026-11-26",
        segments: [
          { start: 0, end: 2 / 24 },
          { start: 0.5, end: 0.75 },
        ],
      },
    ]);
  });

  it("splits the days in Home Assistant's time zone", () => {
    const rows = lightRows(
      [["2026-11-26T08:00:00Z", "2026-11-26T12:00:00Z"]],
      "2026-11-26",
      1,
      "America/New_York",
    );

    expect(rows).toEqual([{ day: "2026-11-26", segments: [{ start: 3 / 24, end: 7 / 24 }] }]);
  });

  it("renders a bar for every on period", () => {
    const host = document.createElement("div");
    render(
      renderLightChart(
        lightRows([["2026-11-26T12:00:00", "2026-11-26T18:00:00"]], "2026-11-26", 30),
      ),
      host,
    );

    expect(host.querySelectorAll("rect.on").length).toBe(1);
    expect(host.querySelector("svg")?.getAttribute("aria-label")).toBe(
      "Light on and off, last 30 days",
    );
  });
});
