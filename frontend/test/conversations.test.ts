import { afterEach, describe, expect, it, vi } from "vitest";
import { TankkeeperApi } from "../src/api";
import { CHAT } from "../src/base";
import "../src/views/conversations";
import type { TkConversations } from "../src/views/conversations";
import type { TkEmbed } from "../src/tk-embed";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const summary = {
  id: "c1",
  source: "mcp",
  started: "2026-11-26T12:00:00+00:00",
  updated: "2026-11-26T12:30:00+00:00",
  title: "Algae",
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
    .on("undo_change", { applied: true })
    .on("delete_conversation", { deleted: true });
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

    find(element, "li[data-id=c1] button.open").click();
    await settle(element);
    expect(conn.last("get_conversation").args).toEqual({ id: "c1" });
    expect(findAll(element, "script")).toEqual([]);
    expect(text(element)).toContain("<script>alert(1)</script>");
    expect(text(element)).toContain("Shorten the light");
    expect(text(element)).toContain("Added to notes");

    find(element, "button.undo").click();
    await settle(element);
    expect(conn.last("undo_change").args).toEqual({ history_id: "h1" });

    find(element, "button.back").click();
    await settle(element);
    expect(findAll(element, "button.undo")).toEqual([]);
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

    find(element, "li[data-id=c1] button.open").click();
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

    find(element, "li[data-id=panel_1] button.open").click();
    await settle(element);
    find(element, "button.resume").click();
    expect(starts).toEqual([{ kind: "resume", id: "panel_1" }]);

    find(element, "button.back").click();
    await settle(element);
    conn.on("get_conversation", { ...summary, messages: [], changes: [] });
    find(element, "li[data-id=c1] button.open").click();
    await settle(element);
    expect(findAll(element, "button.resume")).toEqual([]);
  });

  it("shows a conversation without changes, and errors", async () => {
    const conn = connection().on("get_conversation", { ...summary, messages: [], changes: [] });
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);
    find(element, "li[data-id=c1] button.open").click();
    await settle(element);
    expect(text(element)).toContain("No changes");

    vi.stubGlobal("confirm", () => true);
    conn.fail("delete_conversation", "not_found", "No conversation c1");
    find(element, "button.delete").click();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("No conversation c1");
    expect(findAll(element, "button.delete").length).toBe(1);

    find(element, "button.back").click();
    conn.fail("list_conversations", "not_loaded", "TankKeeper is not loaded");
    await settle(element);
    expect(find(element, ".error").textContent).toBe("TankKeeper is not loaded");
  });

  it("deletes a conversation only after the Member confirms", async () => {
    const conn = connection();
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    vi.stubGlobal("confirm", confirm);
    const element = mount<TkConversations>("tk-conversations", { api: new TankkeeperApi(conn) });
    await settle(element);
    find(element, "li[data-id=c1] button.open").click();
    await settle(element);

    find(element, "button.delete").click();
    await settle(element);
    expect(conn.types()).not.toContain("tankkeeper/delete_conversation");

    find(element, "button.delete").click();
    await settle(element);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(conn.sent).toContainEqual({
      type: "tankkeeper/delete_conversation",
      conversation_id: "c1",
    });
    expect(findAll(element, "button.delete")).toEqual([]);
  });
});
