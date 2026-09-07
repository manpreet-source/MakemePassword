"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { HorizontalBarChart } from "../charts";
import { SortableTable, type Column } from "../table";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/admin/format";

interface BrowserRow {
  browser: string;
  users: number;
  sessions: number;
  share: number;
}

export default function BrowsersSection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const report = useAnalyticsReport("browsers", range);

  const totalUsers = (report.data?.totals as { totalUsers?: number } | undefined)?.totalUsers ?? 0;
  const rows: BrowserRow[] =
    report.data?.rows.map((row) => {
      const dimensions = row.dimensions as { browser: string };
      const metrics = row.metrics as { totalUsers: number; sessions: number };
      return {
        browser: dimensions.browser || "Other",
        users: metrics.totalUsers,
        sessions: metrics.sessions,
        share: totalUsers > 0 ? metrics.totalUsers / totalUsers : 0,
      };
    }) ?? [];

  const columns: Column<BrowserRow>[] = [
    { key: "browser", label: "Browser", render: (row) => row.browser, sortValue: (row) => row.browser },
    { key: "users", label: "Users", render: (row) => formatNumber(row.users), sortValue: (row) => row.users },
    { key: "sessions", label: "Sessions", render: (row) => formatNumber(row.sessions), sortValue: (row) => row.sessions },
    { key: "share", label: "Percentage", render: (row) => formatPercent(row.share), sortValue: (row) => row.share },
  ];

  return (
    <AdminShell
      active="browsers"
      title="Browsers"
      description="Browser usage across visitors."
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
            <h2>Users by browser</h2>
            {rows.length === 0 ? <div className="empty-state">No analytics data available for this period.</div> : <HorizontalBarChart data={rows.map((row) => ({ name: row.browser, value: row.users }))} />}
          </article>
          <article className="admin-panel">
            <h2>Browser detail</h2>
            <SortableTable rows={rows} columns={columns} defaultSortKey="users" />
          </article>
        </div>
      )}
    </AdminShell>
  );
}
