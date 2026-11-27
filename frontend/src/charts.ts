import { html, nothing, svg, type SVGTemplateResult, type TemplateResult } from "lit";
import { addDays, zoned } from "./format";
import type { LogEntry, Water } from "./types";

const DAY_MINUTES = 24 * 60;

export interface Point {
  time: number;
  value: number;
}

/** Readings of one value. Tank readings are joined by a line; tap readings are hollow points. */
export interface Series {
  name: string;
  colour: string;
  joined: boolean;
  points: Point[];
}

export interface Line {
  label: string;
  value: number;
  colour: string;
}

export interface Chart {
  series: Series[];
  lines: Line[];
  min: number;
  max: number;
}

/** One test value, charted on its own. */
export interface ParameterChart {
  key: TestValue;
  label: string;
  chart: Chart;
}

const WIDTH = 320;
const HEIGHT = 160;
const PAD = 24;
const COLOURS = {
  ammonia: "var(--warning-color, #f4b400)",
  nitrite: "var(--error-color, #db4437)",
  nitrate: "var(--info-color, #4285f4)",
  ph: "var(--primary-color, #03a9f4)",
  kh: "var(--success-color, #43a047)",
  gh: "var(--accent-color, #ff9800)",
  phosphate: "var(--state-icon-color, #44739e)",
  temperature_c: "var(--error-color, #db4437)",
};
const WATCH = COLOURS.ammonia;
const ACT = COLOURS.nitrite;
const REFERENCE = "var(--secondary-text-color, #727272)";

type TestValue = keyof typeof COLOURS;

/** The values a test records, in the order they are charted, with their units. */
const PARAMETERS: [TestValue, string][] = [
  ["ammonia", "Ammonia (ppm)"],
  ["nitrite", "Nitrite (ppm)"],
  ["nitrate", "Nitrate (mg/l)"],
  ["ph", "pH"],
  ["kh", "KH (dKH)"],
  ["gh", "GH (dGH)"],
  ["phosphate", "Phosphate (mg/l)"],
  ["temperature_c", "Temperature (°C)"],
];

type WaterValue = "ph" | "kh" | "gh" | "nitrate" | "phosphate";

function series(log: LogEntry[], key: TestValue, name: string, source: "tank" | "tap"): Series {
  const points = log
    .filter(
      (entry) =>
        entry.kind === "test" &&
        (entry.source === "tap" ? "tap" : "tank") === source &&
        typeof entry.values?.[key] === "number",
    )
    .map((entry) => ({ time: Date.parse(entry.time), value: entry.values?.[key] ?? 0 }))
    .sort((a, b) => a.time - b.time);
  return { name, colour: COLOURS[key], joined: source === "tank", points };
}

function chart(all: Series[], lines: Line[]): Chart {
  const values = [
    ...all.flatMap((item) => item.points.map((point) => point.value)),
    ...lines.map((line) => line.value),
  ];
  return { series: all, lines, min: Math.min(0, ...values), max: Math.max(...values, 0) };
}

/** A line for each of the named values that is set. */
function lines(values: [string, number | null | undefined, string][]): Line[] {
  return values.flatMap(([label, value, colour]) =>
    typeof value === "number" ? [{ label, value, colour }] : [],
  );
}

function limits(settings: Record<string, number>, watch: string, act: string): Line[] {
  return lines([
    ["Watch", settings[watch], WATCH],
    ["Act", settings[act], ACT],
  ]);
}

/** Ammonia, nitrite and nitrate over time, with the Watch and Act limits. Tap readings stay off the lines. */
export function cycleChart(log: LogEntry[], settings: Record<string, number>): Chart {
  const keys = [
    ["ammonia", "Ammonia"],
    ["nitrite", "Nitrite"],
    ["nitrate", "Nitrate"],
  ] as const;
  return chart(
    [
      ...keys.map(([key, name]) => series(log, key, name, "tank")),
      ...keys.map(([key, name]) => series(log, key, `Tap ${name.toLowerCase()}`, "tap")),
    ],
    limits(settings, "nitrogen_watch", "nitrogen_act"),
  );
}

function parameterLines(
  key: TestValue,
  settings: Record<string, number>,
  temperature: number | null,
  water: Water | null,
): Line[] {
  const tapWater = (value: WaterValue): Line[] => lines([["Tap water", water?.[value], REFERENCE]]);
  switch (key) {
    case "ammonia":
    case "nitrite":
      return limits(settings, "nitrogen_watch", "nitrogen_act");
    case "ph":
      return [...limits(settings, "ph_watch", "ph_act"), ...tapWater("ph")];
    case "temperature_c":
      return lines([["Target", temperature, REFERENCE]]);
    default:
      return tapWater(key);
  }
}

/**
 * A chart for each test value that has readings, and the labels of those that have none.
 * The lines are the rule limits, the tap water values and the target temperature.
 */
