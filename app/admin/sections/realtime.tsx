"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "../chrome";
import { StatusPanel } from "../status-panel";
import type { ReportState } from "../use-report";
import type { RealtimeOverview } from "@/lib/ga4/client";
import { formatNumber, formatRelativeTime } from "@/lib/admin/format";

interface RealtimeResponse {
  status: ReportState;
  data: RealtimeOverview | null;
  message?: string;
  lastUpdated?: string;
}

const REFRESH_INTERVAL_MS = 30_000;

function topRows(report: RealtimeOverview | null, key: keyof RealtimeOverview, dimension: string, metric: string) {
  const shaped = report?.[key];
  if (!shaped || typeof shaped !== "object" || !("rows" in shaped)) return [];
  return shaped.rows.map((row) => ({ label: row.dimensions[dimension] || "(not set)", value: row.metrics[metric] })).slice(0, 8);
}

export default function RealtimeSection({ email }: { email: string }) {
  const [response, setResponse] = useState<RealtimeResponse>({ status: "loading", data: null });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const thisRequestId = ++requestId.current;
    try {
      const res = await fetch("/api/admin/analytics/realtime", { cache: "no-store" });
      const body = (await res.json()) as RealtimeResponse;
      if (thisRequestId !== requestId.current) return;
      setResponse({ ...body, status: res.ok ? "ready" : body.status });
    } catch {
      if (thisRequestId !== requestId.current) return;
      setResponse({ status: "unavailable", data: null, message: "Analytics data is temporarily unavailable. Please try again." });
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const pages = topRows(response.data, "byPage", "unifiedScreenName", "activeUsers");
  const events = topRows(response.data, "byEvent", "eventName", "eventCount");
  const sources = topRows(response.data, "bySource", "sessionSource", "activeUsers");
  const countries = topRows(response.data, "byCountry", "country", "activeUsers");

  return (
    <AdminShell
      active="realtime"
      title="Realtime"
      description="Active users in roughly the last 30 minutes."
      email={email}
      actions={
        <button className="admin-button" type="button" onClick={() => void load()}>
          Refresh data
        </button>
      }
    >
      <p className="kpi-muted" style={{ marginBottom: 14 }}>
        {response.status === "ready" && <span className="status-pill live"><span className="live-dot" />Live</span>} {formatRelativeTime(response.lastUpdated)}
      </p>
      <StatusPanel state={response.status} message={response.message} onRetry={load} />
      {response.status === "ready" && response.data && (
        <>
          <section className="admin-grid" aria-label="Realtime summary" style={{ gridTemplateColumns: "repeat(1,minmax(0,1fr))" }}>
            <article className="kpi-card">
              <div className="kpi-label">Active users right now</div>
              <div className="kpi-value">{formatNumber(response.data.activeUsers)}</div>
            </article>
          </section>
          <section className="admin-panels" style={{ marginTop: 14 }}>
            <article className="admin-panel">
              <h2>Current pages</h2>
              {pages.length === 0 ? <div className="empty-state">No active visitors right now.</div> : (
                <ul>{pages.map((row) => <li key={row.label}>{row.label} — {formatNumber(row.value)}</li>)}</ul>
              )}
            </article>
            <article className="admin-panel">
              <h2>Recent events</h2>
              {events.length === 0 ? <div className="empty-state">No recent events.</div> : (
                <ul>{events.map((row) => <li key={row.label}>{row.label} — {formatNumber(row.value)}</li>)}</ul>
              )}
            </article>
          </section>
          <section className="admin-panels" style={{ marginTop: 14 }}>
            <article className="admin-panel">
              <h2>Traffic sources</h2>
              {sources.length === 0 ? <div className="empty-state">No active visitors right now.</div> : (
                <ul>{sources.map((row) => <li key={row.label}>{row.label} — {formatNumber(row.value)}</li>)}</ul>
              )}
            </article>
            <article className="admin-panel">
              <h2>Countries</h2>
              {countries.length === 0 ? <div className="empty-state">No active visitors right now.</div> : (
                <ul>{countries.map((row) => <li key={row.label}>{row.label} — {formatNumber(row.value)}</li>)}</ul>
              )}
            </article>
          </section>
        </>
      )}
    </AdminShell>
  );
}
