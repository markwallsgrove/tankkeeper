import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { CLOSE, DELETE, DELETE_LATER, PENCIL, PLUS, iconButton, textButton } from "../buttons";
import { addDays, isoDate } from "../format";
import { facts } from "../settings";
import "../tk-history";
import { REPEAT } from "../tk-week";
import type { Field, Plan, Series, Task, Values } from "../types";

export const PLAN_DAYS = 28;

const TASK_DETAILS: Field[] = [
  { name: "text", label: "Task", type: "text" },
  { name: "date", label: "Date", type: "date" },
  { name: "slot", label: "Slot", type: "select", options: ["task", "dose"] },
];
const NOTE: Field = { name: "note", label: "Note", type: "text" };
const REPEAT_FIELDS: Field[] = [
  { name: "every_days", label: "Repeat every N days", type: "number", step: "1" },
  { name: "weekdays", label: "Or repeat weekly on", type: "weekdays" },
  { name: "until", label: "Repeat until", type: "date" },
];
const TASK_FIELDS: Field[] = [...TASK_DETAILS, NOTE, ...REPEAT_FIELDS];
const EDIT_FIELDS: Field[] = [
  ...TASK_DETAILS,
  { name: "state", label: "State", type: "select", options: ["open", "complete", "skip"] },
  NOTE,
];
const OCCURRENCE_FIELDS: Field[] = [
  ...EDIT_FIELDS,
  {
    name: "scope",
    label: "Apply to (the repeat changes only for this and later ones)",
    type: "select",
    options: ["this", "future"],
    required: true,
  },
  ...REPEAT_FIELDS,
];

const REMINDER_FIELDS: Field[] = [
  { name: "notify", label: "Notify services for reminders", type: "list" },
  { name: "status_notify", label: "Notify services for status alerts", type: "list" },
  { name: "task_time", label: "Task reminder time", type: "time" },
  { name: "dose_time", label: "Dose reminder time", type: "time" },
  { name: "resend_time", label: "Resend open tasks at", type: "time" },
];

/**
 * The plan for the next four weeks: tasks by day, add, edit and remove them, and the reminder settings read-only.
 * A repeating task's occurrence is changed or removed alone, or with every later one.
 */
export class TkPlan extends TkView {
  static override properties = {
    ...TkView.properties,
    plan: { state: true },
    today: { state: true },
    day: { state: true },
  };

  static override styles = shared;

  declare plan: Plan | undefined;
  declare today: string;
  declare day: string | undefined;

  constructor() {
    super();
    this.plan = undefined;
    this.today = "";
    this.day = undefined;
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const start = isoDate(new Date(), api.timeZone);
    const plan = await api.call<Plan>("get_plan", { start, end: addDays(start, PLAN_DAYS - 1) });
    return () => {
      this.plan = plan;
      this.today = start;
      if (this.day !== undefined && (this.day < start || this.day > plan.end)) this.day = undefined;
    };
  }

  private async save(tool: string, values: Values, taskId?: string): Promise<boolean> {
    if (taskId === undefined && Object.keys(values).length === 0) return false;
    const sent = Object.fromEntries(
      Object.entries(values).filter(([, value]) => !Array.isArray(value) || value.length > 0),
    );
    const args = taskId === undefined ? sent : { task_id: taskId, ...sent };
    const saved = await this.run((api) => api.call(tool, args));
    if (saved) this.changed();
    return saved;
  }