export function parameterCharts(
  log: LogEntry[],
  settings: Record<string, number>,
  temperature: number | null,
  water: Water | null,
): { charts: ParameterChart[]; empty: string[] } {
  const charts: ParameterChart[] = [];
  const empty: string[] = [];
  for (const [key, label] of PARAMETERS) {
    const readings = [series(log, key, "Tank", "tank"), series(log, key, "Tap", "tap")];
    if (readings.every((item) => item.points.length === 0)) {
      empty.push(label);
      continue;
    }
    charts.push({
      key,
      label,
      chart: chart(readings, parameterLines(key, settings, temperature, water)),
    });
  }
  return { charts, empty };
}

export function renderChart(data: Chart, label: string): TemplateResult {
  const times = data.series.flatMap((item) => item.points.map((point) => point.time));
  if (times.length === 0) return html`<p class="empty">No readings yet</p>`;
  const start = Math.min(...times);
  const span = Math.max(...times) - start;
  const range = data.max - data.min || 1;
  const x = (time: number): number =>
    span === 0 ? WIDTH / 2 : PAD + ((time - start) / span) * (WIDTH - 2 * PAD);
  const y = (value: number): number =>
    HEIGHT - PAD - ((value - data.min) / range) * (HEIGHT - 2 * PAD);
  return html`
    <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label=${label} class="chart">
      <line class="axis" x1=${PAD} y1=${HEIGHT - PAD} x2=${WIDTH - PAD} y2=${HEIGHT - PAD}></line>
      <text class="tick" x="2" y=${y(data.max) + 4}>${data.max}</text>
      <text class="tick" x="2" y=${y(data.min) + 4}>${data.min}</text>
      ${data.lines.map(
        (line) =>
          svg`<line class="target" x1=${PAD} x2=${WIDTH - PAD} y1=${y(line.value)} y2=${y(line.value)}
            stroke=${line.colour}><title>${line.label} ${line.value}</title></line>`,
      )}
      ${data.series
        .filter((item) => item.points.length > 0)
        .map(
          (item) => svg`
          ${
            item.joined
              ? svg`<polyline fill="none" stroke=${item.colour}
                  points=${item.points.map((point) => `${String(x(point.time))},${String(y(point.value))}`).join(" ")}>
                </polyline>`
              : nothing
          }
          ${item.points.map(
            (point) =>
              svg`<circle class=${item.joined ? "solid" : "hollow"} cx=${x(point.time)} cy=${y(point.value)} r="3"
                stroke=${item.colour} fill=${item.joined ? item.colour : "none"}>
                <title>${item.name} ${point.value}</title></circle>`,
          )}`,
        )}
    </svg>
    <ul class="legend">
      ${data.series
        .filter((item) => item.points.length > 0)
        .map(
          (item) =>
            html`<li>
              ${
                item.joined
                  ? html`<span class="swatch" style="background:${item.colour}"></span>`
                  : html`<span class="swatch hollow" style="border-color:${item.colour}"></span>`
              }${item.name}
            </li>`,
        )}
      ${data.lines.map((line) => html`<li><span class="dash" style="border-color:${line.colour}"></span>${line.label}</li>`)}
    </ul>
  `;
}

export interface LightRow {
  day: string;
  segments: { start: number; end: number }[];
}

/** Each of the last days, with the parts of it a light was on, as fractions of the day. */
export function lightRows(
  periods: [string, string][],
  today: string,
  days: number,
  timeZone?: string,
): LightRow[] {
  const rows: LightRow[] = [];
  for (let back = days - 1; back >= 0; back--) {
    rows.push({ day: addDays(today, -back), segments: [] });
  }
  for (const [from, to] of periods) {
    const start = zoned(new Date(from), timeZone);
    const end = zoned(new Date(to), timeZone);
    for (const row of rows) {
      const first =
        start.day === row.day ? start.minutes / DAY_MINUTES : start.day < row.day ? 0 : null;
      const last = end.day === row.day ? end.minutes / DAY_MINUTES : end.day > row.day ? 1 : null;
      if (first !== null && last !== null && last > first)
        row.segments.push({ start: first, end: last });
    }
  }
  return rows;
}

export function renderLightChart(rows: LightRow[]): SVGTemplateResult {
  const rowHeight = 6;
  const height = rows.length * rowHeight;
  return svg`
    <svg viewBox="0 0 ${WIDTH} ${height}" role="img" class="chart light"
      aria-label=${`Light on and off, last ${String(rows.length)} days`}>
      ${rows.map(
        (row, index) => svg`
          <rect class="off" x="0" y=${index * rowHeight} width=${WIDTH} height=${rowHeight - 1}></rect>
          ${row.segments.map(
            (segment) =>
              svg`<rect class="on" x=${segment.start * WIDTH} y=${index * rowHeight}
                width=${(segment.end - segment.start) * WIDTH} height=${rowHeight - 1}>
                <title>${row.day}</title></rect>`,
          )}`,
      )}
    </svg>`;
}
