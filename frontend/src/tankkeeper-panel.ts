import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { TankkeeperApi } from "./api";
import { CHAT, type ChatStart } from "./base";
import type { HomeAssistant, PanelInfo, Route } from "./types";
import "./views/chat";
import type { TkChat } from "./views/chat";
import "./views/claude";
import "./views/conversations";
import "./views/decisions";
import "./views/log";
import "./views/overview";
import "./views/plan";
import "./views/records";

/** The query parameters a notification's Discuss link opens the chat with. Ids are plain, as TankKeeper makes them. */
const DISCUSS_KINDS = ["proposal", "photo", "review", "status"] as const;
const PLAIN_ID = /^[0-9A-Za-z_-]{1,64}$/;

/** The item a notification's address names, if it names one TankKeeper could have made. */
export function discussed(search: string): ChatStart | undefined {
  const query = new URLSearchParams(search);
  for (const kind of DISCUSS_KINDS) {
    const id = query.get(kind);
    if (id === null) continue;
    const valid = kind === "status" ? id === "now" : PLAIN_ID.test(id);
    return valid ? { kind, id } : undefined;
  }
  return undefined;
}

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["chat", "Chat"],
  ["plan", "Plan"],
  ["log", "Log"],
  ["contents", "Contents"],
  ["products", "Products"],
  ["decisions", "Decisions"],
  ["notes", "Notes"],
  ["conversations", "Conversations"],
  ["claude", "Claude"],
];

/** The TankKeeper sidebar panel. Home Assistant sets hass, panel and narrow. */
export class TankkeeperPanel extends LitElement {
  static override properties = {
    hass: { attribute: false },
    panel: { attribute: false },
    narrow: { type: Boolean },
    route: { attribute: false },
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
  declare panel: PanelInfo | undefined;
  declare narrow: boolean;
  declare route: Route | undefined;
  declare tab: string;
  declare api: TankkeeperApi | undefined;

  constructor() {
    super();
    this.hass = undefined;
    this.panel = undefined;
    this.narrow = false;
    this.route = undefined;
    this.addEventListener(CHAT, (event) => {
      this.openChat((event as CustomEvent<ChatStart>).detail);
    });
    this.tab = "overview";
    this.api = undefined;
  }

  /** The chat stays the same element, so what was said stays while other tabs are open. */
  private readonly chat = document.createElement("tk-chat") as TkChat;

  override connectedCallback(): void {
    super.connectedCallback();
    this.followAddress();
  }

  /** Open the chat about the item the address names, then take it out of the address so a reload does not again. */
  private followAddress(): void {
    const start = discussed(window.location.search);
    if (window.location.search !== "") {
      history.replaceState(history.state, "", window.location.pathname);
    }
    if (start !== undefined) this.openChat(start);
  }

  private openChat(start: ChatStart): void {
    this.chat.start = { ...start };
    this.tab = "chat";
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("route")) this.followAddress();
    this.updateApi(changed);
    this.chat.api = this.api;
  }

  private updateApi(changed: PropertyValues<this>): void {
    const hass = this.hass;
    if (hass === undefined || !(changed.has("hass") || changed.has("panel"))) return;
    const entryId = this.panel?.config?.entry_id;
    if (this.connection === hass.connection && this.api?.entryId === entryId) return;
    this.connection = hass.connection;
    this.api = new TankkeeperApi(hass.connection, hass.config?.time_zone, entryId);
  }

  private connection: HomeAssistant["connection"] | undefined = undefined;

  private view(): TemplateResult {
    switch (this.tab) {
      case "chat":
        return html`${this.chat}`;
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
        <h1>TankKeeper</h1>
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
