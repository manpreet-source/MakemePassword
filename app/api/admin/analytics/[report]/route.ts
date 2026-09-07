import { NextResponse } from "next/server";
import { auth, isAdminEmail } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { isValidDateParam } from "@/lib/ga4/dateRanges";
import { ga4Configured, runReport, runTrafficTimeseries, runEventsTimeseries, runRealtimeOverview, type ReportName } from "@/lib/ga4/client";
import { sumEventCount } from "@/lib/ga4/shape";

const REPORTS = new Set<ReportName>(["overview", "traffic", "audience", "geography", "devices", "browsers", "pages", "events"]);
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request, context: { params: Promise<{ report: string }> }) {
  const session = await auth();
  if (!session || !isAdminEmail(session.user.email) || session.user.role !== "admin") {
    return NextResponse.json({ status: "unauthorized", message: "You don't have permission to access this dashboard." }, { status: 403, headers: NO_STORE });
  }

  const rateKey = session.user.email ?? "unknown";
  const { allowed } = checkRateLimit(rateKey, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ status: "rate_limited", message: "Too many requests. Please wait a moment and try again." }, { status: 429, headers: NO_STORE });
  }

  const { report } = await context.params;

  if (report === "realtime") {
    if (!ga4Configured()) return NextResponse.json({ status: "setup_required", message: "Analytics is not configured yet." }, { status: 503, headers: NO_STORE });
    try {
      const result = await runRealtimeOverview();
      return NextResponse.json({ ...result, lastUpdated: new Date().toISOString() }, { headers: NO_STORE });
    } catch {
      return NextResponse.json({ status: "unavailable", message: "Analytics data is temporarily unavailable. Please try again." }, { status: 503, headers: NO_STORE });
    }
  }

  if (!REPORTS.has(report as ReportName)) {
    return NextResponse.json({ status: "invalid_report" }, { status: 400, headers: NO_STORE });
  }
  if (!ga4Configured()) {
    return NextResponse.json({ status: "setup_required", message: "Analytics is not configured yet." }, { status: 503, headers: NO_STORE });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate") ?? "7daysAgo";
  const endDate = url.searchParams.get("endDate") ?? "today";
  if (!isValidDateParam(startDate) || !isValidDateParam(endDate)) {
    return NextResponse.json({ status: "invalid_date" }, { status: 400, headers: NO_STORE });
  }

  try {
    const reportName = report as ReportName;
    const extra: Record<string, unknown> = {};

    if (reportName === "overview") {
      const [result, timeseries, events] = await Promise.all([
        runReport(reportName, startDate, endDate),
        runTrafficTimeseries(startDate, endDate),
        runReport("events", startDate, endDate),
      ]);
      extra.timeseries = timeseries.status === "ok" ? timeseries.data : null;
      if (events.status === "ok") {
        extra.generatorUses = sumEventCount(events.data.rows, ["generator_opened", "username_generated", "password_generated", "both_generated"]);
        extra.credentialChecks = sumEventCount(events.data.rows, ["username_checked", "password_checked"]);
      }
      return NextResponse.json({ ...result, ...extra, lastUpdated: new Date().toISOString() }, { headers: { "Cache-Control": "private, max-age=60" } });
    }

    if (reportName === "events") {
      const [result, timeseries] = await Promise.all([runReport(reportName, startDate, endDate), runEventsTimeseries(startDate, endDate)]);
      extra.timeseries = timeseries.status === "ok" ? timeseries.data : null;
      return NextResponse.json({ ...result, ...extra, lastUpdated: new Date().toISOString() }, { headers: { "Cache-Control": "private, max-age=60" } });
    }

    const result = await runReport(reportName, startDate, endDate);
    return NextResponse.json({ ...result, lastUpdated: new Date().toISOString() }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    return NextResponse.json({ status: "unavailable", message: "Analytics data is temporarily unavailable. Please try again." }, { status: 503, headers: NO_STORE });
  }
}
