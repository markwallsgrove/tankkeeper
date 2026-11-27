import { html, nothing, type TemplateResult } from "lit";
import type { TankkeeperApi } from "./api";
import { TkView, shared } from "./base";
import { UNDO, iconButton } from "./buttons";
import { changeText, shortTime, sourceText } from "./format";
import type { HistoryEntry } from "./types";

/** The latest changes to a record or collection, each with Undo. */
export class TkHistory extends TkView {
  static override properties = {
    ...TkView.properties,
    collection: { attribute: false },
    recordId: { attribute: false },
    stamp: { attribute: false },
    entries: { state: true },
  };

  static override styles = shared;

  declare collection: string;
  declare recordId: string | undefined;
  declare stamp: number;
  declare entries: HistoryEntry[] | undefined;

  constructor() {
    super();
    this.collection = "";
    this.recordId = undefined;
    this.stamp = 0;
    this.entries = undefined;
  }

  private details: HTMLDetailsElement | null = null;

  private readonly toggled = (): void => {
    if (this.details?.open === true) void this.reload();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.details = this.closest("details");
    this.details?.addEventListener("toggle", this.toggled);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.details?.removeEventListener("toggle", this.toggled);
    this.details = null;
  }

  /** Inside details, load only while they are open. */
  override async reload(): Promise<void> {
    if (this.details !== null && !this.details.open) return;
    await super.reload();
  }

  protected override reloadOn(): string[] {
    return ["api", "collection", "recordId", "stamp"];
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const args: Record<string, unknown> = { collection: this.collection, limit: 10 };
    if (this.recordId !== undefined) args.record_id = this.recordId;
    const { history } = await api.call<{ history: HistoryEntry[] }>("get_history", args);
    return () => {
      this.entries = history;
    };
  }

  private async undo(entry: HistoryEntry): Promise<void> {
    if (await this.run((api) => api.call("undo_change", { history_id: entry.id }))) this.changed();
  }

  override render(): TemplateResult | typeof nothing {
    if (this.entries === undefined) return nothing;
    return html`
      ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
      ${this.entries.length === 0 ? html`<p class="muted">No changes yet</p>` : nothing}
      <ul>
        ${this.entries.map(
          (entry) =>
            html`<li class="row">
              <div class="grow">
                <div>${entry.summary}</div>
                <div class="muted when">
                  ${shortTime(entry.time)} ·
                  ${sourceText(entry.source)}${
                    typeof entry.conversation_name === "string"
                      ? ` · in ${entry.conversation_name}`
                      : nothing
                  }
                </div>
                ${entry.changes.map((change) => html`<div class="muted">${changeText(change)}</div>`)}
              </div>
              ${iconButton({
                icon: UNDO,
                label: "Undo",
                className: "undo",
                disabled: this.busy,
                onClick: () => void this.undo(entry),
              })}
            </li>`,
        )}
      </ul>
    `;
  }
}

customElements.define("tk-history", TkHistory);
