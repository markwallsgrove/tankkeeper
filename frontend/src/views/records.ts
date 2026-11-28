import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { DELETE, PENCIL, PLUS, iconButton } from "../buttons";
import "../tk-history";
import { type MapItem, type MoveDetail, zoneLabel } from "../tank-map";
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

/** A kind of record. A setting changes in the options and is read-only here, except for a contents item's zone on the map; the rest carry an Edit. */
interface Kind {
  title: string;
  /** One record, in words. */
  noun: string;
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
    noun: "product",
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
    noun: "content",
    collection: "contents",
    list: "list_contents",
    key: "contents",
    canShowRemoved: true,
    label: (item) => [str(item.number), str(item.name)].filter((part) => part !== "").join(" "),
    lines: (item) => [
      [
        str(item.type),
        str(item.count),
        zoneLabel(item.zone),
        str(item.where),
        `added ${str(item.added)}`,
      ]
        .filter((part) => part !== "")
        .join(" · "),
      Array.isArray(item.aliases) && item.aliases.length > 0
        ? `Also called: ${item.aliases.map(str).join(", ")}`
        : "",
      str(item.notes),
    ],
  },
  notes: {
    title: "Notes",
    noun: "note",
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

  private map(): TemplateResult | typeof nothing {
    if (this.kind !== "contents") return nothing;
    const placeable = this.items.filter((item) => typeof item.removed !== "string") as MapItem[];
    return html`<tk-tank-map
      .items=${placeable}
      ?disabled=${this.busy}
      @tk-move=${(event: CustomEvent<MoveDetail>) =>
        void this.run((api) =>
          api.call("update_content", { content_id: event.detail.id, zone: event.detail.zone }),
        )}
    ></tk-tank-map>`;
  }

  private actions(config: Kind, item: Item): TemplateResult {
    const edit = config.edit;
    const removed = typeof item.removed === "string";
    return html`<div class="actions">
      ${removed ? html`<span class="muted">Removed ${item.removed}</span>` : nothing}
      ${
        edit === undefined
          ? nothing
          : iconButton({
              icon: PENCIL,
              label: "Edit",
              className: "edit",
              disabled: this.busy,
              onClick: () => {
                this.openDialog(`edit:${item.id}`);
              },
            })
      }
      ${this.historyButton(config.collection, item.id)}
      ${
        edit === undefined || removed
          ? nothing
          : iconButton({
              icon: DELETE,
              label: "Remove",
              className: "remove",
              disabled: this.busy,
              onClick: () => void this.removeRecord(edit, item.id),
            })
      }
    </div>`;
  }

  private item(config: Kind, item: Item): TemplateResult {
    const edit = config.edit;
    return html`<li data-id=${item.id}>
      <div class="row">
        <strong class="grow">${config.label(item)}</strong>
        ${this.actions(config, item)}
      </div>
      ${config
        .lines(item)
        .filter((line) => line !== "")
        .map((line) => html`<div class="muted pre">${line}</div>`)}
      ${this.historyPanel(config.collection, item.id)}
      ${
        edit === undefined
          ? nothing
          : this.formDialog({
              key: `edit:${item.id}`,
              className: "edit",
              heading: `Edit the ${config.noun}`,
              fields: edit.fields,
              values: item,
              save: (values) => this.save(edit, edit.update, values, item.id),
            })
      }
    </li>`;
  }

  private addButton(config: Kind): TemplateResult | typeof nothing {
    if (config.edit === undefined) return nothing;
    return iconButton({
      icon: PLUS,
      label: `Add a ${config.noun}`,
      className: "add",
      disabled: this.busy,
      onClick: () => {
        this.openDialog("add");
      },
    });
  }

  private addDialog(config: Kind): TemplateResult | typeof nothing {
    const edit = config.edit;
    if (edit === undefined) return nothing;
    return this.formDialog({
      key: "add",
      className: "add",
      heading: `Add a ${config.noun}`,
      fields: edit.fields,
      submitLabel: "Add",
      submitIcon: PLUS,
      save: (values) => this.save(edit, edit.add, values),
    });
  }

  override render(): TemplateResult {
    const config = this.config;
    return html`
      <section>
        <div class="head">
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
          ${this.addButton(config)}
        </div>
        ${this.renderError()} ${this.map()}
        <ul>
          ${repeat(
            this.items,
            (item) => item.id,
            (item) => this.item(config, item),
          )}
        </ul>
        ${this.addDialog(config)}
      </section>
    `;
  }
}

customElements.define("tk-records", TkRecords);
