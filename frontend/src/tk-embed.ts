import { css, html, nothing, type TemplateResult } from "lit";
import { isNotFound, type TankkeeperApi } from "./api";
import { TkView, shared } from "./base";
import {
  LABELS,
  cycleChart,
  lightRows,
  parameterChart,
  renderChart,
  renderLightChart,
  type Chart,
  type LightRow,
} from "./charts";
import { parseEmbed, type ChartName, type Embed } from "./embeds";
import { addDays, isoDate } from "./format";
import type { LightInfo, LogEntry, PhotoCheck, Status, TankInfo } from "./types";

/** As many tests as get_log lists at once. */
export const LOG_LIMIT = 500;
export const GONE = "The photo is no longer kept.";

type Shown =
  | { kind: "photo"; url: string | undefined }
  | { kind: "chart"; chart: Chart; label: string }
  | { kind: "light"; lights: { model: string; rows: LightRow[] }[] };

/** The photo link TankKeeper signs for this check: a path on Home Assistant itself, never another site. */
function photoLink(check: PhotoCheck, id: string): string | undefined {
  const url = check.photo_url;
  return url !== null && check.id === id && url.startsWith(`/api/tankkeeper/photos/${id}?`)
    ? url
    : undefined;
}

const pending = new WeakMap<TankkeeperApi, Map<string, Promise<unknown>>>();

/** A command's answer, asked once while the same command with the same arguments is still on its way. */
function ask<T>(api: TankkeeperApi, command: string, args?: Record<string, unknown>): Promise<T> {
  let calls = pending.get(api);
  if (calls === undefined) {
    calls = new Map();
    pending.set(api, calls);
  }
  const key = JSON.stringify([command, args]);
  const found = calls.get(key) as Promise<T> | undefined;
  if (found !== undefined) return found;
  const waiting = calls;
  const call = api.call<T>(command, args).finally(() => waiting.delete(key));
  waiting.set(key, call);
  return call;
}

/** Every test since the day, reading the log a page at a time, newest first. */
async function tests(api: TankkeeperApi, since: string): Promise<LogEntry[]> {
  const entries: LogEntry[] = [];
  const seen = new Set<string>();
  let until: string | undefined;
  for (;;) {
    const args = {
      kind: "test",
      since,
      ...(until === undefined ? {} : { until }),
      limit: LOG_LIMIT,
    };
    const page = (await ask<{ entries: LogEntry[] }>(api, "get_log", args)).entries;
    const fresh = page.filter((entry) => !seen.has(entry.id));
    for (const entry of fresh) {
      seen.add(entry.id);
      entries.push(entry);
      until = entry.time;
    }
    if (page.length < LOG_LIMIT || fresh.length === 0) return entries;
  }
}

const NAMES: Record<ChartName, string> = { ...LABELS, cycle: "Cycle", light: "Light" };

/**
 * A photo or chart in a chat reply. A photo loads through a link signed for the panel's own sign-in, as the Camera
 * card's do; a chart loads its data with the same commands as the Overview.
 */
export class TkEmbed extends TkView {
  static override properties = {
    ...TkView.properties,
    address: { type: String },
    alt: { type: String },
    shown: { state: true },
    large: { state: true },
  };

  static override styles = [
    shared,
    css`
      figure {
        margin: 8px 0;
      }
      figcaption {
        color: var(--secondary-text-color);
        font-size: 0.9em;
      }
      button.photo {
        display: block;
        padding: 0;
        border: none;
        background: none;
        cursor: zoom-in;
      }
      button.photo img {
        display: block;
        width: 100%;
        max-width: 480px;
        height: auto;
        border-radius: 8px;
      }
      .large {
        position: fixed;
        inset: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.85);
        cursor: zoom-out;
      }
      .large img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    `,
  ];

  declare address: string;
  declare alt: string;
  declare shown: Shown | undefined;
  declare large: boolean;

  constructor() {
    super();
    this.address = "";
    this.alt = "";
    this.shown = undefined;
    this.large = false;
  }

