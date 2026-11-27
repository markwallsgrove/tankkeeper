import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/records";
import type { TkRecords } from "../src/views/records";
import { DELETE, HISTORY, PENCIL } from "../src/buttons";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

function icons(root: Element): (string | null)[][] {
  return findAll(root, "ha-icon-button").map((button) => [
    button.getAttribute("label"),
    (button as unknown as { path: string }).path,
  ]);
}

const product = {
  id: "p1",
  name: "Easy Green",
  purpose: "Fertiliser",
  label_dose: { amount_ml: 5, per_litres: 100, frequency: "weekly" },
  label_dose_for_tank_ml: 2.7,
  your_dose: "1 ml daily",
  notes: "Shake first",
  links: ["https://example.com/easy-green"],
};
const note = {
  id: "n1",
  kind: "question",
  topic: "CO2",
  text: "Is CO2 needed?",
  how_to_resolve: null,
};

function connection(): FakeConnection {
  return new FakeConnection()
    .on("list_products", (message) =>
      (message.args as { include_removed?: boolean }).include_removed === true
        ? { products: [product, { ...product, id: "p2", name: "Old", removed: "2026-11-01" }] }
        : { products: [product] },
    )
    .on("list_contents", { contents: [] })
    .on("list_notes", { notes: [note] })
    .on("get_history", { history: [] })
    .on("add_note", { applied: true })
    .on("update_note", { applied: true })
    .on("remove_note", { applied: true });
}

async function records(kind: string, conn = connection()): Promise<TkRecords> {
  const element = mount<TkRecords>("tk-records", {
    kind,
    api: new TankkeeperApi(conn),
  });
  await settle(element);
  return element;
}

function save(element: Element, selector: string, detail: Record<string, unknown>): void {
  find(element, selector).dispatchEvent(
    new CustomEvent("tk-save", { detail, bubbles: true, composed: true }),
  );
}

describe("tk-records for products", () => {
  it("lists products with the label dose for the tank", async () => {
    const element = await records("products");

    expect(text(element)).toContain("Easy Green");
    expect(text(element)).toContain("Fertiliser");
    expect(text(element)).toContain("Label: 5 ml per 100 l, weekly (2.7 ml for this tank)");
    expect(text(element)).toContain("Your dose: 1 ml daily");
    expect(text(element)).toContain("Shake first");
    expect(text(element)).toContain("https://example.com/easy-green");
    expect(findAll(element, "a")).toEqual([]);
  });

  it("lists a product without a label dose, or without a dose for the tank", async () => {
    const conn = connection().on("list_products", {
      products: [
        {
          id: "p3",
          name: "Plain",
          purpose: "Water",
          label_dose: null,
          your_dose: "",
          notes: "",
        },
        { ...product, id: "p4", name: "No volume", label_dose_for_tank_ml: undefined },
      ],
    });
    const element = await records("products", conn);
    expect(text(find(element, "li[data-id=p3]"))).not.toContain("Label");
    expect(text(find(element, "li[data-id=p4]"))).toContain("Label: 5 ml per 100 l, weekly");
    expect(text(find(element, "li[data-id=p4]"))).not.toContain("for this tank");
  });

  it("shows when the records cannot be loaded", async () => {
    const element = await records(
      "products",
      connection().fail("list_products", "not_loaded", "TankKeeper is not loaded"),
    );
    expect(find(element, ".error").textContent).toBe("TankKeeper is not loaded");
  });

  it("shows products read-only, with each product's history and no cog", async () => {
    const conn = connection();
    const element = await records("products", conn);

    expect(findAll(element, "tk-form, button")).toEqual([]);
    expect(text(element)).not.toContain("Add");
    expect(findAll(element, "ha-icon-button.settings")).toEqual([]);
    expect(icons(find(element, "li[data-id=p1]"))).toEqual([["History", HISTORY]]);
    expect(findAll(element, "details")).toEqual([]);
    find(element, "li[data-id=p1] ha-icon-button.history").click();
    await settle(element);
    const history = find(element, "li[data-id=p1] tk-history") as unknown as {
      collection: string;
      recordId: string;
    };
    expect([history.collection, history.recordId]).toEqual(["products", "p1"]);
  });

  it("shows removed products when asked", async () => {
    const element = await records("products");
    const toggle = find(element, "input.show-removed") as HTMLInputElement;

    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    await settle(element);

    expect(text(element)).toContain("Removed 2026-11-01");
  });

  it("keeps an open history with its record when the list changes order", async () => {
    const other = { ...product, id: "p2", name: "Prime" };
    const conn = connection().on("list_products", { products: [product, other] });
    const element = await records("products", conn);
    find(element, "li[data-id=p1] ha-icon-button.history").click();
    await settle(element);

    conn.on("list_products", { products: [other, product] });
    await element.reload();
    await settle(element);

    expect(findAll(element, "li[data-id=p1] tk-history").length).toBe(1);
    expect(findAll(element, "li[data-id=p2] tk-history")).toEqual([]);
  });

  it("loads the history of a product only when its history button opens it", async () => {
    const conn = connection();
    const element = await records("products", conn);
    expect(conn.types()).not.toContain("tankkeeper/get_history");

    find(element, "li[data-id=p1] ha-icon-button.history").click();
    await settle(element);

    expect(conn.last("get_history").args).toEqual({
      collection: "products",
      record_id: "p1",
      limit: 10,
    });
  });

  it("shows only the answer to the latest load, and clears an old error", async () => {
    let answer: (value: unknown) => void = () => undefined;
    const conn = connection().on("list_notes", { notes: [] });
    const element = await records("products", conn);
    conn.on("list_products", () => new Promise((resolve) => (answer = resolve)));
    element.error = "Old problem";

    const slow = element.reload();
    element.kind = "notes";
    await settle(element);
    answer({ products: [product] });
    await slow;
    await settle(element);

    expect(text(element)).not.toContain("Easy Green");
    expect(element.error).toBe("");
  });
});

