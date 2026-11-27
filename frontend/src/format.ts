import type { Change, LogEntry } from "./types";

const SOURCES: Record<string, string> = {
  panel: "Panel",
  mcp: "Claude (MCP)",
  assist: "Assist",
  notification: "Notification",
  rule: "Rule",
  review: "Review",
  camera: "Camera",
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The date as YYYY-MM-DD and the minutes since midnight, in a time zone or the browser's. */
export function zoned(date: Date, timeZone?: string): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string): string => parts.find((item) => item.type === type)?.value ?? "";
  return {
    day: `${part("year")}-${part("month")}-${part("day")}`,
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

/** The date as YYYY-MM-DD, in a time zone or the browser's. */
export function isoDate(date: Date, timeZone?: string): string {
  return zoned(date, timeZone).day;
}

export function addDays(day: string, days: number): string {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
}

/** A time as local YYYY-MM-DD HH:MM. */
export function shortTime(time: string): string {
  const date = new Date(time);
  return `${isoDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function sourceText(source: string): string {
  return SOURCES[source] ?? source;
}

function valueText(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function changeText(change: Change): string {
  if (change.before === null) return `Added to ${change.collection}`;
  if (change.after === null) return `Removed from ${change.collection}`;
  const { before, after } = change;
  const fields = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  const parts = fields.map((key) => `${key} ${valueText(before[key])} → ${valueText(after[key])}`);
  return `${change.collection}: ${parts.join(", ")}`;
}

function withNotes(text: string, ...extra: (string | null | undefined)[]): string {
  const notes = extra.filter((item): item is string => typeof item === "string" && item !== "");
  return [text, ...notes].join(". ");
}

export function logText(entry: LogEntry): string {
  if (entry.kind === "dose") {
    return withNotes(
      `Dose: ${entry.product ?? ""} ${String(entry.amount_ml ?? 0)} ml`,
      entry.why,
      entry.notes,
    );
  }
  if (entry.kind === "test") {
    const values = Object.entries(entry.values ?? {})
      .map(([key, value]) => `${key} ${String(value)}`)
      .join(", ");
    const where = entry.source === "tap" ? "Tap" : "Tank";
    return withNotes(`${where} test: ${values}`, entry.notes);
  }
  const parts = [...(entry.tasks ?? [])];
  if (typeof entry.water_change_percent === "number") {
    parts.push(`${String(entry.water_change_percent)}% water change`);
  }
  if (typeof entry.water_litres === "number") parts.push(`${String(entry.water_litres)} l water`);
  return withNotes(parts.join(". "), entry.why, entry.notes);
}
