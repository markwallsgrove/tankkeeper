import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { chemistryChart, cycleChart, lightRows, renderChart, renderLightChart } from "../charts";
import { addDays, changeText, isoDate, shortTime, sourceText } from "../format";
import "../tk-form";
import "../tk-history";
import type {
  Field,
  Level,
  Light,
  LightInfo,
  LogEntry,
  Plan,
  Proposal,
  Stage,
  Status,
  Task,
  TankInfo,
  Values,
} from "../types";

export const WEEK_DAYS = 7;
export const LIGHT_DAYS = 30;
export const CHART_DAYS = 60;

const LEVELS: Record<Level, string> = { on_course: "On course", watch: "Watch", act: "Act" };
const STAGES: Record<Stage, string> = { cycling: "Cycling", cycled: "Cycled" };

const TANK_FIELDS: Field[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "volume_litres", label: "Volume (litres)", type: "number" },
  { name: "dosing_volume_litres", label: "Water volume for doses (litres)", type: "number" },
  { name: "temperature_c", label: "Target temperature (°C)", type: "number" },
  { name: "stage", label: "Stage", type: "select", options: ["cycling", "cycled"] },
  { name: "notes", label: "Notes", type: "textarea" },
];

const WATER_FIELDS: Field[] = [
  { name: "source", label: "Values come from", type: "select", options: ["supplier", "tap_test"] },
  { name: "ph", label: "pH", type: "number" },
  { name: "kh", label: "KH (dKH)", type: "number" },
  { name: "gh", label: "GH (dGH)", type: "number" },
  { name: "nitrate", label: "Nitrate (mg/l)", type: "number" },
  { name: "phosphate", label: "Phosphate (mg/l)", type: "number" },
  { name: "notes", label: "Notes", type: "textarea" },
];

const RULE_FIELDS: Field[] = [
  { name: "nitrogen_watch", label: "Ammonia or nitrite Watch above (ppm)", type: "number" },
  { name: "nitrogen_act", label: "Ammonia or nitrite Act above (ppm)", type: "number" },
  { name: "ph_watch", label: "pH Watch under, while cycling", type: "number" },
  { name: "ph_act", label: "pH Act under, while cycling", type: "number" },
  {
    name: "stall_watch_days",
    label: "Stalled cycle Watch after (days)",
    type: "number",
    step: "1",
  },
  { name: "stall_act_days", label: "Stalled cycle Act after (days)", type: "number", step: "1" },
  { name: "test_watch_days", label: "Late test Watch after (days)", type: "number", step: "1" },
  { name: "test_act_days", label: "Late test Act after (days)", type: "number", step: "1" },
  { name: "skip_watch", label: "Skipped tasks for Watch", type: "number", step: "1" },
  { name: "skip_act", label: "Skipped tasks for Act", type: "number", step: "1" },
  {
    name: "plan_watch_days",
    label: "Plan ends within, for Watch (days)",
    type: "number",
    step: "1",
  },
  { name: "plan_act_days", label: "Plan ends within, for Act (days)", type: "number", step: "1" },
];

const LIGHT_FIELDS: Field[] = [
  { name: "model", label: "Make and model", type: "text" },
  { name: "on", label: "On", type: "time" },
  { name: "off", label: "Off", type: "time" },
  { name: "brightness_pct", label: "Brightness (%)", type: "number", step: "1" },
  { name: "ramp_minutes", label: "Fade (minutes)", type: "number", step: "1" },
];

/** Opens Assist in Home Assistant's frontend, which handles the action event. */
const ASSIST = {
  config: { tap_action: { action: "assist", start_listening: false } },
  action: "tap",
};

/** The tank at a glance: status, tasks, charts, lights and what is waiting for the Member. */
export class TkOverview extends TkView {
  static override properties = {
    ...TkView.properties,
    status: { state: true },
    tank: { state: true },
    plan: { state: true },
    log: { state: true },
    lights: { state: true },
    proposals: { state: true },
  };

  static override styles = shared;

  declare status: Status | undefined;
  declare tank: TankInfo | undefined;
  declare plan: Plan | undefined;
  declare log: LogEntry[];
  declare lights: LightInfo | undefined;
  declare proposals: Proposal[];

