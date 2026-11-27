import { html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, openChat, shared } from "../base";
import { BACK, CHAT, OPEN, SEARCH, UNDO, iconButton, textButton } from "../buttons";
import { changeText, shortTime, sourceText } from "../format";
import { markdown } from "../markdown";
import { snippet } from "../search";
import { DELETED } from "../tk-delete-conversation";
import "../tk-delete-conversation";
import type { Conversation, ConversationDetail, HistoryEntry } from "../types";
import { PANEL_CHAT } from "./chat-list";

export const CONVERSATION_LIMIT = 50;

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
    this.addEventListener(DELETED, () => {
      this.selected = undefined;
    });
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

  private renderDetail(detail: ConversationDetail): TemplateResult {
    return html`<section>
      <div class="row">
        ${textButton({
          icon: BACK,
          label: "Back",
          className: "back",
          onClick: () => (this.selected = undefined),
        })}
        <h2 class="grow">${detail.name}</h2>
        ${
          detail.id.startsWith(PANEL_CHAT)
            ? textButton({
                icon: CHAT,
                label: "Continue in Chat",
                className: "resume",
                onClick: () => {
                  openChat(this, { kind: "resume", id: detail.id });
                },
              })
            : nothing
        }
        <tk-delete-conversation
          .api=${this.api}
          .conversationId=${detail.id}
        ></tk-delete-conversation>
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
                ${iconButton({
                  icon: UNDO,
                  label: "Undo",
                  className: "undo",
                  disabled: this.busy,
                  onClick: () => void this.undo(entry),
                })}
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
        ${textButton({ icon: SEARCH, label: "Search", className: "search", type: "submit" })}
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
                <strong class="grow">${conversation.name}</strong>
                ${iconButton({
                  icon: OPEN,
                  label: "Open",
                  className: "open",
                  onClick: () => (this.selected = conversation.id),
                })}
              </div>
              <div class="muted">
                ${sourceText(conversation.source)} · ${shortTime(conversation.updated)}
              </div>
              ${conversation.match === undefined ? nothing : snippet(conversation.match)}
              <div class="pre">${conversation.summary}</div>
            </li>`,
        )}
      </ul>
    </section>`;
  }
}

customElements.define("tk-conversations", TkConversations);
