import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/records";
import type { TkRecords } from "../src/views/records";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const contents = [
  { id: "c1", number: 1, type: "plant", name: "Vallisneria", zone: "back_left", aliases: [] },
  {
    id: "c3",
    number: 3,
    type: "plant",
    name: "Rotala",
    zone: "back_left",
    aliases: ["the red one"],
  },
  { id: "c4", number: 4, type: "wood", name: "Spider wood", zone: "back_middle", aliases: [] },
  { id: "c6", number: 6, type: "plant", name: "Java fern", zone: null, aliases: [] },
  { id: "c7", number: 7, type: "rock", name: "Old stone", zone: null, removed: "2026-11-01" },
];

function connection(): FakeConnection {
  return new FakeConnection()
    .on("list_contents", (message) =>
      (message.args as { include_removed?: boolean }).include_removed === true
        ? { contents }
        : { contents: contents.filter((item) => item.removed === undefined) },
    )
    .on("get_history", { history: [] })
    .on("update_content", { applied: true });
}

async function contentsView(conn = connection()): Promise<TkRecords> {
  const element = mount<TkRecords>("tk-records", {
    kind: "contents",
    api: new TankkeeperApi(conn),
  });
  await settle(element);
  return element;
}

function map(element: TkRecords): Element {
  return find(element, "tk-tank-map");
}

function zone(element: TkRecords, name: string): Element {
  return find(map(element), `[data-zone="${name}"]`);
}

function chip(element: TkRecords, id: string): HTMLButtonElement {
  return find(map(element), `button.chip[data-id="${id}"]`) as HTMLButtonElement;
}

describe("tk-tank-map", () => {
  it("shows each item in its zone by number, and the rest as not placed", async () => {
    const element = await contentsView();

    expect(
      findAll(map(element), "[data-zone]").map((item) => item.getAttribute("data-zone")),
    ).toEqual([
      "back_left",
      "back_middle",
      "back_right",
      "front_left",
      "front_middle",
      "front_right",
      "none",
    ]);
    expect(text(zone(element, "back_left"))).toContain("Back left");
    expect(findAll(zone(element, "back_left"), "button.chip").map(text)).toEqual([
      "1 Vallisneria",
      "3 Rotala",
    ]);
    expect(findAll(zone(element, "back_middle"), "button.chip").map(text)).toEqual([
      "4 Spider wood",
    ]);
    expect(findAll(zone(element, "none"), "button.chip").map(text)).toEqual(["6 Java fern"]);
  });

  it("leaves removed items off the map", async () => {
    const element = await contentsView();
    find(element, "input.show-removed").click();
    await settle(element);

    expect(text(map(element))).not.toContain("Old stone");
    expect(text(element)).toContain("Old stone");
  });

  it("moves an item by picking it and then a zone", async () => {
    const conn = connection();
    const element = await contentsView(conn);

    chip(element, "c6").click();
    await settle(element);
    expect(chip(element, "c6").getAttribute("aria-pressed")).toBe("true");
    (find(zone(element, "front_right"), "button.zone-name") as HTMLButtonElement).click();
    await settle(element);

    expect(conn.last("update_content").args).toEqual({ content_id: "c6", zone: "front_right" });
    expect(conn.types().filter((type) => type === "tankkeeper/list_contents")).toHaveLength(2);
  });

  it("takes an item off the map in Not placed", async () => {
    const conn = connection();
    const element = await contentsView(conn);

    chip(element, "c3").click();
    await settle(element);
    (find(zone(element, "none"), "button.zone-name") as HTMLButtonElement).click();
    await settle(element);

    expect(conn.last("update_content").args).toEqual({ content_id: "c3", zone: null });
  });

  it("picks again to let go, and needs a pick before a zone does anything", async () => {
    const conn = connection();
    const element = await contentsView(conn);
    const name = find(zone(element, "front_left"), "button.zone-name") as HTMLButtonElement;
    expect(name.disabled).toBe(true);

    chip(element, "c1").click();
    await settle(element);
    expect(name.disabled).toBe(false);
    chip(element, "c1").click();
    await settle(element);

    expect(chip(element, "c1").getAttribute("aria-pressed")).toBe("false");
    expect(name.disabled).toBe(true);
  });

  it("does nothing when an item is put back in its own zone", async () => {
    const conn = connection();
    const element = await contentsView(conn);

    chip(element, "c1").click();
    await settle(element);
    (find(zone(element, "back_left"), "button.zone-name") as HTMLButtonElement).click();
    await settle(element);

    expect(conn.types()).not.toContain("tankkeeper/update_content");
    expect(chip(element, "c1").getAttribute("aria-pressed")).toBe("false");
  });

  it("moves an item dragged onto a zone", async () => {
    const conn = connection();
    const element = await contentsView(conn);
    const data = new Map<string, string>();
    const transfer = {
      setData: (type: string, value: string) => data.set(type, value),
      getData: (type: string) => data.get(type) ?? "",
      effectAllowed: "",
      dropEffect: "",
    };

    chip(element, "c4").dispatchEvent(
      Object.assign(new Event("dragstart", { bubbles: true }), { dataTransfer: transfer }),
    );
    const over = Object.assign(new Event("dragover", { bubbles: true, cancelable: true }), {
      dataTransfer: transfer,
    });
    zone(element, "front_middle").dispatchEvent(over);
    expect(over.defaultPrevented).toBe(true);
    zone(element, "front_middle").dispatchEvent(
      Object.assign(new Event("drop", { bubbles: true, cancelable: true }), {
        dataTransfer: transfer,
      }),
    );
    await settle(element);

    expect(conn.last("update_content").args).toEqual({ content_id: "c4", zone: "front_middle" });
  });

  it("ignores a drop that carries no item", async () => {
    const conn = connection();
    const element = await contentsView(conn);

    zone(element, "front_middle").dispatchEvent(
      new Event("drop", { bubbles: true, cancelable: true }),
    );
    await settle(element);

    expect(conn.types()).not.toContain("tankkeeper/update_content");
  });

  it("shows the error when a move fails", async () => {
    const conn = connection().fail("update_content", "not_found", "No contents record with id c6");
    const element = await contentsView(conn);

    chip(element, "c6").click();
    await settle(element);
    (find(zone(element, "back_right"), "button.zone-name") as HTMLButtonElement).click();
    await settle(element);

    expect(text(element)).toContain("No contents record with id c6");
  });

  it("lists each item with its number, zone and other names", async () => {
    const element = await contentsView();
    const rotala = find(element, 'li[data-id="c3"]');

    expect(text(rotala)).toContain("3 Rotala");
    expect(text(rotala)).toContain("Back left");
    expect(text(rotala)).toContain("Also called: the red one");
    expect(text(find(element, 'li[data-id="c6"]'))).toContain("Not placed");
  });
});
