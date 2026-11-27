import { LitElement, css, type PropertyValues } from "lit";
import { errorMessage, type TankkeeperApi } from "./api";

/** Fired when a record changed, so the views that show it load again. */
export const CHANGED = "tk-changed";

export const shared = css`
  :host {
    display: block;
    color: var(--primary-text-color);
  }
  section,
  .card {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border-radius: var(--ha-card-border-radius, 12px);
    border: 1px solid var(--divider-color);
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 1.1em;
    margin: 0 0 8px;
  }
  h3 {
    font-size: 1em;
    margin: 8px 0 4px;
  }
  .pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  select,
  input {
    font: inherit;
    max-width: 100%;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    padding: 6px 0;
    border-bottom: 1px solid var(--divider-color);
    overflow-wrap: anywhere;
  }
  li:last-child {
    border-bottom: none;
  }
  button {
    font: inherit;
    padding: 4px 10px;
    border: 1px solid var(--primary-color);
    border-radius: 4px;
    color: var(--primary-color);
    background: none;
    cursor: pointer;
  }
  button.primary {
    color: var(--text-primary-color, #fff);
    background: var(--primary-color);
  }
  .muted {
    color: var(--secondary-text-color);
    font-size: 0.9em;
  }
  .error {
    color: var(--error-color);
  }
  .level.watch {
    color: var(--warning-color);
  }
  .level.act {
    color: var(--error-color);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .grow {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  details {
    margin-top: 6px;
  }
  summary {
    cursor: pointer;
    color: var(--primary-color);
  }
  .chart {
    width: 100%;
    height: auto;
    max-height: 220px;
  }
  .chart .axis {
    stroke: var(--divider-color);
  }
  .chart .tick {
    font-size: 9px;
    fill: var(--secondary-text-color);
  }
  .chart .target {
    stroke-dasharray: 4 3;
  }
  .chart .off {
    fill: var(--divider-color);
  }
  .chart .on {
    fill: var(--warning-color, #f4b400);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.85em;
  }
  .legend li {
    border: none;
    padding: 0;
  }
  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 4px;
  }
  .swatch.hollow {
    box-sizing: border-box;
    border: 2px solid;
    background: none;
  }
  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .charts h3 {
    margin-top: 0;
  }
  dl.facts {
    display: grid;
    grid-template-columns: minmax(120px, max-content) 1fr;
    gap: 4px 12px;
    margin: 0 0 8px;
  }
  dl.facts dt {
    color: var(--secondary-text-color);
  }
  dl.facts dd {
    margin: 0;
    min-width: 0;
  }
  ha-icon-button.settings {
    color: var(--secondary-text-color);
    margin: -8px -8px -8px 0;
  }
  .dash {
    display: inline-block;
    width: 14px;
    border-top: 2px dashed;
    margin-right: 4px;
    vertical-align: middle;
  }
`;

/** Opens Assist in Home Assistant's frontend, which handles the action event. */
const ASSIST = {
  config: { tap_action: { action: "assist", start_listening: false } },
  action: "tap",
};

/** Ask Home Assistant's frontend to open Assist, from an element inside the panel. */
export function openAssist(from: HTMLElement): void {
  from.dispatchEvent(
    new CustomEvent("hass-action", { detail: ASSIST, bubbles: true, composed: true }),
  );
}

/** A view that loads from the API, and loads again when a record it shows changed. */
export abstract class TkView extends LitElement {
  static override properties = {
    api: { attribute: false },
    error: { state: true },
    busy: { state: true },
    version: { state: true },
  };

  declare api: TankkeeperApi | undefined;
  declare error: string;
  declare busy: boolean;
  declare version: number;
  private loads = 0;

  constructor() {
    super();
    this.api = undefined;
    this.error = "";
    this.busy = false;
    this.version = 0;
    this.addEventListener(CHANGED, (event) => {
      if (event.composedPath()[0] !== this) void this.reload();
    });
  }

  /** The properties that make the view load again. */
  protected reloadOn(): string[] {
    return ["api"];
  }

  /** Fetch what the view shows. The function it returns puts it on screen. */
  protected abstract load(api: TankkeeperApi): Promise<() => void>;

  protected override willUpdate(changed: PropertyValues): void {
    if (this.reloadOn().some((name) => changed.has(name))) void this.reload();
  }

  /** Load again. Only the latest load is shown, so a slow older answer can't replace a newer one. */
  async reload(): Promise<void> {
    const api = this.api;
    if (api === undefined) return;
    this.loads += 1;
    const load = this.loads;
    try {
      const show = await this.load(api);
      if (load !== this.loads) return;
      show();
      this.error = "";
      this.version += 1;
    } catch (error: unknown) {
      if (load === this.loads) this.error = errorMessage(error);
    }
  }

  /** Run an action, then load again. Returns whether it worked. */
  protected async run(action: (api: TankkeeperApi) => Promise<unknown>): Promise<boolean> {
    const api = this.api;
    if (api === undefined) return false;
    this.busy = true;
    try {
      await action(api);
      this.error = "";
      await this.reload();
      return true;
    } catch (error: unknown) {
      this.error = errorMessage(error);
      return false;
    } finally {
      this.busy = false;
    }
  }

  /** Tell the views around this one that a record changed. */
  protected changed(): void {
    this.dispatchEvent(new CustomEvent(CHANGED, { bubbles: true, composed: true }));
  }
}
