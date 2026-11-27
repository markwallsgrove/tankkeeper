import { render } from "lit";
import { describe, expect, it } from "vitest";
import { markdown } from "../src/markdown";

function shown(text: string): HTMLElement {
  const container = document.createElement("div");
  render(markdown(text), container);
  return container;
}

function html(text: string): string {
  return shown(text)
    .innerHTML.replace(/<!--[^>]*-->/g, "")
    .replace(/>\s*\n\s*</g, "><")
    .trim();
}

describe("markdown", () => {
  it("shows paragraphs, keeping the line breaks inside one", () => {
    expect(html("First line\nsecond line\n\nNext paragraph")).toBe(
      "<p>First line<br>second line</p><p>Next paragraph</p>",
    );
  });

  it("shows bold, italic and inline code", () => {
    expect(html("**Dose** *less* _today_ and `list_products`")).toBe(
      "<p><strong>Dose</strong> <em>less</em> <em>today</em> and <code>list_products</code></p>",
    );
  });

  it("leaves underscores and stars inside words alone", () => {
    expect(html("snake_case_name and 2*3*4")).toBe("<p>snake_case_name and 2*3*4</p>");
  });

  it("shows formatting inside bold", () => {
    expect(html("**very `important`**")).toBe(
      "<p><strong>very <code>important</code></strong></p>",
    );
  });

  it("shows headings, smaller for deeper levels", () => {
    expect(html("# Plan\n### Steps")).toBe("<h3>Plan</h3><h4>Steps</h4>");
  });

  it("shows bullet and numbered lists", () => {
    expect(html("- one\n* **two**\n\n1. first\n2. second")).toBe(
      "<ul><li>one</li><li><strong>two</strong></li></ul><ol><li>first</li><li>second</li></ol>",
    );
  });

  it("shows code blocks as they are, without formatting inside", () => {
    expect(html("```yaml\nkey: **value**\n  - <b>x</b>\n```\nAfter")).toBe(
      "<pre><code>key: **value**\n  - &lt;b&gt;x&lt;/b&gt;</code></pre><p>After</p>",
    );
  });

  it("shows a code block that is never closed up to the end", () => {
    expect(html("```\nopen")).toBe("<pre><code>open</code></pre>");
  });

  it("links only to web addresses, opening them in a new tab without the panel as opener", () => {
    const link = shown("See [the guide](https://example.com/a?b=1).").querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://example.com/a?b=1");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link?.textContent).toBe("the guide");
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "/config/users",
    "vbscript:x",
  ])("shows a link to %s as text, without a link", (address) => {
    const container = shown(`[click](${address})`);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("click");
  });

  it.each([
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    '<a href="javascript:alert(1)">x</a>',
    "**<iframe src=//evil>**",
    "# <svg onload=alert(1)>",
    "- <b onclick=alert(1)>x</b>",
  ])("shows HTML as text: %s", (text) => {
    const container = shown(text);
    expect(container.querySelectorAll("script, img, iframe, svg, a, b").length).toBe(0);
    expect(container.textContent).toContain("<");
  });

  it("shows nothing for empty text", () => {
    expect(html("")).toBe("");
  });
});
