"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { formatNumber, formatPercent, formatDuration, formatRelativeTime } from "@/lib/admin/format";

export default function AudienceSection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const report = useAnalyticsReport("audience", range);
  const totals = report.data?.totals as
    | { totalUsers: number; newUsers: number; sessions: number; engagementRate: number; averageSessionDuration: number; sessionsPerUser: number }
    | undefined;
  const returningUsers = totals ? Math.max(0, totals.totalUsers - totals.newUsers) : undefined;

  const kpis = [
    { label: "Total users", value: formatNumber(totals?.totalUsers) },
    { label: "New users", value: formatNumber(totals?.newUsers) },
    { label: "Returning users (approx.)", value: formatNumber(returningUsers) },
    { label: "Sessions", value: formatNumber(totals?.sessions) },
    { label: "Engagement rate", value: formatPercent(totals?.engagementRate) },
    { label: "Avg. engagement time", value: formatDuration(totals?.averageSessionDuration) },
    { label: "Sessions per user", value: totals ? totals.sessionsPerUser.toFixed(2) : "—" },
  ];

  return (
    <AdminShell
      active="audience"
      title="Audience"
      description="Aggregated visitor engagement. No individual visitors are ever identified here."
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
        <section className="admin-grid" aria-label="Audience metrics">
          {kpis.map((kpi) => (
            <article className="kpi-card" key={kpi.label}>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
