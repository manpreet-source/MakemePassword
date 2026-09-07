"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShapedReport } from "@/lib/ga4/shape";
import type { ReportName } from "@/lib/ga4/client";
import type { ResolvedDateRange } from "@/lib/ga4/dateRanges";

export type ReportState = "loading" | "setup_required" | "unavailable" | "rate_limited" | "unauthorized" | "ready";

export interface ReportResponse {
  status: ReportState;
  data: ShapedReport | null;
  message?: string;
  lastUpdated?: string;
  timeseries?: ShapedReport | null;
  generatorUses?: number;
  credentialChecks?: number;
}

const DEFAULT_RESPONSE: ReportResponse = { status: "loading", data: null };

export function useAnalyticsReport(report: ReportName, range: ResolvedDateRange) {
  const [response, setResponse] = useState<ReportResponse>(DEFAULT_RESPONSE);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const thisRequestId = ++requestId.current;
    setResponse((previous) => ({ ...previous, status: "loading" }));
    try {
      const url = `/api/admin/analytics/${report}?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}`;
      const res = await fetch(url, { cache: "no-store" });
      const body = (await res.json()) as ReportResponse;
      if (thisRequestId !== requestId.current) return; // A newer request already resolved (or is in flight); ignore this stale one.
      setResponse({ ...body, status: res.ok ? "ready" : (body.status as ReportState) });
    } catch {
      if (thisRequestId !== requestId.current) return;
      setResponse({ status: "unavailable", data: null, message: "Analytics data is temporarily unavailable. Please try again." });
    }
  }, [report, range.startDate, range.endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...response, refresh: load };
}
