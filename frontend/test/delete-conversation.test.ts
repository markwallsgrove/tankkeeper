import { afterEach, describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import { DELETED } from "../src/tk-delete-conversation";
import type { TkDeleteConversation } from "../src/tk-delete-conversation";
import type { Message } from "../src/types";
import { CLOSE, DELETE } from "../src/buttons";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

function named(button: Element): (string | null)[] {
  return [button.getAttribute("label"), (button as unknown as { path: string }).path];
}

function iconOf(button: Element): string | null | undefined {
  return button.querySelector("svg.icon path")?.getAttribute("d");
}

const asked = {
  conversation_id: "c1",
  name: "Algae",
  messages: 4,
  changes: 2,
  code: "K7Q2ZP",
  code_expires: "2026-11-26T12:15:00+00:00",
  next_step: "Ask the owner",
};

function connection(): FakeConnection {
  return new FakeConnection().on("delete_conversation", (message: Message) => {
    const args = message.args as { code?: string };
    return args.code === undefined ? asked : { deleted: true, conversation_id: "c1" };
  });
}

async function mounted(conn: FakeConnection): Promise<TkDeleteConversation> {
  const element = mount<TkDeleteConversation>("tk-delete-conversation", {
    api: new TankkeeperApi(conn),
    conversationId: "c1",
  });
  await settle(element);
  return element;
}

describe("tk-delete-conversation", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("asks in the panel before it deletes, saying the changes stay", async () => {
    const conn = connection();
    const element = await mounted(conn);
    const deleted: string[] = [];
    document.body.addEventListener(DELETED, (event) => {
      deleted.push((event as CustomEvent<string>).detail);
    });

    expect(named(find(element, "ha-icon-button.delete"))).toEqual(["Delete", DELETE]);
    find(element, "ha-icon-button.delete").click();
    await settle(element);
    expect(conn.last("delete_conversation").args).toEqual({ id: "c1" });
    const cancel = find(element, "button.cancel");
    expect([text(cancel), iconOf(cancel)]).toEqual(["Cancel", CLOSE]);
    const confirm = find(element, "button.confirm");
    expect([text(confirm), iconOf(confirm)]).toEqual(["Delete conversation", DELETE]);
    expect(find(element, ".confirm").getAttribute("role")).toBe("alertdialog");
    expect(text(element)).toContain('Delete "Algae"?');
    expect(text(element)).toContain("Its 4 messages go.");
    expect(text(element)).toContain("The 2 changes made in it stay in the history");
    expect(element.shadowRoot?.activeElement).toBe(find(element, "button.cancel"));
    expect(deleted).toEqual([]);

    find(element, "button.confirm").click();
    await settle(element);
    expect(conn.last("delete_conversation").args).toEqual({ id: "c1", code: "K7Q2ZP" });
    expect(deleted).toEqual(["c1"]);
    expect(findAll(element, ".confirm")).toEqual([]);
  });

  it("deletes nothing when the owner cancels", async () => {
    const conn = connection();
    const element = await mounted(conn);

    find(element, "ha-icon-button.delete").click();
    await settle(element);
    find(element, "button.cancel").click();
    await settle(element);

    expect(findAll(element, ".confirm")).toEqual([]);
    expect(conn.sent.length).toBe(1);
    expect(element.shadowRoot?.activeElement).toBe(find(element, "ha-icon-button.delete"));
  });

  it("names one message and one change in the singular", async () => {
    const conn = connection().on("delete_conversation", { ...asked, messages: 1, changes: 1 });
    const element = await mounted(conn);

    find(element, "ha-icon-button.delete").click();
    await settle(element);

    expect(text(element)).toContain("Its 1 message goes.");
    expect(text(element)).toContain("The 1 change made in it stays in the history");
  });

  it("shows why asking or deleting failed", async () => {
    const conn = connection().fail("delete_conversation", "not_found", "No conversation c1");
    const element = await mounted(conn);

    find(element, "ha-icon-button.delete").click();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("No conversation c1");
    expect(findAll(element, ".confirm")).toEqual([]);

    conn.on("delete_conversation", (message: Message) => {
      const args = message.args as { code?: string };
      if (args.code === undefined) return asked;
      throw Object.assign(new Error("The code has expired"), { code: "code_expired" });
    });
    find(element, "ha-icon-button.delete").click();
    await settle(element);
    expect(findAll(element, ".error")).toEqual([]);
    find(element, "button.confirm").click();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("The code has expired");
    expect(findAll(element, ".confirm")).toEqual([]);
  });

  it("does nothing without the API", async () => {
    const element = mount<TkDeleteConversation>("tk-delete-conversation", {
      conversationId: "c1",
    });
    await settle(element);

    find(element, "ha-icon-button.delete").click();
    await settle(element);

    expect(findAll(element, ".confirm")).toEqual([]);
  });
});
