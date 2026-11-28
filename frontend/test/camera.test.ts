import { describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import { ASK, CANCEL, type AskDetail } from "../src/area-picker";
import { CHAT, GALLERY } from "../src/base";
import {
  CAMERA,
  CHAT as CHAT_ICON,
  CHECK,
  CLOSE,
  NOT_A_PROBLEM,
  PHOTOS,
  SEARCH,
  THOROUGH,
} from "../src/buttons";
import "../src/views/camera";
import type { TkCamera } from "../src/views/camera";
import type { CameraInfo, PhotoCheck } from "../src/types";
import { FakeConnection, find, findAll, mount, settle, text } from "./fake";

function iconOf(button: Element): string | null | undefined {
  return button.querySelector("svg.icon path")?.getAttribute("d");
}

const issue: PhotoCheck = {
  id: "c2",
  time: "2026-11-26T14:00:00+00:00",
  reason: "daily",
  content_type: "image/jpeg",
  asked: true,
  summary: "Green film on the front glass.",
  issue: true,
  suggestion: "Cut the photoperiod to 6 hours.",
  seen: {
    water: "Clear",
    algae: "Green spot algae on the glass",
    fish: "One tetra has white spots",
  },
  note: null,
  state: "open",
  proposal_ids: ["p1"],
  photo_url: "/api/tankkeeper/photos/c2?authSig=x",
  embed: "![The tank](tankkeeper:photo/c2)",
  area: null,
  question: null,
  tiles: 0,
};

const info: CameraInfo = {
  camera: "camera.tapo_c100",
  check_time: "14:00",
  after_test: true,
  alerts: true,
  keep_days: 30,
  check_plants: true,
  check_fish: false,
  thorough_days: ["sat", "sun"],
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
    .on("check_thorough", { ...issue, id: "c5", reason: "thorough", tiles: 6 })
    .on("check_area", { ...issue, id: "c4", reason: "area", question: "Is this white spot?" })
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
    expect(text(latest)).toContain("Fish One tetra has white spots");
  });

  it("shows the latest check's text when its photo is no longer kept", async () => {
    const element = await view(
      connection({ ...info, latest: { ...issue, photo_url: null, embed: null } }),
    );

    const latest = find(element, ".latest");
    expect(latest.querySelector("img")).toBeNull();
    expect(text(latest)).toContain("Green film on the front glass.");
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
    const check = find(element, "button.check");
    expect([text(check), iconOf(check)]).toEqual(["Check now", CAMERA]);
    const photos = find(element, "button.photos");
    expect([text(photos), iconOf(photos)]).toEqual(["More photos", PHOTOS]);
    let changed = 0;
    document.body.addEventListener("tk-changed", () => (changed += 1));

    find(element, "button.check").click();
    await settle(element);

    expect(count(conn, "check_now")).toBe(1);
    expect(count(conn, "get_camera")).toBe(2);
    expect(changed).toBe(1);
  });

  it("checks thoroughly and tells the other views", async () => {
    const conn = connection();
    const element = await view(conn);
    const thorough = find(element, "button.thorough");
    expect([text(thorough), iconOf(thorough)]).toEqual(["Thorough check", THOROUGH]);
    let changed = 0;
    document.body.addEventListener("tk-changed", () => (changed += 1));

    thorough.click();
    await settle(element);

    expect(count(conn, "check_thorough")).toBe(1);
    expect(count(conn, "get_camera")).toBe(2);
    expect(changed).toBe(1);
  });

  it("names a thorough check", async () => {
    const element = await view(
      connection({ ...info, latest: { ...issue, reason: "thorough", tiles: 6 } }),
    );

    expect(text(find(element, ".latest"))).toContain("Thorough");
  });

  it("looks closer at an area of the latest photo and tells the other views", async () => {
    const conn = connection();
    const element = await view(conn);
    const closer = find(element, "button.closer");
    expect([text(closer), iconOf(closer)]).toEqual(["Look closer", SEARCH]);
    let changed = 0;
    document.body.addEventListener("tk-changed", () => (changed += 1));

    closer.click();
    await settle(element);
    const picker = find(element, "tk-area-picker") as unknown as { src: string };
    expect(picker.src).toBe("/api/tankkeeper/photos/c2?authSig=x");
    expect(findAll(element, ".latest img")).toEqual([]);
    const detail: AskDetail = {
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 1,
      question: "Is this white spot?",
    };
    find(element, "tk-area-picker").dispatchEvent(
      new CustomEvent(ASK, { detail, bubbles: true, composed: true }),
    );
    await settle(element);

    expect(count(conn, "check_area")).toBe(1);
    expect(conn.last("check_area").args).toEqual(detail);
    expect(count(conn, "get_camera")).toBe(2);
    expect(changed).toBe(1);
    expect(findAll(element, "tk-area-picker")).toEqual([]);
  });

  it("keeps the box when looking closer fails, to try again", async () => {
    const conn = connection().fail("check_area", "lights_off", "The lights are off.");
    const element = await view(conn);
    find(element, "button.closer").click();
    await settle(element);

    find(element, "tk-area-picker").dispatchEvent(
      new CustomEvent(ASK, {
        detail: { x: 0, y: 0, width: 0.5, height: 0.5 },
        bubbles: true,
        composed: true,
      }),
    );
    await settle(element);

    expect(find(element, ".error").textContent).toBe("The lights are off.");
    expect(findAll(element, "tk-area-picker").length).toBe(1);
  });

  it("goes back to the latest photo when looking closer is cancelled", async () => {
    const conn = connection();
    const element = await view(conn);
    find(element, "button.closer").click();
    await settle(element);

    find(element, "tk-area-picker").dispatchEvent(
      new CustomEvent(CANCEL, { bubbles: true, composed: true }),
    );
    await settle(element);

    expect(findAll(element, "tk-area-picker")).toEqual([]);
    expect(findAll(element, ".latest img").length).toBe(1);
    expect(count(conn, "check_area")).toBe(0);
  });

  it("offers Look closer only when the latest photo is kept", async () => {
    const gone = await view(
      connection({ ...info, latest: { ...issue, photo_url: null, embed: null } }),
    );
    const none = await view(connection({ ...info, latest: null, open: [] }));

    expect(findAll(gone, "button.closer")).toEqual([]);
    expect(findAll(none, "button.closer")).toEqual([]);
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

  it("asks the panel to open the gallery from More photos", async () => {
    const element = await view(connection());
    const opened: boolean[] = [];
    document.body.addEventListener(GALLERY, (event) => {
      opened.push((event as CustomEvent<boolean>).detail);
    });

    find(element, "button.photos").click();

    expect(opened).toEqual([true]);
  });

  it("offers More photos only while a camera is set", async () => {
    const element = await view(connection({ ...info, camera: null, latest: null, open: [] }));

    expect(findAll(element, "button.photos")).toEqual([]);
  });

  it("shows the settings read-only, with their history and no cog", async () => {
    const element = await view(connection());

    const card = find(element, "#camera");
    expect(text(card)).toContain("Camera entity, such as a Tapo C100 camera.tapo_c100");
    expect(text(card)).toContain("Alert me about issues");
    expect(text(card)).toContain("Check plant health");
    expect(text(card)).toContain("Check fish health");
    expect(text(card)).toContain("Thorough check on sat, sun");
    expect(findAll(card, "tk-form")).toEqual([]);
    expect(findAll(card, "ha-icon-button.settings")).toEqual([]);
    expect(findAll(card, "tk-history")).toEqual([]);
    find(card, ".settings ha-icon-button.history").click();
    await settle(element);
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
    expect(
      findAll(element, `${first} ha-icon-button`).map((button) => [
        button.getAttribute("label"),
        (button as unknown as { path: string }).path,
      ]),
    ).toEqual([
      ["Not a problem", NOT_A_PROBLEM],
      ["Discuss", CHAT_ICON],
      ["Reject", CLOSE],
      ["Accept", CHECK],
    ]);

    find(element, `${first} ha-icon-button.dismiss`).click();
    await settle(element);
    expect(conn.last("dismiss_finding").args).toEqual({ check_id: "c2" });

    find(element, `${first} ha-icon-button.reject`).click();
    await settle(element);
    expect(conn.last("reject_finding")).toEqual({
      type: "tankkeeper/reject_finding",
      check_id: "c2",
    });

    find(element, `${first} ha-icon-button.accept`).click();
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

    find(element, "#seen ha-icon-button.discuss").click();

    expect(starts).toEqual([{ kind: "photo", id: "c2" }]);
  });
});
