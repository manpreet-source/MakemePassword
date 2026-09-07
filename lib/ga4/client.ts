import { BetaAnalyticsDataClient, protos } from "@google-analytics/data";
import { withReportCache, REPORT_CACHE_TTL_MS } from "./cache";
import { shapeReport, type ShapedReport } from "./shape";

export type ReportName = "overview" | "traffic" | "audience" | "geography" | "devices" | "browsers" | "pages" | "events";

/** The only events this dashboard ever asks GA4 for — every one is safe, behavior-only metadata. */
export const TRACKED_EVENT_NAMES = [
  "generator_opened",
  "username_generated",
  "password_generated",
  "both_generated",
  "username_checked",
  "password_checked",
  "username_regenerated",
  "password_regenerated",
  "credential_copied",
  "preset_selected",
  "advanced_options_opened",
  "theme_changed",
  "recommendation_clicked",
  "generator_mode_changed",
];

export function ga4Configured(): boolean {
  return Boolean(process.env.GA_PROPERTY_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

let cachedClient: BetaAnalyticsDataClient | null = null;

function client(): BetaAnalyticsDataClient {
  if (cachedClient) return cachedClient;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) throw new Error("GA4 server credentials are not configured");
  cachedClient = new BetaAnalyticsDataClient({ credentials: { client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: privateKey } });
  return cachedClient;
}

function propertyPath(): string {
  return `properties/${process.env.GA_PROPERTY_ID}`;
}

function eventNameFilter() {
  return { filter: { fieldName: "eventName", inListFilter: { values: TRACKED_EVENT_NAMES } } };
}

interface ReportConfig {
  metrics: string[];
  dimensions: string[];
  dimensionFilter?: ReturnType<typeof eventNameFilter>;
  orderBys?: { metric?: { metricName: string }; desc?: boolean }[];
}

const REPORT_CONFIG: Record<ReportName, ReportConfig> = {
  overview: { metrics: ["totalUsers", "newUsers", "sessions", "screenPageViews", "engagementRate", "averageSessionDuration"], dimensions: [] },
  traffic: {
    metrics: ["totalUsers", "sessions", "engagementRate"],
    dimensions: ["sessionDefaultChannelGroup"],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
  },
  audience: { metrics: ["totalUsers", "newUsers", "sessions", "engagementRate", "averageSessionDuration", "sessionsPerUser"], dimensions: [] },
  geography: {
    metrics: ["totalUsers", "sessions"],
    dimensions: ["country", "region", "city"],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
  },
  devices: {
    metrics: ["totalUsers", "sessions"],
    dimensions: ["deviceCategory", "operatingSystem"],
    orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
  },
  browsers: { metrics: ["totalUsers", "sessions"], dimensions: ["browser"], orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }] },
  pages: {
    metrics: ["screenPageViews", "totalUsers", "engagementRate", "averageSessionDuration"],
    dimensions: ["pagePath", "pageTitle"],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
  },
  events: {
    metrics: ["eventCount", "totalUsers"],
    dimensions: ["eventName"],
    dimensionFilter: eventNameFilter(),
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
  },
};

export type ReportResult = { status: "setup_required"; data: null } | { status: "ok"; data: ShapedReport };

async function runShapedReport(config: ReportConfig, startDate: string, endDate: string): Promise<ShapedReport> {
  const analytics = client();
  const request: protos.google.analytics.data.v1beta.IRunReportRequest = {
    property: propertyPath(),
    dateRanges: [{ startDate, endDate }],
    metrics: config.metrics.map((name) => ({ name })),
    dimensions: config.dimensions.map((name) => ({ name })),
    dimensionFilter: config.dimensionFilter,
    orderBys: config.orderBys,
    limit: 100,
  };
  const [response] = await analytics.runReport(request);
  return shapeReport(response, config.dimensions, config.metrics);
}

export async function runReport(report: ReportName, startDate: string, endDate: string): Promise<ReportResult> {
  if (!ga4Configured()) return { status: "setup_required", data: null };
  const config = REPORT_CONFIG[report];
  const cacheKey = `report:${report}:${startDate}:${endDate}`;
  const { value } = await withReportCache(cacheKey, REPORT_CACHE_TTL_MS, () => runShapedReport(config, startDate, endDate));
  return { status: "ok", data: value };
}

