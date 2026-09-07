"use client";

import { useEffect } from "react";
import { hasAnalyticsConsent } from "@/lib/analytics/events";
import { loadGoogleAnalytics } from "@/lib/analytics/gtag";

export default function AnalyticsProvider() {
  useEffect(() => {
    if (hasAnalyticsConsent()) loadGoogleAnalytics();
  }, []);
  return null;
}
