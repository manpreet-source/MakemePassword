import { describe, expect, it } from "vitest";
import { resolveDateRange, isValidDateParam } from "@/lib/ga4/dateRanges";

describe("resolveDateRange", () => {
  it("resolves relative presets to GA4 keywords", () => {
    expect(resolveDateRange("today")).toEqual({ startDate: "today", endDate: "today", label: "Today" });
    expect(resolveDateRange("yesterday")).toEqual({ startDate: "yesterday", endDate: "yesterday", label: "Yesterday" });
    expect(resolveDateRange("last7")).toEqual({ startDate: "7daysAgo", endDate: "today", label: "Last 7 days" });
    expect(resolveDateRange("last30")).toEqual({ startDate: "30daysAgo", endDate: "today", label: "Last 30 days" });
    expect(resolveDateRange("last90")).toEqual({ startDate: "90daysAgo", endDate: "today", label: "Last 90 days" });
  });

  it("resolves this-month and last-month to absolute ISO dates", () => {
    const thisMonth = resolveDateRange("thisMonth");
    expect(thisMonth.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(thisMonth.endDate).toBe("today");

    const lastMonth = resolveDateRange("lastMonth");
    expect(lastMonth.startDate).toMatch(/^\d{4}-\d{2}-01$/);
    expect(lastMonth.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(lastMonth.startDate).getTime()).toBeLessThan(new Date(lastMonth.endDate).getTime());
  });

  it("falls back to a safe default for an invalid custom range", () => {
    const range = resolveDateRange("custom", { startDate: "not-a-date", endDate: "also-not-a-date" });
    expect(range).toEqual({ startDate: "7daysAgo", endDate: "today", label: "Custom range" });
  });

  it("passes through a valid custom range", () => {
    const range = resolveDateRange("custom", { startDate: "2026-01-01", endDate: "2026-01-31" });
    expect(range).toEqual({ startDate: "2026-01-01", endDate: "2026-01-31", label: "Custom range" });
  });
});

describe("isValidDateParam", () => {
  it("accepts GA4's relative keywords and ISO dates", () => {
    expect(isValidDateParam("today")).toBe(true);
    expect(isValidDateParam("yesterday")).toBe(true);
    expect(isValidDateParam("7daysAgo")).toBe(true);
    expect(isValidDateParam("2026-01-01")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidDateParam("next week")).toBe(false);
    expect(isValidDateParam("2026/01/01")).toBe(false);
    expect(isValidDateParam("")).toBe(false);
  });
});
