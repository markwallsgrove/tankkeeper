import { css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { live } from "lit/directives/live.js";
import { errorMessage, type TankkeeperApi } from "../api";
import { TkView, shared, type ChatStart } from "../base";
import { changeText, shortTime } from "../format";
import { markdown } from "../markdown";
import type {
  ChatAgent,
  ConversationDetail,
  HistoryEntry,
  PhotoCheck,
  Proposal,
  Review,
} from "../types";

export const NO_TANK_AGENT =
  "TankKeeper's Assist agent is missing. Reload TankKeeper in Settings, Devices & services.";
export const NO_AGENT =
  "Choose the conversation agent in TankKeeper's Claude settings first: Settings, Devices & services, TankKeeper, Configure.";
/** As many items as one command lists, so an item to discuss is found. */
export const LOOKUP_LIMIT = 200;
export const ITEM_TEXT = 200;
const SAID = new Set(["user", "assistant", "error"]);

interface ChatMessage {
  role: string;
  text: string;
}

/** A conversation id for a new chat. It is not a ULID, so Home Assistant keeps it after its chat session ends. */
function newConversationId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return `panel_${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function clip(text: string): string {
  return text.length <= ITEM_TEXT ? text : `${text.slice(0, ITEM_TEXT - 1)}…`;
}

/** The first message about an item, with its text when it is found. */
async function opening(api: TankkeeperApi, start: ChatStart): Promise<string> {
  const { kind, id } = start;
  if (kind === "proposal") {
    const found = await api
      .call<{ proposals: Proposal[] }>("list_proposals", { state: "all", limit: LOOKUP_LIMIT })
      .then((listed) => listed.proposals.find((item) => item.proposal_id === id))
      .catch(() => undefined);
    return found === undefined
      ? `Let's discuss the waiting change ${id}.`
      : `Let's discuss the waiting change "${clip(found.summary)}" (proposal ${id}).`;
  }
  if (kind === "photo") {
    const found = await api
      .call<{ photos: PhotoCheck[] }>("list_photos", { limit: LOOKUP_LIMIT })
      .then((listed) => listed.photos.find((item) => item.id === id)?.summary)
      .catch(() => undefined);
    return found === undefined || found === null
      ? `Let's discuss photo check ${id}.`
      : `Let's discuss what the camera saw: "${clip(found)}" (photo check ${id}).`;
  }
  if (kind === "review") {
    const found = await api
      .call<{ reviews: Review[] }>("get_reviews", { limit: LOOKUP_LIMIT })
      .then((listed) => listed.reviews.find((item) => item.id === id))
      .catch(() => undefined);
    return found === undefined
      ? `Let's discuss review ${id}.`
      : `Let's discuss the review "${clip(found.result)}" (review ${id}).`;
  }
  return "Let's discuss the tank's status now.";
}

/**
 * Chat with the tank's Assist agent. Each chat is a TankKeeper conversation, so it shows in Conversations and can be
 * gone on with. The changes made in it show with Undo, and its waiting changes with Accept and Reject.
 */
export class TkChat extends TkView {
  static override properties = {
    ...TkView.properties,
    start: { attribute: false },
    agent: { state: true },
    messages: { state: true },
    draft: { state: true },
    sending: { state: true },
    changes: { state: true },
    proposals: { state: true },
  };

  static override styles = [
    shared,
    css`
      .messages {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }
      .message {
        max-width: 85%;
        padding: 6px 12px;
        border-radius: 12px;
        overflow-wrap: anywhere;
      }
      .message.user {
        align-self: flex-end;
        color: var(--text-primary-color, #fff);
        background: var(--primary-color);
      }
      .message.assistant {
        align-self: flex-start;
        background: var(--secondary-background-color);
      }
      .message.error {
        align-self: flex-start;
        color: var(--error-color);
      }
      .message p,
      .message pre {
        margin: 4px 0;
      }
      .message pre {
        overflow-x: auto;
      }
      .message ul,
      .message ol {
        margin: 4px 0;
        padding-left: 20px;
      }
      .message ul {
        list-style: disc;
      }
      .message li {
        padding: 0;
        border: none;
      }
      form.send textarea {
        font: inherit;
        width: 100%;
        box-sizing: border-box;
        min-height: 3em;
        resize: vertical;
      }
    `,
  ];

  declare start: ChatStart | undefined;
  declare agent: ChatAgent | undefined;
  declare messages: ChatMessage[];
  declare draft: string;
  declare sending: boolean;
  declare changes: HistoryEntry[];
  declare proposals: Proposal[];
  private conversationId = newConversationId();
  private recorded = false;
  private resuming = false;
  private begun = 0;

  constructor() {
    super();
    this.start = undefined;
    this.agent = undefined;
    this.messages = [];
    this.draft = "";
    this.sending = false;
    this.changes = [];
    this.proposals = [];
  }

