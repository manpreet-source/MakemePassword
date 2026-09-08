"use client";

import { AdminShell } from "../chrome";
import { DateRangeControl, useDateRangeControl } from "../date-range-control";
import { useAnalyticsReport } from "../use-report";
import { StatusPanel } from "../status-panel";
import { formatNumber, formatRelativeTime } from "@/lib/admin/format";
import { sumEventCount } from "@/lib/ga4/shape";

const countFor = sumEventCount;

export default function GeneratorUsageSection({ email }: { email: string }) {
  const { preset, setPreset, custom, setCustom, range } = useDateRangeControl("last30");
  const report = useAnalyticsReport("events", range);
  const rows = report.data?.rows ?? [];

  const cards = [
    { label: "Username generator", description: "Total generations", value: countFor(rows, ["username_generated"]) },
    { label: "Password generator", description: "Total generations", value: countFor(rows, ["password_generated"]) },
    { label: "Passphrase generator", description: "Total generations", value: countFor(rows, ["passphrase_generated"]) },
    { label: "Username favorites", description: "Total suggestions favorited", value: countFor(rows, ["username_favorited"]) },
    { label: "Username checker", description: "Total checks", value: countFor(rows, ["username_checked"]) },
    { label: "Password checker", description: "Total checks", value: countFor(rows, ["password_checked"]) },
    { label: "Copy actions", description: "Total copies", value: countFor(rows, ["credential_copied"]) },
  ];

  return (
    <AdminShell
      active="generator-usage"
      title="Generator usage"
      description="How many people used each tool. Generated or checked credential values are never collected."
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
        <section className="admin-grid" aria-label="Generator and checker usage">
          {cards.map((card) => (
            <article className="kpi-card" key={card.label}>
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-value">{formatNumber(card.value)}</div>
              <div className="kpi-muted">{card.description}</div>
            </article>
          ))}
        </section>
      )}
    </AdminShell>
  );
}
