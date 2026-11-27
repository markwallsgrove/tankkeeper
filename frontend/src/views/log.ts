import { html, type TemplateResult } from "lit";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { DOSE, TEST, textButton } from "../buttons";
import { logText, shortTime } from "../format";
import type { Field, LogEntry, Values } from "../types";

export const LOG_LIMIT = 100;

const KINDS = ["all", "dose", "test", "event"];
const TEST_VALUES: [string, string][] = [
  ["ammonia", "Ammonia (ppm)"],
  ["nitrite", "Nitrite (ppm)"],
  ["nitrate", "Nitrate (ppm)"],
  ["phosphate", "Phosphate (ppm)"],
  ["ph", "pH"],
  ["kh", "KH (dKH)"],
  ["gh", "GH (dGH)"],
  ["temperature_c", "Temperature (°C)"],
];

const TEST_FIELDS: Field[] = [
  { name: "source", label: "Water", type: "select", options: ["tank", "tap"] },
  ...TEST_VALUES.map(([name, label]): Field => ({ name, label, type: "number" })),
  { name: "notes", label: "Notes", type: "textarea" },
];

/** The log, newest first, with forms to record a dose or a water test. */
export class TkLog extends TkView {
  static override properties = {
    ...TkView.properties,
    entries: { state: true },
    kind: { state: true },
    products: { state: true },
  };

  static override styles = shared;

  declare entries: LogEntry[];
  declare kind: string;
  declare products: string[];

  constructor() {
    super();
    this.entries = [];
    this.kind = "all";
    this.products = [];
  }

  protected override reloadOn(): string[] {
    return ["api", "kind"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const [log, products] = await Promise.all([
      api.call<{ entries: LogEntry[] }>("get_log", { kind: this.kind, limit: LOG_LIMIT }),
      api.call<{ products: { name: string }[] }>("list_products"),
    ]);
    return () => {
      this.entries = log.entries;
      this.products = products.products.map((product) => product.name);
    };
  }

  private doseFields(): Field[] {
    return [
      { name: "product", label: "Product", type: "select", options: this.products, required: true },
      { name: "amount_ml", label: "Amount (ml)", type: "number", required: true },
      { name: "why", label: "Why", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" },
    ];
  }

  private async record(tool: string, args: Values): Promise<boolean> {
    const saved = await this.run((api) => api.call(tool, args));
    if (saved) this.changed();
    return saved;
  }

  private async recordTest(values: Values): Promise<boolean> {
    if (Object.keys(values).length === 0) return false;
    const { source, notes, ...readings } = values;
    const args: Values = { values: readings };
    if (source !== undefined) args.source = source;
    if (notes !== undefined) args.notes = notes;
    return this.record("record_test", args);
  }

  override render(): TemplateResult {
    return html`
      <section>
        <div class="row">
          <h2 class="grow">Log</h2>
          <select
            class="kind"
            aria-label="Kind"
            .value=${this.kind}
            @change=${(event: Event) => (this.kind = (event.target as HTMLSelectElement).value)}
          >
            ${KINDS.map((kind) => html`<option value=${kind}>${kind}</option>`)}
          </select>
        </div>
        <div class="actions record">
          ${textButton({
            icon: DOSE,
            label: "Record a dose",
            className: "dose",
            disabled: this.busy,
            onClick: () => {
              this.openDialog("dose");
            },
          })}
          ${textButton({
            icon: TEST,
            label: "Record a test result",
            className: "test",
            disabled: this.busy,
            onClick: () => {
              this.openDialog("test");
            },
          })}
        </div>
        ${this.renderError()}
        <ul>
          ${this.entries.map(
            (entry) =>
              html`<li>
                <div class="pre">${logText(entry)}</div>
                <div class="muted">${shortTime(entry.time)}</div>
              </li>`,
          )}
        </ul>
      </section>
      ${this.formDialog({
        key: "dose",
        className: "dose",
        heading: "Record a dose",
        fields: this.doseFields(),
        submitLabel: "Record",
        submitIcon: DOSE,
        save: (values) => this.record("record_dose", values),
      })}
      ${this.formDialog({
        key: "test",
        className: "test",
        heading: "Record a test result",
        fields: TEST_FIELDS,
        submitLabel: "Record",
        submitIcon: TEST,
        save: (values) => this.recordTest(values),
      })}
    `;
  }
}

customElements.define("tk-log", TkLog);
