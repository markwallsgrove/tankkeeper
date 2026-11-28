import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { CLOSE, SEND, buttonStyles, textButton } from "./buttons";

/** A box on the photo, in fractions of its width and height from the top left. */
export interface AreaBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The box to look at and what the owner asks about it. */
export interface AskDetail extends AreaBox {
  question?: string;
}

export const ASK = "tk-ask";
export const CANCEL = "tk-cancel";
/** A box smaller than this each way is a click, not a box. */
const MIN_SIZE = 0.01;
const PLACES = 10000;

interface Point {
  x: number;
  y: number;
}

function fraction(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * PLACES) / PLACES;
}

/** The box between two corners. Its right and bottom edges never pass the photo's. */
export function boxBetween(a: Point, b: Point): AreaBox {
  const x = fraction(Math.min(a.x, b.x));
  const y = fraction(Math.min(a.y, b.y));
  return {
    x,
    y,
    width: Math.round((fraction(Math.max(a.x, b.x)) - x) * PLACES) / PLACES,
    height: Math.round((fraction(Math.max(a.y, b.y)) - y) * PLACES) / PLACES,
  };
}

/** A photo to drag a box on, a question about the box and Ask Claude. */
export class TkAreaPicker extends LitElement {
  static override properties = {
    src: { type: String },
    alt: { type: String },
    disabled: { type: Boolean },
    box: { state: true },
    question: { state: true },
  };

  static override styles = [
    buttonStyles,
    css`
      :host {
        display: block;
      }
      .frame {
        position: relative;
        max-width: 640px;
        margin: 8px 0;
        cursor: crosshair;
        touch-action: none;
        user-select: none;
        overflow: hidden;
        border-radius: 8px;
      }
      img {
        display: block;
        width: 100%;
        height: auto;
        border-radius: 8px;
        pointer-events: none;
      }
      .box {
        position: absolute;
        border: 2px solid var(--primary-color);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
        box-sizing: border-box;
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin: 8px 0;
      }
      input {
        font: inherit;
        padding: 8px;
        max-width: 624px;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .muted {
        color: var(--secondary-text-color);
      }
    `,
  ];

  declare src: string;
  declare alt: string;
  declare disabled: boolean;
  declare box: AreaBox | undefined;
  declare question: string;
  private start: Point | undefined;

  constructor() {
    super();
    this.src = "";
    this.alt = "";
    this.disabled = false;
    this.box = undefined;
    this.question = "";
    this.start = undefined;
  }

  private point(event: PointerEvent): Point {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  private down(event: PointerEvent): void {
    if (this.disabled) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.start = this.point(event);
    this.box = undefined;
  }

  private move(event: PointerEvent): void {
    if (this.start === undefined) return;
    this.box = boxBetween(this.start, this.point(event));
  }

  private up(event: PointerEvent): void {
    if (this.start === undefined) return;
    const box = boxBetween(this.start, this.point(event));
    this.start = undefined;
    this.box = box.width < MIN_SIZE || box.height < MIN_SIZE ? undefined : box;
  }

  private ask(box: AreaBox): void {
    const question = this.question.trim();
    const detail: AskDetail = question === "" ? { ...box } : { ...box, question };
    this.dispatchEvent(new CustomEvent<AskDetail>(ASK, { detail, bubbles: true, composed: true }));
  }

  private renderBox(box: AreaBox): TemplateResult {
    return html`<div
      class="box"
      style=${styleMap({
        left: `${String(box.x * 100)}%`,
        top: `${String(box.y * 100)}%`,
        width: `${String(box.width * 100)}%`,
        height: `${String(box.height * 100)}%`,
      })}
    ></div>`;
  }

  override render(): TemplateResult {
    const box = this.box;
    return html`<div
        class="frame"
        @pointerdown=${(event: PointerEvent) => {
          this.down(event);
        }}
        @pointermove=${(event: PointerEvent) => {
          this.move(event);
        }}
        @pointerup=${(event: PointerEvent) => {
          this.up(event);
        }}
        @pointercancel=${() => {
          this.start = undefined;
        }}
      >
        <img src=${this.src} alt=${this.alt} draggable="false" />
        ${box === undefined ? nothing : this.renderBox(box)}
      </div>
      <p class="muted">
        Drag over the part of the photo to look at closely. Claude sees it at the camera's full
        resolution, from a photo taken now.
      </p>
      <label>
        Question (optional)
        <input
          class="question"
          maxlength="500"
          .value=${this.question}
          @input=${(event: Event) => {
            this.question = (event.target as HTMLInputElement).value;
          }}
        />
      </label>
      <div class="row">
        ${textButton({
          icon: SEND,
          label: "Ask Claude",
          className: "ask",
          primary: true,
          disabled: this.disabled || box === undefined,
          onClick: () => {
            if (box !== undefined) this.ask(box);
          },
        })}
        ${textButton({
          icon: CLOSE,
          label: "Cancel",
          className: "cancel",
          onClick: () => {
            this.dispatchEvent(new CustomEvent(CANCEL, { bubbles: true, composed: true }));
          },
        })}
      </div>`;
  }
}

customElements.define("tk-area-picker", TkAreaPicker);
