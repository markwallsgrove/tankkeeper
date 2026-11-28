import { css, html, nothing, type TemplateResult } from "lit";
import { shortTime } from "./format";
import type { PhotoCheck } from "./types";

const REASONS: Record<PhotoCheck["reason"], string> = {
  daily: "Daily",
  test: "After a test",
  manual: "Check now",
  chat: "Asked in a chat",
};

const SEEN: [string, string][] = [
  ["water", "Water"],
  ["algae", "Algae"],
  ["plants", "Plants"],
  ["fish", "Fish"],
  ["level", "Water level"],
];

/** How a photo check's photo and text look. */
export const photoStyles = css`
  .photo {
    display: block;
    width: 100%;
    max-width: 640px;
    height: auto;
    border-radius: 8px;
    margin: 8px 0;
  }
  .summary {
    font-weight: 500;
  }
  ul.seen li {
    border: none;
    padding: 2px 0;
  }
`;

/** A photo check's photo, or nothing once it is no longer kept. */
export function photo(check: PhotoCheck): TemplateResult | typeof nothing {
  return check.photo_url === null
    ? nothing
    : html`<img class="photo" src=${check.photo_url} alt="The tank at ${shortTime(check.time)}" />`;
}

/** When a photo check ran and why. */
export function heading(check: PhotoCheck): string {
  return `${shortTime(check.time)} · ${REASONS[check.reason]}`;
}

/** Whether Claude found an issue, when Claude looked at the photo. */
export function verdict(check: PhotoCheck): TemplateResult | typeof nothing {
  if (!check.asked) return nothing;
  return html`<strong class="verdict">${check.issue ? "Issue found" : "No issue found"}</strong>`;
}

/** What Claude saw in a photo, or why it did not look. */
export function finding(check: PhotoCheck): TemplateResult {
  const seen = SEEN.filter(([area]) => check.seen[area] !== undefined);
  return html`
    ${check.summary === null ? nothing : html`<div class="summary">${check.summary}</div>`}
    ${check.suggestion === null ? nothing : html`<div>Suggested: ${check.suggestion}</div>`}
    ${
      seen.length === 0
        ? nothing
        : html`<ul class="seen">
            ${seen.map(([area, label]) => html`<li><strong>${label}</strong> ${check.seen[area]}</li>`)}
          </ul>`
    }
    ${check.note === null ? nothing : html`<div class="muted note">${check.note}</div>`}
  `;
}
