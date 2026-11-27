import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/plan";
import type { TkPlan } from "../src/views/plan";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const reminders = {
  notify: ["notify.phone"],
  status_notify: [],
  task_time: "09:00",
  dose_time: "12:00",
  resend_time: "21:00",
};
const tasks = [
  {
    id: "t1",
    date: "2026-11-26",
    slot: "task",
    time: "09:00",
    text: "Test water",
    state: "open",
    note: null,
  },
  {
    id: "t2",
    date: "2026-11-27",
    slot: "dose",
    time: "12:00",
    text: "Dose Easy Green",
    state: "complete",
    note: "Done",
  },
];

function connection(): FakeConnection {
  return new FakeConnection()
    .on("get_plan", { start: "2026-11-26", end: "2026-12-23", tasks, reminders })
    .on("get_history", { history: [] })
    .on("add_task", { applied: true })
    .on("update_task", { applied: true })
    .on("remove_task", { applied: true });
}

function save(element: Element, selector: string, detail: Record<string, unknown>): void {
  find(element, selector).dispatchEvent(
    new CustomEvent("tk-save", { detail, bubbles: true, composed: true }),
  );
}

describe("tk-plan", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 26, 10));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts today in Home Assistant's time zone", async () => {
    vi.setSystemTime(new Date("2026-11-26T12:00:00Z"));
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", {
      api: new TankkeeperApi(conn, "Pacific/Kiritimati"),
    });
    await settle(element);

    expect(conn.last("get_plan").args).toEqual({ start: "2026-11-27", end: "2026-12-24" });
  });

  it("shows four weeks of tasks by day", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);

    expect(conn.last("get_plan").args).toEqual({ start: "2026-11-26", end: "2026-12-23" });
    expect(findAll(element, "h3").map((heading) => heading.textContent)).toEqual([
      "2026-11-26",
      "2026-11-27",
    ]);
    expect(text(element)).toContain("09:00 Test water");
    expect(text(element)).toContain("complete · Done");
  });

  it("shows a task without a time, and errors", async () => {
    const conn = connection()
      .on("get_plan", {
        start: "2026-11-26",
        end: "2026-12-23",
        tasks: [{ ...tasks[0], time: null }],
        reminders,
      })
      .fail("remove_task", "not_found", "No task t1");
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(find(element, "li[data-task=t1] .grow").textContent.trim()).toBe("Test water");
    find(element, "li[data-task=t1] button.remove").click();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("No task t1");
  });

  it("shows when there are no tasks", async () => {
    const conn = connection().on("get_plan", {
      start: "2026-11-26",
      end: "2026-12-23",
      tasks: [],
      reminders,
    });
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(text(element)).toContain("No tasks in the next four weeks");
  });

  it("adds, edits and removes tasks", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);

    save(element, "tk-form.add", { text: "Trim", date: "2026-11-28" });
    await settle(element);
    expect(conn.last("add_task").args).toEqual({ text: "Trim", date: "2026-11-28" });

    save(element, "li[data-task=t1] tk-form", { state: "skip" });
    await settle(element);
    expect(conn.last("update_task").args).toEqual({ task_id: "t1", state: "skip" });

    find(element, "li[data-task=t1] button.remove").click();
    await settle(element);
    expect(conn.last("remove_task").args).toEqual({ task_id: "t1" });
  });

  it("adds nothing when the Add form is empty", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);

    save(element, "tk-form.add", {});
    await settle(element);
    expect(conn.types()).not.toContain("tankkeeper/add_task");
  });

  it("shows the reminders read-only, with a cog and their history", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);

    const card = find(element, "#reminders");
    expect(text(card)).toContain("Notify services for reminders notify.phone");
    expect(text(card)).toContain("Notify services for status alerts Not set");
    expect(text(card)).toContain("Task reminder time 09:00");
    expect(findAll(card, "tk-form")).toEqual([]);
    expect(find(card, "ha-icon-button.settings").getAttribute("label")).toBe(
      "Edit reminder settings",
    );
    const history = find(card, "tk-history") as unknown as { collection: string; recordId: string };
    expect([history.collection, history.recordId]).toEqual(["settings", "reminders"]);
  });
});
