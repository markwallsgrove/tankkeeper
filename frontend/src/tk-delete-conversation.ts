import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { errorMessage, type TankkeeperApi } from "./api";
import { shared } from "./base";
import { CLOSE, DELETE, iconButton, textButton } from "./buttons";
import type { DeleteAsked } from "./types";

/** Fired once a conversation is deleted, with its id. */
export const DELETED = "tk-conversation-deleted";

function count(amount: number, one: string, many: string): string {
  return `${String(amount)} ${amount === 1 ? one : many}`;
}

/**
 * Delete for one conversation. The first click asks TankKeeper for a code and says what goes; Delete conversation
 * sends the code. The changes made in the conversation stay in the history.
 */
export class TkDeleteConversation extends LitElement {
  static override properties = {
    api: { attribute: false },
    conversationId: { attribute: false },
    disabled: { attribute: false },
    asked: { state: true },
    error: { state: true },
    busy: { state: true },
  };

  static override styles = [
    shared,
    css`
      :host {
        display: inline-block;
      }
      div.confirm {
        margin-top: 6px;
        padding: 8px;
        border: 1px solid var(--error-color);
        border-radius: 4px;
      }
      button.confirm-delete {
        color: var(--text-primary-color, #fff);
        background: var(--error-color);
        border-color: var(--error-color);
      }
    `,
  ];

  declare api: TankkeeperApi | undefined;
  declare conversationId: string;
  declare disabled: boolean;
  declare asked: DeleteAsked | undefined;
  declare error: string;
  declare busy: boolean;

  constructor() {
    super();
    this.api = undefined;
    this.conversationId = "";
    this.disabled = false;
    this.asked = undefined;
    this.error = "";
    this.busy = false;
  }

  private async attempt(action: (api: TankkeeperApi) => Promise<void>): Promise<void> {
    const api = this.api;
    if (api === undefined) return;
    this.busy = true;
    this.error = "";
    try {
      await action(api);
    } catch (error: unknown) {
      this.asked = undefined;
      this.error = errorMessage(error);
    } finally {
      this.busy = false;
    }
  }

  private async ask(): Promise<void> {
    await this.attempt(async (api) => {
      this.asked = await api.call<DeleteAsked>("delete_conversation", { id: this.conversationId });
    });
    await this.focusOn("button.cancel");
  }

  private async confirm(code: string): Promise<void> {
    const id = this.conversationId;
    await this.attempt(async (api) => {
      await api.call("delete_conversation", { id, code });
      this.asked = undefined;
      this.dispatchEvent(
        new CustomEvent<string>(DELETED, { detail: id, bubbles: true, composed: true }),
      );
    });
  }

  private async cancel(): Promise<void> {
    this.asked = undefined;
    await this.focusOn("ha-icon-button.delete");
  }

  private async focusOn(selector: string): Promise<void> {
    await this.updateComplete;
    this.shadowRoot?.querySelector<HTMLElement>(selector)?.focus();
  }

  private renderAsked(asked: DeleteAsked): TemplateResult {
    const goes = asked.messages === 1 ? "goes" : "go";
    const stays = asked.changes === 1 ? "stays" : "stay";
    return html`<div class="confirm" role="alertdialog" aria-labelledby="ask">
      <p id="ask" class="pre">
        Delete "${asked.name}"? Its ${count(asked.messages, "message", "messages")} ${goes}. The
        ${count(asked.changes, "change", "changes")} made in it ${stays} in the history, and Undo
        still works.
      </p>
      <div class="row">
        ${textButton({
          icon: CLOSE,
          label: "Cancel",
          className: "cancel",
          disabled: this.busy,
          onClick: () => void this.cancel(),
        })}
        ${textButton({
          icon: DELETE,
          label: "Delete conversation",
          className: "confirm confirm-delete",
          disabled: this.disabled || this.busy,
          onClick: () => void this.confirm(asked.code),
        })}
      </div>
    </div>`;
  }

  override render(): TemplateResult {
    return html`${iconButton({
      icon: DELETE,
      label: "Delete",
      className: "delete",
      disabled: this.disabled || this.busy || this.asked !== undefined,
      onClick: () => void this.ask(),
    })}
    ${this.asked === undefined ? nothing : this.renderAsked(this.asked)}
    ${this.error ? html`<p class="error">${this.error}</p>` : nothing}`;
  }
}

customElements.define("tk-delete-conversation", TkDeleteConversation);
