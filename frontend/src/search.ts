import { html, type TemplateResult } from "lit";
import type { SearchMatch } from "./types";

/**
 * The words around a search match, with the match marked. start and end count code points, as the backend does.
 * Text bindings only, so nothing in it is read as HTML.
 */
export function snippet(match: SearchMatch): TemplateResult {
  const points = Array.from(match.snippet);
  const part = (from: number, to?: number): string => points.slice(from, to).join("");
  return html`<span class="snippet pre"
    >${part(0, match.start)}<mark>${part(match.start, match.end)}</mark>${part(match.end)}</span
  >`;
}
