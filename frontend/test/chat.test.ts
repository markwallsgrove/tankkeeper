import { afterEach, describe, expect, it, vi } from "vitest";
import { TankkeeperApi } from "../src/api";
import { NO_AGENT, NO_TANK_AGENT } from "../src/views/chat";
import type { TkChat } from "../src/views/chat";
import type { ChatStart } from "../src/base";
import type { Message, Proposal } from "../src/types";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const AGENT = "conversation.nano_agent";

const change = {
  id: "h1",
  time: "2026-11-26T12:10:00+00:00",
  source: "assist",
  conversation_id: "panel_x",
  summary: "Add the note Snails",
  proposal_id: null,
  user_id: "u1",
  changes: [{ collection: "notes", record_id: "n1", before: null, after: { topic: "Snails" } }],
};

const proposal: Proposal = {
  proposal_id: "p1",
  state: "pending",
  created: "2026-11-26T12:00:00+00:00",
  source: "assist",
  summary: "Add the product Excel",
  reason: "Carbon",
  conversation_id: "panel_x",
  changes: [{ collection: "products", record_id: "pr1", before: null, after: { name: "Excel" } }],
  batch: false,
};

function reply(speech: string, type = "action_done", conversationId: string | null = null) {
  return (message: Message) => ({
    conversation_id: conversationId ?? message.conversation_id,
    response: { response_type: type, speech: { plain: { speech } } },
  });
}

function connection(ready = true): FakeConnection {
  return new FakeConnection()
    .on("chat_agent", { agent_id: AGENT, ready })
    .on("list_proposals", { proposals: [] })
    .on("get_conversation", { id: "panel_x", messages: [], changes: [] })
    .on("conversation/process", reply("Hello **owner**"));
}

function processed(conn: FakeConnection): Message[] {
  return conn.sent.filter((message) => message.type === "conversation/process");
}

async function chat(conn: FakeConnection, start?: ChatStart): Promise<TkChat> {
  const element = mount<TkChat>("tk-chat", { api: new TankkeeperApi(conn), start });
  await settle(element);
  return element;
}

async function say(element: TkChat, words: string): Promise<void> {
  const box = find(element, "textarea") as HTMLTextAreaElement;
  box.value = words;
  box.dispatchEvent(new Event("input"));
  find(element, "form.send").dispatchEvent(new Event("submit", { cancelable: true }));
  await settle(element);
}

function draft(element: TkChat): string {
  return (find(element, "textarea") as HTMLTextAreaElement).value;
}

