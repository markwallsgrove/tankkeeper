import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, openChat, shared } from "../base";
import { changeText, shortTime, sourceText } from "../format";
import { markdown } from "../markdown";
import type { Conversation, ConversationDetail, HistoryEntry } from "../types";

export const CONVERSATION_LIMIT = 50;

/** Chats from the panel's chat start with this, so only they can be gone on with there. */
export const PANEL_CHAT = "panel_";

/** Conversations: list, search, read one with the changes made in it and undo them, and delete one. */
export class TkConversations extends TkView {
  static override properties = {
    ...TkView.properties,
    conversations: { state: true },
    query: { state: true },
    selected: { state: true },
    detail: { state: true },
  };

  static override styles = shared;

  declare conversations: Conversation[];
  declare query: string;
  declare selected: string | undefined;
  declare detail: ConversationDetail | undefined;

  constructor() {
    super();
    this.conversations = [];
    this.query = "";
    this.selected = undefined;
    this.detail = undefined;
  }

  protected override reloadOn(): string[] {
    return ["api", "query", "selected"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const selected = this.selected;
    if (selected !== undefined) {
      const detail = await api.call<ConversationDetail>("get_conversation", { id: selected });
      return () => {
        this.detail = detail;
      };
    }
    const found =
      this.query === ""
        ? await api.call<{ conversations: Conversation[] }>("list_conversations", {
            limit: CONVERSATION_LIMIT,
          })
        : await api.call<{ conversations: Conversation[] }>("search_conversations", {
            query: this.query,
            limit: CONVERSATION_LIMIT,
          });
    return () => {
      this.detail = undefined;
      this.conversations = found.conversations;
    };
  }

  private search(event: Event): void {
    event.preventDefault();
    const input = (event.target as HTMLFormElement).querySelector("input");
    this.query = (input?.value ?? "").trim();
  }

  private async undo(entry: HistoryEntry): Promise<void> {
    if (await this.run((api) => api.call("undo_change", { history_id: entry.id }))) this.changed();
  }

  private async deleteConversation(id: string): Promise<void> {
    if (!window.confirm("Delete this conversation? The changes made in it stay in the history."))
      return;
    await this.run(async (api) => {
      await api.deleteConversation(id);
      this.selected = undefined;
    });
  }

  private renderDetail(detail: ConversationDetail): TemplateResult {
    return html`<section>
      <div class="row">
        <button class="back" @click=${() => (this.selected = undefined)}>Back</button>
        <h2 class="grow">${detail.title}</h2>
        ${
          detail.id.startsWith(PANEL_CHAT)
            ? html`<button
                class="resume"
                @click=${() => {
                  openChat(this, { kind: "resume", id: detail.id });
                }}
              >
                Continue in Chat
              </button>`
            : nothing
        }
        <button
          class="delete"
          ?disabled=${this.busy}
          @click=${() => this.deleteConversation(detail.id)}
        >
          Delete
        </button>
      </div>
      <div class="muted">${sourceText(detail.source)} · ${shortTime(detail.started)}</div>
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      <p class="pre">${detail.summary}</p>
      <h3>Messages</h3>
      <ul>
        ${detail.messages.map(
          (message) =>
            html`<li class=${message.role}>
              <div class="role muted">${message.role}</div>
              ${
                message.role === "assistant"
                  ? markdown(message.text, this.api)
                  : html`<div class="pre">${message.text}</div>`
              }
            </li>`,
        )}
      </ul>
      <h3>Changes</h3>
      ${detail.changes.length === 0 ? html`<p class="muted">No changes</p>` : nothing}
      <ul>
        ${detail.changes.map(
          (entry) =>
            html`<li>
              <div class="row">
                <span class="grow">${entry.summary}</span>
                <button class="undo" ?disabled=${this.busy} @click=${() => this.undo(entry)}>
                  Undo
                </button>
              </div>
              <div class="muted">${shortTime(entry.time)} · ${sourceText(entry.source)}</div>
              ${entry.changes.map((change) => html`<div class="muted">${changeText(change)}</div>`)}
            </li>`,
        )}
      </ul>
    </section>`;
  }

  override render(): TemplateResult {
    if (this.detail !== undefined) return this.renderDetail(this.detail);
    return html`<section>
      <h2>Conversations</h2>
      <form
        class="search row"
        @submit=${(event: Event) => {
          this.search(event);
        }}
      >
        <input
          class="search grow"
          type="search"
          aria-label="Search conversations"
          .value=${this.query}
        />
        <button type="submit">Search</button>
      </form>
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      ${this.conversations.length === 0 ? html`<p class="muted">No conversations</p>` : nothing}
      <ul>
        ${repeat(
          this.conversations,
          (conversation) => conversation.id,
          (conversation) =>
            html`<li data-id=${conversation.id}>
              <div class="row">
                <strong class="grow">${conversation.title}</strong>
                <button class="open" @click=${() => (this.selected = conversation.id)}>Open</button>
              </div>
              <div class="muted">
                ${sourceText(conversation.source)} · ${shortTime(conversation.updated)}
              </div>
              <div class="pre">${conversation.summary}</div>
            </li>`,
        )}
      </ul>
    </section>`;
  }
}

customElements.define("tk-conversations", TkConversations);
