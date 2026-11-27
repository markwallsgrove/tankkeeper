import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { historyDetails } from "../settings";
import { saveAndClear } from "../tk-form";
import "../tk-history";
import type { Field, Values } from "../types";

interface Item {
  id: string;
  removed?: string | null;
  [key: string]: unknown;
}

/** How a kind of record is edited in the panel. */
interface Edit {
  idArg: string;
  add: string;
  update: string;
  remove: string;
  fields: Field[];
}

/** A kind of record. A setting changes in the options and is read-only here; the rest carry an Edit. */
interface Kind {
  title: string;
  edit?: Edit;
  collection: string;
  list: string;
  key: string;
  canShowRemoved: boolean;
  label: (item: Item) => string;
  lines: (item: Item) => string[];
}

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
    canShowRemoved: true,
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
      lines.push(str(item.notes));
      if (Array.isArray(item.links)) lines.push(item.links.map(str).join(" "));
      return lines;
    },
  },
  contents: {
    title: "Contents",
    collection: "contents",
    list: "list_contents",
    key: "contents",
    canShowRemoved: true,
    label: (item) => str(item.name),
    lines: (item) => [
      [str(item.type), str(item.count), str(item.where), `added ${str(item.added)}`]
        .filter((part) => part !== "")
        .join(" · "),
      str(item.notes),
    ],
  },
  notes: {
    title: "Notes",
    collection: "notes",
    list: "list_notes",
    key: "notes",
    edit: {
      idArg: "note_id",
      add: "add_note",
      update: "update_note",
      remove: "remove_note",
      fields: [
        { name: "kind", label: "Kind", type: "select", options: ["question", "assumption"] },
        { name: "topic", label: "Topic", type: "text" },
        { name: "text", label: "Text", type: "textarea" },
        { name: "how_to_resolve", label: "How to resolve", type: "textarea" },
      ],
    },
    canShowRemoved: false,
    label: (item) => `${str(item.kind)}: ${str(item.topic)}`,
    lines: (item) => [str(item.text), str(item.how_to_resolve)],
  },
};

/** Products, contents or notes: list them with each record's history and undo. Notes are added, edited and removed here. */
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

  private async save(edit: Edit, tool: string, values: Values, id?: string): Promise<boolean> {
    if (Object.keys(values).length === 0) return false;
    const args = id === undefined ? values : { [edit.idArg]: id, ...values };
    return this.run((api) => api.call(tool, args));
  }

  private async removeRecord(edit: Edit, id: string): Promise<void> {
    await this.run((api) => api.call(edit.remove, { [edit.idArg]: id }));
  }

  private status(edit: Edit | undefined, item: Item): TemplateResult | typeof nothing {
    if (typeof item.removed === "string")
      return html`<span class="muted">Removed ${item.removed}</span>`;
    if (edit === undefined) return nothing;
    return html`<button
      class="remove"
      ?disabled=${this.busy}
      @click=${() => this.removeRecord(edit, item.id)}
    >
      Remove
    </button>`;
  }

  private details(config: Kind, item: Item): TemplateResult {
    const edit = config.edit;
    if (edit === undefined)
      return historyDetails(this.api, config.collection, item.id, this.version);
    return html`<details>
      <summary>Edit and history</summary>
      <tk-form
        .fields=${edit.fields}
        .values=${item}
        .busy=${this.busy}
        @tk-save=${(event: CustomEvent<Values>) => this.save(edit, edit.update, event.detail, item.id)}
      ></tk-form>
      <tk-history
        .api=${this.api}
        .collection=${config.collection}
        .recordId=${item.id}
        .stamp=${this.version}
      ></tk-history>
    </details>`;
  }

  private item(config: Kind, item: Item): TemplateResult {
    return html`<li data-id=${item.id}>
      <div class="row">
        <strong class="grow">${config.label(item)}</strong>
        ${this.status(config.edit, item)}
      </div>
      ${config
        .lines(item)
        .filter((line) => line !== "")
        .map((line) => html`<div class="muted pre">${line}</div>`)}
      ${this.details(config, item)}
    </li>`;
  }

  private add(edit: Edit | undefined): TemplateResult | typeof nothing {
    if (edit === undefined) return nothing;
    return html`<section>
      <h2>Add</h2>
      <tk-form
        class="add"
        .fields=${edit.fields}
        submitLabel="Add"
        .busy=${this.busy}
        @tk-save=${(event: CustomEvent<Values>) =>
          saveAndClear(event, (values) => this.save(edit, edit.add, values))}
      ></tk-form>
    </section>`;
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
      ${this.add(config.edit)}
    `;
  }
}

customElements.define("tk-records", TkRecords);
