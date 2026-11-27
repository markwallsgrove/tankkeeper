import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { errorMessage, type TankkeeperApi } from "./api";
import { HISTORY, SAVE, buttonStyles, iconButton } from "./buttons";
import "./tk-dialog";
import "./tk-form";
import type { Field, Values } from "./types";

/** Fired when a record changed, so the views that show it load again. */
export const CHANGED = "tk-changed";

export const shared = css`
  ${buttonStyles}
  :host {
    display: block;
    color: var(--primary-text-color);
  }
  section,
  .card {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border-radius: var(--ha-card-border-radius, 12px);
    border: 1px solid var(--divider-color);
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  h2 {
    font-size: 1.1em;
    margin: 0 0 8px;
  }
  h3 {
    font-size: 1em;
    margin: 8px 0 4px;
  }
  .pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  select,
  input {
    font: inherit;
    max-width: 100%;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    padding: 6px 0;
    border-bottom: 1px solid var(--divider-color);
    overflow-wrap: anywhere;
  }
  li:last-child {
    border-bottom: none;
  }
  button {
    font: inherit;
    padding: 4px 10px;
    border: 1px solid var(--primary-color);
    border-radius: 4px;
    color: var(--primary-color);
    background: none;
    cursor: pointer;
  }
  button.primary {
    color: var(--text-primary-color, #fff);
    background: var(--primary-color);
  }
  .muted {
    color: var(--secondary-text-color);
    font-size: 0.9em;
  }
  .error {
    color: var(--error-color);
  }
  .level.watch {
    color: var(--warning-color);
  }
  .level.act {
    color: var(--error-color);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .head h2 {
    margin: 0;
  }
  .actions.record {
    gap: 8px;
    margin-bottom: 8px;
  }
  li .detail {
    margin-top: 6px;
  }
  .grow {
    flex: 1 1 200px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  details {
    margin-top: 6px;
  }
  summary {
    cursor: pointer;
    color: var(--primary-color);
  }
  .chart {
    width: 100%;
    height: auto;
    max-height: 220px;
  }
  .chart .axis {
    stroke: var(--divider-color);
  }
  .chart .tick {
    font-size: 9px;
    fill: var(--secondary-text-color);
  }
  .chart .target {
    stroke-dasharray: 4 3;
  }
  .chart .line-label {
    font-size: 8px;
  }
  .chart .off {
    fill: var(--divider-color);
  }
  .chart .on {
    fill: var(--warning-color, #f4b400);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 0.85em;
  }
  .legend li {
    border: none;
    padding: 0;
  }
  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 4px;
  }
  .swatch.hollow {
    box-sizing: border-box;
    border: 2px solid;
    background: none;
  }
  .charts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .charts h3 {
    margin-top: 0;
  }
  dl.facts {
    display: grid;
    grid-template-columns: minmax(120px, max-content) 1fr;
    gap: 4px 12px;
    margin: 0 0 8px;
  }
  dl.facts dt {
    color: var(--secondary-text-color);
  }
  dl.facts dd {
    margin: 0;
    min-width: 0;
  }
  dl.facts .wide {
    grid-column: 1 / -1;
  }
  dl.facts dt.wide {
    margin-top: 4px;
  }
  .snippet {
    display: block;
    font-size: 0.9em;
  }
  mark {
    background: var(--warning-color, #f4b400);
    color: inherit;
  }
  .dash {
    display: inline-block;
    width: 14px;
    border-top: 2px dashed;
    margin-right: 4px;
    vertical-align: middle;
  }
`;

/** Fired to open the panel's chat, about one item or to go on with a saved conversation. */
export const CHAT = "tk-chat";

/** What the chat starts with: an item to discuss, named only by its id, or a saved conversation to go on with. */
export interface ChatStart {
  kind: "proposal" | "photo" | "review" | "status" | "resume";
  id: string;
}

/** Ask the panel to open its chat, from an element inside it. */
export function openChat(from: HTMLElement, start: ChatStart): void {
  from.dispatchEvent(
    new CustomEvent<ChatStart>(CHAT, { detail: start, bubbles: true, composed: true }),
  );
}

/** A form in its own dialog: what it is called, the fields and values it starts with, and how it saves. */
export interface FormDialog {
  /** Which dialog this is. One dialog is open at a time. */
  key: string;
  className: string;
  heading: string;
  fields: Field[];
  values?: object;
  submitLabel?: string;
  submitIcon?: string;
  /** Save what the form sent. The dialog closes once this returns true. */
  save: (values: Values) => Promise<boolean>;
}

