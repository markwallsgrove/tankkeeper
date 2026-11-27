import { afterEach, describe, expect, it, vi } from "vitest";
import { TankkeeperApi } from "../src/api";
import { CHAT } from "../src/base";
import "../src/views/conversations";
import type { TkConversations } from "../src/views/conversations";
import type { TkEmbed } from "../src/tk-embed";
import type { TkDeleteConversation } from "../src/tk-delete-conversation";
import type { Message } from "../src/types";
import { BACK, CHAT as CHAT_ICON, OPEN, SEARCH, UNDO } from "../src/buttons";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

function named(button: Element): (string | null)[] {
  return [button.getAttribute("label"), (button as unknown as { path: string }).path];
}

function iconOf(button: Element): string | null | undefined {
  return button.querySelector("svg.icon path")?.getAttribute("d");
}

const summary = {
  id: "c1",
  source: "mcp",
  started: "2026-11-26T12:00:00+00:00",
  updated: "2026-11-26T12:30:00+00:00",
  title: "Algae",
  name: "Algae",
  summary: "Green spots",
};
const change = {
  id: "h1",
  time: "2026-11-26T12:10:00+00:00",
  source: "mcp",
  conversation_id: "c1",
  summary: "Add the note Light",
  proposal_id: null,
  user_id: "u1",
  changes: [{ collection: "notes", record_id: "n1", before: null, after: { topic: "Light" } }],
};

function connection(): FakeConnection {
  return new FakeConnection()
    .on("list_conversations", { conversations: [summary] })
    .on("search_conversations", { conversations: [] })
    .on("get_conversation", {
      ...summary,
      messages: [
        { role: "user", text: "<script>alert(1)</script>" },
        { role: "assistant", text: "Shorten the light" },
      ],
      changes: [change],
    })
    .on("undo_change", { applied: true });
}

