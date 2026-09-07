"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { SortableTable, type Column } from "../table";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/admin/format";

interface PageRow {
  path: string;
  title: string;
  views: number;
  users: number;
  engagement: number;
}

export default function PagesSection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const report = useAnalyticsReport("pages", range);

  const rows: PageRow[] =
    report.data?.rows.map((row) => {
      const dimensions = row.dimensions as { pagePath: string; pageTitle: string };
      const metrics = row.metrics as { screenPageViews: number; totalUsers: number; engagementRate: number };
      return {
        path: dimensions.pagePath || "/",
        title: dimensions.pageTitle || "",
        views: metrics.screenPageViews,
        users: metrics.totalUsers,
        engagement: metrics.engagementRate,
      };
    }) ?? [];

  const columns: Column<PageRow>[] = [
    {
      key: "path",
      label: "Page",
      render: (row) => (
        <>
          <code>{row.path}</code>
          {row.title ? <span className="kpi-muted"> {row.title}</span> : null}
        </>
      ),
      sortValue: (row) => row.path,
    },
    { key: "views", label: "Views", render: (row) => formatNumber(row.views), sortValue: (row) => row.views },
    { key: "users", label: "Users", render: (row) => formatNumber(row.users), sortValue: (row) => row.users },
    { key: "engagement", label: "Engagement", render: (row) => formatPercent(row.engagement), sortValue: (row) => row.engagement },
  ];

  return (
    <AdminShell
      active="pages"
      title="Popular pages"
      description="Pages receiving the most traffic. Sort by views, users, or engagement."
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
        <article className="admin-panel">
          <h2>Pages</h2>
          <SortableTable rows={rows} columns={columns} defaultSortKey="views" />
        </article>
      )}
    </AdminShell>
  );
}
