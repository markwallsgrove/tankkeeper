import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import type { AskDetail } from "../area-picker";
import "../area-picker";
import { TkView, openChat, openGallery, shared } from "../base";
import {
  CAMERA,
  CHAT,
  CHECK,
  CLOSE,
  NOT_A_PROBLEM,
  PHOTOS,
  SEARCH,
  iconButton,
  textButton,
} from "../buttons";
import { changeText } from "../format";
import { finding, heading, photo, photoStyles } from "../photo";
import { facts } from "../settings";
import "../tk-history";
import type { CameraInfo, Field, PhotoCheck, Proposal } from "../types";

const CAMERA_FIELDS: Field[] = [
  { name: "camera", label: "Camera entity, such as a Tapo C100", type: "text" },
  { name: "check_time", label: "Daily check at, only while a light is on", type: "time" },
  { name: "after_test", label: "Check after each test", type: "checkbox" },
  { name: "alerts", label: "Alert me about issues", type: "checkbox" },
  { name: "keep_days", label: "Keep photos for (days)", type: "number" },
  { name: "check_plants", label: "Check plant health", type: "checkbox" },
  { name: "check_fish", label: "Check fish health", type: "checkbox" },
];

/**
 * The camera: the latest photo, Check now, Look closer at an area, a way to the photos kept, the issues waiting and
 * the settings read-only.
 */
export class TkCamera extends TkView {
  static override properties = {
    ...TkView.properties,
    stamp: { type: Number },
    info: { state: true },
    proposals: { state: true },
    picking: { state: true },
  };

  static override styles = [shared, photoStyles];

  declare stamp: number;
  declare info: CameraInfo | undefined;
  declare proposals: Proposal[];
  declare picking: boolean;

  constructor() {
    super();
    this.stamp = 0;
    this.info = undefined;
    this.proposals = [];
    this.picking = false;
  }

  protected override reloadOn(): string[] {
    return ["api", "stamp"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const [info, pending] = await Promise.all([
      api.call<CameraInfo>("get_camera"),
      api.call<{ proposals: Proposal[] }>("list_proposals", { state: "pending" }),
    ]);
    return () => {
      this.info = info;
      this.proposals = pending.proposals;
    };
  }

  private async act(action: (api: TankkeeperApi) => Promise<unknown>): Promise<boolean> {
    const done = await this.run(action);
    if (done) this.changed();
    return done;
  }

  private async askArea(detail: AskDetail): Promise<void> {
    if (await this.act((api) => api.call("check_area", { ...detail }))) this.picking = false;
  }

  private renderLatest(latest: PhotoCheck): TemplateResult {
    if (this.picking && latest.photo_url !== null) {
      return html`<tk-area-picker
        src=${latest.photo_url}
        alt="The tank, to choose an area"
        ?disabled=${this.busy}
        @tk-ask=${(event: CustomEvent<AskDetail>) => void this.askArea(event.detail)}
        @tk-cancel=${() => {
          this.picking = false;
        }}
      ></tk-area-picker>`;
    }
    return html`<div class="latest">
      <div class="muted">${heading(latest)}</div>
      ${photo(latest)} ${finding(latest)}
    </div>`;
  }

  private renderIssue(check: PhotoCheck): TemplateResult {
    const waiting = this.proposals.filter((proposal) =>
      check.proposal_ids.includes(proposal.proposal_id),
    );
    return html`<li class="issue" data-check=${check.id}>
      <div class="muted">${heading(check)}</div>
      ${photo(check)} ${finding(check)}
      ${
        waiting.length === 0
          ? nothing
          : html`<div class="waiting">
              <div class="muted">Accept applies:</div>
              ${waiting.map(
                (proposal) =>
                  html`<div class="proposal">
                    <strong class="pre">${proposal.summary}</strong>
                    ${proposal.changes.map(
                      (change) => html`<div class="muted">${changeText(change)}</div>`,
                    )}
                  </div>`,
              )}
            </div>`
      }
      <div class="actions">
        ${iconButton({
          icon: NOT_A_PROBLEM,
          label: "Not a problem",
          className: "dismiss",
          disabled: this.busy,
          onClick: () =>
            void this.act((api) => api.call("dismiss_finding", { check_id: check.id })),
        })}
        ${iconButton({
          icon: CHAT,
          label: "Discuss",
          className: "discuss",
          onClick: () => {
            openChat(this, { kind: "photo", id: check.id });
          },
        })}
        ${iconButton({
          icon: CLOSE,
          label: "Reject",
          className: "reject",
          disabled: this.busy,
          onClick: () => void this.act((api) => api.rejectFinding(check.id)),
        })}
        ${iconButton({
          icon: CHECK,
          label: "Accept",
          className: "accept",
          disabled: this.busy,
          onClick: () => void this.act((api) => api.acceptFinding(check.id)),
        })}
      </div>
    </li>`;
  }

  private renderSettings(info: CameraInfo): TemplateResult {
    return html`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${facts(CAMERA_FIELDS, info)} ${this.historyDetails("settings", "camera")}
    </details>`;
  }

  override render(): TemplateResult {
    const info = this.info;
    if (info === undefined) {
      return this.error ? html`<p class="error">${this.error}</p>` : html``;
    }
    const error = this.error ? html`<p class="error">${this.error}</p>` : nothing;
    if (info.camera === null) {
      return html`<section id="camera">
        <h2>Camera</h2>
        ${error}
        <p class="muted">
          No camera is set. Add one in the settings, such as a Tapo C100, to have Claude look at the
          tank.
        </p>
        ${this.renderSettings(info)}
      </section>`;
    }
    const latest = info.latest;
    return html`<section id="camera">
        <h2>Camera</h2>
        ${error}
        ${latest === null ? html`<p class="muted">No photo yet.</p>` : this.renderLatest(latest)}
        <div class="row">
          ${textButton({
            icon: CAMERA,
            label: "Check now",
            className: "check",
            primary: true,
            disabled: this.busy,
            onClick: () => void this.act((api) => api.call("check_now")),
          })}
          ${
            latest?.photo_url == null || this.picking
              ? nothing
              : textButton({
                  icon: SEARCH,
                  label: "Look closer",
                  className: "closer",
                  disabled: this.busy,
                  onClick: () => {
                    this.picking = true;
                  },
                })
          }
          ${textButton({
            icon: PHOTOS,
            label: "More photos",
            className: "photos",
            onClick: () => {
              openGallery(this);
            },
          })}
        </div>
        ${this.renderSettings(info)}
      </section>
      ${
        info.open.length === 0
          ? nothing
          : html`<section id="seen">
              <h2>Seen by the camera</h2>
              <ul>
                ${repeat(
                  info.open,
                  (check) => check.id,
                  (check) => this.renderIssue(check),
                )}
              </ul>
            </section>`
      }`;
  }
}

customElements.define("tk-camera", TkCamera);