describe("tk-conversations", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists and searches conversations", async () => {
    const conn = connection();
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(conn.last("list_conversations").args).toEqual({ limit: 50 });
    expect(text(element)).toContain("Algae");
    expect(text(element)).toContain("Green spots");

    const search = find(element, "input.search") as HTMLInputElement;
    search.value = "shrimp";
    find(element, "form.search").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);
    expect(conn.last("search_conversations").args).toEqual({ query: "shrimp", limit: 50 });
    expect(text(element)).toContain("No conversations");

    search.value = " ";
    find(element, "form.search").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);
    expect(conn.types().at(-1)).toBe("tankkeeper/list_conversations");
  });

  it("reads a conversation with its changes as text, and undoes one", async () => {
    const conn = connection();
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);

    expect(named(find(element, "li[data-id=c1] ha-icon-button.open"))).toEqual(["Open", OPEN]);
    const search = find(element, "form.search button[type=submit]");
    expect([text(search), iconOf(search)]).toEqual(["Search", SEARCH]);
    find(element, "li[data-id=c1] ha-icon-button.open").click();
    await settle(element);
    expect(conn.last("get_conversation").args).toEqual({ id: "c1" });
    const back = find(element, "button.back");
    expect([text(back), iconOf(back)]).toEqual(["Back", BACK]);
    expect(named(find(element, "ha-icon-button.undo"))).toEqual(["Undo", UNDO]);
    expect(findAll(element, "script")).toEqual([]);
    expect(text(element)).toContain("<script>alert(1)</script>");
    expect(text(element)).toContain("Shorten the light");
    expect(text(element)).toContain("Added to notes");

    find(element, "ha-icon-button.undo").click();
    await settle(element);
    expect(conn.last("undo_change").args).toEqual({ history_id: "h1" });

    find(element, "button.back").click();
    await settle(element);
    expect(findAll(element, "ha-icon-button.undo")).toEqual([]);
  });

  it("shows photos and charts in the agent's messages only, and markdown in them", async () => {
    const chart = "![Nitrate](tankkeeper:chart/nitrate?days=7)";
    const conn = connection().on("get_conversation", {
      ...summary,
      messages: [
        { role: "user", text: chart },
        { role: "tool", text: `get_photo {} → {"embed": "${chart}"}` },
        { role: "assistant", text: `**Nitrate** is steady:\n${chart}` },
      ],
      changes: [],
    });
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);

    find(element, "li[data-id=c1] ha-icon-button.open").click();
    await settle(element);

    const embeds = findAll(element, "tk-embed") as TkEmbed[];
    expect(embeds.map((embed) => embed.address)).toEqual(["tankkeeper:chart/nitrate?days=7"]);
    expect(find(element, "li.assistant strong").textContent).toBe("Nitrate");
    expect(text(find(element, "li.user"))).toContain(chart);
    expect(text(find(element, "li.tool"))).toContain(chart);
  });

  it("goes on with a chat from the panel in the chat, and only those", async () => {
    const conn = connection()
      .on("list_conversations", {
        conversations: [{ ...summary, id: "panel_1" }, summary],
      })
      .on("get_conversation", { ...summary, id: "panel_1", messages: [], changes: [] });
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    const starts: unknown[] = [];
    element.addEventListener(CHAT, (event) => starts.push((event as CustomEvent).detail));
    await settle(element);

    find(element, "li[data-id=panel_1] ha-icon-button.open").click();
    await settle(element);
    const resume = find(element, "button.resume");
    expect([text(resume), iconOf(resume)]).toEqual(["Continue in Chat", CHAT_ICON]);
    resume.click();
    expect(starts).toEqual([{ kind: "resume", id: "panel_1" }]);

    find(element, "button.back").click();
    await settle(element);
    conn.on("get_conversation", { ...summary, messages: [], changes: [] });
    find(element, "li[data-id=c1] ha-icon-button.open").click();
    await settle(element);
    expect(findAll(element, "button.resume")).toEqual([]);
  });

  it("shows a conversation without changes, and errors", async () => {
    const conn = connection().on("get_conversation", { ...summary, messages: [], changes: [] });
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);
    find(element, "li[data-id=c1] ha-icon-button.open").click();
    await settle(element);
    expect(text(element)).toContain("No changes");

    find(element, "button.back").click();
    conn.fail("list_conversations", "not_loaded", "TankKeeper is not loaded");
    await settle(element);
    expect(find(element, ".error").textContent).toBe("TankKeeper is not loaded");
  });

  it("deletes a conversation after the owner confirms in the panel, then lists again", async () => {
    const conn = connection().on("delete_conversation", (message: Message) => {
      const args = message.args as { code?: string };
      return args.code === undefined
        ? { conversation_id: "c1", name: "Algae", messages: 2, changes: 1, code: "K7Q2ZP" }
        : { deleted: true, conversation_id: "c1" };
    });
    const confirm = vi.fn(() => true);
    vi.stubGlobal("confirm", confirm);
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);
    find(element, "li[data-id=c1] ha-icon-button.open").click();
    await settle(element);

    const remove = find(element, "tk-delete-conversation") as TkDeleteConversation;
    expect(remove.conversationId).toBe("c1");
    find(remove, "ha-icon-button.delete").click();
    await settle(remove);
    find(remove, "button.confirm").click();
    await settle(element);

    expect(confirm).not.toHaveBeenCalled();
    expect(conn.last("delete_conversation").args).toEqual({ id: "c1", code: "K7Q2ZP" });
    expect(findAll(element, "tk-delete-conversation")).toEqual([]);
    expect(conn.types().at(-1)).toBe("tankkeeper/list_conversations");
  });

  it("shows where a search matched, marked, as text", async () => {
    const conn = connection().on("search_conversations", {
      conversations: [
        {
          ...summary,
          name: "Algae",
          match: {
            field: "message",
            index: 0,
            role: "user",
            snippet: "<i>shrimp</i> moult",
            start: 3,
            end: 9,
          },
        },
      ],
    });
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);

    (find(element, "input.search") as HTMLInputElement).value = "shrimp";
    find(element, "form.search").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);

    expect(findAll(element, "i")).toEqual([]);
    expect(find(element, ".snippet").textContent).toBe("<i>shrimp</i> moult");
    expect(find(element, ".snippet mark").textContent).toBe("shrimp");
  });

  it("names an untitled conversation by what was first said", async () => {
    const conn = connection().on("list_conversations", {
      conversations: [{ ...summary, title: "", name: "How warm…" }],
    });
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);

    expect(find(element, "li[data-id=c1] strong").textContent).toBe("How warm…");
  });
});
