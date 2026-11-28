import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";

/** Where a contents item sits, seen from above with the front (the camera side) at the bottom. */
export const ZONES: Record<string, string> = {
  back_left: "Back left",
  back_middle: "Back middle",
  back_right: "Back right",
  front_left: "Front left",
  front_middle: "Front middle",
  front_right: "Front right",
};

/** The name of a zone, or Not placed. */
export function zoneLabel(zone: unknown): string {
  return (typeof zone === "string" ? ZONES[zone] : undefined) ?? "Not placed";
}

export interface MapItem {
  id: string;
  number?: number;
  name?: string;
  zone?: string | null;
}

/** Moves a contents item to a zone, or off the map when zone is null. */
export interface MoveDetail {
  id: string;
  zone: string | null;
}

export const MOVE = "tk-move";
const DRAG_TYPE = "application/x-tankkeeper-content";
const NOT_PLACED = "none";

/** The tank seen from above in six zones, and the items not placed. Drag an item, or pick it then a zone, to move it. */
export class TkTankMap extends LitElement {
  static override properties = {
    items: { attribute: false },
    disabled: { type: Boolean },
    picked: { state: true },
  };

  static override styles = css`
    :host {
      display: block;
    }
    .edge {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .tank {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      border: 3px solid var(--info-color, #64b5f6);
      border-radius: 6px;
      overflow: hidden;
    }
    .zone {
      min-height: 96px;
      padding: 8px;
      border: 1px dashed var(--divider-color);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .zone.none {
      min-height: 0;
      margin-top: 8px;
      border-radius: 8px;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
    }
    button:disabled {
      cursor: default;
    }
    button.zone-name {
      align-self: flex-start;
      padding: 2px 4px;
      border: none;
      background: none;
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    button.zone-name:not(:disabled) {
      color: var(--primary-color);
      text-decoration: underline;
    }
    button.chip {
      display: flex;
      align-items: center;
      gap: 6px;
      min-height: 32px;
      padding: 2px 10px 2px 2px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      background: var(--card-background-color, #fff);
      font-size: 13px;
    }
    button.chip[aria-pressed="true"] {
      box-shadow: 0 0 0 2px var(--primary-color);
    }
    button.chip b {
      min-width: 24px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
    }
  `;

  declare items: MapItem[];
  declare disabled: boolean;
  declare picked: string | undefined;

  constructor() {
    super();
    this.items = [];
    this.disabled = false;
    this.picked = undefined;
  }

  private move(id: string, zone: string): void {
    this.picked = undefined;
    const item = this.items.find((candidate) => candidate.id === id);
    const target = zone === NOT_PLACED ? null : zone;
    if (item === undefined || (item.zone ?? null) === target) return;
    this.dispatchEvent(
      new CustomEvent<MoveDetail>(MOVE, {
        detail: { id, zone: target },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private chip(item: MapItem): TemplateResult {
    return html`<button
      type="button"
      class="chip"
      data-id=${item.id}
      draggable="true"
      aria-pressed=${this.picked === item.id ? "true" : "false"}
      ?disabled=${this.disabled}
      @click=${() => (this.picked = this.picked === item.id ? undefined : item.id)}
      @dragstart=${(event: DragEvent) => {
        event.dataTransfer?.setData(DRAG_TYPE, item.id);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      }}
    >
      <b>${item.number ?? nothing}</b> ${item.name ?? ""}
    </button>`;
  }

  private zone(zone: string, label: string, items: MapItem[]): TemplateResult {
    const picked = this.picked;
    return html`<div
      class="zone ${zone === NOT_PLACED ? NOT_PLACED : ""}"
      data-zone=${zone}
      @dragover=${(event: DragEvent) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      }}
      @drop=${(event: DragEvent) => {
        event.preventDefault();
        const id = event.dataTransfer?.getData(DRAG_TYPE) ?? "";
        if (id !== "") this.move(id, zone);
      }}
    >
      <button
        type="button"
        class="zone-name"
        ?disabled=${this.disabled || picked === undefined}
        @click=${() => {
          if (picked !== undefined) this.move(picked, zone);
        }}
      >
        ${label}
      </button>
      <div class="chips">
        ${repeat(
          items,
          (item) => item.id,
          (item) => this.chip(item),
        )}
      </div>
    </div>`;
  }

  override render(): TemplateResult {
    const placed = (zone: string | null): MapItem[] =>
      this.items.filter(
        (item) => (typeof item.zone === "string" && item.zone in ZONES ? item.zone : null) === zone,
      );
    return html`
      <div class="edge">BACK</div>
      <div class="tank">
        ${Object.entries(ZONES).map(([zone, label]) => this.zone(zone, label, placed(zone)))}
      </div>
      <div class="edge">FRONT (camera side)</div>
      ${this.zone(NOT_PLACED, "Not placed", placed(null))}
    `;
  }
}

customElements.define("tk-tank-map", TkTankMap);

declare global {
  interface HTMLElementTagNameMap {
    "tk-tank-map": TkTankMap;
  }
}
