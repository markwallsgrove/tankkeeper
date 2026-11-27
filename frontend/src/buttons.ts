import { css, html, svg, type TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";

/** mdiPencil from @mdi/js. */
export const PENCIL =
  "M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z";
/** mdiHistory from @mdi/js. */
export const HISTORY =
  "M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3";
/** mdiDelete from @mdi/js. */
export const DELETE =
  "M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z";
/** mdiDeleteSweep from @mdi/js. */
export const DELETE_LATER =
  "M15,16H19V18H15V16M15,8H22V10H15V8M15,12H21V14H15V12M3,18A2,2 0 0,0 5,20H11A2,2 0 0,0 13,18V8H3V18M14,5H11L10,4H6L5,5H2V7H14V5Z";
/** mdiPlus from @mdi/js. */
export const PLUS = "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z";
/** mdiUndo from @mdi/js. */
export const UNDO =
  "M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z";
/** mdiCheck from @mdi/js. */
export const CHECK = "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z";
/** mdiClose from @mdi/js. */
export const CLOSE =
  "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";
/** mdiChatOutline from @mdi/js. */
export const CHAT =
  "M12,3C6.5,3 2,6.58 2,11C2.05,13.15 3.06,15.17 4.75,16.5C4.75,17.1 4.33,18.67 2,21C4.37,20.89 6.64,20 8.47,18.5C9.61,18.83 10.81,19 12,19C17.5,19 22,15.42 22,11C22,6.58 17.5,3 12,3M12,17C7.58,17 4,14.31 4,11C4,7.69 7.58,5 12,5C16.42,5 20,7.69 20,11C20,14.31 16.42,17 12,17Z";
/** mdiChatPlus from @mdi/js. */
export const CHAT_PLUS =
  "M18 14H20V17H23V19H20V22H18V19H15V17H18V14M12 3C17.5 3 22 6.58 22 11C22 11.58 21.92 12.14 21.78 12.68C20.95 12.25 20 12 19 12C15.69 12 13 14.69 13 18L13.08 18.95L12 19C10.76 19 9.57 18.82 8.47 18.5C5.55 21 2 21 2 21C4.33 18.67 4.7 17.1 4.75 16.5C3.05 15.07 2 13.14 2 11C2 6.58 6.5 3 12 3Z";
/** mdiForum from @mdi/js. */
export const CHATS =
  "M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z";
/** mdiSend from @mdi/js. */
export const SEND = "M2,21L23,12L2,3V10L17,12L2,14V21Z";
/** mdiSkipNext from @mdi/js. */
export const SKIP = "M16,18H18V6H16M6,18L14.5,12L6,6V18Z";
/** mdiArrowLeft from @mdi/js. */
export const BACK = "M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z";
/** mdiMagnify from @mdi/js. */
export const SEARCH =
  "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z";
/** mdiArrowRight from @mdi/js. */
export const OPEN = "M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z";
/** mdiRenameOutline from @mdi/js. */
export const RENAME =
  "M15 16L11 20H21V16H15M12.06 7.19L3 16.25V20H6.75L15.81 10.94L12.06 7.19M5.92 18H5V17.08L12.06 10L13 10.94L5.92 18M18.71 8.04C19.1 7.65 19.1 7 18.71 6.63L16.37 4.29C16.17 4.09 15.92 4 15.66 4C15.41 4 15.15 4.1 14.96 4.29L13.13 6.12L16.88 9.87L18.71 8.04Z";
/** mdiCamera from @mdi/js. */
export const CAMERA =
  "M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z";
/** mdiImageMultiple from @mdi/js. */
export const PHOTOS =
  "M22,16V4A2,2 0 0,0 20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16M11,12L13.03,14.71L16,11L20,16H8M2,6V20A2,2 0 0,0 4,22H18V20H4V6";
/** mdiThumbUp from @mdi/js. */
export const NOT_A_PROBLEM =
  "M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10M1,21H5V9H1V21Z";
/** mdiContentSave from @mdi/js. */
export const SAVE =
  "M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z";
/** mdiSwapHorizontal from @mdi/js. */
export const REPLACE = "M21,9L17,5V8H10V10H17V13M7,11L3,15L7,19V16H14V14H7V11Z";
/** mdiEyedropper from @mdi/js. */
export const DOSE =
  "M19.35,11.72L17.22,13.85L15.81,12.43L8.1,20.14L3.5,22L2,20.5L3.86,15.9L11.57,8.19L10.15,6.78L12.28,4.65L19.35,11.72M16.76,3C17.93,1.83 19.83,1.83 21,3C22.17,4.17 22.17,6.07 21,7.24L19.08,9.16L14.84,4.92L16.76,3M5.56,17.03L4.5,19.5L6.97,18.44L14.4,11L13,9.6L5.56,17.03Z";
/** mdiTestTube from @mdi/js. */
export const TEST =
  "M7,2V4H8V18A4,4 0 0,0 12,22A4,4 0 0,0 16,18V4H17V2H7M11,16C10.4,16 10,15.6 10,15C10,14.4 10.4,14 11,14C11.6,14 12,14.4 12,15C12,15.6 11.6,16 11,16M13,12C12.4,12 12,11.6 12,11C12,10.4 12.4,10 13,10C13.6,10 14,10.4 14,11C14,11.6 13.6,12 13,12M14,7H10V4H14V7Z";
/** mdiChevronDown from @mdi/js. */
export const EXPAND = "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z";
/** mdiChevronUp from @mdi/js. */
export const COLLAPSE = "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z";

/** One thing a Member can do: its icon, the words that name it and its class. */
export interface Action {
  icon: string;
  label: string;
  className: string;
  onClick: () => void;
  disabled?: boolean;
}

/** A button with words: the primary look, a submit button, or one that opens and closes another element. */
export interface TextAction extends Omit<Action, "onClick"> {
  onClick?: () => void;
  primary?: boolean;
  type?: "button" | "submit";
  expanded?: boolean;
  controls?: string;
}

/** An mdi icon drawn in the text colour, for a button with words. */
export function icon(path: string): TemplateResult {
  return html`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
    ${svg`<path d=${path}></path>`}
  </svg>`;
}

/** A row action: an icon button whose label is its name and its tooltip. */
export function iconButton(action: Action): TemplateResult {
  const disabled = action.disabled === true;
  return html`<ha-icon-button
    class=${action.className}
    .path=${action.icon}
    label=${action.label}
    ?disabled=${disabled}
    @click=${() => {
      if (!disabled) action.onClick();
    }}
  ></ha-icon-button>`;
}

/** A button with its icon before its words. */
export function textButton(action: TextAction): TemplateResult {
  const expanded = action.expanded === undefined ? undefined : String(action.expanded);
  return html`<button
    class="${action.className}${action.primary === true ? " primary" : ""} with-icon"
    type=${action.type ?? "button"}
    ?disabled=${action.disabled === true}
    aria-expanded=${ifDefined(expanded)}
    aria-controls=${ifDefined(action.controls)}
    @click=${() => {
      action.onClick?.();
    }}
  >
    ${icon(action.icon)}<span>${action.label}</span>
  </button>`;
}

/** How buttons with icons look, for each element that shows them. */
export const buttonStyles = css`
  button.with-icon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  svg.icon {
    width: 18px;
    height: 18px;
    flex: none;
    fill: currentColor;
  }
  ha-icon-button {
    --mdc-icon-button-size: 36px;
    --mdc-icon-size: 20px;
    color: var(--secondary-text-color);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
  }
`;
