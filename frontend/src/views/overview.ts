import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, openChat, shared } from "../base";
import { CAMERA, CHAT, CHECK, CLOSE, SKIP, iconButton, textButton } from "../buttons";
import { cycleChart, lightRows, parameterCharts, renderChart, renderLightChart } from "../charts";
import { addDays, changeText, isoDate, shortTime, sourceText } from "../format";
import { facts } from "../settings";
import "../tk-history";
import "./camera";
import type {
  CameraInfo,
  ClaudeSettings,
  Field,
  Level,
  Light,
  LightSchedule,
  PhotoCheck,
  LightInfo,
  LogEntry,
  Plan,
  Proposal,
  Stage,
  Status,
  Task,
  TankInfo,
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

/** The tank at a glance: status, tasks, charts, settings, lights and what is waiting for the Member. */
export class TkOverview extends TkView {
  static override properties = {
    ...TkView.properties,
    status: { state: true },
    tank: { state: true },
    plan: { state: true },
    log: { state: true },
    lights: { state: true },
    proposals: { state: true },
    camera: { state: true },
    claude: { state: true },
    result: { state: true },
  };

  static override styles = shared;

  declare status: Status | undefined;
  declare tank: TankInfo | undefined;
  declare plan: Plan | undefined;
  declare log: LogEntry[];
  declare lights: LightInfo | undefined;
  declare proposals: Proposal[];
  declare camera: CameraInfo | undefined;
  declare claude: ClaudeSettings | undefined;
  /** The check Analyse tank now last ran. */
  declare result: PhotoCheck | undefined;

  constructor() {
    super();
    this.status = undefined;
    this.tank = undefined;
    this.plan = undefined;
    this.log = [];
    this.lights = undefined;
    this.proposals = [];
    this.camera = undefined;
    this.claude = undefined;
    this.result = undefined;
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const today = isoDate(new Date(), api.timeZone);
    const [status, tank, plan, log, lights, proposals, camera, claude] = await Promise.all([
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
      api.call<CameraInfo>("get_camera"),
      api.call<ClaudeSettings>("get_claude"),
    ]);
    return () => {
      this.status = status;
      this.tank = tank;
      this.plan = plan;
      this.log = log.entries;
      this.lights = lights;
      this.proposals = proposals.proposals;
      this.camera = camera;
      this.claude = claude;
    };
  }

  private async act(action: (api: TankkeeperApi) => Promise<unknown>): Promise<void> {
    if (await this.run(action)) this.changed();
  }

  /** A card of settings, read-only, with their history. */
  private settingsCard(
    id: string,
    title: string,
    fields: Field[],
    values: object,
    collection: string,
    recordId: string,
  ): TemplateResult {
    return html`<section id=${id}>
      <h2>${title}</h2>
      ${facts(fields, values)} ${this.historyDetails(collection, recordId)}
    </section>`;
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
    </section>`;
  }

  /** Why Analyse tank now can't run, or undefined when it can. */
  private analyseBlocked(lights: LightInfo): string | undefined {
    if (this.busy) return "A check is running.";
    const dark = lights.lights.length > 0 && lights.lights.every((light) => light.state !== "on");
    return dark ? "Every light is off, so the camera sees nothing." : undefined;
  }

  private scrollToCamera(event: Event): void {
    event.preventDefault();
    this.renderRoot.querySelector("tk-camera")?.scrollIntoView({ block: "start" });
  }

  /** Analyse tank now: a photo check from the Overview, and what it found. */
  private renderAnalyse(lights: LightInfo): TemplateResult | typeof nothing {
    const { claude, result } = this;
    if (this.camera?.camera == null || claude === undefined) return nothing;
    const blocked = this.analyseBlocked(lights);
    return html`<section id="analyse">
      <div class="row">
        ${textButton({
          icon: CAMERA,
          label: "Analyse tank now",
          className: "analyse",
          primary: true,
          disabled: blocked !== undefined,
          onClick: () =>
            void this.act(async (api) => {
              this.result = await api.call<PhotoCheck>("check_now");
            }),
        })}
      </div>
      ${blocked === undefined ? nothing : html`<p class="muted reason">${blocked}</p>`}
      <p class="muted cost">
        Each check uses paid Anthropic API usage and counts toward Claude's daily cap of
        ${String(claude.daily_cap)}.
      </p>
      ${
        claude.ai_task === null
          ? html`<p class="muted no-ai-task">
              No AI task entity is set, so a check takes a photo but Claude does not look at it.
            </p>`
          : nothing
      }
      ${
        result === undefined
          ? nothing
          : html`<div class="result">
              <div class="muted">${shortTime(result.time)}</div>
              ${result.asked ? html`<strong>${result.issue ? "Issue found" : "No issue found"}</strong>` : nothing}
              ${result.summary === null ? nothing : html`<div>${result.summary}</div>`}
              ${result.suggestion === null ? nothing : html`<div>Suggested: ${result.suggestion}</div>`}
              ${result.note === null ? nothing : html`<div class="muted">${result.note}</div>`}
              <a
                class="camera-link"
                href="#camera"
                @click=${(event: Event) => {
                  this.scrollToCamera(event);
                }}
                >See it in the Camera section</a
              >
            </div>`
      }
    </section>`;
  }

  private renderTask(task: Task, buttons: boolean): TemplateResult {
    return html`<li>
      <div class="row">
        <span class="grow">${task.time ?? ""} ${task.text}</span>
        ${
          buttons && task.state === "open"
            ? html`<div class="actions">
                ${iconButton({
                  icon: SKIP,
                  label: "Skip",
                  className: "skip",
                  disabled: this.busy,
                  onClick: () =>
                    void this.act((api) => api.call("skip_task", { task_id: task.id })),
                })}
                ${iconButton({
                  icon: CHECK,
                  label: "Complete",
                  className: "complete",
                  disabled: this.busy,
                  onClick: () =>
                    void this.act((api) => api.call("complete_task", { task_id: task.id })),
                })}
              </div>`
            : html`<span class="muted">${task.state === "open" ? "" : task.state}</span>`
        }
      </div>
    </li>`;
  }

  private renderLight(light: Light, today: string): TemplateResult {
    const { schedule, automation } = light;
    return html`<li data-light=${light.id}>
      <div class="row">
        <strong class="grow">${light.model}</strong>
        <span class="muted">${light.state ?? "unknown"}</span>
      </div>
      ${
        schedule === null
          ? html`<div><strong>Needs helpers</strong></div>
              <div class="muted">
                Should run ${light.on} to
                ${light.off}${light.brightness_pct === null ? "" : `, ${String(light.brightness_pct)}%`}
              </div>`
          : html`<div>${helperSchedule(schedule)}</div>`
      }
      ${
        automation === null
          ? nothing
          : html`<div class="muted">
              Automation
              ${
                automation.id === null
                  ? automation.entity_id
                  : html`<a class="automation" href=${`/config/automation/edit/${automation.id}`}
                      >${automation.entity_id}</a
                    >`
              }
              (${automation.state ?? "missing"})
            </div>`
      }
      <div class="muted">Today ${light.today.on} to ${light.today.off}</div>
      ${light.problems.map((problem) => html`<div class="error">${problem}</div>`)}
      ${renderLightChart(lightRows(light.on_periods, today, LIGHT_DAYS, this.api?.timeZone))}
      ${this.historyDetails("lights", light.id)}
    </li>`;
  }

  private renderParameters(status: Status, tank: TankInfo): TemplateResult {
    const { charts, empty } = parameterCharts(
      this.log,
      status.settings,
      tank.tank.temperature_c,
      tank.water,
    );
    return html`<section id="parameters">
      <h2>Water parameters</h2>
      <div class="charts">
        ${charts.map(
          (item) =>
            html`<div class="parameter" data-parameter=${item.key}>
              <h3>${item.label}</h3>
              ${renderChart(item.chart, item.label)}
            </div>`,
        )}
      </div>
      ${empty.length === 0 ? nothing : html`<p class="muted">No readings yet for: ${empty.join(", ")}</p>`}
    </section>`;
  }

  private renderProposal(proposal: Proposal): TemplateResult {
    return html`<li>
      <strong class="pre">${proposal.summary}</strong>
      <div class="pre">${proposal.reason}</div>
      <div class="muted">${sourceText(proposal.source)} · ${shortTime(proposal.created)}</div>
      ${proposal.changes.map((change) => html`<div class="muted">${changeText(change)}</div>`)}
      <div class="actions">
        ${iconButton({
          icon: CHAT,
          label: "Discuss",
          className: "discuss",
          onClick: () => {
            openChat(this, { kind: "proposal", id: proposal.proposal_id });
          },
        })}
        ${iconButton({
          icon: CLOSE,
          label: "Reject",
          className: "reject",
          disabled: this.busy,
          onClick: () => void this.act((api) => api.reject(proposal.proposal_id)),
        })}
        ${iconButton({
          icon: CHECK,
          label: "Accept",
          className: "accept",
          disabled: this.busy,
          onClick: () => void this.act((api) => api.accept(proposal.proposal_id)),
        })}
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
      ${this.renderStatus(status, tank)} ${this.renderAnalyse(lights)}
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
      ${this.renderParameters(status, tank)}
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
      ${this.settingsCard("tank", "Tank", TANK_FIELDS, tank.tank, "tank", "tank")}
      ${this.settingsCard("water", "Water", WATER_FIELDS, tank.water ?? {}, "water", "water")}
      <section id="light">
        <h2>Light</h2>
        ${lights.lights.length === 0 ? html`<p class="muted">No lights yet</p>` : nothing}
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
      </section>
      ${this.settingsCard("rules", "Rule limits", RULE_FIELDS, status.settings, "settings", "rules")}
      <tk-camera .api=${this.api} .stamp=${this.version}></tk-camera>
    `;
  }
}

customElements.define("tk-overview", TkOverview);

/** The schedule the helpers hold, with "?" for a helper that holds no time. */
function helperSchedule(schedule: LightSchedule): string {
  const parts = [`${schedule.on ?? "?"} to ${schedule.off ?? "?"}`];
  if (schedule.brightness_pct !== null) parts.push(`${String(schedule.brightness_pct)}%`);
  if (schedule.ramp_minutes !== null) parts.push(`${String(schedule.ramp_minutes)} min ramp`);
  return parts.join(", ");
}
