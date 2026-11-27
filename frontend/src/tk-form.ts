import { LitElement, css, html, nothing, type TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { SAVE, buttonStyles, icon } from "./buttons";
import type { Field, Values } from "./types";

type Input = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function capitalised(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function ticked(form: HTMLFormElement, name: string): string[] {
  return [...form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)]
    .filter((box) => box.checked)
    .map((box) => box.value);
}

function read(field: Field, form: HTMLFormElement): unknown {
  if (field.type === "weekdays") return ticked(form, field.name);
  const input = form.elements.namedItem(field.name) as Input;
  return field.type === "checkbox"
    ? (input as HTMLInputElement).checked
    : parsed(field, input.value);
}

function shown(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(String).join("\n");
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    return String(value);
  return JSON.stringify(value);
}

function parsed(field: Field, raw: string): unknown {
  if (field.type === "number") return raw.trim() === "" ? null : Number(raw);
  if (field.type === "list") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");
  }
  return raw;
}

function empty(value: unknown): boolean {
  return (
    value === "" ||
    value === null ||
    value === false ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * The fields whose value differs from the record's. A new record sends the ones filled in.
 * An emptied number becomes null.
 */
export function readForm(fields: Field[], form: HTMLFormElement, values: Values): Values {
  const changed: Values = {};
  for (const field of fields) {
    const value = read(field, form);
    const before = values[field.name];
    if (empty(value) && (before === undefined || before === null)) continue;
    if (JSON.stringify(value) !== JSON.stringify(before)) changed[field.name] = value;
  }
  return changed;
}

/** A form for one record. It fires tk-save with the changed fields. */
export class TkForm extends LitElement {
  static override properties = {
    fields: { attribute: false },
    values: { attribute: false },
    submitLabel: { attribute: false },
    submitIcon: { attribute: false },
    busy: { type: Boolean },
    error: { attribute: false },
  };

  declare fields: Field[];
  declare values: Values;
  declare submitLabel: string;
  declare submitIcon: string;
  declare busy: boolean;
  declare error: string;

  constructor() {
    super();
    this.fields = [];
    this.values = {};
    this.submitLabel = "Save";
    this.submitIcon = SAVE;
    this.busy = false;
    this.error = "";
  }

  static override styles = [
    buttonStyles,
    css`
      form {
        display: grid;
        gap: 8px;
      }
      label {
        display: grid;
        gap: 2px;
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }
      input:not([type="checkbox"]),
      select,
      textarea {
        font: inherit;
        padding: 6px;
        color: var(--primary-text-color);
        background: var(--input-fill-color, var(--secondary-background-color));
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        box-sizing: border-box;
        width: 100%;
      }
      button {
        justify-self: start;
        font: inherit;
        padding: 6px 14px;
        border: none;
        border-radius: 4px;
        color: var(--text-primary-color, #fff);
        background: var(--primary-color);
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.5;
      }
      .error {
        color: var(--error-color);
      }
      fieldset {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 12px;
        margin: 0;
        padding: 0;
        border: none;
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }
      legend {
        padding: 0 0 2px;
      }
      label.day {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--primary-text-color);
      }
    `,
  ];

  private weekdays(field: Field): TemplateResult {
    const value = this.values[field.name];
    const chosen = Array.isArray(value) ? value.map(String) : [];
    return html`<fieldset>
      <legend>${field.label}</legend>
      ${WEEKDAYS.map(
        (day) =>
          html`<label class="day"
            ><input
              name=${field.name}
              type="checkbox"
              value=${day}
              .checked=${chosen.includes(day)}
            />${capitalised(day)}</label
          >`,
      )}
    </fieldset>`;
  }

  private input(field: Field): TemplateResult {
    const value = shown(this.values[field.name]);
    if (field.type === "select") {
      return html`<select name=${field.name} ?required=${field.required === true} .value=${value}>
        <option value="" ?selected=${value === ""}></option>
        ${(field.options ?? []).map(
          (option) =>
            html`<option value=${option} ?selected=${option === value}>${option}</option>`,
        )}
      </select>`;
    }
    if (field.type === "checkbox") {
      return html`<input
        name=${field.name}
        type="checkbox"
        .checked=${this.values[field.name] === true}
      />`;
    }
    if (field.type === "textarea" || field.type === "list") {
      return html`<textarea
        name=${field.name}
        rows="3"
        ?required=${field.required === true}
        .value=${value}
      ></textarea>`;
    }
    return html`<input
      name=${field.name}
      type=${field.type}
      step=${ifDefined(field.step ?? (field.type === "number" ? "any" : undefined))}
      ?required=${field.required === true}
      .value=${value}
    />`;
  }

  private submit(event: Event): void {
    event.preventDefault();
    const detail = readForm(this.fields, event.target as HTMLFormElement, this.values);
    this.dispatchEvent(
      new CustomEvent<Values>("tk-save", { detail, bubbles: true, composed: true }),
    );
  }

  override render(): TemplateResult {
    return html`<form
      @submit=${(event: SubmitEvent) => {
        this.submit(event);
      }}
    >
      ${this.fields.map((field) =>
        field.type === "weekdays"
          ? this.weekdays(field)
          : html`<label>${field.label} ${this.input(field)}</label>`,
      )}
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      <button class="with-icon" type="submit" ?disabled=${this.busy}>
        ${icon(this.submitIcon)}<span>${this.submitLabel}</span>
      </button>
    </form>`;
  }
}

customElements.define("tk-form", TkForm);
