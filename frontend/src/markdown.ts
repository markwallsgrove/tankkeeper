import { html, nothing, type TemplateResult } from "lit";

/**
 * Markdown from the chat agent, shown with Lit templates only. Every piece of text is bound as text, never as HTML,
 * so HTML in a reply shows as typed. Links open only web addresses.
 */
export function markdown(text: string): TemplateResult {
  return html`${blocks(text.split("\n"))}`;
}

type Piece = string | TemplateResult;

const FENCE = /^\s*```/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const INLINE =
  /`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|(?<![\w*])\*([^*\s](?:[^*]*[^*\s])?)\*(?![\w*])|(?<!\w)_([^_\s](?:[^_]*[^_\s])?)_(?!\w)/g;

function blocks(lines: string[]): TemplateResult[] {
  const shown: TemplateResult[] = [];
  let index = 0;
  const take = (pattern: RegExp): string[] => {
    const items: string[] = [];
    for (let match = pattern.exec(lines[index] ?? ""); match !== null;) {
      items.push(match[1] ?? "");
      index += 1;
      match = pattern.exec(lines[index] ?? "");
    }
    return items;
  };
  while (index < lines.length) {
    const line = lines[index] ?? "";
    const heading = HEADING.exec(line);
    if (FENCE.test(line)) {
      const end = lines.findIndex((next, at) => at > index && FENCE.test(next));
      const stop = end === -1 ? lines.length : end;
      shown.push(html`<pre><code>${lines.slice(index + 1, stop).join("\n")}</code></pre>`);
      index = stop + 1;
    } else if (heading !== null) {
      const content = inline(heading[2] ?? "");
      shown.push(
        (heading[1] ?? "").length <= 2 ? html`<h3>${content}</h3>` : html`<h4>${content}</h4>`,
      );
      index += 1;
    } else if (BULLET.test(line)) {
      const items = take(BULLET).map(listItem);
      shown.push(
        html`<ul>
          ${items}
        </ul>`,
      );
    } else if (NUMBERED.test(line)) {
      const items = take(NUMBERED).map(listItem);
      shown.push(
        html`<ol>
          ${items}
        </ol>`,
      );
    } else if (line.trim() === "") {
      index += 1;
    } else {
      const paragraph: string[] = [];
      while (index < lines.length && startsParagraph(lines[index] ?? "")) {
        paragraph.push(lines[index] ?? "");
        index += 1;
      }
      const parts = paragraph.map(
        (part, at) => html`${at > 0 ? html`<br />` : nothing}${inline(part)}`,
      );
      shown.push(html`<p>${parts}</p>`);
    }
  }
  return shown;
}

function listItem(item: string): TemplateResult {
  return html`<li>${inline(item)}</li>`;
}

function startsParagraph(line: string): boolean {
  return (
    line.trim() !== "" &&
    !FENCE.test(line) &&
    !HEADING.test(line) &&
    !BULLET.test(line) &&
    !NUMBERED.test(line)
  );
}

function inline(text: string): Piece[] {
  const pieces: Piece[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) pieces.push(text.slice(last, match.index));
    const [whole, code, bold, label, address, starred, underscored] = match;
    if (code !== undefined) pieces.push(html`<code>${code}</code>`);
    else if (bold !== undefined) pieces.push(html`<strong>${inline(bold)}</strong>`);
    else if (label !== undefined) pieces.push(link(label, address ?? "", whole));
    else pieces.push(html`<em>${inline(starred ?? underscored ?? "")}</em>`);
    last = match.index + whole.length;
  }
  if (last < text.length) pieces.push(text.slice(last));
  return pieces;
}

function link(label: string, address: string, whole: string): Piece {
  if (!/^https?:\/\//i.test(address)) return whole;
  return html`<a href=${address} target="_blank" rel="noopener noreferrer">${inline(label)}</a>`;
}
