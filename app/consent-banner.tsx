"use client";

import { useEffect, useState } from "react";
import { hasConsentDecision, setAnalyticsConsent } from "@/lib/analytics/events";
import { loadGoogleAnalytics } from "@/lib/analytics/gtag";

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasConsentDecision());
  }, []);

  function decide(accepted: boolean) {
    setAnalyticsConsent(accepted);
    if (accepted) loadGoogleAnalytics();
    setVisible(false);
  }

  return (
    <aside className="consent-banner" aria-label="Analytics consent" hidden={!visible}>
      <div>
        <strong>Keep MakeMePassword quiet.</strong>
        <span> Optional analytics help us improve the tool. Credential contents are never collected.</span>
      </div>
      <div className="consent-actions">
        <button className="text-button" type="button" onClick={() => decide(false)}>
          Reject
        </button>
        <button className="button button-accent" type="button" onClick={() => decide(true)}>
          Allow analytics
        </button>
      </div>
    </aside>
  );
}
