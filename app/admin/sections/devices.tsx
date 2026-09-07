"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { DonutChart } from "../charts";
import { SortableTable, type Column } from "../table";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/admin/format";

interface OsRow {
  os: string;
  users: number;
  sessions: number;
}

export default function DevicesSection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const report = useAnalyticsReport("devices", range);

  const categoryTotals = new Map<string, number>();
  const osTotals = new Map<string, { users: number; sessions: number }>();
  for (const rawRow of report.data?.rows ?? []) {
    const dimensions = rawRow.dimensions as { deviceCategory: string; operatingSystem: string };
    const metrics = rawRow.metrics as { totalUsers: number; sessions: number };
    const category = dimensions.deviceCategory || "other";
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + metrics.totalUsers);
    const os = dimensions.operatingSystem || "Other";
    const existing = osTotals.get(os) ?? { users: 0, sessions: 0 };
    osTotals.set(os, { users: existing.users + metrics.totalUsers, sessions: existing.sessions + metrics.sessions });
  }

  const totalUsers = [...categoryTotals.values()].reduce((sum, value) => sum + value, 0);
  const categoryData = [...categoryTotals.entries()].map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const osRows: OsRow[] = [...osTotals.entries()].map(([os, values]) => ({ os, users: values.users, sessions: values.sessions }));

  const columns: Column<OsRow>[] = [
    { key: "os", label: "Operating system", render: (row) => row.os, sortValue: (row) => row.os },
    { key: "users", label: "Users", render: (row) => formatNumber(row.users), sortValue: (row) => row.users },
    { key: "sessions", label: "Sessions", render: (row) => formatNumber(row.sessions), sortValue: (row) => row.sessions },
    {
      key: "share",
      label: "Percentage",
      render: (row) => formatPercent(totalUsers > 0 ? row.users / totalUsers : 0),
      sortValue: (row) => (totalUsers > 0 ? row.users / totalUsers : 0),
    },
  ];

  return (
    <AdminShell
      active="devices"
      title="Devices"
      description="Desktop, mobile, and tablet visitors, plus operating system breakdown."
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
            <h2>Device category</h2>
            {categoryData.length === 0 ? <div className="empty-state">No analytics data available for this period.</div> : <DonutChart data={categoryData} />}
          </article>
          <article className="admin-panel">
            <h2>Operating systems</h2>
            <SortableTable rows={osRows} columns={columns} defaultSortKey="users" />
          </article>
        </div>
      )}
    </AdminShell>
  );
}
