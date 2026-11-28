import { LitElement, css, html, type TemplateResult } from "lit";
import { CLOSE, buttonStyles, iconButton } from "./buttons";

/** Fired as tk-dialog-closed when the dialog closes, by its close button or Escape. */
const CLOSED = "tk-dialog-closed";

/** A modal dialog with a heading and a close button, around what is slotted in. It opens as it is shown. */
export class TkDialog extends LitElement {
  static override properties = {
    heading: {},
    wide: { type: Boolean, reflect: true },
  };

  static override styles = [
    buttonStyles,
    css`
      dialog {
        box-sizing: border-box;
        width: min(480px, calc(100vw - 32px));
        max-height: calc(100vh - 32px);
        overflow: auto;
        padding: 12px 16px 16px;
        border: none;
        border-radius: var(--ha-card-border-radius, 12px);
        color: var(--primary-text-color);
        background: var(--ha-card-background, var(--card-background-color, #fff));
      }
      :host([wide]) dialog {
        width: min(960px, calc(100vw - 32px));
      }
      dialog::backdrop {
        background: rgb(0 0 0 / 40%);
      }
      .head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      h2 {
        flex: 1;
        font-size: 1.1em;
        margin: 0;
      }
    `,
  ];

  declare heading: string;
  /** Room for a large photo. */
  declare wide: boolean;

  constructor() {
    super();
    this.heading = "";
    this.wide = false;
  }

  private get dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  protected override firstUpdated(): void {
    this.dialog?.showModal();
  }

  /** Close the dialog, as its close button does. */
  close(): void {
    this.dialog?.close();
  }

  override render(): TemplateResult {
    return html`<dialog
      aria-labelledby="heading"
      @close=${() => {
        this.dispatchEvent(new CustomEvent(CLOSED, { bubbles: true, composed: true }));
      }}
    >
      <div class="head">
        <h2 id="heading">${this.heading}</h2>
        ${iconButton({
          icon: CLOSE,
          label: "Close",
          className: "close",
          onClick: () => {
            this.close();
          },
        })}
      </div>
      <slot></slot>
    </dialog>`;
  }
}

customElements.define("tk-dialog", TkDialog);