describe("tk-chat", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("says where to choose an agent when none is chosen", async () => {
    const element = await chat(connection(false));

    expect(text(element)).toContain(NO_AGENT);
    expect(findAll(element, "textarea")).toEqual([]);
  });

  it("says the tank's own agent is missing when Home Assistant has none", async () => {
    const element = await chat(connection().on("chat_agent", { agent_id: null, ready: true }));

    expect(text(element)).toContain(NO_TANK_AGENT);
    expect(text(element)).not.toContain(NO_AGENT);
    expect(findAll(element, "textarea")).toEqual([]);
  });

  it("keeps a late reply out of a chat started while it waited", async () => {
    let answer: (value: unknown) => void = () => undefined;
    const conn = connection().on(
      "conversation/process",
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const element = await chat(conn);
    await say(element, "Hello");
    const first = processed(conn)[0]?.conversation_id;

    element.start = { kind: "status", id: "now" };
    await settle(element);
    answer({
      conversation_id: first,
      response: { response_type: "action_done", speech: { plain: { speech: "Old reply" } } },
    });
    await settle(element);
    await say(element, "About the status");

    expect(findAll(element, ".message").map((item) => item.textContent.trim())).toEqual([
      "About the status",
    ]);
    expect(processed(conn)[1]?.conversation_id).not.toBe(first);
  });

  it("keeps a late failure out of a chat started while it waited", async () => {
    let fail: (reason: Error) => void = () => undefined;
    const conn = connection().on(
      "conversation/process",
      () =>
        new Promise((_resolve, reject) => {
          fail = reject;
        }),
    );
    const element = await chat(conn);
    await say(element, "Hello");

    element.start = { kind: "status", id: "now" };
    await settle(element);
    fail(new Error("Lost connection"));
    await settle(element);

    expect(findAll(element, ".message")).toEqual([]);
    expect(draft(element)).toBe("Let's discuss the tank's status now.");
  });

  it("sends chat to the tank's agent and keeps the conversation for follow-ups", async () => {
    const conn = connection();
    const element = await chat(conn);

    await say(element, "Hello");
    await say(element, "And now?");

    const [first, second] = processed(conn);
    expect(first).toMatchObject({ text: "Hello", agent_id: AGENT });
    expect(String(first?.conversation_id)).toMatch(/^panel_[0-9a-f]{32}$/);
    expect(second).toMatchObject({ text: "And now?", conversation_id: first?.conversation_id });
    expect(findAll(element, ".message.user").map((item) => item.textContent.trim())).toEqual([
      "Hello",
      "And now?",
    ]);
    expect(findAll(element, ".message.assistant strong").map((item) => item.textContent)).toEqual([
      "owner",
      "owner",
    ]);
    expect(draft(element)).toBe("");
    expect(conn.last("get_conversation").args).toEqual({ id: first?.conversation_id });
  });

  it("follows the conversation id Home Assistant answers with", async () => {
    const conn = connection().on("conversation/process", reply("Hi", "action_done", "panel_new"));
    const element = await chat(conn);

    await say(element, "Hello");
    await say(element, "Again");

    expect(processed(conn)[1]?.conversation_id).toBe("panel_new");
  });

  it("keeps its conversation id when Home Assistant answers without one", async () => {
    const conn = connection().on("conversation/process", () => ({
      conversation_id: null,
      response: { response_type: "action_done", speech: { plain: { speech: "Hi" } } },
    }));
    const element = await chat(conn);

    await say(element, "Hello");
    await say(element, "Again");

    const [first, second] = processed(conn);
    expect(second?.conversation_id).toBe(first?.conversation_id);
  });

  it("sends with Enter and adds a line with Shift+Enter", async () => {
    const conn = connection();
    const element = await chat(conn);
    const box = find(element, "textarea") as HTMLTextAreaElement;
    box.value = "Hello";
    box.dispatchEvent(new Event("input"));

    const shifted = new KeyboardEvent("keydown", {
      key: "Enter",
      shiftKey: true,
      cancelable: true,
    });
    box.dispatchEvent(shifted);
    expect(shifted.defaultPrevented).toBe(false);
    expect(processed(conn)).toEqual([]);

    box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
    await settle(element);
    expect(processed(conn).map((message) => message.text)).toEqual(["Hello"]);
  });

  it("sends nothing when the message is empty", async () => {
    const conn = connection();
    const element = await chat(conn);

    await say(element, "   ");

    expect(processed(conn)).toEqual([]);
  });

  it("shows HTML in replies and saved messages as text", async () => {
    const conn = connection()
      .on("conversation/process", reply('<img src=x onerror="alert(1)"> [x](javascript:alert(1))'))
      .on("get_conversation", {
        id: "panel_old",
        messages: [{ role: "assistant", text: "<script>alert(1)</script>" }],
        changes: [],
      });
    const element = await chat(conn, { kind: "resume", id: "panel_old" });

    await say(element, "<b>bold</b>");

    expect(findAll(element, "script, img, b, a")).toEqual([]);
    expect(text(element)).toContain("<script>alert(1)</script>");
    expect(text(element)).toContain('<img src=x onerror="alert(1)">');
    expect(text(element)).toContain("<b>bold</b>");
  });

  it("shows an error answer and a failed request as errors", async () => {
    const conn = connection().on("conversation/process", reply("Choose an agent", "error"));
    const element = await chat(conn);

    await say(element, "Hello");
    expect(findAll(element, ".message.error").map((item) => item.textContent.trim())).toEqual([
      "Choose an agent",
    ]);

    conn.fail("conversation/process", "timeout", "Lost connection");
    await say(element, "Again");
    expect(findAll(element, ".message.error").map((item) => item.textContent.trim())).toEqual([
      "Choose an agent",
      "Lost connection",
    ]);
  });

  it("shows an answer without speech as an empty reply", async () => {
    const conn = connection().on("conversation/process", (message: Message) => ({
      conversation_id: message.conversation_id,
      response: { response_type: "action_done" },
    }));
    const element = await chat(conn);

    await say(element, "Hello");

    expect(findAll(element, ".message.assistant").length).toBe(1);
  });

  it("shows the changes made in the chat with Undo, and its waiting changes with Accept and Reject", async () => {
    const other = { ...proposal, proposal_id: "p2", conversation_id: "panel_other" };
    const conn = connection()
      .on("get_conversation", { id: "panel_x", messages: [], changes: [change] })
      .on("list_proposals", { proposals: [proposal, other] })
      .on("conversation/process", reply("Done", "action_done", "panel_x"))
      .on("undo_change", { applied: true })
      .on("accept_proposal", { state: "applied" })
      .on("reject_proposal", { state: "rejected" });
    const element = await chat(conn);
    const changed = vi.fn();
    document.body.addEventListener("tk-changed", changed);
    expect(findAll(element, ".changes li")).toEqual([]);

    await say(element, "Note snails");

    expect(conn.last("list_proposals").args).toEqual({ state: "pending", limit: 200 });
    expect(text(find(element, ".changes"))).toContain("Add the note Snails");
    expect(text(find(element, ".changes"))).toContain("Added to notes");
    expect(text(find(element, ".waiting"))).toContain("Added to products");
    expect(findAll(element, ".waiting li").map((item) => item.getAttribute("data-id"))).toEqual([
      "p1",
    ]);

    find(element, ".changes button.undo").click();
    await settle(element);
    expect(conn.last("undo_change").args).toEqual({ history_id: "h1" });

    find(element, ".waiting button.accept").click();
    await settle(element);
    expect(conn.sent).toContainEqual({ type: "tankkeeper/accept_proposal", proposal_id: "p1" });

    find(element, ".waiting button.reject").click();
    await settle(element);
    expect(conn.sent).toContainEqual({ type: "tankkeeper/reject_proposal", proposal_id: "p1" });
    expect(changed).toHaveBeenCalledTimes(3);
    document.body.removeEventListener("tk-changed", changed);
  });

  it("shows why an action failed", async () => {
    const conn = connection()
      .on("get_conversation", { id: "panel_x", messages: [], changes: [change] })
      .on("conversation/process", reply("Done", "action_done", "panel_x"))
      .fail("undo_change", "not_found", "Already undone");
    const element = await chat(conn);
    await say(element, "Note snails");

    find(element, ".changes button.undo").click();
    await settle(element);

    expect(text(find(element, "p.error"))).toBe("Already undone");
  });

  it("starts a new chat with a new conversation", async () => {
    const conn = connection();
    const element = await chat(conn);
    await say(element, "Hello");

    find(element, "button.new").click();
    await settle(element);
    expect(findAll(element, ".message")).toEqual([]);
    await say(element, "Fresh");

    const [first, second] = processed(conn);
    expect(second?.conversation_id).not.toBe(first?.conversation_id);
    expect(String(second?.conversation_id)).toMatch(/^panel_/);
  });

  it("goes on with a saved conversation, showing what was said", async () => {
    const conn = connection().on("get_conversation", {
      id: "panel_old",
      messages: [
        { role: "user", text: "Hello" },
        { role: "tool", text: "list_products {}" },
        { role: "assistant", text: "Hi" },
        { role: "error", text: "Failed" },
      ],
      changes: [],
    });
    const element = await chat(conn, { kind: "resume", id: "panel_old" });

    expect(findAll(element, ".message").map((item) => item.className)).toEqual([
      "message user",
      "message assistant",
      "message error",
    ]);
    await say(element, "More");

    expect(processed(conn)[0]?.conversation_id).toBe("panel_old");
  });

  it("shows why a saved conversation could not be read", async () => {
    const conn = connection().fail("get_conversation", "not_found", "No such conversation");
    const element = await chat(conn, { kind: "resume", id: "panel_gone" });

    expect(text(find(element, "p.error"))).toBe("No such conversation");
  });

  it.each<[ChatStart, string, string]>([
    [
      { kind: "proposal", id: "p1" },
      "list_proposals",
      'Let\'s discuss the waiting change "Add the product Excel" (proposal p1).',
    ],
    [
      { kind: "photo", id: "c1" },
      "list_photos",
      'Let\'s discuss what the camera saw: "Algae on the glass" (photo check c1).',
    ],
    [
      { kind: "review", id: "r1" },
      "get_reviews",
      'Let\'s discuss the review "Ammonia is up" (review r1).',
    ],
    [{ kind: "status", id: "now" }, "chat_agent", "Let's discuss the tank's status now."],
  ])("fills in the first message to discuss %o", async (start, command, words) => {
    const conn = connection()
      .on("list_proposals", { proposals: [proposal] })
      .on("list_photos", { photos: [{ id: "c1", summary: "Algae on the glass" }] })
      .on("get_reviews", { reviews: [{ id: "r1", result: "Ammonia is up" }] });
    const element = await chat(conn, start);

    expect(conn.types()).toContain(`tankkeeper/${command}`);
    expect(draft(element)).toBe(words);
    expect(processed(conn)).toEqual([]);
  });

  it.each<[ChatStart, string]>([
    [{ kind: "proposal", id: "p9" }, "Let's discuss the waiting change p9."],
    [{ kind: "photo", id: "c9" }, "Let's discuss photo check c9."],
    [{ kind: "review", id: "r9" }, "Let's discuss review r9."],
  ])("names only the id when %o is not found", async (start, words) => {
    const conn = connection()
      .on("list_photos", { photos: [{ id: "c1", summary: null }] })
      .on("get_reviews", { reviews: [] });
    const element = await chat(conn, start);

    expect(draft(element)).toBe(words);
  });

  it("names only the id when the waiting changes cannot be looked up", async () => {
    const conn = connection().on("list_proposals", (message: Message) => {
      if ((message.args as { state: string }).state === "all") throw new Error("Lost connection");
      return { proposals: [] };
    });
    const element = await chat(conn, { kind: "proposal", id: "p1" });

    expect(draft(element)).toBe("Let's discuss the waiting change p1.");
  });

  it("clips a long item text in the first message", async () => {
    const conn = connection().on("get_reviews", {
      reviews: [{ id: "r1", result: "x".repeat(400) }],
    });
    const element = await chat(conn, { kind: "review", id: "r1" });

    expect(draft(element)).toBe(`Let's discuss the review "${"x".repeat(199)}…" (review r1).`);
  });

  it("names only the id when the item cannot be looked up", async () => {
    const conn = connection().fail("get_reviews", "failed", "Lost connection");
    const element = await chat(conn, { kind: "review", id: "r1" });

    expect(draft(element)).toBe("Let's discuss review r1.");
  });

  it("starts again when a new item is chosen", async () => {
    const conn = connection().on("list_proposals", { proposals: [proposal] });
    const element = await chat(conn);
    await say(element, "Hello");

    element.start = { kind: "status", id: "now" };
    await settle(element);

    expect(findAll(element, ".message")).toEqual([]);
    expect(draft(element)).toBe("Let's discuss the tank's status now.");
  });

  it("keeps a typed message when a slow look-up answers late", async () => {
    let answer: (value: unknown) => void = () => undefined;
    const conn = connection().on(
      "get_reviews",
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const element = await chat(conn, { kind: "review", id: "r1" });
    const box = find(element, "textarea") as HTMLTextAreaElement;
    box.value = "My own words";
    box.dispatchEvent(new Event("input"));

    answer({ reviews: [{ id: "r1", result: "Ammonia is up" }] });
    await settle(element);

    expect(draft(element)).toBe("My own words");
  });

  it("waits for the API before it loads", async () => {
    const element = mount<TkChat>("tk-chat", {});
    await settle(element);

    expect(text(element)).toContain("Chat");
  });
});
