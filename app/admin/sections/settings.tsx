"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../chrome";
import { formatRelativeTime } from "@/lib/admin/format";

const LAST_SUCCESS_KEY = "makemepassword-admin-last-success";

interface StatusResponse {
  ga4Configured: boolean;
  measurementIdConfigured: boolean;
}

interface TestResult {
  ok: boolean;
  message: string;
  testedAt: string;
}

export default function SettingsSection({ email }: { email: string }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics/status", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: StatusResponse) => setStatus(body))
      .catch(() => setStatus(null));
    try {
      setLastSuccess(window.localStorage.getItem(LAST_SUCCESS_KEY));
    } catch {
      setLastSuccess(null);
    }
  }, []);

  async function runTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/analytics/test-connection", { method: "POST" });
      const body = (await res.json()) as TestResult;
      setTestResult(body);
      if (body.ok) {
        try {
          window.localStorage.setItem(LAST_SUCCESS_KEY, body.testedAt);
        } catch {
          // Ignore storage failures; the timestamp simply won't persist across visits.
        }
        setLastSuccess(body.testedAt);
      }
    } catch {
      setTestResult({ ok: false, message: "Analytics data is temporarily unavailable. Please try again.", testedAt: new Date().toISOString() });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AdminShell active="settings" title="Settings" description="Connection status and privacy configuration." email={email}>
      <article className="admin-panel">
        <h2>Google Analytics</h2>
        <p className="kpi-label" style={{ marginBottom: 6 }}>
          Status
        </p>
        <p>
          {status === null ? (
            "—"
          ) : status.measurementIdConfigured ? (
            <span className="status-pill ok">Connected ✓</span>
          ) : (
            <span className="status-pill">Not configured</span>
          )}
        </p>
        <p className="kpi-label" style={{ marginTop: 16, marginBottom: 6 }}>
          Measurement ID
        </p>
        <p>
          <code>{status?.measurementIdConfigured ? "G-••••••••" : "Not set"}</code>
        </p>
        <p className="kpi-label" style={{ marginTop: 16, marginBottom: 6 }}>
          GA property
        </p>
        <p>{status?.ga4Configured ? <span className="status-pill ok">Connected ✓</span> : <span className="status-pill">Not configured</span>}</p>
        <p className="kpi-label" style={{ marginTop: 16, marginBottom: 6 }}>
          Last successful data request
        </p>
        <p className="kpi-muted">{formatRelativeTime(lastSuccess)}</p>
        <button className="admin-button primary" type="button" onClick={runTest} disabled={testing} style={{ marginTop: 18 }}>
          {testing ? "Testing…" : "Test analytics connection"}
        </button>
        {testResult && (
          <p className={testResult.ok ? "kpi-muted" : "login-error"} style={{ marginTop: 12 }}>
            {testResult.message}
          </p>
        )}
      </article>
      <article className="admin-panel" style={{ marginTop: 14 }}>
        <h2>Privacy</h2>
        <p className="kpi-muted">
          Credentials are never sent to Google Analytics or stored by MakeMePassword. This dashboard only ever displays aggregated traffic and
          product-usage metrics.
        </p>
      </article>
    </AdminShell>
  );
}
