import { render } from "lit";
import { describe, expect, it } from "vitest";
import { snippet } from "../src/search";

describe("snippet", () => {
  it("marks the match by code points, as the backend counts, after an emoji", () => {
    const host = document.createElement("div");
    render(
      snippet({
        field: "message",
        index: 0,
        role: "user",
        snippet: "😀😀 abc NITRATE up",
        start: 7,
        end: 14,
      }),
      host,
    );

    expect(host.querySelector("mark")?.textContent).toBe("NITRATE");
    expect(host.textContent).toBe("😀😀 abc NITRATE up");
  });
});
