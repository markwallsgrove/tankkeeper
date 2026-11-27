import { html, nothing, type TemplateResult } from "lit";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import "../tk-form";
import "../tk-history";
import type { ClaudeSettings, Field, Values } from "../types";

const CLAUDE_FIELDS: Field[] = [
  { name: "agent", label: "Conversation agent Tankkeeper chats through", type: "text" },
  { name: "ai_task", label: "AI task entity for review comments", type: "text" },
  {
    name: "review_on",
    label: "Review after, one per line: test, task, status",
    type: "list",
  },
  { name: "comments", label: "Claude comments on reviews", type: "checkbox" },
  { name: "daily_time", label: "Daily review at", type: "time" },
  {
    name: "daily_cap",
    label: "Claude comments a day, at most",
    type: "number",
    step: "1",
    required: true,
  },
];

/** The Claude settings: the agent Tankkeeper chats through, and when and how Claude reviews the tank. */
export class TkClaude extends TkView {
  static override properties = {
    ...TkView.properties,
    settings: { state: true },
  };

  static override styles = shared;

  declare settings: ClaudeSettings | undefined;

  constructor() {
    super();
    this.settings = undefined;
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const settings = await api.call<ClaudeSettings>("get_claude");
    return () => {
      this.settings = settings;
    };
  }

  private async save(values: Values): Promise<void> {
    if (Object.keys(values).length === 0) return;
    if (await this.run((api) => api.call("set_claude", values))) this.changed();
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
              <tk-form
                class="claude"
                .fields=${CLAUDE_FIELDS}
                .values=${settings}
                .busy=${this.busy}
                @tk-save=${(event: CustomEvent<Values>) => this.save(event.detail)}
              ></tk-form>
              <tk-history
                .api=${this.api}
                .collection=${"settings"}
                .recordId=${"claude"}
                .stamp=${this.version}
              ></tk-history>`
      }
    </section>`;
  }
}

customElements.define("tk-claude", TkClaude);
