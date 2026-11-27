import { describe, expect, it } from "vitest";
import "../src/tk-week";
import type { TkWeek } from "../src/tk-week";
import { kindOf, mondayOf } from "../src/tk-week";
import type { Task } from "../src/types";
import { find, findAll, mount, settle, text } from "./fake";

function task(id: string, date: string, more: Partial<Task> = {}): Task {
  return {
    id,
    date,
    slot: "task",
    time: "09:00",
    text: "Trim plants",
    state: "open",
    note: null,
    series_id: null,
    ...more,
  };
}

const testWater = task("t1", "2026-11-26", { text: "Test water" });
const dose = task("t2", "2026-11-26", { slot: "dose", time: "12:00", text: "Easy Green 2 ml" });
const waterChange = task("s1@2026-11-28", "2026-11-28", { text: "Water change", series_id: "s1" });
const tasks: Task[] = [
  testWater,
  dose,
  waterChange,
  task("t3", "2026-11-29", { state: "complete" }),
  task("t4", "2026-12-03"),
];

async function week(props: Partial<TkWeek> = {}): Promise<TkWeek> {
  const element = mount<TkWeek>("tk-week", {
    tasks,
    start: "2026-11-26",
    end: "2026-12-23",
    today: "2026-11-26",
    ...props,
  });
  await settle(element);
  return element;
}

function days(element: TkWeek, selector: string): (string | null)[] {
  return findAll(element, selector).map((cell) => cell.getAttribute("data-day"));
}

function picked(element: TkWeek, type: string): string[] {
  const seen: string[] = [];
  element.addEventListener(type, (event) => seen.push((event as CustomEvent<string>).detail));
  return seen;
}

describe("mondayOf and kindOf", () => {
  it("finds the Monday on or before a day", () => {
    expect(mondayOf("2026-11-26")).toBe("2026-11-23");
    expect(mondayOf("2026-11-23")).toBe("2026-11-23");
    expect(mondayOf("2026-11-29")).toBe("2026-11-23");
  });

  it("calls a task with test in its text a test, and the rest by slot", () => {
    expect(kindOf(testWater)).toBe("test");
    expect(kindOf(dose)).toBe("dose");
    expect(kindOf(waterChange)).toBe("task");
    expect(kindOf(task("x", "2026-11-26", { text: "Contest" }))).toBe("task");
    expect(kindOf(task("x", "2026-11-26", { slot: "dose", text: "Dose after the test" }))).toBe(
      "test",
    );
  });
});

