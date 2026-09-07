"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { HorizontalBarChart } from "../charts";
import { SortableTable, type Column } from "../table";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/admin/format";

interface SourceRow {
  source: string;
  users: number;
  sessions: number;
  engagement: number;
}

export default function TrafficSection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const report = useAnalyticsReport("traffic", range);

  const rows: SourceRow[] =
    report.data?.rows.map((row) => {
      const dimensions = row.dimensions as { sessionDefaultChannelGroup: string };
      const metrics = row.metrics as { totalUsers: number; sessions: number; engagementRate: number };
      return {
        source: dimensions.sessionDefaultChannelGroup || "(not set)",
        users: metrics.totalUsers,
        sessions: metrics.sessions,
        engagement: metrics.engagementRate,
      };
    }) ?? [];

  const columns: Column<SourceRow>[] = [
    { key: "source", label: "Source", render: (row) => row.source, sortValue: (row) => row.source },
    { key: "users", label: "Users", render: (row) => formatNumber(row.users), sortValue: (row) => row.users },
    { key: "sessions", label: "Sessions", render: (row) => formatNumber(row.sessions), sortValue: (row) => row.sessions },
    { key: "engagement", label: "Engagement", render: (row) => formatPercent(row.engagement), sortValue: (row) => row.engagement },
  ];

  return (
    <AdminShell
      active="traffic"
      title="Traffic"
      description="Where visitors came from: organic search, direct, referral, social, paid, and email."
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
      {report.status === "ready" && (
        <div className="admin-panels">
          <article className="admin-panel">
            <h2>Sessions by source</h2>
            {rows.length === 0 ? (
              <div className="empty-state">No analytics data available for this period.</div>
            ) : (
              <HorizontalBarChart data={rows.map((row) => ({ name: row.source, value: row.sessions }))} />
            )}
          </article>
          <article className="admin-panel">
            <h2>Source detail</h2>
            <SortableTable rows={rows} columns={columns} defaultSortKey="sessions" />
          </article>
        </div>
      )}
    </AdminShell>
  );
}
