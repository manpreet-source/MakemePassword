import type { protos } from "@google-analytics/data";

type RunReportResponse = protos.google.analytics.data.v1beta.IRunReportResponse;
type RunRealtimeReportResponse = protos.google.analytics.data.v1beta.IRunRealtimeReportResponse;

export interface ReportRow {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
}

export interface ShapedReport {
  totals: Record<string, number>;
  rows: ReportRow[];
  rowCount: number;
}

/** Converts a raw GA4 Data API response into plain, named JSON — no client code ever sees the SDK's response shape. */
export function shapeReport(response: RunReportResponse | RunRealtimeReportResponse, dimensionNames: string[], metricNames: string[]): ShapedReport {
  const rows: ReportRow[] = (response.rows ?? []).map((row) => {
    const dimensions: Record<string, string> = {};
    dimensionNames.forEach((name, index) => {
      dimensions[name] = row.dimensionValues?.[index]?.value ?? "";
    });
    const metrics: Record<string, number> = {};
    metricNames.forEach((name, index) => {
      metrics[name] = Number(row.metricValues?.[index]?.value ?? 0);
    });
    return { dimensions, metrics };
  });

  const totalsRow = "totals" in response ? response.totals?.[0] : undefined;
  const totals: Record<string, number> = {};
  metricNames.forEach((name, index) => {
    const fromTotals = totalsRow?.metricValues?.[index]?.value;
    totals[name] = fromTotals !== undefined ? Number(fromTotals) : rows.reduce((sum, row) => sum + (row.metrics[name] ?? 0), 0);
  });

  return { totals, rows, rowCount: Number(response.rowCount ?? rows.length) };
}

/** Sums `eventCount` across rows whose `eventName` dimension is one of `names`. */
export function sumEventCount(rows: ReportRow[], names: string[]): number {
  return rows.filter((row) => names.includes(row.dimensions.eventName ?? "")).reduce((sum, row) => sum + (row.metrics.eventCount ?? 0), 0);
}

/** GA4's `date` dimension returns YYYYMMDD; format it as YYYY-MM-DD for display and charting. */
export function formatGaDate(value: string): string {
  if (!/^\d{8}$/.test(value)) return value;
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export interface TimeseriesPoint {
  date: string;
  [series: string]: string | number;
}

/** Pivots rows shaped as (date, seriesDimension) -> metric into one point per date with one field per series value. */
export function pivotTimeseries(rows: ReportRow[], seriesDimension: string, metric: string): TimeseriesPoint[] {
  const dateKeys = Array.from(new Set(rows.map((row) => row.dimensions.date ?? ""))).sort();
  const seriesValues = Array.from(new Set(rows.map((row) => row.dimensions[seriesDimension] ?? "")));

  return dateKeys.map((date) => {
    const point: TimeseriesPoint = { date: formatGaDate(date) };
    for (const series of seriesValues) {
      const match = rows.find((row) => row.dimensions.date === date && row.dimensions[seriesDimension] === series);
      point[series] = match?.metrics[metric] ?? 0;
    }
    return point;
  });
}
