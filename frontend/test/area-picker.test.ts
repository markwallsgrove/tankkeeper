import { describe, expect, it } from "vitest";
import { ASK, CANCEL, boxBetween, type AskDetail, type TkAreaPicker } from "../src/area-picker";
import "../src/area-picker";
import { find, mount, settle, text } from "./fake";

async function picker(disabled = false): Promise<TkAreaPicker> {
  const element = mount<TkAreaPicker>("tk-area-picker", {
    src: "/api/tankkeeper/photos/c2?authSig=x",
    alt: "The tank",
    disabled,
  });
  await settle(element);
  find(element, ".frame").getBoundingClientRect = () => new DOMRect(10, 20, 400, 200);
  return element;
}

function pointer(element: TkAreaPicker, type: string, x: number, y: number): void {
  find(element, ".frame").dispatchEvent(
    new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, bubbles: true }),
  );
}

async function drag(element: TkAreaPicker, from: [number, number], to: [number, number]) {
  pointer(element, "pointerdown", ...from);
  pointer(element, "pointermove", (from[0] + to[0]) / 2, (from[1] + to[1]) / 2);
  pointer(element, "pointerup", ...to);
  await settle(element);
}

function asked(): AskDetail[] {
  const seen: AskDetail[] = [];
  document.body.addEventListener(ASK, (event) => {
    seen.push((event as CustomEvent<AskDetail>).detail);
  });
  return seen;
}

function ask(element: TkAreaPicker): HTMLButtonElement {
  return find(element, "button.ask") as HTMLButtonElement;
}

describe("boxBetween", () => {
  it("gives the box between two corners in any order", () => {
    expect(boxBetween({ x: 0.75, y: 0.5 }, { x: 0.25, y: 0.1 })).toEqual({
      x: 0.25,
      y: 0.1,
      width: 0.5,
      height: 0.4,
    });
  });

  it("keeps the box inside the photo", () => {
    expect(boxBetween({ x: -0.2, y: 0.5 }, { x: 1.4, y: 1.2 })).toEqual({
      x: 0,
      y: 0.5,
      width: 1,
      height: 0.5,
    });
  });
});

describe("tk-area-picker", () => {
  it("shows the photo and asks for nothing until a box is drawn", async () => {
    const element = await picker();

    expect(find(element, "img").getAttribute("src")).toBe("/api/tankkeeper/photos/c2?authSig=x");
    expect(element.shadowRoot?.querySelector(".box")).toBeNull();
    expect(ask(element).disabled).toBe(true);
    expect(text(element)).toContain("Drag over the part of the photo to look at closely.");
  });

  it("draws the dragged box and asks Claude about it with the question", async () => {
    const element = await picker();
    const seen = asked();

    await drag(element, [110, 70], [310, 170]);
    const box = find(element, ".box");
    expect([box.style.left, box.style.top, box.style.width, box.style.height]).toEqual([
      "25%",
      "25%",
      "50%",
      "50%",
    ]);
    const input = find(element, "input.question") as HTMLInputElement;
    input.value = "  Is this white spot?  ";
    input.dispatchEvent(new Event("input"));
    await settle(element);
    ask(element).click();

    expect(seen).toEqual([
      { x: 0.25, y: 0.25, width: 0.5, height: 0.5, question: "Is this white spot?" },
    ]);
  });

  it("asks without a question when none is typed", async () => {
    const element = await picker();
    const seen = asked();

    await drag(element, [10, 20], [210, 120]);
    ask(element).click();

    expect(seen).toEqual([{ x: 0, y: 0, width: 0.5, height: 0.5 }]);
  });

  it("treats a click as no box", async () => {
    const element = await picker();

    await drag(element, [110, 70], [111, 70]);

    expect(element.shadowRoot?.querySelector(".box")).toBeNull();
    expect(ask(element).disabled).toBe(true);
  });

  it("ignores moves that are not a drag, and a cancelled drag", async () => {
    const element = await picker();

    pointer(element, "pointermove", 200, 100);
    pointer(element, "pointerup", 200, 100);
    pointer(element, "pointerdown", 110, 70);
    pointer(element, "pointercancel", 110, 70);
    pointer(element, "pointermove", 310, 170);
    await settle(element);

    expect(element.shadowRoot?.querySelector(".box")).toBeNull();
  });

  it("draws nothing while disabled", async () => {
    const element = await picker(true);

    await drag(element, [110, 70], [310, 170]);

    expect(element.shadowRoot?.querySelector(".box")).toBeNull();
    expect(ask(element).disabled).toBe(true);
  });

  it("tells the view when the owner cancels", async () => {
    const element = await picker();
    let cancelled = 0;
    document.body.addEventListener(CANCEL, () => (cancelled += 1));

    find(element, "button.cancel").click();

    expect(cancelled).toBe(1);
  });
});
