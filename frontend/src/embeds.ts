/**
 * The photos and charts the chat agent can put in a reply, as markdown images with a tankkeeper address:
 * `![The tank](tankkeeper:photo/<check id>)` and `![Nitrate](tankkeeper:chart/nitrate?days=30)`.
 * Only these addresses are read. Every other image address shows as text, so a reply never loads an outside image.
 */

export const CHARTS = [
  "ammonia",
  "nitrite",
  "nitrate",
  "phosphate",
  "ph",
  "kh",
  "gh",
  "temperature_c",
  "cycle",
  "light",
] as const;

export type ChartName = (typeof CHARTS)[number];

export type Embed =
  { kind: "photo"; id: string } | { kind: "chart"; chart: ChartName; days: number };

/** The most photos and charts one reply shows; the rest show as text. */
export const MAX_EMBEDS = 5;
export const DEFAULT_DAYS = 30;
export const MAX_DAYS = 365;
/** get_light reads at most this many days. */
export const LIGHT_MAX_DAYS = 30;

/** A photo check id is a ULID, as the backend checks it. */
const PHOTO_PREFIX = "tankkeeper:photo/";
const PHOTO = /^tankkeeper:photo\/[0-9A-HJKMNP-TV-Z]{26}$/;
const CHART = /^tankkeeper:chart\/([a-z_]+)(?:\?days=(\d+))?$/;

function isChart(name: string): name is ChartName {
  return (CHARTS as readonly string[]).includes(name);
}

/** The photo or chart an address names, or undefined when it names neither. */
export function parseEmbed(address: string): Embed | undefined {
  if (PHOTO.test(address)) return { kind: "photo", id: address.slice(PHOTO_PREFIX.length) };
  const chart = CHART.exec(address);
  const name = chart?.[1] ?? "";
  if (chart === null || !isChart(name)) return undefined;
  const most = name === "light" ? LIGHT_MAX_DAYS : MAX_DAYS;
  const asked = chart[2] === undefined ? DEFAULT_DAYS : Number(chart[2]);
  return { kind: "chart", chart: name, days: Math.min(most, Math.max(1, asked)) };
}
