import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TankkeeperApi } from "../src/api";
import "../src/views/plan";
import type { TkWeek } from "../src/tk-week";
import type { TkPlan } from "../src/views/plan";
import { DELETE, HISTORY, PENCIL } from "../src/buttons";
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
    series_id: null,
  },
  {
    id: "t2",
    date: "2026-11-27",
    slot: "dose",
    time: "12:00",
    text: "Dose Easy Green",
    state: "complete",
    note: "Done",
    series_id: null,
  },
];
const occurrence = {
  id: "s1@2026-11-28",
  date: "2026-11-28",
  slot: "task",
  time: "09:00",
  text: "Water change 25%",
  state: "open",
  note: null,
  series_id: "s1",
};
const series = [
  {
    id: "s1",
    start: "2026-11-26",
    slot: "task",
    text: "Water change 25%",
    note: "",
    every_days: null,
    weekdays: ["mon", "sat"],
    until: "2026-12-31",
    skipped: [],
    repeat: "every Mon and Sat until 2026-12-31",
  },
];

function connection(): FakeConnection {
  return new FakeConnection()
    .on("get_plan", {
      start: "2026-11-26",
      end: "2026-12-23",
      tasks: [...tasks, occurrence],
      series,
      reminders,
    })
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
      "2026-11-28",
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
        series: [],
        reminders,
      })
      .fail("remove_task", "not_found", "No task t1");
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(find(element, "li[data-task=t1] .grow").textContent.trim()).toBe("Test water");
    find(element, "li[data-task=t1] ha-icon-button.remove").click();
    await settle(element);
    expect(find(element, ".error").textContent).toBe("No task t1");
  });

  it("shows when there are no tasks", async () => {
    const conn = connection().on("get_plan", {
      start: "2026-11-26",
      end: "2026-12-23",
      tasks: [],
      series: [],
      reminders,
    });
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(text(element)).toContain("No tasks in the next four weeks");
  });

  it("gives each task edit, history and remove icon buttons, each named", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);

    const buttons = findAll(element, "li[data-task=t1] .actions ha-icon-button").map((button) => [
      button.getAttribute("label"),
      (button as unknown as { path: string }).path,
    ]);
    expect(buttons).toEqual([
      ["Edit", PENCIL],
      ["History", HISTORY],
      ["Remove", DELETE],
    ]);
    expect(findAll(element, "li[data-task=t1] details")).toEqual([]);
    expect(find(element, "li[data-task=t1] .detail").textContent.trim()).toBe("open");
  });

  it("adds a repeating task", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    find(element, "ha-icon-button.add").click();
    await settle(element);
    const add = find(element, "tk-dialog tk-form.add") as unknown as { fields: { name: string }[] };
    expect(add.fields.map((field) => field.name)).toEqual([
      "text",
      "date",
      "slot",
      "note",
      "every_days",
      "weekdays",
      "until",
    ]);

    save(element, "tk-dialog tk-form.add", {
      text: "Water change",
      every_days: 7,
      until: "2026-12-31",
    });
    await settle(element);

    expect(conn.last("add_task").args).toEqual({
      text: "Water change",
      every_days: 7,
      until: "2026-12-31",
    });
  });

  it("marks a repeating task and says how it repeats", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);

    const row = find(element, "li[data-task='s1@2026-11-28']");
    expect(findAll(row, "ha-svg-icon.repeat")).toHaveLength(1);
    expect(text(row)).toContain("every Mon and Sat until 2026-12-31");
    expect(findAll(find(element, "li[data-task=t1]"), "ha-svg-icon.repeat")).toEqual([]);
  });

  it("edits one occurrence, or it and every later one", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    const selector = "tk-dialog.edit tk-form";
    const edit = async (taskId: string): Promise<void> => {
      find(element, `li[data-task='${taskId}'] ha-icon-button.edit`).click();
      await settle(element);
    };
    await edit("s1@2026-11-28");
    const form = find(element, selector) as unknown as {
      fields: { name: string }[];
      values: Record<string, unknown>;
    };
    expect(form.fields.map((field) => field.name)).toEqual([
      "text",
      "date",
      "slot",
      "state",
      "note",
      "scope",
      "every_days",
      "weekdays",
      "until",
    ]);
    expect(form.values).toMatchObject({
      text: "Water change 25%",
      scope: "this",
      every_days: null,
      weekdays: ["mon", "sat"],
      until: "2026-12-31",
    });

    save(element, selector, { state: "complete" });
    await settle(element);
    expect(conn.last("update_task").args).toEqual({ task_id: "s1@2026-11-28", state: "complete" });

    await edit("s1@2026-11-28");

    save(element, selector, { scope: "future", every_days: 3, weekdays: [], until: "" });
    await settle(element);
    expect(conn.last("update_task").args).toEqual({
      task_id: "s1@2026-11-28",
      scope: "future",
      every_days: 3,
      until: "",
    });

    await edit("t1");
    expect(
      (find(element, selector) as unknown as { fields: { name: string }[] }).fields.length,
    ).toBe(5);
  });

  it("removes one occurrence, or it and every later one", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(findAll(find(element, "li[data-task=t1]"), "ha-icon-button.remove-future")).toEqual([]);

    find(element, "li[data-task='s1@2026-11-28'] ha-icon-button.remove").click();
    await settle(element);
    expect(conn.last("remove_task").args).toEqual({ task_id: "s1@2026-11-28" });

    find(element, "li[data-task='s1@2026-11-28'] ha-icon-button.remove-future").click();
    await settle(element);
    expect(conn.last("remove_task").args).toEqual({ task_id: "s1@2026-11-28", scope: "future" });
  });

  it("shows the week above the list, from today", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);

    const week = find(element, "tk-week") as unknown as TkWeek;
    expect([week.start, week.end, week.today]).toEqual(["2026-11-26", "2026-12-23", "2026-11-26"]);
    expect(week.tasks.map((task) => task.id)).toEqual(["t1", "t2", "s1@2026-11-28"]);
    expect(week.picked).toBeUndefined();
    expect(
      element.shadowRoot?.querySelector("section")?.firstElementChild?.nextElementSibling?.tagName,
    ).toBe("TK-WEEK");
  });

  it("scrolls to a task's row when its chip is clicked", async () => {
    const scrolled: string[] = [];
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value(this: Element) {
        scrolled.push(this.getAttribute("data-task") ?? "");
      },
    });
    try {
      const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
      await settle(element);
      const week = find(element, "tk-week");
      await settle(week as unknown as TkWeek);

      find(week, ".strip button[data-day='2026-11-26']").click();
      await settle(element);
      expect(findAll(element, "li[data-task]")).toHaveLength(1);
      find(week, ".chip[data-task=t2]").click();
      await settle(element);
      expect((week as unknown as TkWeek).picked).toBeUndefined();
      expect(findAll(element, "li[data-task]")).toHaveLength(3);
      expect(scrolled).toEqual(["t2"]);
    } finally {
      Reflect.deleteProperty(Element.prototype, "scrollIntoView");
    }
    expect("scrollIntoView" in Element.prototype).toBe(false);
  });

  it("drops the day filter when the week moves off the day", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);
    const week = find(element, "tk-week");
    await settle(week as unknown as TkWeek);
    find(week, ".strip button[data-day='2026-11-27']").click();
    await settle(element);

    find(week, "button.next").click();
    await settle(element);
    expect(findAll(element, ".filter")).toEqual([]);

    find(week, ".strip button[data-day='2026-12-01']").click();
    await settle(element);
    week.dispatchEvent(new CustomEvent("tk-week-change", { detail: "2026-11-30" }));
    await settle(element);
    expect(text(find(element, ".filter"))).toContain("Showing 2026-12-01");
  });

  it("drops the day filter when a reload moves the day out of the plan", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);
    find(find(element, "tk-week"), ".strip button[data-day='2026-11-26']").click();
    await settle(element);
    expect(findAll(element, ".filter")).toHaveLength(1);

    vi.setSystemTime(new Date(2026, 10, 27, 10));
    find(element, "ha-icon-button.add").click();
    await settle(element);
    save(element, "tk-dialog tk-form.add", { date: "2026-11-30", slot: "task", text: "Trim" });
    await settle(element);

    expect(findAll(element, ".filter")).toEqual([]);
    expect((find(element, "tk-week") as unknown as TkWeek).picked).toBeUndefined();
  });

  it("shows only the day tapped in the strip, until it is tapped again or Show all", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);
    const week = find(element, "tk-week");
    const pick = async (day: string): Promise<void> => {
      week.dispatchEvent(new CustomEvent("tk-pick-day", { detail: day }));
      await settle(element);
    };

    await pick("2026-11-27");
    expect(findAll(element, "h3").map((heading) => heading.textContent)).toEqual(["2026-11-27"]);
    expect((week as unknown as TkWeek).picked).toBe("2026-11-27");
    expect(text(find(element, ".filter"))).toContain("Showing 2026-11-27");

    await pick("2026-11-27");
    expect(findAll(element, "h3")).toHaveLength(3);

    await pick("2026-11-30");
    expect(findAll(element, "h3")).toEqual([]);
    expect(text(element)).toContain("No tasks on 2026-11-30");
    find(element, ".filter button").click();
    await settle(element);
    expect(findAll(element, "h3")).toHaveLength(3);
    expect(findAll(element, ".filter")).toEqual([]);
  });

  it("adds a task in its own dialog, which closes after the save", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    expect(findAll(element, "tk-form")).toEqual([]);

    find(element, "ha-icon-button.add").click();
    await settle(element);
    expect(find(element, "tk-dialog.add").getAttribute("heading")).toBe("Add a task");

    save(element, "tk-dialog tk-form.add", { text: "Trim", date: "2026-11-28" });
    await settle(element);
    expect(conn.last("add_task").args).toEqual({ text: "Trim", date: "2026-11-28" });
    expect(findAll(element, "tk-dialog")).toEqual([]);
  });

  it("keeps the add dialog open with nothing to add, and shows errors in it", async () => {
    const conn = connection().fail("add_task", "invalid_input", "No date");
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);
    find(element, "ha-icon-button.add").click();
    await settle(element);

    save(element, "tk-form.add", {});
    await settle(element);
    expect(conn.types()).not.toContain("tankkeeper/add_task");

    save(element, "tk-form.add", { text: "Trim" });
    await settle(element);
    const form = find(element, "tk-dialog tk-form.add") as unknown as { error: string };
    expect(form.error).toBe("No date");
    expect(findAll(element, "section > p.error")).toEqual([]);
  });

  it("edits a task in its own dialog, and removes it", async () => {
    const conn = connection();
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(conn) });
    await settle(element);

    find(element, "li[data-task=t1] ha-icon-button.edit").click();
    await settle(element);
    const form = find(element, "tk-dialog.edit tk-form") as unknown as { values: { id: string } };
    expect(form.values.id).toBe("t1");
    save(element, "tk-dialog.edit tk-form", { state: "skip" });
    await settle(element);
    expect(conn.last("update_task").args).toEqual({ task_id: "t1", state: "skip" });
    expect(findAll(element, "tk-dialog")).toEqual([]);

    find(element, "li[data-task=t1] ha-icon-button.remove").click();
    await settle(element);
    expect(conn.last("remove_task").args).toEqual({ task_id: "t1" });
  });

  it("opens and closes a task's history from its icon button", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);
    expect(findAll(element, "li[data-task=t1] tk-history")).toEqual([]);

    find(element, "li[data-task=t1] ha-icon-button.history").click();
    await settle(element);
    const history = find(element, "li[data-task=t1] tk-history") as unknown as {
      collection: string;
      recordId: string;
    };
    expect([history.collection, history.recordId]).toEqual(["tasks", "t1"]);

    find(element, "li[data-task=t1] ha-icon-button.history").click();
    await settle(element);
    expect(findAll(element, "li[data-task=t1] tk-history")).toEqual([]);
  });

  it("shows the reminders read-only, with their history and no cog", async () => {
    const element = mount<TkPlan>("tk-plan", { api: new TankkeeperApi(connection()) });
    await settle(element);

    const card = find(element, "#reminders");
    expect(text(card)).toContain("Notify services for reminders notify.phone");
    expect(text(card)).toContain("Notify services for status alerts Not set");
    expect(text(card)).toContain("Task reminder time 09:00");
    expect(findAll(card, "tk-form")).toEqual([]);
    expect(findAll(card, "ha-icon-button.settings")).toEqual([]);
    find(card, "ha-icon-button.history").click();
    await settle(element);
    const history = find(card, "tk-history") as unknown as { collection: string; recordId: string };
    expect([history.collection, history.recordId]).toEqual(["settings", "reminders"]);
  });
});
