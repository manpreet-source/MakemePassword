"use client";

import { useState } from "react";
import { AdminShell } from "./chrome";
import { DateRangeControl, useDateRangeControl } from "./date-range-control";
import { useAnalyticsReport } from "./use-report";
import { StatusPanel } from "./status-panel";
import { TrendAreaChart } from "./charts";
import { formatNumber, formatPercent, formatDuration, formatRelativeTime } from "@/lib/admin/format";
import { formatGaDate } from "@/lib/ga4/shape";

const METRIC_OPTIONS = [
  { key: "totalUsers", label: "Users" },
  { key: "sessions", label: "Sessions" },
  { key: "screenPageViews", label: "Page views" },
];

export default function AdminDashboard({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last7");
  const report = useAnalyticsReport("overview", range);
  const [metric, setMetric] = useState<(typeof METRIC_OPTIONS)[number]["key"]>("totalUsers");

  const totals = report.data?.totals as
    | { totalUsers: number; newUsers: number; sessions: number; screenPageViews: number; engagementRate: number; averageSessionDuration: number }
    | undefined;

  const kpis = [
    { label: "Total users", value: formatNumber(totals?.totalUsers) },
    { label: "New users", value: formatNumber(totals?.newUsers) },
    { label: "Sessions", value: formatNumber(totals?.sessions) },
    { label: "Page views", value: formatNumber(totals?.screenPageViews) },
    { label: "Engagement rate", value: formatPercent(totals?.engagementRate) },
    { label: "Avg. engagement time", value: formatDuration(totals?.averageSessionDuration) },
    { label: "Generator uses", value: formatNumber(report.generatorUses) },
    { label: "Credential checks", value: formatNumber(report.credentialChecks) },
  ];

  const chartData =
    report.timeseries?.rows.map((row) => ({ date: formatGaDate(row.dimensions.date ?? ""), [metric]: row.metrics[metric] ?? 0 })) ?? [];

  return (
    <AdminShell
      active="overview"
      title="Overview"
      description="Aggregated traffic and product usage for MakeMePassword."
      email={email}
      actions={
        <>
          <DateRangeControl preset={preset} setPreset={setPreset} custom={custom} setCustom={setCustom} />
          <button className="admin-button" type="button" onClick={() => report.refresh()}>
            Refresh data
          </button>
        </>
      }
    >
      <p className="kpi-muted" style={{ marginBottom: 14 }}>
        {formatRelativeTime(report.lastUpdated)}
      </p>
      <StatusPanel state={report.status} message={report.message} onRetry={report.refresh} />
      <section className="admin-grid" aria-label="Key performance indicators">
        {kpis.map((kpi) => (
          <article className="kpi-card" key={kpi.label}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{report.status === "ready" ? kpi.value : "—"}</div>
            <div className="kpi-muted">{report.status === "loading" ? "Loading…" : report.status === "ready" ? "Connected data" : "Awaiting data"}</div>
          </article>
        ))}
      </section>
      <section className="admin-panels">
        <article className="admin-panel">
          <h2>Traffic over time</h2>
          <div className="admin-actions" style={{ marginBottom: 10 }}>
            {METRIC_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`admin-button${metric === option.key ? " primary" : ""}`}
                onClick={() => setMetric(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {report.status !== "ready" ? (
            <div className="chart-placeholder">Connect GA4 to view the traffic chart.</div>
          ) : chartData.length === 0 ? (
            <div className="empty-state">No analytics data available for this period.</div>
          ) : (
            <TrendAreaChart data={chartData} seriesKey={metric} />
          )}
        </article>
        <article className="admin-panel">
          <h2>Privacy boundary</h2>
          <p className="kpi-muted">
            This dashboard measures traffic and actions only. Generated usernames, generated passwords, manually checked credentials, clipboard
            contents, and individual visitor identities are never sent to GA4 or displayed here.
          </p>
        </article>
      </section>
    </AdminShell>
  );
}
