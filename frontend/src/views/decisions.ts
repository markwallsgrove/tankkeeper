import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { CHECK, COLLAPSE, EXPAND, PENCIL, PLUS, REPLACE, iconButton } from "../buttons";
import "../tk-history";
import type { Decision, DecisionDetail, Field, Values } from "../types";

const STATUSES = ["proposed", "accepted", "replaced"];

const TEXT_FIELDS: Field[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "decision", label: "Decision", type: "textarea" },
  { name: "why", label: "Why", type: "textarea" },
  { name: "open", label: "Open points, one per line", type: "list" },
  { name: "date", label: "Date", type: "date" },
];

const ADD_FIELDS: Field[] = [
  ...TEXT_FIELDS,
  { name: "status", label: "Status", type: "select", options: ["proposed", "accepted"] },
];

const REPLACE_FIELDS: Field[] = [
  { name: "replaced_by", label: "Replaced by decision number", type: "number", step: "1" },
];

function code(number: number): string {
  return String(number).padStart(4, "0");
}

/** Decisions: list by status, read one, add, edit, accept and replace, with history and undo. */
export class TkDecisions extends TkView {
  static override properties = {
    ...TkView.properties,
    decisions: { state: true },
    status: { state: true },
    selected: { state: true },
    detail: { state: true },
  };

  static override styles = shared;

  declare decisions: Decision[];
  declare status: string;
  declare selected: number | undefined;
  declare detail: DecisionDetail | undefined;

  constructor() {
    super();
    this.decisions = [];
    this.status = "";
    this.selected = undefined;
    this.detail = undefined;
  }

  protected override reloadOn(): string[] {
    return ["api", "status", "selected"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const args = this.status === "" ? {} : { status: this.status };
    const { decisions } = await api.call<{ decisions: Decision[] }>("list_decisions", args);
    const detail =
      this.selected === undefined
        ? undefined
        : await api.call<DecisionDetail>("get_decision", { number: this.selected });
    return () => {
      this.decisions = decisions;
      this.detail = detail;
    };
  }

  private async save(action: string, values: Values, number?: number): Promise<boolean> {
    if (action !== "accept" && Object.keys(values).length === 0) return false;
    const args = number === undefined ? { action, ...values } : { action, number, ...values };
    const saved = await this.run((api) => api.call("set_decision", args));
    if (saved) this.changed();
    return saved;
  }

  private toggle(number: number): void {
    this.selected = this.selected === number ? undefined : number;
  }

  private renderDetail(detail: DecisionDetail): TemplateResult {
    return html`<div class="card">
      <p class="pre">${detail.decision}</p>
      <h3>Why</h3>
      <p class="pre">${detail.why}</p>
      ${
        detail.open.length > 0
          ? html`<h3>Open points</h3>
              <ul>
                ${detail.open.map((point) => html`<li>${point}</li>`)}
              </ul>`
          : nothing
      }
      ${detail.replaced_by === null ? nothing : html`<p class="muted">Replaced by ${code(detail.replaced_by)}</p>`}
      ${
        detail.replaces.length > 0
          ? html`<p class="muted">Replaces ${detail.replaces.map(code).join(", ")}</p>`
          : nothing
      }
      <div class="actions">
        ${
          detail.status === "proposed"
            ? iconButton({
                icon: CHECK,
                label: "Accept",
                className: "accept",
                disabled: this.busy,
                onClick: () => void this.save("accept", {}, detail.number),
              })
            : nothing
        }
        ${iconButton({
          icon: PENCIL,
          label: "Edit",
          className: "update",
          disabled: this.busy,
          onClick: () => {
            this.openDialog("update");
          },
        })}
        ${iconButton({
          icon: REPLACE,
          label: "Replace",
          className: "replace",
          disabled: this.busy,
          onClick: () => {
            this.openDialog("replace");
          },
        })}
        ${this.historyButton("decisions", code(detail.number))}
      </div>
      ${this.historyPanel("decisions", code(detail.number))}
      ${this.formDialog({
        key: "update",
        className: "update",
        heading: `Edit decision ${code(detail.number)}`,
        fields: TEXT_FIELDS,
        values: detail,
        save: (values) => this.save("update", values, detail.number),
      })}
      ${this.formDialog({
        key: "replace",
        className: "replace",
        heading: `Replace decision ${code(detail.number)}`,
        fields: REPLACE_FIELDS,
        submitLabel: "Replace",
        submitIcon: REPLACE,
        save: (values) => this.save("replace", values, detail.number),
      })}
    </div>`;
  }

  private renderDecision(decision: Decision): TemplateResult {
    const open = this.selected === decision.number;
    return html`<li data-number=${decision.number}>
      <div class="row">
        <strong class="grow">${code(decision.number)} ${decision.title}</strong>
        ${iconButton({
          icon: open ? COLLAPSE : EXPAND,
          label: open ? "Close" : "Open",
          className: "open",
          onClick: () => {
            this.toggle(decision.number);
          },
        })}
      </div>
      <div class="muted">${decision.status} · ${decision.date}</div>
      ${open && this.detail?.number === decision.number ? this.renderDetail(this.detail) : nothing}
    </li>`;
  }

  override render(): TemplateResult {
    return html`
      <section>
        <div class="head">
          <h2 class="grow">Decisions</h2>
          <select
            class="status"
            aria-label="Status"
            .value=${this.status}
            @change=${(event: Event) => (this.status = (event.target as HTMLSelectElement).value)}
          >
            <option value="">All</option>
            ${STATUSES.map((status) => html`<option value=${status}>${status}</option>`)}
          </select>
          ${iconButton({
            icon: PLUS,
            label: "Add a decision",
            className: "add",
            disabled: this.busy,
            onClick: () => {
              this.openDialog("add");
            },
          })}
        </div>
        ${this.renderError()}
        <ul>
          ${repeat(
            this.decisions,
            (decision) => decision.number,
            (decision) => this.renderDecision(decision),
          )}
        </ul>
        ${this.formDialog({
          key: "add",
          className: "add",
          heading: "Add a decision",
          fields: ADD_FIELDS,
          submitLabel: "Add",
          submitIcon: PLUS,
          save: (values) => this.save("add", values),
        })}
      </section>
    `;
  }
}

customElements.define("tk-decisions", TkDecisions);
