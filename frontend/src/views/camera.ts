import { css, html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, openChat, shared } from "../base";
import { changeText, shortTime } from "../format";
import { facts, historyDetails } from "../settings";
import type { CameraInfo, Field, PhotoCheck, Proposal } from "../types";

export const PHOTOS_SHOWN = 20;

const CAMERA_FIELDS: Field[] = [
  { name: "camera", label: "Camera entity, such as a Tapo C100", type: "text" },
  { name: "check_time", label: "Daily check at, only while a light is on", type: "time" },
  { name: "after_test", label: "Check after each test", type: "checkbox" },
  { name: "alerts", label: "Alert me about issues", type: "checkbox" },
  { name: "keep_days", label: "Keep photos for (days)", type: "number" },
];

const REASONS: Record<PhotoCheck["reason"], string> = {
  daily: "Daily",
  test: "After a test",
  manual: "Check now",
  chat: "Asked in a chat",
};

const SEEN: [string, string][] = [
  ["water", "Water"],
  ["algae", "Algae"],
  ["plants", "Plants"],
  ["level", "Water level"],
];

function photo(check: PhotoCheck): TemplateResult | typeof nothing {
  return check.photo_url === null
    ? nothing
    : html`<img class="photo" src=${check.photo_url} alt="The tank at ${shortTime(check.time)}" />`;
}

function heading(check: PhotoCheck): string {
  return `${shortTime(check.time)} · ${REASONS[check.reason]}`;
}

/** What Claude saw in a photo, or why it did not look. */
function finding(check: PhotoCheck): TemplateResult {
  const seen = SEEN.filter(([area]) => check.seen[area] !== undefined);
  return html`
    ${check.summary === null ? nothing : html`<div class="summary">${check.summary}</div>`}
    ${check.suggestion === null ? nothing : html`<div>Suggested: ${check.suggestion}</div>`}
    ${
      seen.length === 0
        ? nothing
        : html`<ul class="seen">
            ${seen.map(([area, label]) => html`<li><strong>${label}</strong> ${check.seen[area]}</li>`)}
          </ul>`
    }
    ${check.note === null ? nothing : html`<div class="muted note">${check.note}</div>`}
  `;
}

/** The camera: the latest photo, Check now, the photos kept, the issues waiting and the settings read-only. */
export class TkCamera extends TkView {
  static override properties = {
    ...TkView.properties,
    stamp: { type: Number },
    info: { state: true },
    photos: { state: true },
    proposals: { state: true },
  };

  static override styles = [
    shared,
    css`
      .photo {
        display: block;
        width: 100%;
        max-width: 640px;
        height: auto;
        border-radius: 8px;
        margin: 8px 0;
      }
      .summary {
        font-weight: 500;
      }
      ul.seen li {
        border: none;
        padding: 2px 0;
      }
    `,
  ];

  declare stamp: number;
  declare info: CameraInfo | undefined;
  declare photos: PhotoCheck[] | undefined;
  declare proposals: Proposal[];

  constructor() {
    super();
    this.stamp = 0;
    this.info = undefined;
    this.photos = undefined;
    this.proposals = [];
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
      if (info.camera === null) this.photos = undefined;
    };
  }

  private async act(action: (api: TankkeeperApi) => Promise<unknown>): Promise<void> {
    if (await this.run(action)) this.changed();
  }

  private async showPhotos(): Promise<void> {
    await this.run(async (api) => {
      const listed = await api.call<{ photos: PhotoCheck[] }>("list_photos", {
        limit: PHOTOS_SHOWN,
      });
      this.photos = listed.photos;
    });
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
      <div class="row">
        <button
          class="dismiss"
          ?disabled=${this.busy}
          @click=${() => this.act((api) => api.call("dismiss_finding", { check_id: check.id }))}
        >
          Not a problem
        </button>
        <button
          class="discuss"
          @click=${() => {
            openChat(this, { kind: "photo", id: check.id });
          }}
        >
          Discuss
        </button>
        <button
          class="reject"
          ?disabled=${this.busy}
          @click=${() => this.act((api) => api.rejectFinding(check.id))}
        >
          Reject
        </button>
        <button
          class="accept primary"
          ?disabled=${this.busy}
          @click=${() => this.act((api) => api.acceptFinding(check.id))}
        >
          Accept
        </button>
      </div>
    </li>`;
  }

  private renderPhotos(): TemplateResult {
    const photos = this.photos;
    if (photos === undefined) {
      return html`<button class="photos" ?disabled=${this.busy} @click=${() => this.showPhotos()}>
        Photos
      </button>`;
    }
    return html`<h3>Photos</h3>
      ${photos.length === 0 ? html`<p class="muted">No photos yet.</p>` : nothing}
      <ul class="photos">
        ${repeat(
          photos,
          (check) => check.id,
          (check) =>
            html`<li class="photo-check">
              <div class="muted">${heading(check)}</div>
              ${photo(check)} ${finding(check)}
            </li>`,
        )}
      </ul>`;
  }

  private renderSettings(info: CameraInfo): TemplateResult {
    return html`<details class="settings">
      <summary>Camera settings</summary>
      <p class="muted">
        Each check sends the photo to Anthropic through the AI task entity, uses paid API calls and
        counts toward Claude's comments a day.
      </p>
      ${facts(CAMERA_FIELDS, info)} ${historyDetails(this.api, "settings", "camera", this.version)}
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
        ${
          latest === null
            ? html`<p class="muted">No photo yet.</p>`
            : html`<div class="latest">
                <div class="muted">${heading(latest)}</div>
                ${photo(latest)} ${finding(latest)}
              </div>`
        }
        <div class="row">
          <button
            class="check primary"
            ?disabled=${this.busy}
            @click=${() => this.act((api) => api.call("check_now"))}
          >
            Check now
          </button>
        </div>
        ${this.renderPhotos()} ${this.renderSettings(info)}
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
