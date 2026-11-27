import { html, type TemplateResult } from "lit";
import type { TankkeeperApi } from "./api";
import "./tk-history";
import type { Field } from "./types";

/** mdiCog from @mdi/js. */
export const COG =
  "M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z";

const INTEGRATION_PAGE = "/config/integrations/integration/tankkeeper";

/** The integration page, opened on the tank's entry when it is known. Its Configure button opens the options. */
export function settingsUrl(entryId: string | undefined): string {
  return entryId === undefined
    ? INTEGRATION_PAGE
    : `${INTEGRATION_PAGE}#config_entry=${encodeURIComponent(entryId)}`;
}

/** Move Home Assistant's frontend to the settings, as its own links do, without loading the page again. */
export function openSettings(entryId: string | undefined): void {
  history.pushState(null, "", settingsUrl(entryId));
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}

/** A cog that opens the settings, where these values are changed. */
export function cog(what: string, api: TankkeeperApi | undefined): TemplateResult {
  return html`<ha-icon-button
    class="settings"
    .path=${COG}
    label="Edit ${what} settings"
    @click=${() => {
      openSettings(api?.entryId);
    }}
  ></ha-icon-button>`;
}

/** A card title with a cog that opens the settings. */
export function settingsHeader(
  title: string,
  what: string,
  api: TankkeeperApi | undefined,
): TemplateResult {
  return html`<div class="row">
    <h2 class="grow">${title}</h2>
    ${cog(what, api)}
  </div>`;
}

function factText(field: Field, value: unknown): string {
  if (field.type === "checkbox" && typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length === 0 ? "Not set" : value.map(String).join(", ");
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

/** The values of the fields, read-only. */
export function facts(fields: Field[], values: object): TemplateResult {
  const known = new Map<string, unknown>(Object.entries(values));
  return html`<dl class="facts">
    ${fields.map(
      (field) =>
        html`<dt>${field.label}</dt>
          <dd class="pre">${factText(field, known.get(field.name))}</dd>`,
    )}
  </dl>`;
}

/** A record's history with Undo, folded away until it is opened. */
export function historyDetails(
  api: TankkeeperApi | undefined,
  collection: string,
  recordId: string,
  stamp: number,
): TemplateResult {
  return html`<details>
    <summary>History</summary>
    <tk-history
      .api=${api}
      .collection=${collection}
      .recordId=${recordId}
      .stamp=${stamp}
    ></tk-history>
  </details>`;
}
