import { render } from "lit";
import { describe, expect, it } from "vitest";
import {
  cycleChart,
  lightRows,
  parameterCharts,
  renderChart,
  renderLightChart,
} from "../src/charts";
import type { LogEntry } from "../src/types";

const log: LogEntry[] = [
  {
    id: "4",
    kind: "test",
    time: "2026-11-26T13:00:00+00:00",
    source: "tap",
    values: { ammonia: 0.2 },
  },
  {
    id: "3b",
    kind: "test",
    time: "2026-11-26T12:00:00+00:00",
    source: "tank",
    values: { temperature_c: 24.5 },
  },
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
      ["Tap ammonia", [0.2]],
      ["Tap nitrite", []],
      ["Tap nitrate", []],
    ]);
    expect(chart.lines.map((line) => [line.label, line.value])).toEqual([
      ["Watch", 2],
      ["Act", 4],
    ]);
    expect(chart.min).toBe(0);
    expect(chart.max).toBe(4);
  });

  it("keeps tap readings out of the tank lines", () => {
    const chart = cycleChart(log, {});

    expect(chart.series.map((series) => [series.name, series.joined])).toEqual([
      ["Ammonia", true],
      ["Nitrite", true],
      ["Nitrate", true],
      ["Tap ammonia", false],
      ["Tap nitrite", false],
      ["Tap nitrate", false],
    ]);
  });
});

describe("parameterCharts", () => {
  const settings = { nitrogen_watch: 0.25, nitrogen_act: 1, ph_watch: 6.8, ph_act: 6.4 };
  const water = { ph: 7.4, kh: 5, gh: null, nitrate: 10, phosphate: 0.1 };

  it("charts each parameter that has readings, in a fixed order, with units", () => {
    const { charts, empty } = parameterCharts(log, settings, 25, water);

    expect(charts.map((item) => item.label)).toEqual([
      "Ammonia (ppm)",
      "Nitrite (ppm)",
      "pH",
      "KH (dKH)",
      "Temperature (°C)",
    ]);
    expect(empty).toEqual(["Nitrate (mg/l)", "GH (dGH)", "Phosphate (mg/l)"]);
  });

  it("puts tank readings on a line and tap readings in a separate hollow series", () => {
    const ph = parameterCharts(log, settings, 25, water).charts.find((item) => item.key === "ph");

    expect(
      ph?.chart.series.map((series) => [
        series.name,
        series.joined,
        series.points.map((point) => point.value),
      ]),
    ).toEqual([
      ["Tank", true, [7.2]],
      ["Tap", false, [7.6]],
    ]);
  });

  it("draws the limits, the tap water values and the target temperature", () => {
    const lines = (key: string): [string, number][] =>
      parameterCharts(log, settings, 25, water)
        .charts.find((item) => item.key === key)
        ?.chart.lines.map((line) => [line.label, line.value]) ?? [];

    expect(lines("ammonia")).toEqual([
      ["Watch", 0.25],
      ["Act", 1],
    ]);
    expect(lines("nitrite")).toEqual([
      ["Watch", 0.25],
      ["Act", 1],
    ]);
    expect(lines("ph")).toEqual([
      ["Watch", 6.8],
      ["Act", 6.4],
      ["Tap water", 7.4],
    ]);
    expect(lines("kh")).toEqual([["Tap water", 5]]);
    expect(lines("temperature_c")).toEqual([["Target", 25]]);
  });

  it("draws the tap water nitrate and phosphate, and no line for an unknown value", () => {
    const more: LogEntry[] = [
      {
        id: "5",
        kind: "test",
        time: "2026-11-27T12:00:00+00:00",
        source: "tank",
        values: { nitrate: 20, phosphate: 0.5, gh: 6 },
      },
    ];
    const charts = parameterCharts(more, {}, null, water).charts;
    const lines = (key: string): string[] =>
      charts.find((item) => item.key === key)?.chart.lines.map((line) => line.label) ?? [];

    expect(lines("nitrate")).toEqual(["Tap water"]);
    expect(lines("phosphate")).toEqual(["Tap water"]);
    expect(lines("gh")).toEqual([]);
  });

  it("draws no lines without rules, water values or a target", () => {
    const charts = parameterCharts(log, {}, null, null).charts;

    expect(charts.flatMap((item) => item.chart.lines)).toEqual([]);
  });
});

describe("renderChart", () => {
  it("joins tank readings with a line and leaves tap readings as hollow points", () => {
    const host = document.createElement("div");
    const ph = parameterCharts(log, {}, null, { ph: 7.4 }).charts.find((item) => item.key === "ph");
    if (ph === undefined) throw new Error("No pH chart");
    render(renderChart(ph.chart, ph.label), host);

    expect(host.querySelector("svg")?.getAttribute("aria-label")).toBe("pH");
    expect(host.querySelectorAll("polyline").length).toBe(1);
    expect(host.querySelectorAll("circle.hollow").length).toBe(1);
    expect(host.querySelectorAll("circle.solid").length).toBe(1);
    expect(host.querySelectorAll("line.target").length).toBe(1);
    expect(host.querySelectorAll(".legend .swatch.hollow").length).toBe(1);
    expect(host.textContent).toContain("Tap water");
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
