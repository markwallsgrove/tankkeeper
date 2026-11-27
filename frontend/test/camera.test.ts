import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import { CHAT } from "../src/base";
import "../src/views/camera";
import type { TkCamera } from "../src/views/camera";
import type { CameraInfo, PhotoCheck } from "../src/types";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

const issue: PhotoCheck = {
  id: "c2",
  time: "2026-11-26T14:00:00+00:00",
  reason: "daily",
  content_type: "image/jpeg",
  asked: true,
  summary: "Green film on the front glass.",
  issue: true,
  suggestion: "Cut the photoperiod to 6 hours.",
  seen: { water: "Clear", algae: "Green spot algae on the glass" },
  note: null,
  state: "open",
  proposal_ids: ["p1"],
  photo_url: "/api/tankkeeper/photos/c2?authSig=x",
  embed: "![The tank](tankkeeper:photo/c2)",
};

const quiet: PhotoCheck = {
  ...issue,
  id: "c1",
  time: "2026-11-25T14:00:00+00:00",
  reason: "manual",
  summary: null,
  issue: false,
  suggestion: null,
  seen: {},
  note: "No comment: the daily cap of 5 is reached.",
  state: null,
  proposal_ids: [],
  photo_url: null,
  embed: null,
};

const info: CameraInfo = {
  camera: "camera.tapo_c100",
  check_time: "14:00",
  after_test: true,
  alerts: true,
  keep_days: 30,
  latest: issue,
  open: [issue, { ...issue, id: "c3", reason: "test", proposal_ids: ["p2", "p3"] }],
};

function proposal(id: string, summary: string): object {
  return {
    proposal_id: id,
    state: "pending",
    created: "2026-11-26T14:00:00+00:00",
    source: "camera",
    summary,
    reason: "Green spots",
    evidence: null,
    changes: [
      {
        collection: "tasks",
        record_id: id,
        before: null,
        after: { text: summary, date: "2026-11-28" },
      },
    ],
    batch: false,
  };
}

const pending = [
  proposal("p1", "Add the task Wipe the glass"),
  proposal("p2", "Add the task Trim plants"),
  proposal("p3", "Add the task Water change"),
  proposal("p9", "Add the product Excel"),
];

function connection(answer: CameraInfo = info): FakeConnection {
  return new FakeConnection()
    .on("get_camera", answer)
    .on("list_proposals", { proposals: pending })
    .on("get_history", { history: [] })
    .on("check_now", issue)
    .on("list_photos", { photos: [issue, quiet] })
    .on("dismiss_finding", { id: "c2" })
    .on("accept_finding", { id: "c2" })
    .on("reject_finding", { id: "c2" });
}

async function view(conn: FakeConnection): Promise<TkCamera> {
  const element = mount<TkCamera>("tk-camera", { api: new TankkeeperApi(conn) });
  await settle(element);
  return element;
}

function count(conn: FakeConnection, type: string): number {
  return conn.types().filter((sent) => sent === `tankkeeper/${type}`).length;
}

