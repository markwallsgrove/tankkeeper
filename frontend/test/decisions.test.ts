import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/decisions";
import type { TkDecisions } from "../src/views/decisions";
import { CHECK, COLLAPSE, EXPAND, HISTORY, PENCIL, REPLACE } from "../src/buttons";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

function icons(root: Element, selector: string): (string | null)[][] {
  return findAll(root, selector).map((button) => [
    button.getAttribute("label"),
    (button as unknown as { path: string }).path,
  ]);
}

const listed = [
  { number: 1, title: "Fishless cycle", date: "2026-11-01", status: "accepted", replaced_by: null },
  { number: 2, title: "Dose daily", date: "2026-11-02", status: "proposed", replaced_by: null },
];

function connection(): FakeConnection {
  return new FakeConnection()
    .on("list_decisions", { decisions: listed })
    .on("get_decision", (message) => ({
      ...listed[(message.args as { number: number }).number - 1],
      decision: "Use ammonia",
      why: "Safer",
      open: ["Which source?"],
      replaces: [],
    }))
    .on("set_decision", { applied: true })
    .on("get_history", { history: [] });
}

function save(element: Element, selector: string, detail: Record<string, unknown>): void {
  find(element, selector).dispatchEvent(
    new CustomEvent("tk-save", { detail, bubbles: true, composed: true }),
  );
}

async function view(conn = connection()): Promise<TkDecisions> {
  const element = mount<TkDecisions>("tk-decisions", { api: new TankkeeperApi(conn) });
  await settle(element);
  return element;
}

describe("tk-decisions", () => {
  it("lists decisions and opens one with its text", async () => {
    const conn = connection();
    const element = await view(conn);
    expect(text(element)).toContain("0001 Fishless cycle");
    expect(text(element)).toContain("accepted · 2026-11-01");

    find(element, "li[data-number='1'] ha-icon-button.open").click();
    await settle(element);

    expect(conn.last("get_decision").args).toEqual({ number: 1 });
    expect(text(element)).toContain("Use ammonia");
    expect(text(element)).toContain("Which source?");
    expect(icons(element, "li[data-number='1'] > .row ha-icon-button")).toEqual([
      ["Close", COLLAPSE],
    ]);
    expect(icons(element, "li[data-number='2'] > .row ha-icon-button")).toEqual([["Open", EXPAND]]);
    expect(icons(element, ".card .actions ha-icon-button")).toEqual([
      ["Edit", PENCIL],
      ["Replace", REPLACE],
      ["History", HISTORY],
    ]);
    expect(findAll(element, "details, tk-form, tk-history")).toEqual([]);
    find(element, ".card ha-icon-button.history").click();
    await settle(element);
    const history = find(element, "tk-history") as unknown as {
      collection: string;
      recordId: string;
    };
    expect([history.collection, history.recordId]).toEqual(["decisions", "0001"]);

    const status = find(element, "select.status") as HTMLSelectElement;
    status.value = "proposed";
    status.dispatchEvent(new Event("change"));
    await settle(element);
    expect(conn.last("list_decisions").args).toEqual({ status: "proposed" });
    status.value = "";
    status.dispatchEvent(new Event("change"));
    await settle(element);
    expect(conn.last("list_decisions").args).toEqual({});
  });

  it("adds, updates, accepts and replaces decisions, each form in its own dialog", async () => {
    const conn = connection();
    const element = await view(conn);
    expect(findAll(element, "tk-form")).toEqual([]);

    find(element, "ha-icon-button.add").click();
    await settle(element);
    expect(find(element, "tk-dialog.add").getAttribute("heading")).toBe("Add a decision");
    save(element, "tk-dialog tk-form.add", { title: "New", decision: "Do", why: "Because" });
    await settle(element);
    expect(conn.last("set_decision").args).toEqual({
      action: "add",
      title: "New",
      decision: "Do",
      why: "Because",
    });
    expect(findAll(element, "tk-dialog")).toEqual([]);

    find(element, "li[data-number='2'] ha-icon-button.open").click();
    await settle(element);
    expect(icons(element, ".card .actions ha-icon-button")).toEqual([
      ["Accept", CHECK],
      ["Edit", PENCIL],
      ["Replace", REPLACE],
      ["History", HISTORY],
    ]);
    find(element, ".card ha-icon-button.update").click();
    await settle(element);
    save(element, "tk-dialog.update tk-form", { why: "Clearer" });
    await settle(element);
    expect(conn.last("set_decision").args).toEqual({ action: "update", number: 2, why: "Clearer" });
    expect(findAll(element, "tk-dialog")).toEqual([]);

    find(element, ".card ha-icon-button.accept").click();
    await settle(element);
    expect(conn.last("set_decision").args).toEqual({ action: "accept", number: 2 });

    find(element, ".card ha-icon-button.replace").click();
    await settle(element);
    save(element, "tk-dialog.replace tk-form", { replaced_by: 1 });
    await settle(element);
    expect(conn.last("set_decision").args).toEqual({
      action: "replace",
      number: 2,
      replaced_by: 1,
    });
    expect(findAll(element, "tk-dialog")).toEqual([]);

    find(element, "li[data-number='1'] ha-icon-button.open").click();
    find(element, "li[data-number='1'] ha-icon-button.open").click();
    await settle(element);
    expect(findAll(element, ".card")).toEqual([]);
  });

  it("shows what replaced a decision and what it replaces", async () => {
    const conn = connection().on("get_decision", {
      ...listed[0],
      status: "replaced",
      replaced_by: 3,
      decision: "Use ammonia",
      why: "Safer",
      open: [],
      replaces: [7],
    });
    const element = await view(conn);
    find(element, "li[data-number='1'] ha-icon-button.open").click();
    await settle(element);
    expect(text(element)).toContain("Replaced by 0003");
    expect(text(element)).toContain("Replaces 0007");
    expect(text(element)).not.toContain("Open points");
  });

  it("ignores an empty form and shows errors in the dialog", async () => {
    const conn = connection().fail("set_decision", "invalid_input", "Needs a title");
    const element = await view(conn);
    find(element, "ha-icon-button.add").click();
    await settle(element);

    save(element, "tk-form.add", {});
    await settle(element);
    expect(conn.types()).not.toContain("tankkeeper/set_decision");

    save(element, "tk-form.add", { why: "x" });
    await settle(element);
    const form = find(element, "tk-dialog.add tk-form") as unknown as { error: string };
    expect(form.error).toBe("Needs a title");
    expect(findAll(element, "section > p.error")).toEqual([]);
  });

  it("shows an error from Accept in the view", async () => {
    const conn = connection().fail("set_decision", "invalid_input", "Already accepted");
    const element = await view(conn);
    find(element, "li[data-number='2'] ha-icon-button.open").click();
    await settle(element);
    find(element, ".card ha-icon-button.accept").click();
    await settle(element);
    expect(find(element, "section > p.error").textContent).toBe("Already accepted");
  });
});
