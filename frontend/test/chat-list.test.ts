import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TankkeeperApi } from "../src/api";
import { OPEN_CHAT, type OpenChat } from "../src/views/chat-list";
import type { TkChatList } from "../src/views/chat-list";
import { DELETED } from "../src/tk-delete-conversation";
import type { TkDeleteConversation } from "../src/tk-delete-conversation";
import type { Conversation, Message } from "../src/types";
import { RENAME } from "../src/buttons";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const panelChat: Conversation = {
  id: "panel_a",
  source: "assist",
  started: "2026-11-26T11:00:00+00:00",
  updated: "2026-11-26T11:55:00+00:00",
  title: "Algae",
  name: "Algae",
  summary: "",
};
const assistChat: Conversation = {
  id: "01JABCDEF",
  source: "assist",
  started: "2026-11-25T08:00:00+00:00",
  updated: "2026-11-25T09:00:00+00:00",
  title: "",
  name: "How warm is the tank…",
  summary: "",
};
const mcpChat: Conversation = {
  id: "c9",
  source: "mcp",
  started: "2026-11-20T08:00:00+00:00",
  updated: "2026-11-20T08:00:00+00:00",
  title: "Plan",
  name: "Plan",
  summary: "",
};

function connection(): FakeConnection {
  return new FakeConnection()
    .on("list_conversations", { conversations: [panelChat, assistChat, mcpChat] })
    .on("search_conversations", { conversations: [] })
    .on("rename_conversation", (message: Message) => {
      const args = message.args as { title: string };
      return { ...panelChat, title: args.title, name: args.title };
    });
}

async function list(conn: FakeConnection, active = "panel_a"): Promise<TkChatList> {
  const element = mount<TkChatList>("tk-chat-list", { api: new TankkeeperApi(conn), active });
  await settle(element);
  return element;
}

function opened(element: TkChatList): OpenChat[] {
  const found: OpenChat[] = [];
  element.addEventListener(OPEN_CHAT, (event) => {
    found.push((event as CustomEvent<OpenChat>).detail);
  });
  return found;
}

async function search(element: TkChatList, words: string): Promise<void> {
  const input = find(element, "input.search") as HTMLInputElement;
  input.value = words;
  find(element, "form.search").dispatchEvent(new Event("submit", { cancelable: true }));
  await settle(element);
}