  constructor() {
    super();
    this.status = undefined;
    this.tank = undefined;
    this.plan = undefined;
    this.log = [];
    this.lights = undefined;
    this.proposals = [];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const today = isoDate(new Date(), api.timeZone);
    const [status, tank, plan, log, lights, proposals] = await Promise.all([
      api.call<Status>("get_status"),
      api.call<TankInfo>("get_tank"),
      api.call<Plan>("get_plan", { start: today, end: addDays(today, WEEK_DAYS) }),
      api.call<{ entries: LogEntry[] }>("get_log", {
        kind: "test",
        since: addDays(today, -CHART_DAYS),
        limit: 500,
      }),
      api.call<LightInfo>("get_light", { days: LIGHT_DAYS }),
      api.call<{ proposals: Proposal[] }>("list_proposals", { state: "pending" }),
    ]);
    return () => {
      this.status = status;
      this.tank = tank;
      this.plan = plan;
      this.log = log.entries;
      this.lights = lights;
      this.proposals = proposals.proposals;
    };
  }

  private async act(action: (api: TankkeeperApi) => Promise<unknown>): Promise<void> {
    if (await this.run(action)) this.changed();
  }

  private async save(tool: string, values: Values, extra: Values = {}): Promise<void> {
    if (Object.keys(values).length === 0) return;
    await this.act((api) => api.call(tool, { ...extra, ...values }));
  }

  private discuss(): void {
    this.dispatchEvent(
      new CustomEvent("hass-action", { detail: ASSIST, bubbles: true, composed: true }),
    );
  }

  private editor(
    title: string,
    name: string,
    tool: string,
    fields: Field[],
    values: object,
    collection: string,
    id: string,
  ): TemplateResult {
    return html`<details>
      <summary>${title}</summary>
      <tk-form
        class=${name}
        .fields=${fields}
        .values=${values}
        .busy=${this.busy}
        @tk-save=${(event: CustomEvent<Values>) => this.save(tool, event.detail)}
      ></tk-form>
      <tk-history
        .api=${this.api}
        .collection=${collection}
        .recordId=${id}
        .stamp=${this.version}
      ></tk-history>
    </details>`;
  }

  private renderStatus(status: Status, tank: TankInfo): TemplateResult {
    const level = status.status === null ? "Not checked yet" : LEVELS[status.status];
    const stage = status.stage === null ? "" : STAGES[status.stage];
    return html`<section id="status">
      <div class="row">
        <h2 class="grow">${tank.tank.name}</h2>
        <strong class="level ${status.status ?? ""}">${level}</strong>
      </div>
      <div class="muted">
        ${[stage, status.checked === null ? "" : `checked ${shortTime(status.checked)}`]
          .filter((part) => part !== "")
          .join(" · ")}
      </div>
      <ul>
        ${status.rules
          .filter((rule) => rule.level !== "on_course")
          .map(
            (rule) =>
              html`<li>
                <strong>${LEVELS[rule.level]}</strong> ${rule.reason}
                ${rule.action === null ? nothing : html`<div>${rule.action}</div>`}
              </li>`,
          )}
      </ul>
      ${this.editor("Edit tank", "tank", "set_tank", TANK_FIELDS, tank.tank, "tank", "tank")}
      ${this.editor("Edit water", "water", "set_water", WATER_FIELDS, tank.water ?? {}, "water", "water")}
      ${this.editor("Edit rule limits", "rules", "set_rules", RULE_FIELDS, status.settings, "settings", "rules")}
    </section>`;
  }

  private renderTask(task: Task, buttons: boolean): TemplateResult {
    return html`<li>
      <div class="row">
        <span class="grow">${task.time ?? ""} ${task.text}</span>
        ${
          buttons && task.state === "open"
            ? html`<button
                  class="skip"
                  ?disabled=${this.busy}
                  @click=${() => this.act((api) => api.call("skip_task", { task_id: task.id }))}
                >
                  Skip
                </button>
                <button
                  class="complete primary"
                  ?disabled=${this.busy}
                  @click=${() => this.act((api) => api.call("complete_task", { task_id: task.id }))}
                >
                  Complete
                </button>`
            : html`<span class="muted">${task.state === "open" ? "" : task.state}</span>`
        }
      </div>
    </li>`;
  }

