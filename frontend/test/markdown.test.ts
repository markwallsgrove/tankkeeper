import { render } from "lit";
import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import { markdown } from "../src/markdown";
import type { TkEmbed } from "../src/tk-embed";
import { FakeConnection } from "./fake";

const ID = "01JD0000000000000000000000";

function shown(text: string, api?: TankkeeperApi): HTMLElement {
  const container = document.createElement("div");
  render(markdown(text, api), container);
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

  it("shows photos and charts in their place when it has the API", () => {
    const api = new TankkeeperApi(new FakeConnection());
    const container = shown(
      `Here it is:\n![The tank](tankkeeper:photo/${ID})\n\nAnd ![](tankkeeper:chart/nitrate?days=7) **now**`,
      api,
    );

    const embeds = [...container.querySelectorAll<TkEmbed>("tk-embed")];
    expect(embeds.map((embed) => [embed.address, embed.alt, embed.api])).toEqual([
      [`tankkeeper:photo/${ID}`, "The tank", api],
      ["tankkeeper:chart/nitrate?days=7", "", api],
    ]);
    expect(container.textContent).toContain("Here it is:");
    expect(container.querySelector("strong")?.textContent).toBe("now");
  });

  it("shows photos and charts as text without the API", () => {
    const container = shown(`![The tank](tankkeeper:photo/${ID})`);

    expect(container.querySelector("tk-embed")).toBeNull();
    expect(container.textContent).toContain(`![The tank](tankkeeper:photo/${ID})`);
  });

  it.each([
    "//example.com/tank.jpg",
    "data:image/png;base64,AAAA",
    "javascript:alert(1)",
    "/api/tankkeeper/photos/01JD0000000000000000000000",
    "tankkeeper:chart/salinity",
    "tankkeeper:photo/../../secrets",
  ])("shows an image from %s as text, loading nothing", (address) => {
    const api = new TankkeeperApi(new FakeConnection());
    const container = shown(`Look ![tank](${address}) here`, api);

    expect(container.querySelectorAll("img, a, tk-embed").length).toBe(0);
    expect(container.textContent).toContain(`![tank](${address})`);
  });

  it.each(["https://example.com/tank.jpg", "http://example.com/pixel.gif?leak=nitrate"])(
    "shows an image from %s as a ! and a link, loading nothing",
    (address) => {
      const api = new TankkeeperApi(new FakeConnection());
      const container = shown(`Done![tank](${address})`, api);

      expect(container.querySelectorAll("img, tk-embed").length).toBe(0);
      expect(container.querySelector("a")?.getAttribute("href")).toBe(address);
      expect(container.textContent).toContain("Done!tank");
    },
  );

  it("shows an image with no text and a web address as text, not an empty link", () => {
    const api = new TankkeeperApi(new FakeConnection());
    const container = shown("See ![](https://example.com/tank.jpg)", api);

    expect(container.querySelectorAll("img, a, tk-embed").length).toBe(0);
    expect(container.textContent).toContain("![](https://example.com/tank.jpg)");
  });

  it("shows at most five photos and charts in one reply, and the rest as text", () => {
    const api = new TankkeeperApi(new FakeConnection());
    const chart = (days: number): string =>
      `![Nitrate](tankkeeper:chart/nitrate?days=${String(days)})`;
    const container = shown(
      `${chart(1)} ${chart(2)}\n- ${chart(3)}\n- ${chart(4)}\n\n**${chart(5)}** ${chart(6)}`,
      api,
    );

    const embeds = [...container.querySelectorAll("tk-embed")] as TkEmbed[];
    expect(embeds.map((embed) => embed.address)).toEqual(
      [1, 2, 3, 4, 5].map((days) => `tankkeeper:chart/nitrate?days=${String(days)}`),
    );
    expect(container.textContent).toContain(chart(6));
  });

  it("keeps code that shows an embed as code", () => {
    const api = new TankkeeperApi(new FakeConnection());
    const container = shown(`\`![x](tankkeeper:photo/${ID})\``, api);

    expect(container.querySelector("tk-embed")).toBeNull();
    expect(container.querySelector("code")?.textContent).toBe(`![x](tankkeeper:photo/${ID})`);
  });

  it("shows nothing for empty text", () => {
    expect(html("")).toBe("");
  });
});