  protected override reloadOn(): string[] {
    return ["api", "address"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const embed = parseEmbed(this.address);
    const shown = embed === undefined ? undefined : await this.fetch(api, embed);
    return () => {
      this.shown = shown;
    };
  }

  private async fetch(api: TankkeeperApi, embed: Embed): Promise<Shown> {
    if (embed.kind === "photo") {
      const check = await ask<PhotoCheck>(api, "get_photo_check", { check_id: embed.id }).catch(
        (error: unknown) => {
          if (isNotFound(error)) return undefined;
          throw error;
        },
      );
      return { kind: "photo", url: check === undefined ? undefined : photoLink(check, embed.id) };
    }
    const { chart, days } = embed;
    if (chart === "light") {
      const info = await ask<LightInfo>(api, "get_light", { days });
      const lights = info.lights.map((light) => ({
        model: light.model,
        rows: lightRows(light.on_periods, info.today, days, api.timeZone),
      }));
      return { kind: "light", lights };
    }
    const since = addDays(isoDate(new Date(), api.timeZone), -days);
    const [entries, status] = await Promise.all([
      tests(api, since),
      ask<Status>(api, "get_status"),
    ]);
    const label = NAMES[chart];
    if (chart === "cycle") {
      return { kind: "chart", chart: cycleChart(entries, status.settings), label };
    }
    const tank = await ask<TankInfo>(api, "get_tank");
    const found = parameterChart(
      entries,
      chart,
      status.settings,
      tank.tank.temperature_c,
      tank.water,
    );
    return { kind: "chart", chart: found.chart, label };
  }

  private caption(embed: Embed): string {
    if (this.alt !== "") return this.alt;
    if (embed.kind === "photo") return "The tank";
    return `${NAMES[embed.chart]}, last ${String(embed.days)} days`;
  }

  private open(): void {
    this.large = true;
    void this.updateComplete.then(() =>
      this.renderRoot.querySelector<HTMLElement>(".large")?.focus(),
    );
  }

  private close(): void {
    this.large = false;
    void this.updateComplete.then(() =>
      this.renderRoot.querySelector<HTMLElement>("button.photo")?.focus(),
    );
  }

  /** The larger photo is the dialog's only stop, so Tab stays on it and Escape closes it. */
  private keydown(event: KeyboardEvent): void {
    if (event.key === "Tab") event.preventDefault();
    if (event.key === "Escape") this.close();
  }

  private renderPhoto(url: string | undefined, caption: string): TemplateResult {
    if (url === undefined) return html`<p class="muted">${GONE}</p>`;
    return html`<button
        class="photo"
        aria-label="Open the photo larger"
        @click=${() => {
          this.open();
        }}
      >
        <img
          src=${url}
          alt=${caption}
          @error=${() => {
            this.shown = { kind: "photo", url: undefined };
          }}
        />
      </button>
      ${
        this.large
          ? html`<div
              class="large"
              role="dialog"
              aria-modal="true"
              aria-label=${caption}
              tabindex="-1"
              @click=${() => {
                this.close();
              }}
              @keydown=${(event: KeyboardEvent) => {
                this.keydown(event);
              }}
            >
              <img src=${url} alt=${caption} />
            </div>`
          : nothing
      }`;
  }

  private renderShown(shown: Shown, caption: string): TemplateResult {
    if (shown.kind === "photo") return this.renderPhoto(shown.url, caption);
    if (shown.kind === "chart") return renderChart(shown.chart, shown.label);
    if (shown.lights.length === 0) return html`<p class="muted">No lights yet</p>`;
    return html`${shown.lights.map(
      (light) =>
        html`<div class="muted">${light.model}</div>
          ${renderLightChart(light.rows)}`,
    )}`;
  }

  override render(): TemplateResult {
    const embed = parseEmbed(this.address);
    if (embed === undefined) return html`![${this.alt}](${this.address})`;
    const caption = this.caption(embed);
    const shown = this.shown;
    return html`<figure>
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      ${shown === undefined ? nothing : this.renderShown(shown, caption)}
      <figcaption>${caption}</figcaption>
    </figure>`;
  }
}

customElements.define("tk-embed", TkEmbed);
