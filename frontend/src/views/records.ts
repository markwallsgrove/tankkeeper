import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { saveAndClear } from "../tk-form";
import "../tk-history";
import type { Field, Values } from "../types";

interface Item {
  id: string;
  removed?: string | null;
  [key: string]: unknown;
}

interface Kind {
  title: string;
  collection: string;
  list: string;
  key: string;
  idArg: string;
  add: string;
  update: string;
  remove: string;
  canShowRemoved: boolean;
  fields: Field[];
  label: (item: Item) => string;
  lines: (item: Item) => string[];
  values: (item: Item) => Values;
}

const CONTENT_TYPES = ["plant", "rock", "wood", "substrate", "decoration", "fish", "other"];

function str(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

interface LabelDose {
  amount_ml?: number;
  per_litres?: number;
  frequency?: string;
}

function labelDose(item: Item): LabelDose {
  return item.label_dose ?? {};
}

const KINDS: Record<string, Kind> = {
  products: {
    title: "Products",
    collection: "products",
    list: "list_products",
    key: "products",
    idArg: "product_id",
    add: "add_product",
    update: "update_product",
    remove: "remove_product",
    canShowRemoved: true,
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "purpose", label: "Purpose", type: "text" },
      { name: "label_amount_ml", label: "Label dose (ml)", type: "number" },
      { name: "label_per_litres", label: "Label dose is for (litres)", type: "number" },
      { name: "label_frequency", label: "Label frequency", type: "text" },
      { name: "your_dose", label: "Your dose", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" },
      { name: "links", label: "Links, one per line", type: "list" },
    ],
    label: (item) => str(item.name),
    lines: (item) => {
      const dose = labelDose(item);
      const lines = [str(item.purpose)];
      if (item.label_dose) {
        const forTank =
          item.label_dose_for_tank_ml === undefined
            ? ""
            : ` (${str(item.label_dose_for_tank_ml)} ml for this tank)`;
        lines.push(
          `Label: ${str(dose.amount_ml)} ml per ${str(dose.per_litres)} l, ${str(dose.frequency)}${forTank}`,
        );
      }
      if (str(item.your_dose)) lines.push(`Your dose: ${str(item.your_dose)}`);
      return lines;
    },
    values: (item) => {
      const dose = labelDose(item);
      return {
        ...item,
        label_amount_ml: dose.amount_ml,
        label_per_litres: dose.per_litres,
        label_frequency: dose.frequency,
      };
    },
  },
  contents: {
    title: "Contents",
    collection: "contents",
    list: "list_contents",
    key: "contents",
    idArg: "content_id",
    add: "add_content",
    update: "update_content",
    remove: "remove_content",
    canShowRemoved: true,
    fields: [
      { name: "type", label: "Type", type: "select", options: CONTENT_TYPES },
      { name: "name", label: "Name", type: "text" },
      { name: "count", label: "Count", type: "number", step: "1" },
      { name: "where", label: "Where", type: "text" },
      { name: "added", label: "Added", type: "date" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    label: (item) => str(item.name),
    lines: (item) => [
      [str(item.type), str(item.count), str(item.where), `added ${str(item.added)}`]
        .filter((part) => part !== "")
        .join(" · "),
      str(item.notes),
    ],
    values: (item) => item,
  },
  notes: {
    title: "Notes",
    collection: "notes",
    list: "list_notes",
    key: "notes",
    idArg: "note_id",
    add: "add_note",
    update: "update_note",
    remove: "remove_note",
    canShowRemoved: false,
    fields: [
      { name: "kind", label: "Kind", type: "select", options: ["question", "assumption"] },
      { name: "topic", label: "Topic", type: "text" },
      { name: "text", label: "Text", type: "textarea" },
      { name: "how_to_resolve", label: "How to resolve", type: "textarea" },
    ],
    label: (item) => `${str(item.kind)}: ${str(item.topic)}`,
    lines: (item) => [str(item.text), str(item.how_to_resolve)],
    values: (item) => item,
  },
};

/** Products, contents or notes: list, add, edit, remove, and each record's history with undo. */
export class TkRecords extends TkView {
  static override properties = {
    ...TkView.properties,
    kind: { attribute: false },
    items: { state: true },
    showRemoved: { state: true },
  };

  static override styles = shared;

  declare kind: string;
  declare items: Item[];
  declare showRemoved: boolean;

  constructor() {
    super();
    this.kind = "";
    this.items = [];
    this.showRemoved = false;
  }

  private get config(): Kind {
    const config = KINDS[this.kind];
    if (config === undefined) throw new Error(`No records called ${this.kind}`);
    return config;
  }

  protected override reloadOn(): string[] {
    return ["api", "kind", "showRemoved"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const config = this.config;
    const args = config.canShowRemoved ? { include_removed: this.showRemoved } : {};
    const items = (await api.call<Record<string, Item[]>>(config.list, args))[config.key] ?? [];
    return () => {
      this.items = items;
    };
  }

  private async save(tool: string, values: Values, id?: string): Promise<boolean> {
    if (Object.keys(values).length === 0) return false;
    const args = id === undefined ? values : { [this.config.idArg]: id, ...values };
    return this.run((api) => api.call(tool, args));
  }

  private async removeRecord(id: string): Promise<void> {
    await this.run((api) => api.call(this.config.remove, { [this.config.idArg]: id }));
  }

  private item(config: Kind, item: Item): TemplateResult {
    const removed = typeof item.removed === "string";
    return html`<li data-id=${item.id}>
      <div class="row">
        <strong class="grow">${config.label(item)}</strong>
        ${
          removed
            ? html`<span class="muted">Removed ${item.removed}</span>`
            : html`<button
                class="remove"
                ?disabled=${this.busy}
                @click=${() => this.removeRecord(item.id)}
              >
                Remove
              </button>`
        }
      </div>
      ${config
        .lines(item)
        .filter((line) => line !== "")
        .map((line) => html`<div class="muted">${line}</div>`)}
      <details>
        <summary>Edit and history</summary>
        <tk-form
          .fields=${config.fields}
          .values=${config.values(item)}
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) => this.save(config.update, event.detail, item.id)}
        ></tk-form>
        <tk-history
          .api=${this.api}
          .collection=${config.collection}
          .recordId=${item.id}
          .stamp=${this.version}
        ></tk-history>
      </details>
    </li>`;
  }

  override render(): TemplateResult {
    const config = this.config;
    return html`
      <section>
        <div class="row">
          <h2 class="grow">${config.title}</h2>
          ${
            config.canShowRemoved
              ? html`<label class="muted"
                  ><input
                    type="checkbox"
                    class="show-removed"
                    .checked=${this.showRemoved}
                    @change=${(event: Event) => (this.showRemoved = (event.target as HTMLInputElement).checked)}
                  />
                  Show removed</label
                >`
              : nothing
          }
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
        <ul>
          ${repeat(
            this.items,
            (item) => item.id,
            (item) => this.item(config, item),
          )}
        </ul>
      </section>
      <section>
        <h2>Add</h2>
        <tk-form
          class="add"
          .fields=${config.fields}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) =>
            saveAndClear(event, (values) => this.save(config.add, values))}
        ></tk-form>
      </section>
    `;
  }
}

customElements.define("tk-records", TkRecords);