describe("tk-week", () => {
  it("shows the week with today, each task as a chip coloured by kind", async () => {
    const element = await week();

    expect(text(find(element, ".label"))).toBe("2026-11-23 to 2026-11-29");
    expect(days(element, ".grid .day")).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
    expect(days(element, ".grid .day.today")).toEqual(["2026-11-26"]);
    expect(days(element, ".grid .day.outside")).toEqual(["2026-11-23", "2026-11-24", "2026-11-25"]);
    expect(text(find(element, ".grid .day[data-day='2026-11-26'] .head"))).toBe("Thu 26");
    const chips = findAll(element, ".grid .chip");
    expect(chips.map((chip) => [chip.getAttribute("data-task"), chip.className])).toEqual([
      ["t1", "chip test"],
      ["t2", "chip dose"],
      ["s1@2026-11-28", "chip task"],
      ["t3", "chip task done"],
    ]);
    expect(findAll(element, ".chip ha-svg-icon.repeat").length).toBe(1);
    expect(findAll(find(element, ".chip[data-task='s1@2026-11-28']"), "ha-svg-icon")).toHaveLength(
      1,
    );
    expect(text(find(element, ".chip[data-task=t2]"))).toBe("Easy Green 2 ml");
  });

  it("names each chip's kind, repeat and done state, and today, for screen readers", async () => {
    const element = await week();

    expect(findAll(element, ".grid .chip").map((chip) => chip.getAttribute("aria-label"))).toEqual([
      "Test water, test",
      "Easy Green 2 ml, dose",
      "Water change, task, repeats",
      "Trim plants, task, done",
    ]);
    expect(days(element, ".grid .day[aria-current=date]")).toEqual(["2026-11-26"]);
  });

  it("keeps the shown week inside the window when the window moves", async () => {
    const element = await week();
    find(element, "button.next").click();
    await settle(element);

    element.start = "2026-12-08";
    element.end = "2027-01-04";
    await settle(element);
    expect(text(find(element, ".label"))).toBe("2026-12-07 to 2026-12-13");

    element.start = "2026-11-02";
    element.end = "2026-11-20";
    await settle(element);
    expect(text(find(element, ".label"))).toBe("2026-11-16 to 2026-11-22");
  });

  it("asks to show a task when its chip is clicked", async () => {
    const element = await week();
    const seen = picked(element, "tk-pick-task");

    find(element, ".chip[data-task=t2]").click();

    expect(seen).toEqual(["t2"]);
  });

  it("moves a week at a time inside the window", async () => {
    const element = await week();
    const prev = find(element, "button.prev") as HTMLButtonElement;
    const next = find(element, "button.next") as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);

    next.click();
    await settle(element);
    expect(text(find(element, ".label"))).toBe("2026-11-30 to 2026-12-06");
    expect(findAll(element, ".grid .chip").map((chip) => chip.getAttribute("data-task"))).toEqual([
      "t4",
    ]);
    expect(days(element, ".grid .day.today")).toEqual([]);
    expect(prev.disabled).toBe(false);

    next.click();
    await settle(element);
    next.click();
    await settle(element);
    expect(text(find(element, ".label"))).toBe("2026-12-14 to 2026-12-20");
    expect(days(element, ".grid .day.outside")).toEqual([]);
    expect(next.disabled).toBe(false);
    next.click();
    await settle(element);
    expect(text(find(element, ".label"))).toBe("2026-12-21 to 2026-12-27");
    expect(days(element, ".grid .day.outside")).toEqual([
      "2026-12-24",
      "2026-12-25",
      "2026-12-26",
      "2026-12-27",
    ]);
    expect(next.disabled).toBe(true);
    next.click();
    await settle(element);
    expect(text(find(element, ".label"))).toBe("2026-12-21 to 2026-12-27");

    prev.click();
    await settle(element);
    expect(text(find(element, ".label"))).toBe("2026-12-14 to 2026-12-20");
  });

  it("says which week it moved to", async () => {
    const element = await week();
    const seen = picked(element, "tk-week-change");

    find(element, "button.next").click();
    await settle(element);
    find(element, "button.prev").click();

    expect(seen).toEqual(["2026-11-30", "2026-11-23"]);
  });

  it("shows a strip of counts for narrow screens, where tapping a day picks it", async () => {
    const element = await week({ picked: "2026-11-28" });
    const seen = picked(element, "tk-pick-day");

    expect(
      findAll(element, ".strip .count").map((count) => [
        count.closest("button")?.getAttribute("data-day"),
        count.textContent,
      ]),
    ).toEqual([
      ["2026-11-23", ""],
      ["2026-11-24", ""],
      ["2026-11-25", ""],
      ["2026-11-26", "2"],
      ["2026-11-27", ""],
      ["2026-11-28", "1"],
      ["2026-11-29", "1"],
    ]);
    expect(days(element, ".strip button.today")).toEqual(["2026-11-26"]);
    expect(days(element, ".strip button.picked")).toEqual(["2026-11-28"]);
    expect(days(element, ".strip button[aria-current=date]")).toEqual(["2026-11-26"]);
    expect(days(element, ".strip button[aria-pressed=true]")).toEqual(["2026-11-28"]);
    expect(days(element, ".strip button[aria-pressed=false]")).toHaveLength(6);
    expect(days(element, ".strip button[disabled]")).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
    ]);
    expect(find(element, ".strip button[data-day='2026-11-26']").getAttribute("aria-label")).toBe(
      "Thu 26: 2 tasks",
    );
    expect(find(element, ".strip button[data-day='2026-11-28']").getAttribute("aria-label")).toBe(
      "Sat 28: 1 task",
    );

    find(element, ".strip button[data-day='2026-11-26']").click();

    expect(seen).toEqual(["2026-11-26"]);
  });

  it("starts on the window's first week when today is outside it", async () => {
    const element = await week({ today: "2026-10-01" });

    expect(text(find(element, ".label"))).toBe("2026-11-23 to 2026-11-29");
    expect(days(element, ".grid .day.today")).toEqual([]);
  });
});