  private renderLight(light: Light, today: string): TemplateResult {
    return html`<li data-light=${light.id}>
      <div class="row">
        <strong class="grow">${light.model}</strong>
        <span class="muted">${light.state ?? "unknown"}</span>
        <button
          class="remove"
          ?disabled=${this.busy}
          @click=${() => this.act((api) => api.call("set_light", { action: "remove", light_id: light.id }))}
        >
          Remove
        </button>
      </div>
      <div>
        ${light.on} to
        ${light.off}${light.brightness_pct === null ? "" : `, ${String(light.brightness_pct)}%`}
      </div>
      <div class="muted">Today ${light.today.on} to ${light.today.off}</div>
      ${light.problem === null ? nothing : html`<div class="error">${light.problem}</div>`}
      ${renderLightChart(lightRows(light.on_periods, today, LIGHT_DAYS, this.api?.timeZone))}
      <details>
        <summary>Edit and history</summary>
        <tk-form
          .fields=${LIGHT_FIELDS}
          .values=${light}
          .busy=${this.busy}
          @tk-save=${(event: CustomEvent<Values>) => this.save("set_light", event.detail, { action: "update", light_id: light.id })}
        ></tk-form>
        <tk-history
          .api=${this.api}
          .collection=${"lights"}
          .recordId=${light.id}
          .stamp=${this.version}
        ></tk-history>
      </details>
    </li>`;
  }

  private renderProposal(proposal: Proposal): TemplateResult {
    return html`<li>
      <strong class="pre">${proposal.summary}</strong>
      <div class="pre">${proposal.reason}</div>
      <div class="muted">${sourceText(proposal.source)} · ${shortTime(proposal.created)}</div>
      ${proposal.changes.map((change) => html`<div class="muted">${changeText(change)}</div>`)}
      <div class="row">
        <button
          class="discuss"
          @click=${() => {
            this.discuss();
          }}
        >
          Discuss
        </button>
        <button
          class="reject"
          ?disabled=${this.busy}
          @click=${() => this.act((api) => api.reject(proposal.proposal_id))}
        >
          Reject
        </button>
        <button
          class="accept primary"
          ?disabled=${this.busy}
          @click=${() => this.act((api) => api.accept(proposal.proposal_id))}
        >
          Accept
        </button>
      </div>
    </li>`;
  }

  override render(): TemplateResult {
    const { status, tank, plan, lights } = this;
    if (status === undefined || tank === undefined || plan === undefined || lights === undefined) {
      return this.error
        ? html`<p class="error">${this.error}</p>`
        : html`<p class="muted">Loading</p>`;
    }
    const today = isoDate(new Date(), this.api?.timeZone);
    const todays = plan.tasks.filter((task) => task.date === today);
    const week = plan.tasks.filter((task) => task.date > today);
    return html`
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      ${this.renderStatus(status, tank)}
      <section id="today">
        <h2>Today</h2>
        ${todays.length === 0 ? html`<p class="muted">No tasks today</p>` : nothing}
        <ul>
          ${repeat(
            todays,
            (task) => task.id,
            (task) => this.renderTask(task, true),
          )}
        </ul>
      </section>
      <section id="waiting">
        <h2>Waiting for you</h2>
        ${this.proposals.length === 0 ? html`<p class="muted">Nothing is waiting for you</p>` : nothing}
        <ul>
          ${repeat(
            this.proposals,
            (proposal) => proposal.proposal_id,
            (proposal) => this.renderProposal(proposal),
          )}
        </ul>
      </section>
      <section id="cycle">
        <h2>Cycle</h2>
        ${renderChart(cycleChart(this.log, status.settings), "Cycle")}
      </section>
      <section id="chemistry">
        <h2>Water chemistry</h2>
        ${renderChart(chemistryChart(this.log, tank.water), "Water chemistry")}
        <p class="muted">Hollow points are tap water.</p>
      </section>
      <section id="week">
        <h2>Next 7 days</h2>
        ${week.length === 0 ? html`<p class="muted">No tasks</p>` : nothing}
        <ul>
          ${week.map(
            (task) =>
              html`<li>
                <span class="muted">${task.date}</span> ${task.time ?? ""} ${task.text}
              </li>`,
          )}
        </ul>
      </section>
      ${
        lights.lights.length === 0
          ? nothing
          : html`<section id="light">
              <h2>Light</h2>
              ${
                lights.next_change === null
                  ? nothing
                  : html`<div class="muted">Next change ${shortTime(lights.next_change.time)}</div>`
              }
              <ul>
                ${repeat(
                  lights.lights,
                  (light) => light.id,
                  (light) => this.renderLight(light, lights.today),
                )}
              </ul>
            </section>`
      }
      <div id="cameras"></div>
    `;
  }
}

customElements.define("tk-overview", TkOverview);
