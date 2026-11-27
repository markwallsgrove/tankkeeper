import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/tk-history";
import type { TkHistory } from "../src/tk-history";
import { UNDO } from "../src/buttons";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const entry = {
  id: "h1",
  time: "2026-11-26T12:00:00+00:00",
  source: "panel",
  conversation_id: null,
  summary: "Change the tank details",
  proposal_id: null,
  user_id: "u1",
  changes: [
    { collection: "tank", record_id: "tank", before: { name: "Nano" }, after: { name: "Big" } },
  ],
};

describe("tk-history", () => {
  it("lists the record's changes and undoes one", async () => {
    const connection = new FakeConnection()
      .on("get_history", { history: [entry] })
      .on("undo_change", { applied: true, history: { ...entry, id: "h2" } });
    const element = mount<TkHistory>("tk-history", {
      api: new TankkeeperApi(connection),
      collection: "tank",
      recordId: "tank",
    });
    const changed: Event[] = [];
    element.addEventListener("tk-changed", (event) => changed.push(event));
    await settle(element);

    expect(connection.last("get_history").args).toEqual({
      collection: "tank",
      record_id: "tank",
      limit: 10,
    });
    expect(text(element)).toContain("Change the tank details");
    expect(text(element)).toContain("tank: name Nano → Big");
    expect(text(element)).toContain("Panel");
    const undo = find(element, "ha-icon-button.undo");
    expect([undo.getAttribute("label"), (undo as unknown as { path: string }).path]).toEqual([
      "Undo",
      UNDO,
    ]);

    find(element, "ha-icon-button.undo").click();
    await settle(element);

    expect(connection.last("undo_change").args).toEqual({ history_id: "h1" });
    expect(changed.length).toBe(1);
    expect(connection.types().filter((type) => type === "tankkeeper/get_history").length).toBe(2);
  });

  it("shows an undo that fails, and says when there is no history", async () => {
    const connection = new FakeConnection()
      .on("get_history", { history: [entry] })
      .fail("undo_change", "not_found", "That change is gone");
    const element = mount<TkHistory>("tk-history", {
      api: new TankkeeperApi(connection),
      collection: "notes",
    });
    await settle(element);
    expect(connection.last("get_history").args).toEqual({ collection: "notes", limit: 10 });

    find(element, "ha-icon-button.undo").click();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("That change is gone");

    connection.on("get_history", { history: [] });
    element.collection = "lights";
    await settle(element);
    expect(findAll(element, "ha-icon-button.undo")).toEqual([]);
    expect(text(element)).toContain("No changes yet");
  });

  it("loads only while the details around it are open", async () => {
    const connection = new FakeConnection().on("get_history", { history: [entry] });
    const details = document.createElement("details");
    const element = document.createElement("tk-history") as TkHistory;
    Object.assign(element, { api: new TankkeeperApi(connection), collection: "tank" });
    details.append(element);
    document.body.append(details);
    await settle(element);
    expect(connection.types()).toEqual([]);

    element.stamp = 1;
    await settle(element);
    expect(connection.types()).toEqual([]);

    details.open = true;
    await settle(element);
    expect(connection.types()).toEqual(["tankkeeper/get_history"]);
    expect(text(element)).toContain("Change the tank details");

    details.open = false;
    element.stamp = 2;
    await settle(element);
    expect(connection.types()).toEqual(["tankkeeper/get_history"]);

    element.remove();
    details.open = true;
    await settle(element);
    expect(connection.types()).toEqual(["tankkeeper/get_history"]);
  });

  it("names the conversation a change was made in, even once it is deleted", async () => {
    const connection = new FakeConnection().on("get_history", {
      history: [
        { ...entry, id: "h1", conversation_id: "panel_a", conversation_name: "Algae" },
        {
          ...entry,
          id: "h2",
          conversation_id: "panel_b",
          conversation_name: "deleted conversation",
        },
        { ...entry, id: "h3", conversation_name: null },
      ],
    });
    const element = mount<TkHistory>("tk-history", {
      api: new TankkeeperApi(connection),
      collection: "tank",
    });
    await settle(element);

    const lines = findAll(element, "li .when").map((item) =>
      item.textContent.replace(/\s+/g, " ").trim(),
    );
    expect(lines[0]).toMatch(/ · Panel · in Algae$/);
    expect(lines[1]).toMatch(/ · Panel · in deleted conversation$/);
    expect(lines[2]).toMatch(/ · Panel$/);
  });

  it("waits for the API", async () => {
    const element = mount<TkHistory>("tk-history", { collection: "tank" });
    await settle(element);

    expect(text(element)).toBe("");
  });
});