describe("tk-camera", () => {
  it("shows the latest photo and what Claude saw", async () => {
    const element = await view(connection());

    const latest = find(element, ".latest");
    expect(find(latest, "img").getAttribute("src")).toBe("/api/tankkeeper/photos/c2?authSig=x");
    expect(text(latest)).toContain("Daily");
    expect(text(latest)).toContain("Green film on the front glass.");
    expect(text(latest)).toContain("Suggested: Cut the photoperiod to 6 hours.");
    expect(text(latest)).toContain("Water Clear");
    expect(text(latest)).toContain("Algae Green spot algae on the glass");
  });

  it("says when there is no photo yet", async () => {
    const element = await view(connection({ ...info, latest: null, open: [] }));

    expect(text(element)).toContain("No photo yet.");
    expect(findAll(element, "#seen")).toEqual([]);
  });

  it("asks for a camera when none is set", async () => {
    const element = await view(connection({ ...info, camera: null, latest: null, open: [] }));

    expect(text(element)).toContain("No camera is set.");
    expect(findAll(element, "button.check")).toEqual([]);
    expect(findAll(element, "ha-icon-button.settings")).toEqual([]);
  });

  it("checks now and tells the other views", async () => {
    const conn = connection();
    const element = await view(conn);
    let changed = 0;
    document.body.addEventListener("tk-changed", () => (changed += 1));

    find(element, "button.check").click();
    await settle(element);

    expect(count(conn, "check_now")).toBe(1);
    expect(count(conn, "get_camera")).toBe(2);
    expect(changed).toBe(1);
  });

  it("shows why a check failed", async () => {
    const conn = connection().fail("check_now", "lights_off", "The lights are off.");
    const element = await view(conn);

    find(element, "button.check").click();
    await settle(element);

    expect(find(element, ".error").textContent).toBe("The lights are off.");
  });

  it("shows why the camera could not load", async () => {
    const element = await view(connection().fail("get_camera", "unknown", "Not loaded"));

    expect(find(element, ".error").textContent).toBe("Not loaded");
  });

  it("lists the photos kept", async () => {
    const conn = connection();
    const element = await view(conn);

    find(element, "button.photos").click();
    await settle(element);

    expect(conn.last("list_photos").args).toEqual({ limit: 20 });
    const items = findAll(element, "li.photo-check").map((item) =>
      item.textContent.replace(/\s+/g, " ").trim(),
    );
    expect(items.length).toBe(2);
    expect(items[0]).toContain("Green film on the front glass.");
    expect(items[1]).toContain("Check now");
    expect(items[1]).toContain("No comment: the daily cap of 5 is reached.");
    expect(findAll(element, "li.photo-check")[1]?.querySelector("img")).toBeNull();
  });

  it("says when no photos are kept", async () => {
    const conn = connection().on("list_photos", { photos: [] });
    const element = await view(conn);

    find(element, "button.photos").click();
    await settle(element);

    expect(text(element)).toContain("No photos yet.");
  });

  it("forgets the photos when the camera is removed", async () => {
    const conn = connection();
    const element = await view(conn);
    find(element, "button.photos").click();
    await settle(element);

    conn.on("get_camera", { ...info, camera: null, latest: null, open: [] });
    element.stamp = 1;
    await settle(element);
    conn.on("get_camera", info);
    element.stamp = 2;
    await settle(element);

    expect(findAll(element, "li.photo-check")).toEqual([]);
    expect(findAll(element, "button.photos").length).toBe(1);
  });

  it("shows the settings read-only, with their history and no cog", async () => {
    const element = await view(connection());

    const card = find(element, "#camera");
    expect(text(card)).toContain("Camera entity, such as a Tapo C100 camera.tapo_c100");
    expect(text(card)).toContain("Alert me about issues");
    expect(findAll(card, "tk-form")).toEqual([]);
    expect(findAll(card, "ha-icon-button.settings")).toEqual([]);
    const history = find(card, "tk-history") as unknown as { collection: string; recordId: string };
    expect([history.collection, history.recordId]).toEqual(["settings", "camera"]);
  });

  it("loads again when the stamp changes", async () => {
    const conn = connection();
    const element = await view(conn);

    element.stamp = 5;
    await settle(element);

    expect(count(conn, "get_camera")).toBe(2);
  });

  it("lists what the camera saw and the plan changes Accept applies", async () => {
    const conn = connection();
    const element = await view(conn);

    expect(conn.last("list_proposals").args).toEqual({ state: "pending" });
    const items = findAll(element, "#seen li.issue");
    expect(items.length).toBe(2);
    const proposals = (item: Element | undefined): string[] =>
      [...(item?.querySelectorAll(".proposal strong") ?? [])].map((found) => found.textContent);
    expect(proposals(items[0])).toEqual(["Add the task Wipe the glass"]);
    expect(items[0]?.textContent).toContain("Accept applies:");
    expect(items[1]?.textContent).toContain("After a test");
    expect(proposals(items[1])).toEqual(["Add the task Trim plants", "Add the task Water change"]);
  });

  it("says nothing about plan changes when none wait", async () => {
    const element = await view(
      connection({ ...info, open: [{ ...issue, proposal_ids: ["gone"] }] }),
    );

    expect(text(find(element, "#seen"))).not.toContain("Accept applies");
  });

  it("dismisses, rejects and accepts an issue", async () => {
    const conn = connection();
    const element = await view(conn);
    const first = '#seen li.issue[data-check="c2"]';

    find(element, `${first} button.dismiss`).click();
    await settle(element);
    expect(conn.last("dismiss_finding").args).toEqual({ check_id: "c2" });

    find(element, `${first} button.reject`).click();
    await settle(element);
    expect(conn.last("reject_finding")).toEqual({
      type: "tankkeeper/reject_finding",
      check_id: "c2",
    });

    find(element, `${first} button.accept`).click();
    await settle(element);
    expect(conn.last("accept_finding")).toEqual({
      type: "tankkeeper/accept_finding",
      check_id: "c2",
    });
    expect(count(conn, "get_camera")).toBe(4);
  });

  it("opens the chat to discuss an issue", async () => {
    const element = await view(connection());
    const starts: unknown[] = [];
    element.addEventListener(CHAT, (event) => starts.push((event as CustomEvent).detail));

    find(element, "#seen button.discuss").click();

    expect(starts).toEqual([{ kind: "photo", id: "c2" }]);
  });
});
