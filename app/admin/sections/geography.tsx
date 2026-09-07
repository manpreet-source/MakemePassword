"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { HorizontalBarChart } from "../charts";
import { SortableTable, type Column } from "../table";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/admin/format";

interface GeoRow {
  country: string;
  region: string;
  city: string;
  users: number;
  sessions: number;
  share: number;
}

export default function GeographySection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const report = useAnalyticsReport("geography", range);

  const totalUsers = (report.data?.totals as { totalUsers?: number } | undefined)?.totalUsers ?? 0;
  const rows: GeoRow[] =
    report.data?.rows.map((row) => {
      const dimensions = row.dimensions as { country: string; region: string; city: string };
      const metrics = row.metrics as { totalUsers: number; sessions: number };
      return {
        country: dimensions.country || "(not set)",
        region: dimensions.region || "(not set)",
        city: dimensions.city || "(not set)",
        users: metrics.totalUsers,
        sessions: metrics.sessions,
        share: totalUsers > 0 ? metrics.totalUsers / totalUsers : 0,
      };
    }) ?? [];

  const countryTotals = new Map<string, number>();
  for (const row of rows) countryTotals.set(row.country, (countryTotals.get(row.country) ?? 0) + row.users);
  const topCountries = [...countryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const columns: Column<GeoRow>[] = [
    { key: "country", label: "Country", render: (row) => row.country, sortValue: (row) => row.country },
    { key: "region", label: "Region", render: (row) => row.region, sortValue: (row) => row.region },
    { key: "city", label: "City", render: (row) => row.city, sortValue: (row) => row.city },
    { key: "users", label: "Users", render: (row) => formatNumber(row.users), sortValue: (row) => row.users },
    { key: "sessions", label: "Sessions", render: (row) => formatNumber(row.sessions), sortValue: (row) => row.sessions },
    { key: "share", label: "Percentage", render: (row) => formatPercent(row.share), sortValue: (row) => row.share },
  ];

  return (
    <AdminShell
      active="geography"
      title="Geography"
      description="Aggregated country, region, and city data. Individual visitors are never located."
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
            <h2>Top countries by users</h2>
            {topCountries.length === 0 ? <div className="empty-state">No analytics data available for this period.</div> : <HorizontalBarChart data={topCountries} />}
            <p className="kpi-muted" style={{ marginTop: 10 }}>
              Shown as a ranked bar chart of aggregated country totals rather than a per-visitor map.
            </p>
          </article>
          <article className="admin-panel">
            <h2>Country, region, and city detail</h2>
            <SortableTable rows={rows} columns={columns} defaultSortKey="users" />
          </article>
        </div>
      )}
    </AdminShell>
  );
}
