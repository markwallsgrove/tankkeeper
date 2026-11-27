import { render } from "lit";
import { describe, expect, it } from "vitest";
import { PENCIL, PLUS, icon, iconButton, textButton } from "../src/buttons";

function host(): HTMLElement {
  return document.createElement("div");
}

function one(into: HTMLElement, selector: string): HTMLElement {
  const element = into.querySelector<HTMLElement>(selector);
  if (element === null) throw new Error(`${selector} is missing`);
  return element;
}

describe("iconButton", () => {
  it("is an icon button named by its label, which is also its tooltip", () => {
    const into = host();
    const clicks: string[] = [];

    render(
      iconButton({
        icon: PENCIL,
        label: "Edit",
        className: "edit",
        onClick: () => clicks.push("edit"),
      }),
      into,
    );
    const button = one(into, "ha-icon-button.edit") as HTMLElement & { path: string };

    expect(button.getAttribute("label")).toBe("Edit");
    expect(button.path).toBe(PENCIL);
    expect(button.hasAttribute("disabled")).toBe(false);
    button.click();
    expect(clicks).toEqual(["edit"]);
  });

  it("does nothing while it is disabled", () => {
    const into = host();
    const clicks: string[] = [];

    render(
      iconButton({
        icon: PENCIL,
        label: "Edit",
        className: "edit",
        disabled: true,
        onClick: () => clicks.push("edit"),
      }),
      into,
    );
    const button = into.querySelector<HTMLElement>("ha-icon-button.edit");
    button?.click();

    expect(button?.hasAttribute("disabled")).toBe(true);
    expect(clicks).toEqual([]);
  });
});

describe("textButton", () => {
  it("shows its icon before its words", () => {
    const into = host();
    const clicks: string[] = [];

    render(
      textButton({ icon: PLUS, label: "Add", className: "add", onClick: () => clicks.push("add") }),
      into,
    );
    const button = one(into, "button.add") as HTMLButtonElement;

    expect(button.type).toBe("button");
    expect(button.textContent.trim()).toBe("Add");
    expect(button.querySelector("svg path")?.getAttribute("d")).toBe(PLUS);
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(button.classList.contains("primary")).toBe(false);
    expect(button.hasAttribute("aria-expanded")).toBe(false);
    button.click();
    expect(clicks).toEqual(["add"]);
  });

  it("can be primary, submit a form, or open and close another element", () => {
    const into = host();

    render(
      textButton({
        icon: PLUS,
        label: "Chats",
        className: "chats",
        primary: true,
        type: "submit",
        expanded: false,
        controls: "chat-list",
        disabled: true,
      }),
      into,
    );
    const button = one(into, "button.chats") as HTMLButtonElement;
    button.click();

    expect(button.classList.contains("primary")).toBe(true);
    expect(button.type).toBe("submit");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.getAttribute("aria-controls")).toBe("chat-list");
    expect(button.disabled).toBe(true);
  });
});

describe("icon", () => {
  it("draws the mdi path in the text colour", () => {
    const into = host();

    render(icon(PLUS), into);

    expect(into.querySelector("svg.icon")?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(into.querySelector("path")?.getAttribute("d")).toBe(PLUS);
  });
});
