import { html, svg, type SVGTemplateResult, type TemplateResult } from "lit";
import { addDays, zoned } from "./format";

const DAY_MINUTES = 24 * 60;
import type { LogEntry, Water } from "./types";

export interface Point {
  time: number;
  value: number;
  hollow: boolean;
}

export interface Series {
  name: string;
  colour: string;
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
};

function series(log: LogEntry[], key: keyof typeof COLOURS, name: string): Series {
  const points = log
    .filter((entry) => entry.kind === "test" && typeof entry.values?.[key] === "number")
    .map((entry) => ({
      time: Date.parse(entry.time),
      value: entry.values?.[key] ?? 0,
      hollow: entry.source === "tap",
    }))
    .sort((a, b) => a.time - b.time);
  return { name, colour: COLOURS[key], points };
}

function chart(all: Series[], lines: Line[]): Chart {
  const values = [
    ...all.flatMap((item) => item.points.map((point) => point.value)),
    ...lines.map((line) => line.value),
  ];
  return { series: all, lines, min: Math.min(0, ...values), max: Math.max(...values, 0) };
}

/** Ammonia, nitrite and nitrate over time, with the Watch and Act limits. */
export function cycleChart(log: LogEntry[], settings: Record<string, number>): Chart {
  const lines: Line[] = [];
  if (settings.nitrogen_watch !== undefined) {
    lines.push({ label: "Watch", value: settings.nitrogen_watch, colour: COLOURS.ammonia });
  }
  if (settings.nitrogen_act !== undefined) {
    lines.push({ label: "Act", value: settings.nitrogen_act, colour: COLOURS.nitrite });
  }
  return chart(
    [
      series(log, "ammonia", "Ammonia"),
      series(log, "nitrite", "Nitrite"),
      series(log, "nitrate", "Nitrate"),
    ],
    lines,
  );
}

/** pH, KH and GH over time. Tap readings are hollow. The water values are the targets. */
export function chemistryChart(log: LogEntry[], water: Water | null): Chart {
  const keys = [
    ["ph", "pH"],
    ["kh", "KH"],
    ["gh", "GH"],
  ] as const;
  const lines: Line[] = [];
  for (const [key, name] of keys) {
    const value = water?.[key];
    if (typeof value === "number")
      lines.push({ label: `${name} target`, value, colour: COLOURS[key] });
  }
  return chart(
    keys.map(([key, name]) => series(log, key, name)),
    lines,
  );
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
      ${data.series.map(
        (item) => svg`
          <polyline fill="none" stroke=${item.colour}
            points=${item.points.map((point) => `${String(x(point.time))},${String(y(point.value))}`).join(" ")}>
          </polyline>
          ${item.points.map(
            (point) =>
              svg`<circle class=${point.hollow ? "hollow" : "solid"} cx=${x(point.time)} cy=${y(point.value)} r="3"
                stroke=${item.colour} fill=${point.hollow ? "none" : item.colour}>
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
              <span class="swatch" style="background:${item.colour}"></span>${item.name}
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
