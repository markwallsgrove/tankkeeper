import { render } from "lit";
import { afterEach, describe, expect, it } from "vitest";
import { TankkeeperApi } from "../src/api";
import { COG, facts, openSettings, settingsButton, settingsUrl } from "../src/settings";
import type { Field } from "../src/types";
import { FakeConnection } from "./fake";

const FIELDS: Field[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "volume_litres", label: "Volume (litres)", type: "number" },
  { name: "temperature_c", label: "Target temperature (°C)", type: "number" },
  { name: "notes", label: "Notes", type: "textarea" },
  { name: "notify", label: "Notify", type: "list" },
  { name: "none", label: "None", type: "list" },
  { name: "comments", label: "Comments", type: "checkbox" },
  { name: "alerts", label: "Alerts", type: "checkbox" },
  { name: "dose", label: "Dose", type: "text" },
];

const listeners: EventListener[] = [];

function navigations(): string[] {
  const seen: string[] = [];
  const listen = (event: Event): void => {
    const detail = (event as CustomEvent<{ replace: boolean }>).detail;
    seen.push(
      `${window.location.pathname}${window.location.hash} replace=${String(detail.replace)}`,
    );
  };
  window.addEventListener("location-changed", listen);
  listeners.push(listen);
  return seen;
}

afterEach(() => {
  for (const listen of listeners.splice(0)) window.removeEventListener("location-changed", listen);
  history.replaceState(null, "", "/");
});

describe("settingsUrl", () => {
  it("opens the tank's entry on the integration page", () => {
    expect(settingsUrl("abc123")).toBe(
      "/config/integrations/integration/tankkeeper#config_entry=abc123",
    );
    expect(settingsUrl("a b")).toBe(
      "/config/integrations/integration/tankkeeper#config_entry=a%20b",
    );
  });

  it("opens the integration page when the entry is not known", () => {
    expect(settingsUrl(undefined)).toBe("/config/integrations/integration/tankkeeper");
  });
});

describe("openSettings", () => {
  it("moves Home Assistant's frontend to the settings without loading the page again", () => {
    const seen = navigations();

    openSettings("abc123");

    expect(seen.at(-1)).toBe(
      "/config/integrations/integration/tankkeeper#config_entry=abc123 replace=false",
    );
  });
});

describe("settingsButton", () => {
  it("is a cog that opens the tank's settings", () => {
    const seen = navigations();
    const host = document.createElement("div");
    const api = new TankkeeperApi(new FakeConnection(), "UTC", "entry1");

    render(settingsButton(api), host);
    const cog = host.querySelector("ha-icon-button.settings");

    expect(cog?.getAttribute("label")).toBe("TankKeeper settings");
    expect((cog as unknown as { path: string }).path).toBe(COG);
    (cog as HTMLElement).click();
    expect(seen.at(-1)).toBe(
      "/config/integrations/integration/tankkeeper#config_entry=entry1 replace=false",
    );
  });

  it("opens the integration page before the API is ready", () => {
    const seen = navigations();
    const host = document.createElement("div");

    render(settingsButton(undefined), host);
    host.querySelector<HTMLElement>("ha-icon-button")?.click();

    expect(seen.at(-1)).toBe("/config/integrations/integration/tankkeeper replace=false");
  });
});

describe("facts", () => {
  it("shows each setting read-only, with a word for values that are not set", () => {
    const host = document.createElement("div");

    render(
      facts(FIELDS, {
        name: "Nano",
        volume_litres: 60,
        temperature_c: null,
        notes: "",
        notify: ["notify.phone", "notify.tablet"],
        none: [],
        comments: true,
        alerts: false,
        dose: { amount_ml: 5 },
      }),
      host,
    );

    const rows = [...host.querySelectorAll("dt")].map((dt) => [
      dt.textContent,
      dt.nextElementSibling?.textContent,
    ]);
    expect(rows).toEqual([
      ["Name", "Nano"],
      ["Volume (litres)", "60"],
      ["Target temperature (°C)", "Not set"],
      ["Notes", "Not set"],
      ["Notify", "notify.phone, notify.tablet"],
      ["None", "Not set"],
      ["Comments", "Yes"],
      ["Alerts", "No"],
      ["Dose", '{"amount_ml":5}'],
    ]);
    expect(host.querySelectorAll("input, textarea, select, button").length).toBe(0);
  });

  it("puts long text under its label, across the whole width", () => {
    const host = document.createElement("div");

    render(facts(FIELDS, { name: "Nano", notes: "Cycling since 21 Nov" }), host);

    const wide = [...host.querySelectorAll(".wide")].map(
      (item) => `${item.tagName}:${item.textContent}`,
    );
    expect(wide).toEqual(["DT:Notes", "DD:Cycling since 21 Nov"]);
  });
});
