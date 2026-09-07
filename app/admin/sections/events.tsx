"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { EngagementAreaChart } from "../charts";
import { SortableTable, type Column } from "../table";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/admin/format";
import { pivotTimeseries, sumEventCount } from "@/lib/ga4/shape";

interface EventRow {
  event: string;
  count: number;
  users: number;
}

export default function EventsSection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const events = useAnalyticsReport("events", range);
  const overview = useAnalyticsReport("overview", range);

  const rows: EventRow[] =
    events.data?.rows.map((row) => {
      const dimensions = row.dimensions as { eventName: string };
      const metrics = row.metrics as { eventCount: number; totalUsers: number };
      return { event: dimensions.eventName, count: metrics.eventCount, users: metrics.totalUsers };
    }) ?? [];

  const columns: Column<EventRow>[] = [
    { key: "event", label: "Event", render: (row) => row.event, sortValue: (row) => row.event },
    { key: "count", label: "Count", render: (row) => formatNumber(row.count), sortValue: (row) => row.count },
    { key: "users", label: "Users", render: (row) => formatNumber(row.users), sortValue: (row) => row.users },
  ];

  const chartSeries = ["generator_opened", "username_generated", "password_generated", "credential_copied"];
  const chartData = events.timeseries ? pivotTimeseries(events.timeseries.rows, "eventName", "eventCount").map((point) => {
    const filtered: Record<string, string | number> = { date: point.date };
    for (const key of chartSeries) filtered[key] = point[key] ?? 0;
    return filtered;
  }) : [];

  const eventRows = events.data?.rows ?? [];
  const visitors = (overview.data?.totals as { totalUsers?: number } | undefined)?.totalUsers ?? 0;
  const opened = sumEventCount(eventRows, ["generator_opened"]);
  const generated = sumEventCount(eventRows, ["username_generated", "password_generated", "both_generated"]);
  const copied = sumEventCount(eventRows, ["credential_copied"]);
  const checked = sumEventCount(eventRows, ["username_checked", "password_checked"]);

  function pct(part: number, whole: number): string {
    return whole > 0 ? formatPercent(part / whole) : "—";
  }

  return (
    <AdminShell
      active="events"
      title="Events"
      description="Safe product events, feature usage over time, and conversion funnels."
      email={email}
      actions={
        <>
          <DateRangeControl preset={preset} setPreset={setPreset} custom={custom} setCustom={setCustom} />
          <button
            className="admin-button"
            type="button"
            onClick={() => {
              void events.refresh();
              void overview.refresh();
            }}
          >
            Refresh data
          </button>
        </>
      }
    >
      <p className="kpi-muted" style={{ marginBottom: 14 }}>
        {formatRelativeTime(events.lastUpdated)}
      </p>
      <StatusPanel state={events.status} message={events.message} onRetry={events.refresh} />
      {events.status === "ready" && (
        <>
          <section className="admin-panels">
            <article className="admin-panel">
              <h2>Feature usage over time</h2>
              {chartData.length === 0 ? (
                <div className="empty-state">No analytics data available for this period.</div>
              ) : (
                <EngagementAreaChart data={chartData} series={chartSeries} />
              )}
            </article>
            <article className="admin-panel">
              <h2>All tracked events</h2>
              <SortableTable rows={rows} columns={columns} defaultSortKey="count" />
            </article>
          </section>
          <section className="admin-panels" style={{ marginTop: 14 }}>
            <article className="admin-panel">
              <h2>Generator funnel</h2>
              <div className="funnel">
                <div className="funnel-step">
                  <span>Website visitors</span>
                  <strong>{formatNumber(visitors)}</strong>
                </div>
                <div className="funnel-step">
                  <span>Opened generator</span>
                  <strong>
                    {formatNumber(opened)} <span className="funnel-pct">{pct(opened, visitors)}</span>
                  </strong>
                </div>
                <div className="funnel-step">
                  <span>Generated credential</span>
                  <strong>
                    {formatNumber(generated)} <span className="funnel-pct">{pct(generated, opened)}</span>
                  </strong>
                </div>
                <div className="funnel-step">
                  <span>Copied credential</span>
                  <strong>
                    {formatNumber(copied)} <span className="funnel-pct">{pct(copied, generated)}</span>
                  </strong>
                </div>
              </div>
            </article>
            <article className="admin-panel">
              <h2>Checker funnel</h2>
              <div className="funnel">
                <div className="funnel-step">
                  <span>Website visitors</span>
                  <strong>{formatNumber(visitors)}</strong>
                </div>
                <div className="funnel-step">
                  <span>Checked credential</span>
                  <strong>
                    {formatNumber(checked)} <span className="funnel-pct">{pct(checked, visitors)}</span>
                  </strong>
                </div>
              </div>
              <p className="kpi-muted" style={{ marginTop: 10 }}>
                A final &ldquo;generated a better credential&rdquo; step is not shown: no event confirms a stronger credential was actually
                generated after a check, and this dashboard never fabricates a number it can&rsquo;t back with real data.
              </p>
            </article>
          </section>
        </>
      )}
    </AdminShell>
  );
}
