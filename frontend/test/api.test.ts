import { describe, expect, it } from "vitest";
import { TankkeeperApi, errorMessage } from "../src/api";
import { FakeConnection } from "./fake";

describe("TankkeeperApi", () => {
  it("calls a tool with its args nested", async () => {
    const connection = new FakeConnection().on("list_products", { products: [] });
    const api = new TankkeeperApi(connection);

    expect(await api.call("list_products")).toEqual({ products: [] });
    await api.call("list_products", { include_removed: true });

    expect(connection.sent).toEqual([
      { type: "tankkeeper/list_products", args: {} },
      { type: "tankkeeper/list_products", args: { include_removed: true } },
    ]);
  });

  it("is refused by the fake when an argument name is wrong, as the backend refuses it", async () => {
    const api = new TankkeeperApi(new FakeConnection().on("get_tank", {}));

    await expect(api.call("get_tank", { x: 1 })).rejects.toThrow("get_tank: unknown x, missing -");
    await expect(api.call("add_task", {})).rejects.toThrow("add_task: unknown -, missing text");
  });

  it("deletes a conversation through its tool, with the code the first call gives", async () => {
    const api = new TankkeeperApi(new FakeConnection().on("delete_conversation", {}));

    await expect(api.call("delete_conversation", { conversation_id: "c1" })).rejects.toThrow(
      "delete_conversation: unknown conversation_id, missing id",
    );
    await expect(api.call("delete_conversation", { id: "c1", code: "ABC123" })).resolves.toEqual(
      {},
    );
    expect("deleteConversation" in api).toBe(false);
  });

  it("sends the panel-only commands with their ids", async () => {
    const connection = new FakeConnection()
      .on("accept_proposal", { state: "applied" })
      .on("reject_proposal", { state: "rejected" });
    const api = new TankkeeperApi(connection);

    await api.accept("p1");
    await api.reject("p2");

    expect(connection.sent).toEqual([
      { type: "tankkeeper/accept_proposal", proposal_id: "p1" },
      { type: "tankkeeper/reject_proposal", proposal_id: "p2" },
    ]);
  });
});

describe("TankkeeperApi chat", () => {
  it("asks for the tank's agent and sends chat to it through Home Assistant's conversation API", async () => {
    const reply = { conversation_id: "panel_1", response: { response_type: "action_done" } };
    const connection = new FakeConnection()
      .on("chat_agent", { agent_id: "conversation.nano", ready: true })
      .on("conversation/process", reply);
    const api = new TankkeeperApi(connection);

    expect(await api.chatAgent()).toEqual({ agent_id: "conversation.nano", ready: true });
    expect(await api.converse("Hello", "panel_1", "conversation.nano")).toEqual(reply);

    expect(connection.sent).toEqual([
      { type: "tankkeeper/chat_agent" },
      {
        type: "conversation/process",
        text: "Hello",
        conversation_id: "panel_1",
        agent_id: "conversation.nano",
      },
    ]);
  });
});

describe("errorMessage", () => {
  it("reads Home Assistant errors, errors and anything else", () => {
    expect(errorMessage({ code: "not_found", message: "No such note" })).toBe("No such note");
    expect(errorMessage(new Error("Lost connection"))).toBe("Lost connection");
    expect(errorMessage(3)).toBe("3");
  });
});