describe("tk-chat-list", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-26T12:00:00+00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it("lists the chats newest first with their names, how long ago and where other chats came from", async () => {
    const conn = connection();
    const element = await list(conn);

    expect(conn.last("list_conversations").args).toEqual({ limit: 50 });
    const items = findAll(element, "li");
    expect(items.map((item) => item.getAttribute("data-id"))).toEqual([
      "panel_a",
      "01JABCDEF",
      "c9",
    ]);
    const panel = find(element, "li[data-id=panel_a]");
    const assist = find(element, 'li[data-id="01JABCDEF"]');
    expect(text(panel)).toContain("Algae");
    expect(text(panel)).toContain("5 min ago");
    expect(text(panel)).not.toContain("read only");
    expect(text(assist)).toContain("How warm is the tank…");
    expect(text(assist)).toContain("yesterday · Assist, read only");
    expect(text(find(element, "li[data-id=c9]"))).toContain("6 days ago · Claude (MCP), read only");
    expect(panel.classList.contains("active")).toBe(true);
    expect(find(panel, "button.open").getAttribute("aria-current")).toBe("true");
    expect(assist.classList.contains("active")).toBe(false);
  });

  it("opens a chat with one click", async () => {
    const element = await list(connection());
    const found = opened(element);

    find(element, "li[data-id=c9] button.open").click();

    expect(found).toEqual([{ id: "c9", index: null }]);
  });

  it("says when there are no chats, and why the list could not load", async () => {
    const conn = connection().on("list_conversations", { conversations: [] });
    const element = await list(conn);
    expect(text(element)).toContain("No chats yet");

    conn.fail("list_conversations", "not_loaded", "TankKeeper is not loaded");
    await element.reload();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("TankKeeper is not loaded");
  });

  it("searches what was said and the titles, showing the match marked", async () => {
    const conn = connection().on("search_conversations", {
      conversations: [
        {
          ...assistChat,
          match: {
            field: "message",
            index: 3,
            role: "assistant",
            snippet: "…the <b>nitrate</b> is high…",
            start: 8,
            end: 15,
          },
        },
      ],
    });
    const element = await list(conn);
    const found = opened(element);

    await search(element, "  nitrate ");

    expect(conn.last("search_conversations").args).toEqual({ query: "nitrate", limit: 50 });
    expect(findAll(element, "b")).toEqual([]);
    expect(find(element, "li .snippet").textContent).toBe("…the <b>nitrate</b> is high…");
    expect(find(element, "li .snippet mark").textContent).toBe("nitrate");
    find(element, "li button.open").click();
    expect(found).toEqual([{ id: "01JABCDEF", index: 3 }]);

    await search(element, "");
    expect(conn.types().at(-1)).toBe("tankkeeper/list_conversations");
    expect(findAll(element, ".snippet")).toEqual([]);
  });

  it("opens a title match without a message to go to, and says when nothing matches", async () => {
    const conn = connection().on("search_conversations", {
      conversations: [
        {
          ...panelChat,
          match: { field: "title", index: null, role: null, snippet: "Algae", start: 0, end: 5 },
        },
      ],
    });
    const element = await list(conn);
    const found = opened(element);

    await search(element, "alg");
    find(element, "li button.open").click();
    expect(found).toEqual([{ id: "panel_a", index: null }]);

    conn.on("search_conversations", { conversations: [] });
    await search(element, "shrimp");
    expect(text(element)).toContain("No chats match");
  });

  it("renames a chat in place: Enter saves, Escape leaves it", async () => {
    const conn = connection();
    const element = await list(conn);

    const rename = find(element, "li[data-id=panel_a] ha-icon-button.rename");
    expect([rename.getAttribute("label"), (rename as unknown as { path: string }).path]).toEqual([
      "Rename",
      RENAME,
    ]);
    rename.click();
    await settle(element);
    const input = find(element, "li[data-id=panel_a] input.title") as HTMLInputElement;
    expect(input.value).toBe("Algae");
    expect(input.placeholder).toBe("Algae");
    expect(element.shadowRoot?.activeElement).toBe(input);

    input.value = "Other";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settle(element);
    expect(findAll(element, "input.title")).toEqual([]);
    expect(conn.types()).not.toContain("tankkeeper/rename_conversation");

    find(element, "li[data-id=panel_a] ha-icon-button.rename").click();
    await settle(element);
    const again = find(element, "li[data-id=panel_a] input.title") as HTMLInputElement;
    again.value = "  Green algae  ";
    again.dispatchEvent(new Event("input"));
    again.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    find(element, "form.rename").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);
    expect(conn.last("rename_conversation").args).toEqual({ id: "panel_a", title: "Green algae" });
    expect(findAll(element, "input.title")).toEqual([]);
    expect(conn.types().at(-1)).toBe("tankkeeper/list_conversations");
  });

  it("starts the rename of an untitled chat empty, with its name as the hint", async () => {
    const element = await list(connection());

    find(element, 'li[data-id="01JABCDEF"] ha-icon-button.rename').click();
    await settle(element);

    const input = find(element, "input.title") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("How warm is the tank…");
  });

  it("keeps Delete off for the chat that is waiting for a reply", async () => {
    const element = await list(connection());
    element.locked = "panel_a";
    await settle(element);

    const deletes = findAll(element, "tk-delete-conversation") as TkDeleteConversation[];
    expect(deletes.map((item) => item.disabled)).toEqual([true, false, false]);
    const locked = find(element, "li[data-id=panel_a] tk-delete-conversation");
    expect(find(locked, "ha-icon-button.delete").hasAttribute("disabled")).toBe(true);
  });

  it("keeps the name when the new title is blank, and shows why a rename failed", async () => {
    const conn = connection();
    const element = await list(conn);

    const rename = find(element, "li[data-id=panel_a] ha-icon-button.rename");
    expect([rename.getAttribute("label"), (rename as unknown as { path: string }).path]).toEqual([
      "Rename",
      RENAME,
    ]);
    rename.click();
    await settle(element);
    const input = find(element, "input.title") as HTMLInputElement;
    input.value = "   ";
    input.dispatchEvent(new Event("input"));
    find(element, "form.rename").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);
    expect(conn.types()).not.toContain("tankkeeper/rename_conversation");
    expect(findAll(element, "input.title")).toEqual([]);

    conn.fail("rename_conversation", "not_found", "No conversation panel_a");
    find(element, "li[data-id=panel_a] ha-icon-button.rename").click();
    await settle(element);
    const retry = find(element, "input.title") as HTMLInputElement;
    retry.value = "New";
    retry.dispatchEvent(new Event("input"));
    find(element, "form.rename").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);
    expect(find(element, ".error").textContent).toBe("No conversation panel_a");
    expect(findAll(element, "input.title").length).toBe(1);
  });

  it("offers Delete on each chat and loads again once one is deleted", async () => {
    const conn = connection();
    const element = await list(conn);
    const deletes = findAll(element, "tk-delete-conversation") as TkDeleteConversation[];
    expect(deletes.map((item) => item.conversationId)).toEqual(["panel_a", "01JABCDEF", "c9"]);
    const loads = conn.types().filter((type) => type === "tankkeeper/list_conversations").length;

    deletes[1]?.dispatchEvent(
      new CustomEvent(DELETED, { detail: "01JABCDEF", bubbles: true, composed: true }),
    );
    await settle(element);

    const after = conn.types().filter((type) => type === "tankkeeper/list_conversations").length;
    expect(after).toBe(loads + 1);
  });

  it("loads again when the chat it sits beside says so", async () => {
    const conn = connection();
    const element = await list(conn);
    const loads = conn.sent.length;

    element.stamp = 1;
    await settle(element);

    expect(conn.sent.length).toBe(loads + 1);
  });
});
