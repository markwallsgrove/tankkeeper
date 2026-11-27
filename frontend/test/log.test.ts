import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/log";
import type { TkLog } from "../src/views/log";
import { FakeConnection, find, mount, settle, text } from "./fake";

function connection(): FakeConnection {
  return new FakeConnection()
    .on("get_log", {
      entries: [
        {
          id: "1",
          kind: "dose",
          time: "2026-11-26T12:00:00+00:00",
          product: "Easy Green",
          amount_ml: 1,
        },
      ],
    })
    .on("list_products", { products: [{ id: "p1", name: "Easy Green" }] })
    .on("record_dose", { recorded: true })
    .on("record_test", { recorded: true });
}

function save(element: Element, selector: string, detail: Record<string, unknown>): void {
  find(element, selector).dispatchEvent(
    new CustomEvent("tk-save", { detail, bubbles: true, composed: true }),
  );
}

describe("tk-log", () => {
  it("shows the newest entries and filters by kind", async () => {
    const conn = connection();
    const element = mount<TkLog>("tk-log", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(conn.last("get_log").args).toEqual({ kind: "all", limit: 100 });
    expect(text(element)).toContain("Dose: Easy Green 1 ml");

    const select = find(element, "select.kind") as HTMLSelectElement;
    select.value = "test";
    select.dispatchEvent(new Event("change"));
    await settle(element);
    expect(conn.last("get_log").args).toEqual({ kind: "test", limit: 100 });
  });

  it("records a dose and a test", async () => {
    const conn = connection();
    const element = mount<TkLog>("tk-log", { api: new TankkeeperApi(conn) });
    await settle(element);
    const dose = find(element, "tk-form.dose") as unknown as {
      fields: { name: string; options?: string[] }[];
    };
    expect(dose.fields[0]?.options).toEqual(["Easy Green"]);

    save(element, "tk-form.dose", { product: "Easy Green", amount_ml: 2 });
    await settle(element);
    expect(conn.last("record_dose").args).toEqual({ product: "Easy Green", amount_ml: 2 });

    save(element, "tk-form.test", { source: "tap", ph: 7.4, ammonia: 0, notes: "Cloudy" });
    await settle(element);
    expect(conn.last("record_test").args).toEqual({
      source: "tap",
      values: { ph: 7.4, ammonia: 0 },
      notes: "Cloudy",
    });

    save(element, "tk-form.test", { nitrate: 10 });
    await settle(element);
    expect(conn.last("record_test").args).toEqual({ values: { nitrate: 10 } });

    save(element, "tk-form.test", {});
    await settle(element);
    expect(conn.types().filter((type) => type === "tankkeeper/record_test").length).toBe(2);
  });

  it("shows why a dose was not recorded", async () => {
    const conn = connection().fail("record_dose", "not_found", "No product Excel");
    const element = mount<TkLog>("tk-log", { api: new TankkeeperApi(conn) });
    await settle(element);
    save(element, "tk-form.dose", { product: "Excel", amount_ml: 2 });
    await settle(element);
    expect(find(element, ".error").textContent).toBe("No product Excel");
  });
});
