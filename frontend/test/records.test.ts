import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/records";
import type { TkRecords } from "../src/views/records";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const product = {
  id: "p1",
  name: "Easy Green",
  purpose: "Fertiliser",
  label_dose: { amount_ml: 5, per_litres: 100, frequency: "weekly" },
  label_dose_for_tank_ml: 2.7,
  your_dose: "1 ml daily",
  notes: "",
  links: [],
};

function connection(): FakeConnection {
  return new FakeConnection()
    .on("list_products", (message) =>
      (message.args as { include_removed?: boolean }).include_removed === true
        ? { products: [product, { ...product, id: "p2", name: "Old", removed: "2026-11-01" }] }
        : { products: [product] },
    )
    .on("list_contents", { contents: [] })
    .on("list_notes", { notes: [] })
    .on("get_history", { history: [] })
    .on("add_product", { applied: true })
    .on("update_product", { applied: true })
    .on("remove_product", { applied: true });
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
          links: [],
        },
        { ...product, id: "p4", name: "No volume", label_dose_for_tank_ml: undefined },
      ],
    });
    const element = await records("products", conn);
    expect(text(find(element, "li[data-id=p3]"))).not.toContain("Label");
    expect(text(find(element, "li[data-id=p4]"))).toContain("Label: 5 ml per 100 l, weekly");
    expect(text(find(element, "li[data-id=p4]"))).not.toContain("for this tank");
    const form = find(element, "li[data-id=p3] tk-form") as unknown as {
      values: Record<string, unknown>;
    };
    expect(form.values.label_amount_ml).toBeUndefined();
  });

  it("shows when the records cannot be loaded", async () => {
    const element = await records(
      "products",
      connection().fail("list_products", "not_loaded", "Tankkeeper is not loaded"),
    );
    expect(find(element, ".error").textContent).toBe("Tankkeeper is not loaded");
  });

  it("adds, edits and removes a product with the panel's actions", async () => {
    const conn = connection();
    const element = await records("products", conn);

    save(element, "tk-form.add", { name: "Seachem", label_amount_ml: 5, label_per_litres: 100 });
    await settle(element);
    expect(conn.last("add_product").args).toEqual({
      name: "Seachem",
      label_amount_ml: 5,
      label_per_litres: 100,
    });

    const form = find(element, "li[data-id=p1] tk-form");
    expect((form as unknown as { values: Record<string, unknown> }).values).toMatchObject({
      name: "Easy Green",
      label_amount_ml: 5,
      label_per_litres: 100,
      label_frequency: "weekly",
    });
    save(element, "li[data-id=p1] tk-form", { your_dose: "2 ml" });
    await settle(element);
    expect(conn.last("update_product").args).toEqual({ product_id: "p1", your_dose: "2 ml" });

    find(element, "li[data-id=p1] button.remove").click();
    await settle(element);
    expect(conn.last("remove_product").args).toEqual({ product_id: "p1" });

    const history = find(element, "li[data-id=p1] tk-history") as unknown as {
      collection: string;
      recordId: string;
    };
    expect([history.collection, history.recordId]).toEqual(["products", "p1"]);
  });

  it("does nothing when a form has no changes", async () => {
    const conn = connection();
    const element = await records("products", conn);

    save(element, "li[data-id=p1] tk-form", {});
    await settle(element);

    expect(conn.types()).not.toContain("tankkeeper/update_product");
  });

  it("shows removed products when asked", async () => {
    const element = await records("products");
    const toggle = find(element, "input.show-removed") as HTMLInputElement;

    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    await settle(element);

    expect(text(element)).toContain("Removed 2026-11-01");
    expect(findAll(element, "li[data-id=p2] button.remove")).toEqual([]);
  });

  it("clears the Add form once the product is saved, and keeps it when saving fails", async () => {
    const conn = connection();
    const element = await records("products", conn);
    const form = find(element, "tk-form.add");
    const name = find(form, "[name=name]") as HTMLInputElement;

    name.value = "Seachem";
    find(form, "form").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);
    expect(conn.last("add_product").args).toEqual({ name: "Seachem" });
    expect(name.value).toBe("");

    conn.fail("add_product", "already_exists", "Seachem already exists");
    name.value = "Seachem";
    find(form, "form").dispatchEvent(new Event("submit", { cancelable: true }));
    await settle(element);
    expect(name.value).toBe("Seachem");
  });

  it("keeps an open edit with its record when the list changes order", async () => {
    const other = { ...product, id: "p2", name: "Prime" };
    const conn = connection().on("list_products", { products: [product, other] });
    const element = await records("products", conn);
    (find(element, "li[data-id=p1] details") as HTMLDetailsElement).open = true;

    conn.on("list_products", { products: [other, product] });
    await element.reload();
    await settle(element);

    expect((find(element, "li[data-id=p1] details") as HTMLDetailsElement).open).toBe(true);
    expect((find(element, "li[data-id=p2] details") as HTMLDetailsElement).open).toBe(false);
  });

  it("loads the history of a product only when its details open", async () => {
    const conn = connection();
    const element = await records("products", conn);
    expect(conn.types()).not.toContain("tankkeeper/get_history");

    const details = find(element, "li[data-id=p1] details") as HTMLDetailsElement;
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
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

  it("shows a failed change", async () => {
    const conn = connection().fail("add_product", "already_exists", "Easy Green already exists");
    const element = await records("products", conn);

    save(element, "tk-form.add", { name: "Easy Green" });
    await settle(element);

    expect(find(element, ".error").textContent).toBe("Easy Green already exists");
  });
});

describe("tk-records for contents and notes", () => {
  it("shows contents with their count and place", async () => {
    const conn = connection()
      .on("list_contents", {
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
      })
      .on("update_content", { applied: true });
    const element = await records("contents", conn);

    expect(text(element)).toContain("Fern");
    expect(text(element)).toContain("plant · 2 · Back · added 2026-11-20");
    save(element, "li[data-id=c1] tk-form", { count: 3 });
    await settle(element);
    expect(conn.last("update_content").args).toEqual({ content_id: "c1", count: 3 });
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
