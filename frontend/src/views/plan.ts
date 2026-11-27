import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { addDays, isoDate } from "../format";
import { facts, historyDetails, settingsHeader } from "../settings";
import { saveAndClear } from "../tk-form";
import "../tk-history";
import type { Field, Plan, Task, Values } from "../types";

export const PLAN_DAYS = 28;

const TASK_DETAILS: Field[] = [
  { name: "text", label: "Task", type: "text" },
  { name: "date", label: "Date", type: "date" },
  { name: "slot", label: "Slot", type: "select", options: ["task", "dose"] },
];
const NOTE: Field = { name: "note", label: "Note", type: "text" };
const TASK_FIELDS: Field[] = [...TASK_DETAILS, NOTE];
const EDIT_FIELDS: Field[] = [
  ...TASK_DETAILS,
  { name: "state", label: "State", type: "select", options: ["open", "complete", "skip"] },
  NOTE,
];

const REMINDER_FIELDS: Field[] = [
  { name: "notify", label: "Notify services for reminders", type: "list" },
  { name: "status_notify", label: "Notify services for status alerts", type: "list" },
  { name: "task_time", label: "Task reminder time", type: "time" },
  { name: "dose_time", label: "Dose reminder time", type: "time" },
  { name: "resend_time", label: "Resend open tasks at", type: "time" },
];

/** The plan for the next four weeks: tasks by day, add, edit and remove them, and the reminder settings read-only. */
export class TkPlan extends TkView {
  static override properties = {
    ...TkView.properties,
    plan: { state: true },
  };

  static override styles = shared;

  declare plan: Plan | undefined;

  constructor() {
    super();
    this.plan = undefined;
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const start = isoDate(new Date(), api.timeZone);
    const plan = await api.call<Plan>("get_plan", { start, end: addDays(start, PLAN_DAYS - 1) });
    return () => {
      this.plan = plan;
    };
  }

  private async save(tool: string, values: Values, taskId?: string): Promise<boolean> {
    if (taskId === undefined && Object.keys(values).length === 0) return false;
    const args = taskId === undefined ? values : { task_id: taskId, ...values };
    const saved = await this.run((api) => api.call(tool, args));
    if (saved) this.changed();
    return saved;
  }

  private renderTask(task: Task): TemplateResult {
    return html`<li data-task=${task.id}>
      <div class="row">
        <span class="grow">${task.time ?? ""} ${task.text}</span>
        <button
          class="remove"
          ?disabled=${this.busy}
          @click=${() => this.save("remove_task", {}, task.id)}
        >
          Remove
        </button>
      </div>
      <div class="muted">
        ${[task.state, task.note].filter((part) => part !== null && part !== "").join(" · ")}
      </div>
      <details>
        <summary>Edit and history</summary>
        <tk-form
          .fields=${EDIT_FIELDS}
          .values=${task}
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) => this.save("update_task", event.detail, task.id)}
        ></tk-form>
        <tk-history
          .api=${this.api}
          .collection=${"tasks"}
          .recordId=${task.id}
          .stamp=${this.version}
        ></tk-history>
      </details>
    </li>`;
  }

  override render(): TemplateResult {
    const plan = this.plan;
    const days = [...new Set(plan?.tasks.map((task) => task.date) ?? [])];
    return html`
      <section>
        <h2>Plan</h2>
        ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
        ${plan !== undefined && days.length === 0 ? html`<p class="muted">No tasks in the next four weeks</p>` : nothing}
        ${days.map(
          (day) =>
            html`<h3>${day}</h3>
              <ul>
                ${repeat(
                  plan?.tasks.filter((task) => task.date === day) ?? [],
                  (task) => task.id,
                  (task) => this.renderTask(task),
                )}
              </ul>`,
        )}
      </section>
      <section>
        <h2>Add a task</h2>
        <tk-form
          class="add"
          .fields=${TASK_FIELDS}
          submitLabel="Add"
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) =>
            saveAndClear(event, (values) => this.save("add_task", values))}
        ></tk-form>
      </section>
      ${
        plan === undefined
          ? nothing
          : html`<section id="reminders">
              ${settingsHeader("Reminders", "reminder", this.api)}
              ${facts(REMINDER_FIELDS, plan.reminders)}
              ${historyDetails(this.api, "settings", "reminders", this.version)}
            </section>`
      }
    `;
  }
}

customElements.define("tk-plan", TkPlan);
