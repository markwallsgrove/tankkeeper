import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { TankkeeperApi } from "./api";
import type { HomeAssistant } from "./types";
import "./views/claude";
import "./views/conversations";
import "./views/decisions";
import "./views/log";
import "./views/overview";
import "./views/plan";
import "./views/records";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["plan", "Plan"],
  ["log", "Log"],
  ["contents", "Contents"],
  ["products", "Products"],
  ["decisions", "Decisions"],
  ["notes", "Notes"],
  ["conversations", "Conversations"],
  ["claude", "Claude"],
];

/** The Tankkeeper sidebar panel. Home Assistant sets hass and narrow. */
export class TankkeeperPanel extends LitElement {
  static override properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    tab: { state: true },
    api: { state: true },
  };

  static override styles = css`
    :host {
      display: block;
      min-height: 100%;
      background: var(--primary-background-color);
      color: var(--primary-text-color);
      font-family: var(--ha-font-family-body, inherit);
    }
    header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      height: var(--header-height, 56px);
      background: var(--app-header-background-color, var(--primary-color));
      color: var(--app-header-text-color, var(--text-primary-color, #fff));
    }
    h1 {
      font-size: 1.25em;
      font-weight: 400;
      margin: 0;
    }
    nav {
      display: flex;
      overflow-x: auto;
      border-bottom: 1px solid var(--divider-color);
      background: var(--card-background-color, #fff);
    }
    button.tab {
      font: inherit;
      flex: 0 0 auto;
      padding: 12px 14px;
      border: none;
      border-bottom: 2px solid transparent;
      background: none;
      color: var(--secondary-text-color);
      cursor: pointer;
    }
    button.tab[aria-selected="true"] {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 12px 16px;
      box-sizing: border-box;
    }
  `;

  declare hass: HomeAssistant | undefined;
  declare narrow: boolean;
  declare tab: string;
  declare api: TankkeeperApi | undefined;

  constructor() {
    super();
    this.hass = undefined;
    this.narrow = false;
    this.tab = "overview";
    this.api = undefined;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has("hass") &&
      this.hass !== undefined &&
      this.connection !== this.hass.connection
    ) {
      this.connection = this.hass.connection;
      this.api = new TankkeeperApi(this.hass.connection, this.hass.config?.time_zone);
    }
  }

  private connection: HomeAssistant["connection"] | undefined = undefined;

  private view(): TemplateResult {
    switch (this.tab) {
      case "plan":
        return html`<tk-plan .api=${this.api}></tk-plan>`;
      case "log":
        return html`<tk-log .api=${this.api}></tk-log>`;
      case "decisions":
        return html`<tk-decisions .api=${this.api}></tk-decisions>`;
      case "claude":
        return html`<tk-claude .api=${this.api}></tk-claude>`;
      case "conversations":
        return html`<tk-conversations .api=${this.api}></tk-conversations>`;
      case "contents":
      case "products":
      case "notes":
        return html`${keyed(this.tab, html`<tk-records .api=${this.api} .kind=${this.tab}></tk-records>`)}`;
      default:
        return html`<tk-overview .api=${this.api}></tk-overview>`;
    }
  }

  override render(): TemplateResult {
    return html`
      <header>
        ${this.narrow ? html`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>` : nothing}
        <h1>Tankkeeper</h1>
      </header>
      <nav role="tablist">
        ${TABS.map(
          ([tab, label]) =>
            html`<button
              class="tab"
              role="tab"
              data-tab=${tab}
              aria-selected=${this.tab === tab ? "true" : "false"}
              @click=${() => (this.tab = tab)}
            >
              ${label}
            </button>`,
        )}
      </nav>
      <main>${this.view()}</main>
    `;
  }
}

customElements.define("tankkeeper-panel", TankkeeperPanel);