  /** Show every day, then scroll to the task's row. */
  private async showTask(taskId: string): Promise<void> {
    this.day = undefined;
    await this.updateComplete;
    this.renderRoot.querySelector(`li[data-task="${CSS.escape(taskId)}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  /** Drop the day filter when the week starting on monday doesn't hold the day. */
  private keepDayIn(monday: string): void {
    if (this.day !== undefined && (this.day < monday || this.day > addDays(monday, 6))) {
      this.day = undefined;
    }
  }

  private pickDay(day: string): void {
    this.day = this.day === day ? undefined : day;
  }

  private renderTask(task: Task): TemplateResult {
    const series = this.plan?.series.find((item) => item.id === task.series_id);
    const detail = [task.state, task.note, series?.repeat].filter(
      (part) => part !== undefined && part !== null && part !== "",
    );
    return html`<li data-task=${task.id}>
      <div class="row">
        ${
          series === undefined
            ? nothing
            : html`<ha-svg-icon class="repeat" .path=${REPEAT} title="Repeats"></ha-svg-icon>`
        }
        <span class="grow">${task.time ?? ""} ${task.text}</span>
        <div class="actions">
          ${iconButton({
            icon: PENCIL,
            label: "Edit",
            className: "edit",
            disabled: this.busy,
            onClick: () => {
              this.openDialog(`edit:${task.id}`);
            },
          })}
          ${this.historyButton("tasks", task.id)}
          ${iconButton({
            icon: DELETE,
            label: "Remove",
            className: "remove",
            disabled: this.busy,
            onClick: () => void this.save("remove_task", {}, task.id),
          })}
          ${
            series === undefined
              ? nothing
              : iconButton({
                  icon: DELETE_LATER,
                  label: "Remove this and later",
                  className: "remove-future",
                  disabled: this.busy,
                  onClick: () => void this.save("remove_task", { scope: "future" }, task.id),
                })
          }
        </div>
      </div>
      <div class="muted detail">${detail.join(" · ")}</div>
      ${this.historyPanel("tasks", task.id)}
      ${this.formDialog({
        key: `edit:${task.id}`,
        className: "edit",
        heading: "Edit the task",
        fields: series === undefined ? EDIT_FIELDS : OCCURRENCE_FIELDS,
        values: series === undefined ? task : occurrenceValues(task, series),
        save: (values) => this.save("update_task", values, task.id),
      })}
    </li>`;
  }

  override render(): TemplateResult {
    const plan = this.plan;
    const all = [...new Set(plan?.tasks.map((task) => task.date) ?? [])];
    const days = this.day === undefined ? all : all.filter((day) => day === this.day);
    return html`
      <section>
        <div class="head">
          <h2>Plan</h2>
          ${iconButton({
            icon: PLUS,
            label: "Add a task",
            className: "add",
            disabled: this.busy,
            onClick: () => {
              this.openDialog("add");
            },
          })}
        </div>
        ${this.renderError()}
        ${
          plan === undefined
            ? nothing
            : html`<tk-week
                .tasks=${plan.tasks}
                .start=${plan.start}
                .end=${plan.end}
                .today=${this.today}
                .picked=${this.day}
                @tk-week-change=${(event: CustomEvent<string>) => {
                  this.keepDayIn(event.detail);
                }}
                @tk-pick-task=${(event: CustomEvent<string>) => this.showTask(event.detail)}
                @tk-pick-day=${(event: CustomEvent<string>) => {
                  this.pickDay(event.detail);
                }}
              ></tk-week>`
        }
        ${
          this.day === undefined
            ? nothing
            : html`<p class="filter muted">
                Showing ${this.day}
                ${textButton({
                  icon: CLOSE,
                  label: "Show all",
                  className: "show-all",
                  onClick: () => {
                    this.day = undefined;
                  },
                })}
              </p>`
        }
        ${
          plan !== undefined && days.length === 0
            ? html`<p class="muted">
                ${this.day === undefined ? "No tasks in the next four weeks" : `No tasks on ${this.day}`}
              </p>`
            : nothing
        }
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
        ${this.formDialog({
          key: "add",
          className: "add",
          heading: "Add a task",
          fields: TASK_FIELDS,
          submitLabel: "Add",
          submitIcon: PLUS,
          save: (values) => this.save("add_task", values),
        })}
      </section>
      ${
        plan === undefined
          ? nothing
          : html`<section id="reminders">
              <h2>Reminders</h2>
              ${facts(REMINDER_FIELDS, plan.reminders)}
              ${this.historyDetails("settings", "reminders")}
            </section>`
      }
    `;
  }
}

/** An occurrence's fields with its repeating task's repeat, changed for this one unless the scope says future. */
function occurrenceValues(task: Task, series: Series): Values {
  return {
    ...task,
    scope: "this",
    every_days: series.every_days,
    weekdays: series.weekdays,
    until: series.until,
  };
}

customElements.define("tk-plan", TkPlan);
