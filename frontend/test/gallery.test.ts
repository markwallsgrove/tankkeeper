import { afterEach, describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import { GALLERY } from "../src/base";
import { BACK } from "../src/buttons";
import "../src/views/gallery";
import type { TkGallery } from "../src/views/gallery";
import type { TkDialog } from "../src/tk-dialog";
import type { PhotoCheck } from "../src/types";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const issue: PhotoCheck = {
  id: "c3",
  time: "2026-11-27T14:00:00+00:00",
  reason: "daily",
  content_type: "image/jpeg",
  asked: true,
  summary: "Green film on the front glass.",
  issue: true,
  suggestion: "Cut the photoperiod to 6 hours.",
  seen: {
    water: "Clear",
    algae: "Green spot algae on the glass",
    plants: "Healthy",
    level: "Full",
  },
  note: null,
  state: "open",
  proposal_ids: ["p1"],
  photo_url: "/api/tankkeeper/photos/c3?authSig=x",
  embed: "![The tank](tankkeeper:photo/c3)",
};

const clear: PhotoCheck = {
  ...issue,
  id: "c2",
  time: "2026-11-26T14:00:00+00:00",
  reason: "manual",
  summary: "The tank looks healthy.",
  issue: false,
  suggestion: null,
  seen: { water: "Clear" },
  state: null,
  proposal_ids: [],
  photo_url: null,
  embed: null,
};

const noteOnly: PhotoCheck = {
  ...clear,
  id: "c1",
  time: "2026-11-25T14:00:00+00:00",
  reason: "test",
  asked: false,
  summary: null,
  seen: {},
  note: "No comment: the daily cap of 5 is reached.",
  photo_url: "/api/tankkeeper/photos/c1?authSig=y",
};

function connection(photos: PhotoCheck[] = [issue, clear, noteOnly]): FakeConnection {
  return new FakeConnection().on("list_photos", { photos });
}

async function view(conn: FakeConnection): Promise<TkGallery> {
  const element = mount<TkGallery>("tk-gallery", { api: new TankkeeperApi(conn) });
  await settle(element);
  return element;
}

function card(element: TkGallery, id: string): HTMLElement {
  return find(element, `li.photo-check[data-check=${id}]`);
}

function large(element: TkGallery): TkDialog {
  return find(element, "tk-dialog.large") as TkDialog;
}

async function open(element: TkGallery, id: string): Promise<TkDialog> {
  find(card(element, id), "button.open").click();
  await settle(element);
  const dialog = large(element);
  await dialog.updateComplete;
  return dialog;
}

describe("tk-gallery", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("lists every photo check kept, newest first, as the backend sends them", async () => {
    const conn = connection();
    const element = await view(conn);

    expect(conn.last("list_photos").args).toEqual({ limit: 20 });
    expect(
      findAll(element, "li.photo-check").map((item) => item.getAttribute("data-check")),
    ).toEqual(["c3", "c2", "c1"]);
  });

  it("shows each photo with its time, reason and what Claude said", async () => {
    const element = await view(connection());

    const first = card(element, "c3");
    expect(find(first, "img.photo").getAttribute("src")).toBe(
      "/api/tankkeeper/photos/c3?authSig=x",
    );
    expect(text(first)).toContain("Daily");
    expect(find(first, ".verdict").textContent).toBe("Issue found");
    expect(text(first)).toContain("Green film on the front glass.");
    expect(text(first)).toContain("Suggested: Cut the photoperiod to 6 hours.");
    expect(text(first)).toContain("Water Clear");
    expect(text(first)).toContain("Algae Green spot algae on the glass");
    expect(text(first)).toContain("Plants Healthy");
    expect(text(first)).toContain("Water level Full");
    expect(find(card(element, "c2"), ".verdict").textContent).toBe("No issue found");
  });

  it("shows a pruned photo's text without the image", async () => {
    const element = await view(connection());

    const pruned = card(element, "c2");
    expect(pruned.querySelector("img")).toBeNull();
    expect(find(pruned, ".pruned").textContent).toBe("The photo is no longer kept.");
    expect(text(pruned)).toContain("Check now");
    expect(text(pruned)).toContain("The tank looks healthy.");
  });

  it("shows the note of a check Claude did not answer, with no verdict", async () => {
    const element = await view(connection());

    const quiet = card(element, "c1");
    expect(text(quiet)).toContain("After a test");
    expect(find(quiet, ".note").textContent).toBe("No comment: the daily cap of 5 is reached.");
    expect(quiet.querySelector(".verdict")).toBeNull();
  });

  it("opens a photo large with all of its text, and closes it", async () => {
    const element = await view(connection());
    expect(findAll(element, "tk-dialog")).toEqual([]);
    expect(find(card(element, "c3"), "button.open").getAttribute("aria-label")).toContain(
      "Open the photo check of",
    );

    const dialog = await open(element, "c3");

    expect(dialog.wide).toBe(true);
    expect(dialog.heading).toContain("Daily");
    expect((find(dialog, "dialog") as HTMLDialogElement).open).toBe(true);
    const body = find(element, "div.large");
    expect(find(body, "img.photo").getAttribute("src")).toBe("/api/tankkeeper/photos/c3?authSig=x");
    expect(text(body)).toContain("Issue found");
    expect(text(body)).toContain("Suggested: Cut the photoperiod to 6 hours.");
    expect(text(body)).toContain("Water level Full");

    find(dialog, "ha-icon-button.close").click();
    await settle(element);

    expect(findAll(element, "tk-dialog")).toEqual([]);
  });

  it("opens a pruned photo large with its text", async () => {
    const element = await view(connection());

    await open(element, "c2");

    const body = find(element, "div.large");
    expect(body.querySelector("img")).toBeNull();
    expect(find(body, ".pruned-note").textContent).toBe("The photo is no longer kept.");
    expect(text(body)).toContain("The tank looks healthy.");
  });

  it("opens a check with only a note large", async () => {
    const element = await view(connection());

    await open(element, "c1");

    const body = find(element, "div.large");
    expect(find(body, ".note").textContent).toBe("No comment: the daily cap of 5 is reached.");
    expect(body.querySelector(".verdict")).toBeNull();
  });

  it("shows 20 photos at first and 20 more on Show more, with fresh links", async () => {
    const many = Array.from({ length: 45 }, (_, index) => ({ ...issue, id: `m${String(index)}` }));
    const conn = new FakeConnection().on("list_photos", (message) => ({
      photos: many.slice(0, (message.args as { limit: number }).limit),
    }));
    const element = await view(conn);
    expect(findAll(element, "li.photo-check").length).toBe(20);

    find(element, "button.more").click();
    await settle(element);

    expect(conn.last("list_photos").args).toEqual({ limit: 40 });
    expect(findAll(element, "li.photo-check").length).toBe(40);

    find(element, "button.more").click();
    await settle(element);

    expect(findAll(element, "li.photo-check").length).toBe(45);
    expect(findAll(element, "button.more")).toEqual([]);
  });

  it("offers no Show more when every photo is shown", async () => {
    const element = await view(connection());

    expect(findAll(element, "button.more")).toEqual([]);
  });

  it("stops at the most photo checks TankKeeper keeps", async () => {
    const many = Array.from({ length: 200 }, (_, index) => ({ ...issue, id: `m${String(index)}` }));
    const conn = new FakeConnection().on("list_photos", (message) => ({
      photos: many.slice(0, (message.args as { limit: number }).limit),
    }));
    const element = await view(conn);
    for (let page = 1; page < 10; page += 1) {
      find(element, "button.more").click();
      await settle(element);
    }

    expect(conn.last("list_photos").args).toEqual({ limit: 200 });
    expect(findAll(element, "button.more")).toEqual([]);
  });

  it("says when no photos are kept", async () => {
    const element = await view(connection([]));

    expect(text(element)).toContain("No photos yet.");
    expect(findAll(element, "li.photo-check")).toEqual([]);
  });

  it("shows why the photos could not load", async () => {
    const element = await view(
      new FakeConnection().fail("list_photos", "not_found", "No camera is set."),
    );

    expect(find(element, ".error").textContent).toBe("No camera is set.");
    expect(text(element)).not.toContain("No photos yet.");
  });

  it("goes back to the overview", async () => {
    const element = await view(connection());
    const opened: boolean[] = [];
    document.body.addEventListener(GALLERY, (event) => {
      opened.push((event as CustomEvent<boolean>).detail);
    });

    const back = find(element, "button.back");
    expect(back.querySelector("svg.icon path")?.getAttribute("d")).toBe(BACK);
    back.click();

    expect(opened).toEqual([false]);
  });
});