  protected override reloadOn(): string[] {
    return ["api", "start"];
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("start")) this.begin(this.start);
    super.willUpdate(changed);
  }

  /** Start a chat: a new one, one about an item, or one that goes on with a saved conversation. */
  private begin(start: ChatStart | undefined): void {
    this.begun += 1;
    const resume = start?.kind === "resume";
    this.conversationId = resume ? start.id : newConversationId();
    this.recorded = resume;
    this.resuming = resume;
    this.messages = [];
    this.draft = "";
    this.sending = false;
    this.changes = [];
    this.proposals = [];
    this.error = "";
    const api = this.api;
    if (start === undefined || resume || api === undefined) return;
    const begun = this.begun;
    void opening(api, start).then((words) => {
      if (begun === this.begun && this.draft === "") this.draft = words;
    });
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const id = this.conversationId;
    const [agent, pending, detail] = await Promise.all([
      api.chatAgent(),
      api.call<{ proposals: Proposal[] }>("list_proposals", {
        state: "pending",
        limit: LOOKUP_LIMIT,
      }),
      this.recorded ? api.call<ConversationDetail>("get_conversation", { id }) : undefined,
    ]);
    return () => {
      this.agent = agent;
      this.proposals = pending.proposals.filter((item) => item.conversation_id === id);
      this.changes = detail?.changes ?? [];
      if (this.resuming && detail !== undefined) {
        this.resuming = false;
        this.messages = detail.messages.filter((message) => SAID.has(message.role));
      }
    };
  }

  private ready(): string | undefined {
    const agent = this.agent;
    return agent?.ready === true && agent.agent_id !== null ? agent.agent_id : undefined;
  }

  /** Why the chat cannot be used: the tank's own agent is gone, or no agent to pass chat to is chosen. */
  private missing(): string {
    return this.agent?.ready === true ? NO_TANK_AGENT : NO_AGENT;
  }

  private async send(): Promise<void> {
    const api = this.api;
    const agentId = this.ready();
    const words = this.draft.trim();
    if (api === undefined || agentId === undefined || words === "" || this.sending) return;
    const begun = this.begun;
    this.messages = [...this.messages, { role: "user", text: words }];
    this.draft = "";
    this.sending = true;
    let answer: ChatMessage;
    try {
      const result = await api.converse(words, this.conversationId, agentId);
      if (begun !== this.begun) return;
      this.conversationId = result.conversation_id ?? this.conversationId;
      this.recorded = true;
      const speech = result.response.speech?.plain?.speech ?? "";
      answer = {
        role: result.response.response_type === "error" ? "error" : "assistant",
        text: speech,
      };
    } catch (error: unknown) {
      if (begun !== this.begun) return;
      answer = { role: "error", text: errorMessage(error) };
    }
    this.messages = [...this.messages, answer];
    this.sending = false;
    await this.reload();
  }

  private newChat(): void {
    this.begin(undefined);
    void this.reload();
  }

  private async act(action: (api: TankkeeperApi) => Promise<unknown>): Promise<void> {
    if (await this.run(action)) this.changed();
  }

  private keydown(event: KeyboardEvent): void {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    void this.send();
  }

  private renderMessage(message: ChatMessage): TemplateResult {
    return html`<div class="message ${message.role}">
      ${
        message.role === "assistant"
          ? markdown(message.text)
          : html`<div class="pre">${message.text}</div>`
      }
    </div>`;
  }

  private renderLinked(): TemplateResult {
    return html`${
      this.changes.length === 0
        ? nothing
        : html`<h3>Changes made in this chat</h3>
            <ul class="changes">
              ${this.changes.map(
                (entry) =>
                  html`<li>
                    <div class="row">
                      <span class="grow">${entry.summary}</span>
                      <button
                        class="undo"
                        ?disabled=${this.busy}
                        @click=${() => this.act((api) => api.call("undo_change", { history_id: entry.id }))}
                      >
                        Undo
                      </button>
                    </div>
                    <div class="muted">${shortTime(entry.time)}</div>
                    ${entry.changes.map((change) => html`<div class="muted">${changeText(change)}</div>`)}
                  </li>`,
              )}
            </ul>`
    }
    ${
      this.proposals.length === 0
        ? nothing
        : html`<h3>Waiting for you</h3>
            <ul class="waiting">
              ${this.proposals.map(
                (proposal) =>
                  html`<li data-id=${proposal.proposal_id}>
                    <strong class="pre">${proposal.summary}</strong>
                    <div class="pre">${proposal.reason}</div>
                    ${proposal.changes.map((change) => html`<div class="muted">${changeText(change)}</div>`)}
                    <div class="row">
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
                  </li>`,
              )}
            </ul>`
    }`;
  }

  private renderChat(): TemplateResult {
    return html`<div class="messages">
        ${this.messages.map((message) => this.renderMessage(message))}
        ${this.sending ? html`<div class="muted">Thinking…</div>` : nothing}
      </div>
      <form
        class="send"
        @submit=${(event: Event) => {
          event.preventDefault();
          void this.send();
        }}
      >
        <textarea
          aria-label="Message"
          placeholder="Ask about the tank"
          .value=${live(this.draft)}
          ?disabled=${this.sending}
          @input=${(event: Event) => {
            this.draft = (event.target as HTMLTextAreaElement).value;
          }}
          @keydown=${(event: KeyboardEvent) => {
            this.keydown(event);
          }}
        ></textarea>
        <div class="row">
          <span class="grow muted">Enter sends, Shift+Enter adds a line.</span>
          <button class="primary" type="submit" ?disabled=${this.sending}>Send</button>
        </div>
      </form>
      ${this.renderLinked()}`;
  }

  override render(): TemplateResult {
    const ready = this.ready() !== undefined;
    return html`<section>
      <div class="row">
        <h2 class="grow">Chat</h2>
        ${
          ready
            ? html`<button
                class="new"
                ?disabled=${this.sending}
                @click=${() => {
                  this.newChat();
                }}
              >
                New chat
              </button>`
            : nothing
        }
      </div>
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      ${this.agent !== undefined && !ready ? html`<p class="muted">${this.missing()}</p>` : nothing}
      ${ready ? this.renderChat() : nothing}
    </section>`;
  }
}

customElements.define("tk-chat", TkChat);
