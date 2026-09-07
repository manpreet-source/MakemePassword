"use client";

import type { ReportState } from "./use-report";

const STATE_LABELS: Partial<Record<ReportState, string>> = {
  setup_required: "Setup required",
  unavailable: "Unavailable",
  rate_limited: "Rate limited",
  unauthorized: "Unauthorized",
};

export function StatusPanel({ state, message, onRetry }: { state: ReportState; message?: string; onRetry?: () => void }) {
  if (state === "ready") return null;

  if (state === "loading") {
    return (
      <section className="admin-panel" aria-busy="true">
        <div className="empty-state">Loading analytics…</div>
      </section>
    );
  }

  if (state === "setup_required") {
    return (
      <section className="admin-panel setup-panel">
        <span className="status-pill">Setup required</span>
        <h2>Connect Google Analytics to see real data</h2>
        <p>
          {message ??
            "The dashboard is protected and ready, but GA4 server credentials are not configured. Add the server-only variables from .env.example, grant the service account Viewer access to your GA4 property, then refresh. No sample or invented values are shown."}
        </p>
      </section>
    );
  }

  return (
    <section className="admin-panel setup-panel">
      <span className="status-pill">{STATE_LABELS[state] ?? "Unavailable"}</span>
      <h2>{message ?? "Analytics data is temporarily unavailable. Please try again."}</h2>
      {onRetry && (
        <button className="admin-button primary" type="button" onClick={onRetry} style={{ marginTop: 12 }}>
          Retry
        </button>
      )}
    </section>
  );
}
