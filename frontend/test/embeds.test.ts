import { describe, expect, it } from "vitest";
import { CHARTS, parseEmbed } from "../src/embeds";

const ID = "01JD0000000000000000000000";

describe("parseEmbed", () => {
  it("reads a photo by its check id", () => {
    expect(parseEmbed(`tankkeeper:photo/${ID}`)).toEqual({ kind: "photo", id: ID });
  });

  it.each(CHARTS)("reads the %s chart, for 30 days when no days are given", (chart) => {
    expect(parseEmbed(`tankkeeper:chart/${chart}`)).toEqual({ kind: "chart", chart, days: 30 });
  });

  it.each([
    ["nitrate", "7", 7],
    ["nitrate", "0", 1],
    ["nitrate", "365", 365],
    ["nitrate", "366", 365],
    ["ph", "9".repeat(400), 365],
    ["light", "10", 10],
    ["light", "31", 30],
    ["light", "0", 1],
  ])("keeps the %s chart's days=%s within its range", (chart, days, kept) => {
    expect(parseEmbed(`tankkeeper:chart/${chart}?days=${days}`)).toEqual({
      kind: "chart",
      chart,
      days: kept,
    });
  });

  it.each([
    "https://example.com/tank.jpg",
    "http://example.com/tank.jpg",
    "//example.com/tank.jpg",
    "/api/tankkeeper/photos/01JD0000000000000000000000",
    "data:image/png;base64,AAAA",
    "javascript:alert(1)",
    "TANKKEEPER:photo/01JD0000000000000000000000",
    "tankkeeper:photo/01jd0000000000000000000000",
    "tankkeeper:photo/01JD000000000000000000000",
    "tankkeeper:photo/01JD00000000000000000000000",
    "tankkeeper:photo/01JD000000000000000000000I",
    "tankkeeper:photo/01JD000000000000000000000U",
    "tankkeeper:photo/../../secrets",
    `tankkeeper:photo/${ID}?days=3`,
    "tankkeeper:chart/salinity",
    "tankkeeper:chart/Nitrate",
    "tankkeeper:chart/nitrate?days=",
    "tankkeeper:chart/nitrate?days=-3",
    "tankkeeper:chart/nitrate?days=3.5",
    "tankkeeper:chart/nitrate?days=abc",
    "tankkeeper:chart/nitrate?days=3&x=1",
    "tankkeeper:chart/nitrate?weeks=3",
    "tankkeeper:chart/nitrate/",
    "tankkeeper:video/x",
    "tankkeeper:",
    "",
  ])("leaves %s out", (address) => {
    expect(parseEmbed(address)).toBeUndefined();
  });
});
