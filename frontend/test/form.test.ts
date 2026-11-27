import { describe, expect, it } from "vitest";
import "../src/tk-form";
import type { TkForm } from "../src/tk-form";
import type { Field, Values } from "../src/types";
import { find, findAll, mount, settle, text } from "./fake";

const fields: Field[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "count", label: "Count", type: "number" },
  { name: "kind", label: "Kind", type: "select", options: ["question", "assumption"] },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "links", label: "Links", type: "list" },
  { name: "added", label: "Added", type: "date" },
  { name: "off", label: "Off", type: "time" },
  { name: "on", label: "On", type: "checkbox" },
];

async function form(values: Values = {}): Promise<{ element: TkForm; saved: Values[] }> {
  const element = mount<TkForm>("tk-form", { fields, values });
  const saved: Values[] = [];
  element.addEventListener("tk-save", (event) => saved.push((event as CustomEvent<Values>).detail));
  await settle(element);
  return { element, saved };
}

function set(element: TkForm, name: string, value: string): void {
  const input = find(element, `[name=${name}]`) as HTMLInputElement;
  input.value = value;
}

describe("tk-form", () => {
  it("sends only the fields that changed", async () => {
    const { element, saved } = await form({
      name: "Fern",
      count: 2,
      kind: "question",
      links: ["a"],
    });
    expect((find(element, "[name=count]") as HTMLInputElement).value).toBe("2");
    expect((find(element, "[name=links]") as HTMLTextAreaElement).value).toBe("a");

    set(element, "count", "3");
    set(element, "links", "a\nb\n");
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([{ count: 3, links: ["a", "b"] }]);
  });

  it("sends the filled-in fields of a new record and leaves empty ones out", async () => {
    const { element, saved } = await form();

    set(element, "name", "Java fern");
    set(element, "kind", "assumption");
    set(element, "added", "2026-11-20");
    set(element, "off", "21:30");
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([
      { name: "Java fern", kind: "assumption", added: "2026-11-20", off: "21:30" },
    ]);
  });

  it("clears a text field that had a value", async () => {
    const { element, saved } = await form({ name: "Fern", notes: "Old" });

    set(element, "notes", "");
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([{ notes: "" }]);
  });

  it("leaves out an empty field whose value was null", async () => {
    const { element, saved } = await form({ name: "Fern", notes: null, count: null });

    set(element, "name", "Java fern");
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([{ name: "Java fern" }]);
  });

  it("clears a number field that had a value", async () => {
    const { element, saved } = await form({ name: "Fern", count: 2 });

    set(element, "count", "");
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([{ count: null }]);
  });

  it("marks required selects and text areas, and steps only numbers", async () => {
    const element = mount<TkForm>("tk-form", {
      fields: [
        { name: "kind", label: "Kind", type: "select", options: ["a"], required: true },
        { name: "notes", label: "Notes", type: "textarea", required: true },
        { name: "off", label: "Off", type: "time" },
        { name: "count", label: "Count", type: "number" },
      ],
    });
    await settle(element);

    expect((find(element, "[name=kind]") as HTMLSelectElement).required).toBe(true);
    expect((find(element, "[name=notes]") as HTMLTextAreaElement).required).toBe(true);
    expect(find(element, "[name=off]").hasAttribute("step")).toBe(false);
    expect(find(element, "[name=count]").getAttribute("step")).toBe("any");
  });

  it("shows an error and a busy state", async () => {
    const { element } = await form();
    element.error = "No such note";
    element.busy = true;
    await settle(element);

    expect(find(element, ".error").textContent).toBe("No such note");
    expect((find(element, "button[type=submit]") as HTMLButtonElement).disabled).toBe(true);
  });

  it("sends a checkbox only when it changed", async () => {
    const { element, saved } = await form({ name: "Fern", on: true });
    const box = find(element, "[name=on]") as HTMLInputElement;
    expect(box.checked).toBe(true);

    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));
    box.checked = false;
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([{}, { on: false }]);
  });

  it("sends the weekdays ticked as a list, only when they changed", async () => {
    const element = mount<TkForm>("tk-form", {
      fields: [{ name: "weekdays", label: "Repeat on", type: "weekdays" }],
      values: { weekdays: ["mon", "thu"] },
    });
    const saved: Values[] = [];
    element.addEventListener("tk-save", (event) =>
      saved.push((event as CustomEvent<Values>).detail),
    );
    await settle(element);
    const boxes = findAll(element, "input[name=weekdays]") as HTMLInputElement[];
    expect(boxes.map((box) => box.value)).toEqual([
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
      "sun",
    ]);
    expect(boxes.filter((box) => box.checked).map((box) => box.value)).toEqual(["mon", "thu"]);
    expect(text(element)).toContain("Mon");

    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));
    const [monday, , , , , saturday] = boxes;
    if (monday === undefined || saturday === undefined) throw new Error("No weekday boxes");
    monday.checked = false;
    saturday.checked = true;
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));
    boxes.forEach((box) => {
      box.checked = false;
    });
    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([{}, { weekdays: ["thu", "sat"] }, { weekdays: [] }]);
  });

  it("leaves out weekdays left empty on a new record", async () => {
    const element = mount<TkForm>("tk-form", {
      fields: [{ name: "weekdays", label: "Repeat on", type: "weekdays" }],
    });
    const saved: Values[] = [];
    element.addEventListener("tk-save", (event) =>
      saved.push((event as CustomEvent<Values>).detail),
    );
    await settle(element);

    find(element, "form").dispatchEvent(new Event("submit", { cancelable: true }));

    expect(saved).toEqual([{}]);
  });
});
