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
    .on("remove_task", { applied: true })
    .on("set_reminders", { applied: true });
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

  it("adds, edits and removes tasks and sets the reminders", async () => {
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

    const form = find(element, "tk-form.reminders") as unknown as {
      values: Record<string, unknown>;
    };
    expect(form.values.notify).toEqual(["notify.phone"]);
    save(element, "tk-form.reminders", { task_time: "08:00" });
    await settle(element);
    expect(conn.last("set_reminders").args).toEqual({ task_time: "08:00" });

    save(element, "tk-form.reminders", {});
    await settle(element);
    expect(conn.types().filter((type) => type === "tankkeeper/set_reminders").length).toBe(1);
  });
});