describe("tk-records for contents and notes", () => {
  it("shows contents with their count and place", async () => {
    const conn = connection().on("list_contents", {
      contents: [
        {
          id: "c1",
          type: "plant",
          name: "Fern",
          count: 2,
          where: "Back",
          added: "2026-11-20",
          removed: null,
          notes: "",
        },
      ],
    });
    const element = await records("contents", conn);

    expect(text(element)).toContain("Fern");
    expect(text(element)).toContain("plant · 2 · Back · added 2026-11-20");
    expect(findAll(element, "tk-form, button")).toEqual([]);
    expect(findAll(element, "ha-icon-button.settings")).toEqual([]);
  });

  it("gives each note edit, history and remove icon buttons, and an add button", async () => {
    const element = await records("notes");
    expect(icons(find(element, "li[data-id=n1]"))).toEqual([
      ["Edit", PENCIL],
      ["History", HISTORY],
      ["Remove", DELETE],
    ]);
    expect(find(element, "ha-icon-button.add").getAttribute("label")).toBe("Add a note");
    expect(findAll(element, "tk-form, details")).toEqual([]);
  });

  it("adds, edits and removes notes, each form in its own dialog", async () => {
    const conn = connection();
    const element = await records("notes", conn);

    find(element, "ha-icon-button.add").click();
    await settle(element);
    expect(find(element, "tk-dialog.add").getAttribute("heading")).toBe("Add a note");
    save(element, "tk-dialog tk-form.add", { kind: "assumption", topic: "Light", text: "6 hours" });
    await settle(element);
    expect(conn.last("add_note").args).toEqual({
      kind: "assumption",
      topic: "Light",
      text: "6 hours",
    });
    expect(findAll(element, "tk-dialog")).toEqual([]);

    find(element, "li[data-id=n1] ha-icon-button.edit").click();
    await settle(element);
    save(element, "tk-dialog.edit tk-form", { text: "Is CO2 worth it?" });
    await settle(element);
    expect(conn.last("update_note").args).toEqual({ note_id: "n1", text: "Is CO2 worth it?" });
    expect(findAll(element, "tk-dialog")).toEqual([]);

    find(element, "li[data-id=n1] ha-icon-button.remove").click();
    await settle(element);
    expect(conn.last("remove_note").args).toEqual({ note_id: "n1" });

    find(element, "li[data-id=n1] ha-icon-button.history").click();
    await settle(element);
    const history = find(element, "li[data-id=n1] tk-history") as unknown as {
      collection: string;
      recordId: string;
    };
    expect([history.collection, history.recordId]).toEqual(["notes", "n1"]);
  });

  it("does nothing when a form has no changes, and keeps its dialog open", async () => {
    const conn = connection();
    const element = await records("notes", conn);
    find(element, "li[data-id=n1] ha-icon-button.edit").click();
    await settle(element);

    save(element, "tk-dialog.edit tk-form", {});
    await settle(element);

    expect(conn.types()).not.toContain("tankkeeper/update_note");
    expect(findAll(element, "tk-dialog.edit").length).toBe(1);
  });

  it("keeps the Add dialog and what was typed when saving fails, with the error in it", async () => {
    const conn = connection().fail("add_note", "invalid_input", "A note needs text");
    const element = await records("notes", conn);
    find(element, "ha-icon-button.add").click();
    await settle(element);
    const form = find(element, "tk-dialog tk-form.add");
    const topic = find(form, "[name=topic]") as HTMLInputElement;
    (find(form, "[name=kind]") as HTMLSelectElement).value = "question";
    (find(form, "[name=text]") as HTMLTextAreaElement).value = "Is CO2 needed?";
    topic.value = "CO2";
    find(form, "form").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);

    expect(topic.value).toBe("CO2");
    expect(find(form, ".error").textContent).toBe("A note needs text");
    expect(findAll(element, "section > p.error")).toEqual([]);
  });

  it("does not offer to remove a removed record", async () => {
    const conn = connection().on("list_notes", { notes: [{ ...note, removed: "2026-11-02" }] });
    const element = await records("notes", conn);
    expect(text(find(element, "li[data-id=n1]"))).toContain("Removed 2026-11-02");
    expect(findAll(element, "li[data-id=n1] ha-icon-button.remove")).toEqual([]);
  });

  it("renders note text as text, never as markup", async () => {
    const conn = connection().on("list_notes", {
      notes: [
        {
          id: "n1",
          kind: "question",
          topic: "<b>CO2</b>",
          text: '<img src=x onerror="alert(1)">',
          how_to_resolve: null,
        },
      ],
    });
    const element = await records("notes", conn);

    expect(findAll(element, "img")).toEqual([]);
    expect(findAll(element, "li b")).toEqual([]);
    expect(text(element)).toContain('<img src=x onerror="alert(1)">');
  });

  it("refuses a kind it does not know", () => {
    const element = document.createElement("tk-records") as TkRecords;
    element.kind = "fish";

    expect(() => element.render()).toThrow("No records called fish");
  });
});
