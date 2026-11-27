import { afterEach, describe, expect, it } from "vitest";
import "../src/tk-dialog";
import type { TkDialog } from "../src/tk-dialog";
import { find, mount, settle, text } from "./fake";

describe("tk-dialog", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("opens with its heading and what is slotted in", async () => {
    const element = mount<TkDialog>("tk-dialog", { heading: "Record a dose" });
    element.append(document.createTextNode("The form"));
    await settle(element);

    const dialog = find(element, "dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(find(element, "#heading").textContent).toBe("Record a dose");
    expect(dialog.getAttribute("aria-labelledby")).toBe("heading");
    expect(text(element)).toContain("Record a dose");
    expect(element.textContent).toBe("The form");
  });

  it("closes from its close button and says so", async () => {
    const element = mount<TkDialog>("tk-dialog", { heading: "Add a task" });
    await settle(element);
    let closed = 0;
    document.body.addEventListener("tk-dialog-closed", () => (closed += 1));

    find(element, "ha-icon-button.close").click();

    expect((find(element, "dialog") as HTMLDialogElement).open).toBe(false);
    expect(closed).toBe(1);
  });
});
