import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/claude";
import type { TkClaude } from "../src/views/claude";
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
    .on("get_history", { history: [] });
}

describe("tk-claude", () => {
  it("shows the settings read-only, the model note and their history", async () => {
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(connection()) });
    await settle(element);

    expect(text(element)).toContain("Choose the model in the Anthropic integration.");
    expect(text(element)).toContain(
      "Conversation agent TankKeeper chats through conversation.claude_conversation",
    );
    expect(text(element)).toContain("Claude comments on reviews No");
    expect(text(element)).toContain("Review after test, status");
    expect(findAll(element, "tk-form")).toEqual([]);
    const history = find(element, "tk-history") as unknown as {
      collection: string;
      recordId: string;
    };
    expect([history.collection, history.recordId]).toEqual(["settings", "claude"]);
    expect(find(element, "ha-icon-button.settings").getAttribute("label")).toBe(
      "Edit Claude settings",
    );
  });

  it("shows why the settings could not load", async () => {
    const conn = connection().fail("get_claude", "not_loaded", "TankKeeper is not loaded");
    const element = mount<TkClaude>("tk-claude", { api: new TankkeeperApi(conn) });
    await settle(element);

    expect(find(element, ".error").textContent).toBe("TankKeeper is not loaded");
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