/** Daily users/sessions/page views for the traffic-over-time chart. */
export async function runTrafficTimeseries(startDate: string, endDate: string): Promise<ReportResult> {
  if (!ga4Configured()) return { status: "setup_required", data: null };
  const metrics = ["totalUsers", "sessions", "screenPageViews"];
  const dimensions = ["date"];
  const cacheKey = `traffic_timeseries:${startDate}:${endDate}`;
  const { value } = await withReportCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    const analytics = client();
    const [response] = await analytics.runReport({
      property: propertyPath(),
      dateRanges: [{ startDate, endDate }],
      metrics: metrics.map((name) => ({ name })),
      dimensions: dimensions.map((name) => ({ name })),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 366,
    });
    return shapeReport(response, dimensions, metrics);
  });
  return { status: "ok", data: value };
}

/** Daily counts for each tracked product event, for the engagement chart and funnels. */
export async function runEventsTimeseries(startDate: string, endDate: string): Promise<ReportResult> {
  if (!ga4Configured()) return { status: "setup_required", data: null };
  const cacheKey = `events_timeseries:${startDate}:${endDate}`;
  const { value } = await withReportCache(cacheKey, REPORT_CACHE_TTL_MS, async () => {
    const analytics = client();
    const [response] = await analytics.runReport({
      property: propertyPath(),
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      dimensionFilter: eventNameFilter(),
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 5000,
    });
    return shapeReport(response, ["date", "eventName"], ["eventCount"]);
  });
  return { status: "ok", data: value };
}

export interface RealtimeOverview {
  activeUsers: number;
  byPage: ShapedReport;
  byEvent: ShapedReport;
  bySource: ShapedReport;
  byCountry: ShapedReport;
}

export type RealtimeResult = { status: "setup_required"; data: null } | { status: "ok"; data: RealtimeOverview };

/** Section 19: live active-user snapshot. GA4 realtime data covers roughly the last 30 minutes. */
export async function runRealtimeOverview(): Promise<RealtimeResult> {
  if (!ga4Configured()) return { status: "setup_required", data: null };
  const analytics = client();
  const property = propertyPath();
  const [totalResponse, pageResponse, eventResponse, sourceResponse, countryResponse] = await Promise.all([
    analytics.runRealtimeReport({ property, metrics: [{ name: "activeUsers" }] }),
    analytics.runRealtimeReport({ property, metrics: [{ name: "activeUsers" }], dimensions: [{ name: "unifiedScreenName" }], limit: 10 }),
    analytics.runRealtimeReport({
      property,
      metrics: [{ name: "eventCount" }],
      dimensions: [{ name: "eventName" }],
      dimensionFilter: eventNameFilter(),
      limit: 10,
    }),
    analytics.runRealtimeReport({ property, metrics: [{ name: "activeUsers" }], dimensions: [{ name: "sessionSource" }], limit: 10 }),
    analytics.runRealtimeReport({ property, metrics: [{ name: "activeUsers" }], dimensions: [{ name: "country" }], limit: 10 }),
  ]);

  const totalShaped = shapeReport(totalResponse[0], [], ["activeUsers"]);
  return {
    status: "ok",
    data: {
      activeUsers: totalShaped.totals.activeUsers ?? 0,
      byPage: shapeReport(pageResponse[0], ["unifiedScreenName"], ["activeUsers"]),
      byEvent: shapeReport(eventResponse[0], ["eventName"], ["eventCount"]),
      bySource: shapeReport(sourceResponse[0], ["sessionSource"], ["activeUsers"]),
      byCountry: shapeReport(countryResponse[0], ["country"], ["activeUsers"]),
    },
  };
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

/** Used by the Settings page's "Test Analytics Connection" action. Never exposes credential values. */
export async function testConnection(): Promise<ConnectionTestResult> {
  if (!ga4Configured()) return { ok: false, message: "GA4 server credentials are not configured." };
  try {
    const analytics = client();
    await analytics.runReport({
      property: propertyPath(),
      dateRanges: [{ startDate: "today", endDate: "today" }],
      metrics: [{ name: "activeUsers" }],
      limit: 1,
    });
    return { ok: true, message: "Connected to Google Analytics." };
  } catch {
    return { ok: false, message: "Could not reach the Google Analytics Data API. Check property access and service account permissions." };
  }
}
