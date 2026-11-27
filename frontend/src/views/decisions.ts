import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { saveAndClear } from "../tk-form";
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
      ${
        detail.status === "proposed"
          ? html`<button
              class="accept primary"
              ?disabled=${this.busy}
              @click=${() => this.save("accept", {}, detail.number)}
            >
              Accept
            </button>`
          : nothing
      }
      <details>
        <summary>Edit</summary>
        <tk-form
          class="update"
          .fields=${TEXT_FIELDS}
          .values=${detail}
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) => this.save("update", event.detail, detail.number)}
        ></tk-form>
      </details>
      <details>
        <summary>Replace</summary>
        <tk-form
          class="replace"
          .fields=${REPLACE_FIELDS}
          submitLabel="Replace"
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) =>
            saveAndClear(event, (values) => this.save("replace", values, detail.number))}
        ></tk-form>
      </details>
      <tk-history
        .api=${this.api}
        .collection=${"decisions"}
        .recordId=${code(detail.number)}
        .stamp=${this.version}
      ></tk-history>
    </div>`;
  }

  private renderDecision(decision: Decision): TemplateResult {
    const open = this.selected === decision.number;
    return html`<li data-number=${decision.number}>
      <div class="row">
        <strong class="grow">${code(decision.number)} ${decision.title}</strong>
        <button
          class="open"
          @click=${() => {
            this.toggle(decision.number);
          }}
        >
          ${open ? "Close" : "Open"}
        </button>
      </div>
      <div class="muted">${decision.status} · ${decision.date}</div>
      ${open && this.detail?.number === decision.number ? this.renderDetail(this.detail) : nothing}
    </li>`;
  }

  override render(): TemplateResult {
    return html`
      <section>
        <div class="row">
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
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
        <ul>
          ${repeat(
            this.decisions,
            (decision) => decision.number,
            (decision) => this.renderDecision(decision),
          )}
        </ul>
      </section>
      <section>
        <h2>Add a decision</h2>
        <tk-form
          class="add"
          .fields=${ADD_FIELDS}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) =>
            saveAndClear(event, (values) => this.save("add", values))}
        ></tk-form>
      </section>
    `;
  }
}

customElements.define("tk-decisions", TkDecisions);
