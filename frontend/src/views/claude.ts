import { html, nothing, type TemplateResult } from "lit";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { shortTime } from "../format";
import { facts, historyDetails } from "../settings";
import type { ClaudeSettings, Field, Review } from "../types";

const CLAUDE_FIELDS: Field[] = [
  { name: "agent", label: "Conversation agent TankKeeper chats through", type: "text" },
  { name: "ai_task", label: "AI task entity for review comments", type: "text" },
  { name: "review_on", label: "Review after", type: "list" },
  { name: "comments", label: "Claude comments on reviews", type: "checkbox" },
  { name: "daily_time", label: "Daily review at", type: "time" },
  { name: "daily_cap", label: "Claude comments a day, at most", type: "number" },
];

const REVIEWS_SHOWN = 20;

const TRIGGER_TEXT: Record<string, string> = {
  test: "Test",
  task: "Task",
  status: "Status change",
  daily: "Daily",
};

function reviewItem(review: Review): TemplateResult {
  const triggers = review.triggers.map((trigger) => TRIGGER_TEXT[trigger] ?? trigger).join(", ");
  const waiting = review.proposal_ids.length;
  return html`<li class="review">
    <div class="muted">${shortTime(review.time)} · ${triggers}</div>
    <div>${review.result}</div>
    ${review.comment === null ? nothing : html`<div class="comment">Claude: ${review.comment}</div>`}
    ${review.note === null ? nothing : html`<div class="muted">${review.note}</div>`}
    ${
      waiting === 0
        ? nothing
        : html`<div class="muted">
            ${waiting} plan ${waiting === 1 ? "change" : "changes"} proposed
          </div>`
    }
  </li>`;
}

/** The Claude settings, read-only, and the latest reviews. The settings change in the options. */
export class TkClaude extends TkView {
  static override properties = {
    ...TkView.properties,
    settings: { state: true },
    reviews: { state: true },
  };

  static override styles = shared;

  declare settings: ClaudeSettings | undefined;
  declare reviews: Review[];

  constructor() {
    super();
    this.settings = undefined;
    this.reviews = [];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const [settings, reviews] = await Promise.all([
      api.call<ClaudeSettings>("get_claude"),
      api.call<{ reviews: Review[] }>("get_reviews", { limit: REVIEWS_SHOWN }),
    ]);
    return () => {
      this.settings = settings;
      this.reviews = reviews.reviews;
    };
  }

  override render(): TemplateResult {
    const settings = this.settings;
    return html`<section>
      <h2>Claude</h2>
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      ${
        settings === undefined
          ? nothing
          : html`<p class="muted note">${settings.model_note}</p>
              ${facts(CLAUDE_FIELDS, settings)}
              ${historyDetails(this.api, "settings", "claude", this.version)}`
      }
      <h3>Reviews</h3>
      ${
        this.reviews.length === 0
          ? html`<p class="muted">No reviews yet.</p>`
          : html`<ul class="reviews">
              ${this.reviews.map(reviewItem)}
            </ul>`
      }
    </section>`;
  }
}

customElements.define("tk-claude", TkClaude);
