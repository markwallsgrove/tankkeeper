import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { addDays } from "./format";
import type { Task } from "./types";

/** mdiRepeat from @mdi/js. */
export const REPEAT = "M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z";

const WEEK = [0, 1, 2, 3, 4, 5, 6];
const NAME = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const TEST = /\btest/i;

function utc(day: string): Date {
  const [year = 0, month = 1, date = 1] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date));
}

function weekday(day: string): number {
  return (utc(day).getUTCDay() + 6) % 7;
}

/** The Monday on or before the day, as YYYY-MM-DD. */
export function mondayOf(day: string): string {
  return addDays(day, -weekday(day));
}

/** What a chip's colour shows: a planned test, a dose or another task. */
export function kindOf(task: Task): "test" | "dose" | "task" {
  if (TEST.test(task.text)) return "test";
  return task.slot === "dose" ? "dose" : "task";
}

function head(day: string): string {
  return `${NAME.format(utc(day))} ${String(utc(day).getUTCDate())}`;
}

/**
 * One week of the plan as a grid of chips, or on a narrow screen a strip of task counts.
 * It fires tk-pick-task with a task id when a chip is clicked, tk-pick-day with a day when the strip is tapped,
 * and tk-week-change with the Monday shown after Previous or Next.
 */
export class TkWeek extends LitElement {
  static override properties = {
    tasks: { attribute: false },
    start: { attribute: false },
    end: { attribute: false },
    today: { attribute: false },
    picked: { attribute: false },
    week: { state: true },
  };

  declare tasks: Task[];
  declare start: string;
  declare end: string;
  declare today: string;
  declare picked: string | undefined;
  declare week: string | undefined;

  constructor() {
    super();
    this.tasks = [];
    this.start = "";
    this.end = "";
    this.today = "";
    this.picked = undefined;
    this.week = undefined;
  }

  static override styles = css`
    :host {
      display: block;
      margin-bottom: 12px;
    }
    nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .label {
      flex: 1;
      text-align: center;
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }
    nav button {
      font: inherit;
      padding: 4px 10px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      color: var(--primary-text-color);
      background: none;
      cursor: pointer;
    }
    nav button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
    }
    .day {
      min-height: 72px;
      padding: 4px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .day.outside {
      opacity: 0.4;
    }
    .today {
      border-color: var(--primary-color);
      box-shadow: inset 0 0 0 1px var(--primary-color);
    }
    .head {
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .today .head {
      color: var(--primary-color);
      font-weight: 600;
    }
    .chip {
      display: flex;
      align-items: center;
      gap: 2px;
      width: 100%;
      font: inherit;
      font-size: 0.75em;
      text-align: left;
      padding: 2px 4px;
      border: none;
      border-radius: 4px;
      color: rgba(0, 0, 0, 0.87);
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .chip span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .chip.task {
      background: var(--primary-color);
    }
    .chip.dose {
      background: var(--success-color, #43a047);
    }
    .chip.test {
      background: var(--warning-color, #ffa600);
    }
    .chip.done {
      opacity: 0.5;
      text-decoration: line-through;
    }
    ha-svg-icon {
      --mdc-icon-size: 12px;
      flex: none;
    }
    .strip {
      display: none;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 4px;
    }
    .strip button {
      display: grid;
      justify-items: center;
      gap: 2px;
      font: inherit;
      font-size: 0.8em;
      padding: 4px 0;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      color: var(--primary-text-color);
      background: none;
      cursor: pointer;
    }
    .strip button:disabled {
      opacity: 0.4;
      cursor: default;
    }
    .strip button.picked {
      background: var(--primary-color);
      color: rgba(0, 0, 0, 0.87);
    }
    .count {
      font-weight: 600;
      min-height: 1.2em;
    }
    @media (max-width: 600px) {
      .grid {
        display: none;
      }
      .strip {
        display: grid;
      }
    }
  `;

  private first(): string {
    return mondayOf(this.start);
  }

  private last(): string {
    return mondayOf(this.end);
  }

  /** The week picked, or today's, kept inside the window. */
  private shown(): string {
    const week = this.week ?? mondayOf(this.today);
    if (week < this.first()) return this.first();
    return week > this.last() ? this.last() : week;
  }

  /** Show another week and fire tk-week-change with its Monday. The buttons are disabled at the window's ends. */
  private move(weeks: number): void {
    this.week = addDays(this.shown(), 7 * weeks);
    this.fire("tk-week-change", this.week);
  }

  private fire(type: string, detail: string): void {
    this.dispatchEvent(new CustomEvent<string>(type, { detail, bubbles: true, composed: true }));
  }

  private inside(day: string): boolean {
    return day >= this.start && day <= this.end;
  }

  private chip(task: Task): TemplateResult {
    const kind = kindOf(task);
    const done = task.state !== "open";
    const classes = ["chip", kind, ...(done ? ["done"] : [])].join(" ");
    const label = [
      task.text,
      kind,
      ...(task.series_id === null ? [] : ["repeats"]),
      ...(done ? ["done"] : []),
    ].join(", ");
    return html`<button
      class=${classes}
      aria-label=${label}
      data-task=${task.id}
      title=${task.text}
      @click=${() => {
        this.fire("tk-pick-task", task.id);
      }}
    >
      ${
        task.series_id === null
          ? nothing
          : html`<ha-svg-icon class="repeat" .path=${REPEAT}></ha-svg-icon>`
      }<span>${task.text}</span>
    </button>`;
  }

  override render(): TemplateResult {
    const week = this.shown();
    const days = WEEK.map((index) => addDays(week, index));
    const onDay = (day: string): Task[] => this.tasks.filter((task) => task.date === day);
    const dayClass = (day: string, base: string): string =>
      [
        base,
        ...(day === this.today ? ["today"] : []),
        ...(this.inside(day) ? [] : ["outside"]),
      ].join(" ");
    return html`<nav>
        <button
          class="prev"
          aria-label="Previous week"
          ?disabled=${week <= this.first()}
          @click=${() => {
            this.move(-1);
          }}
        >
          ‹
        </button>
        <span class="label">${week} to ${addDays(week, 6)}</span>
        <button
          class="next"
          aria-label="Next week"
          ?disabled=${week >= this.last()}
          @click=${() => {
            this.move(1);
          }}
        >
          ›
        </button>
      </nav>
      <div class="grid">
        ${days.map(
          (day) =>
            html`<div
              class=${dayClass(day, "day")}
              data-day=${day}
              aria-current=${day === this.today ? "date" : nothing}
            >
              <span class="head">${head(day)}</span>
              ${onDay(day).map((task) => this.chip(task))}
            </div>`,
        )}
      </div>
      <div class="strip">
        ${days.map((day) => {
          const count = onDay(day).length;
          const classes = [
            ...(day === this.today ? ["today"] : []),
            ...(day === this.picked ? ["picked"] : []),
          ].join(" ");
          return html`<button
            class=${classes}
            data-day=${day}
            aria-current=${day === this.today ? "date" : nothing}
            aria-pressed=${day === this.picked ? "true" : "false"}
            aria-label=${`${head(day)}: ${String(count)} ${count === 1 ? "task" : "tasks"}`}
            ?disabled=${!this.inside(day)}
            @click=${() => {
              this.fire("tk-pick-day", day);
            }}
          >
            <span>${head(day)}</span><span class="count">${count === 0 ? "" : String(count)}</span>
          </button>`;
        })}
      </div>`;
  }
}

customElements.define("tk-week", TkWeek);
