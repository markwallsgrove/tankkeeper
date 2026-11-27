import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/claude";
import type { TkClaude } from "../src/views/claude";
import type { TkForm } from "../src/tk-form";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const settings = {
  agent: "conversation.claude_conversation",
  ai_task: null,
  review_on: ["test", "status"],
  comments: false,
  daily_time: null,
  daily_cap: 5,
  model_note: "Choose the model in the Anthropic integration.",
};

const reviews = [
  {
    id: "r2",
    time: "2026-11-26T08:02:00+00:00",
    triggers: ["test", "status"],
    level: "watch",
    result: "Watch: Ammonia 3 ppm is above the 2 ppm watch limit.",
    asked: true,
    comment: "The cycle has started.",
    note: null,
    proposal_ids: ["p1"],
  },
  {
    id: "r1",
    time: "2026-11-25T20:00:00+00:00",
    triggers: ["daily"],
    level: "on_course",
    result: "On course. Every rule is inside its limits.",
    asked: false,
    comment: null,
    note: "No comment: the daily cap of 5 is reached.",
    proposal_ids: ["p2", "p3"],
  },
];

function connection(listed: unknown[] = reviews): FakeConnection {
  return new FakeConnection()
    .on("get_claude", settings)
    .on("get_reviews", { reviews: listed })
    .on("get_history", { history: [] })
    .on("set_claude", { applied: true });
}

function save(element: Element, detail: Record<string, unknown>): void {
  find(element, "tk-form.claude").dispatchEvent(
    new CustomEvent("tk-save", { detail, bubbles: true, composed: true }),
  );
}

describe("tk-claude", () => {
  it("shows the settings, the model note and their history", async () => {
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(connection()) });
    await settle(element);

    expect(text(element)).toContain("Choose the model in the Anthropic integration.");
    const form = find(element, "tk-form.claude") as unknown as { values: Record<string, unknown> };
    expect(form.values.agent).toBe("conversation.claude_conversation");
    expect(findAll(element, "tk-history").length).toBe(1);
  });

  it("needs a daily cap", async () => {
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(connection()) });
    await settle(element);

    const form = find(element, "tk-form.claude") as TkForm;
    await settle(form);
    const cap = find(form, "input[name=daily_cap]") as HTMLInputElement;
    expect(cap.required).toBe(true);
  });

  it("saves what changed and loads the settings again", async () => {
    const conn = connection();
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(conn) });
    await settle(element);

    save(element, { comments: true, daily_time: "20:00" });
    await settle(element);
    expect(conn.last("set_claude").args).toEqual({ comments: true, daily_time: "20:00" });
    expect(conn.types().filter((type) => type === "tankkeeper/get_claude").length).toBe(2);

    save(element, {});
    await settle(element);
    expect(conn.types().filter((type) => type === "tankkeeper/set_claude").length).toBe(1);
  });

  it("shows why the settings could not be saved", async () => {
    const conn = connection().fail("set_claude", "invalid_input", "No AI task entity ai_task.gone");
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(conn) });
    await settle(element);

    save(element, { ai_task: "ai_task.gone" });
    await settle(element);

    expect(find(element, ".error").textContent).toBe("No AI task entity ai_task.gone");
  });

  it("lists the latest reviews with Claude's comments and notes", async () => {
    const conn = connection();
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(conn) });
    await settle(element);

    expect(conn.last("get_reviews").args).toEqual({ limit: 20 });
    const items = findAll(element, "li.review").map((item) =>
      item.textContent.replace(/\s+/g, " ").trim(),
    );
    expect(items[0]).toContain("Test, Status change");
    expect(items[0]).toContain("Watch: Ammonia 3 ppm is above the 2 ppm watch limit.");
    expect(items[0]).toContain("Claude: The cycle has started.");
    expect(items[0]).toContain("1 plan change proposed");
    expect(items[1]).toContain("Daily");
    expect(items[1]).toContain("No comment: the daily cap of 5 is reached.");
    expect(items[1]).toContain("2 plan changes proposed");
    expect(items[1]).not.toContain("Claude:");
  });

  it("says when there are no reviews yet", async () => {
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(connection([])) });
    await settle(element);

    expect(text(element)).toContain("No reviews yet.");
    expect(findAll(element, "li.review").length).toBe(0);
  });
});