/** A view that loads from the API, and loads again when a record it shows changed. */
export abstract class TkView extends LitElement {
  static override properties = {
    api: { attribute: false },
    error: { state: true },
    busy: { state: true },
    version: { state: true },
    dialog: { state: true },
    openHistories: { state: true },
  };

  declare api: TankkeeperApi | undefined;
  declare error: string;
  declare busy: boolean;
  declare version: number;
  /** The open dialog's key. */
  declare dialog: string | undefined;
  /** The keys of the histories that are open. */
  declare openHistories: ReadonlySet<string>;
  private loads = 0;

  constructor() {
    super();
    this.api = undefined;
    this.error = "";
    this.busy = false;
    this.version = 0;
    this.dialog = undefined;
    this.openHistories = new Set();
    this.addEventListener(CHANGED, (event) => {
      if (event.composedPath()[0] !== this) void this.reload();
    });
  }

  /** The properties that make the view load again. */
  protected reloadOn(): string[] {
    return ["api"];
  }

  /** Fetch what the view shows. The function it returns puts it on screen. */
  protected abstract load(api: TankkeeperApi): Promise<() => void>;

  protected override willUpdate(changed: PropertyValues): void {
    if (this.reloadOn().some((name) => changed.has(name))) void this.reload();
  }

  /** Load again. Only the latest load is shown, so a slow older answer can't replace a newer one. */
  async reload(): Promise<void> {
    const api = this.api;
    if (api === undefined) return;
    this.loads += 1;
    const load = this.loads;
    try {
      const show = await this.load(api);
      if (load !== this.loads) return;
      show();
      this.error = "";
      this.version += 1;
    } catch (error: unknown) {
      if (load === this.loads) this.error = errorMessage(error);
    }
  }

  /** Run an action, then load again. Returns whether it worked. */
  protected async run(action: (api: TankkeeperApi) => Promise<unknown>): Promise<boolean> {
    const api = this.api;
    if (api === undefined) return false;
    this.busy = true;
    try {
      await action(api);
      this.error = "";
      await this.reload();
      return true;
    } catch (error: unknown) {
      this.error = errorMessage(error);
      return false;
    } finally {
      this.busy = false;
    }
  }

  /** Tell the views around this one that a record changed. */
  protected changed(): void {
    this.dispatchEvent(new CustomEvent(CHANGED, { bubbles: true, composed: true }));
  }

  /** Open a dialog, without the error of what was done before. */
  protected openDialog(key: string): void {
    this.error = "";
    this.dialog = key;
  }

  /** The view's error. While a dialog is open, the dialog shows it instead. */
  protected renderError(): TemplateResult | typeof nothing {
    return this.dialog === undefined && this.error
      ? html`<p class="error">${this.error}</p>`
      : nothing;
  }

  /** The form in its dialog while that dialog is open. Errors show in it, and it closes after a save. */
  protected formDialog(form: FormDialog): TemplateResult | typeof nothing {
    if (this.dialog !== form.key) return nothing;
    return html`<tk-dialog
      class=${form.className}
      heading=${form.heading}
      @tk-dialog-closed=${() => {
        this.dialog = undefined;
      }}
    >
      <tk-form
        class=${form.className}
        .fields=${form.fields}
        .values=${form.values ?? {}}
        .submitLabel=${form.submitLabel ?? "Save"}
        .submitIcon=${form.submitIcon ?? SAVE}
        .busy=${this.busy}
        .error=${this.error}
        @tk-save=${async (event: CustomEvent<Values>) => {
          if (await form.save(event.detail)) this.dialog = undefined;
        }}
      ></tk-form>
    </tk-dialog>`;
  }

  /** The icon button that opens and closes a record's history. */
  protected historyButton(collection: string, recordId: string): TemplateResult {
    const key = `${collection}/${recordId}`;
    return iconButton({
      icon: HISTORY,
      label: "History",
      className: "history",
      onClick: () => {
        const open = new Set(this.openHistories);
        if (!open.delete(key)) open.add(key);
        this.openHistories = open;
      },
    });
  }

  /** A record's history with Undo, while its history button has it open. */
  protected historyPanel(collection: string, recordId: string): TemplateResult | typeof nothing {
    if (!this.openHistories.has(`${collection}/${recordId}`)) return nothing;
    return html`<tk-history
      .api=${this.api}
      .collection=${collection}
      .recordId=${recordId}
      .stamp=${this.version}
    ></tk-history>`;
  }

  /** A record's history button, on its own line, with the history under it while it is open. */
  protected historyDetails(collection: string, recordId: string): TemplateResult {
    return html`<div class="actions">${this.historyButton(collection, recordId)}</div>
      ${this.historyPanel(collection, recordId)}`;
  }
}
