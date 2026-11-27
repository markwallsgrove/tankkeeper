import { css, html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, shared } from "../base";
import { relativeTime, sourceText } from "../format";
import { snippet } from "../search";
import { DELETED } from "../tk-delete-conversation";
import "../tk-delete-conversation";
import type { Conversation } from "../types";

export const CHAT_LIST_LIMIT = 50;

/** Chats from the panel's chat start with this. Only they can go on, as Home Assistant may give others a new id. */
export const PANEL_CHAT = "panel_";

/** Fired to open a chat. index is the message a search matched, to show it. */
export const OPEN_CHAT = "tk-open-chat";

export interface OpenChat {
  id: string;
  index: number | null;
}

/** The owner's chats, newest first, to open, search, rename and delete. */
export class TkChatList extends TkView {
  static override properties = {
    ...TkView.properties,
    active: { attribute: false },
    stamp: { attribute: false },
    locked: { attribute: false },
    conversations: { state: true },
    query: { state: true },
    renaming: { state: true },
    draftTitle: { state: true },
  };

  static override styles = [
    shared,
    css`
      li.active {
        background: var(--secondary-background-color);
      }
      li {
        padding: 6px 4px;
      }
      button.open {
        display: block;
        width: 100%;
        text-align: left;
        border: none;
        padding: 2px 0;
        color: inherit;
      }
      .name {
        display: block;
        font-weight: 500;
      }
      .actions button,
      .actions tk-delete-conversation {
        font-size: 0.85em;
      }
      form.search {
        margin-bottom: 8px;
      }
      input.title {
        width: 100%;
        box-sizing: border-box;
      }
    `,
  ];

  declare active: string;
  declare stamp: number;
  /** The chat waiting for a reply, which can't be deleted until it comes. */
  declare locked: string;
  declare conversations: Conversation[] | undefined;
  declare query: string;
  declare renaming: string | undefined;
  declare draftTitle: string;

  constructor() {
    super();
    this.active = "";
    this.stamp = 0;
    this.locked = "";
    this.conversations = undefined;
    this.query = "";
    this.renaming = undefined;
    this.draftTitle = "";
    this.addEventListener(DELETED, () => {
      void this.reload();
    });
  }

  protected override reloadOn(): string[] {
    return ["api", "query", "stamp"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const found =
      this.query === ""
        ? await api.call<{ conversations: Conversation[] }>("list_conversations", {
            limit: CHAT_LIST_LIMIT,
          })
        : await api.call<{ conversations: Conversation[] }>("search_conversations", {
            query: this.query,
            limit: CHAT_LIST_LIMIT,
          });
    return () => {
      this.conversations = found.conversations;
    };
  }

  private search(event: Event): void {
    event.preventDefault();
    const input = (event.target as HTMLFormElement).querySelector("input");
    this.query = (input?.value ?? "").trim();
  }

  private open(conversation: Conversation): void {
    const index = conversation.match?.index ?? null;
    this.dispatchEvent(
      new CustomEvent<OpenChat>(OPEN_CHAT, {
        detail: { id: conversation.id, index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async startRename(conversation: Conversation): Promise<void> {
    this.renaming = conversation.id;
    this.draftTitle = conversation.title;
    this.error = "";
    await this.updateComplete;
    this.shadowRoot?.querySelector<HTMLInputElement>("input.title")?.focus();
  }

  private async rename(event: Event, id: string): Promise<void> {
    event.preventDefault();
    const title = this.draftTitle.trim();
    if (title === "") {
      this.renaming = undefined;
      return;
    }
    const done = await this.run((api) => api.call("rename_conversation", { id, title }));
    if (done) this.renaming = undefined;
  }

  private renderName(conversation: Conversation): TemplateResult {
    if (this.renaming === conversation.id) {
      return html`<form
        class="rename"
        @submit=${(event: Event) => this.rename(event, conversation.id)}
      >
        <input
          class="title"
          aria-label="Chat title"
          maxlength="200"
          placeholder=${conversation.name}
          .value=${this.draftTitle}
          @input=${(event: Event) => {
            this.draftTitle = (event.target as HTMLInputElement).value;
          }}
          @keydown=${(event: KeyboardEvent) => {
            if (event.key === "Escape") this.renaming = undefined;
          }}
        />
      </form>`;
    }
    const readOnly = !conversation.id.startsWith(PANEL_CHAT);
    const when = relativeTime(conversation.updated);
    return html`<button
      class="open"
      aria-current=${conversation.id === this.active ? "true" : "false"}
      @click=${() => {
        this.open(conversation);
      }}
    >
      <span class="name">${conversation.name}</span>
      <span class="muted"
        >${readOnly ? `${when} · ${sourceText(conversation.source)}, read only` : when}</span
      >
      ${conversation.match === undefined ? nothing : snippet(conversation.match)}
    </button>`;
  }

  private renderItem(conversation: Conversation): TemplateResult {
    return html`<li
      data-id=${conversation.id}
      class=${conversation.id === this.active ? "active" : ""}
    >
      ${this.renderName(conversation)}
      <div class="row actions">
        <button
          class="rename"
          ?disabled=${this.busy}
          @click=${() => this.startRename(conversation)}
        >
          Rename
        </button>
        <tk-delete-conversation
          .api=${this.api}
          .conversationId=${conversation.id}
          .disabled=${conversation.id === this.locked}
        ></tk-delete-conversation>
      </div>
    </li>`;
  }

  override render(): TemplateResult {
    const conversations = this.conversations;
    return html`<form
        class="search row"
        role="search"
        @submit=${(event: Event) => {
          this.search(event);
        }}
      >
        <input
          class="search grow"
          type="search"
          aria-label="Search chats"
          placeholder="Search chats"
          .value=${this.query}
        />
      </form>
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      ${
        conversations?.length === 0
          ? html`<p class="muted">${this.query === "" ? "No chats yet" : "No chats match"}</p>`
          : nothing
      }
      <ul>
        ${repeat(
          conversations ?? [],
          (conversation) => conversation.id,
          (conversation) => this.renderItem(conversation),
        )}
      </ul>`;
  }
}

customElements.define("tk-chat-list", TkChatList);
