import { describe, expect, it } from "vitest";
import { shapeReport, formatGaDate, pivotTimeseries } from "@/lib/ga4/shape";

function mockResponse(rows: { dims: string[]; metrics: string[] }[], totals?: string[]) {
  return {
    rows: rows.map((row) => ({
      dimensionValues: row.dims.map((value) => ({ value })),
      metricValues: row.metrics.map((value) => ({ value })),
    })),
    totals: totals ? [{ metricValues: totals.map((value) => ({ value })) }] : undefined,
    rowCount: rows.length,
  } as any;
}

describe("shapeReport", () => {
  it("maps dimension and metric values by declared name", () => {
    const response = mockResponse([{ dims: ["Chrome"], metrics: ["100", "80"] }]);
    const shaped = shapeReport(response, ["browser"], ["totalUsers", "sessions"]);
    expect(shaped.rows).toEqual([{ dimensions: { browser: "Chrome" }, metrics: { totalUsers: 100, sessions: 80 } }]);
  });

  it("prefers the API's totals row when present", () => {
    const response = mockResponse(
      [
        { dims: ["Chrome"], metrics: ["100"] },
        { dims: ["Firefox"], metrics: ["50"] },
      ],
      ["999"],
    );
    const shaped = shapeReport(response, ["browser"], ["totalUsers"]);
    expect(shaped.totals.totalUsers).toBe(999);
  });

  it("falls back to summing rows when no totals row is present", () => {
    const response = mockResponse([
      { dims: ["Chrome"], metrics: ["100"] },
      { dims: ["Firefox"], metrics: ["50"] },
    ]);
    const shaped = shapeReport(response, ["browser"], ["totalUsers"]);
    expect(shaped.totals.totalUsers).toBe(150);
  });

  it("handles an empty response without throwing", () => {
    const shaped = shapeReport(mockResponse([]), ["browser"], ["totalUsers"]);
    expect(shaped.rows).toEqual([]);
    expect(shaped.totals.totalUsers).toBe(0);
  });
});

describe("formatGaDate", () => {
  it("converts GA4's YYYYMMDD dimension value to YYYY-MM-DD", () => {
    expect(formatGaDate("20260907")).toBe("2026-09-07");
  });

  it("passes through values that aren't 8-digit dates", () => {
    expect(formatGaDate("(not set)")).toBe("(not set)");
  });
});

describe("pivotTimeseries", () => {
  it("pivots (date, series) rows into one point per date", () => {
    const rows = [
      { dimensions: { date: "20260101", eventName: "a" }, metrics: { eventCount: 3 } },
      { dimensions: { date: "20260101", eventName: "b" }, metrics: { eventCount: 5 } },
      { dimensions: { date: "20260102", eventName: "a" }, metrics: { eventCount: 1 } },
    ];
    const points = pivotTimeseries(rows, "eventName", "eventCount");
    expect(points).toEqual([
      { date: "2026-01-01", a: 3, b: 5 },
      { date: "2026-01-02", a: 1, b: 0 },
    ]);
  });
});
