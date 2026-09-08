"use client";

import { useEffect, useState } from "react";
import { hasConsentDecision, setAnalyticsConsent } from "@/lib/analytics/events";
import { loadGoogleAnalytics } from "@/lib/analytics/gtag";
import { useI18n } from "./i18n-provider";

export default function ConsentBanner() {
  const { t } = useI18n();
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
        <strong>{t.consentTitle}</strong>
        <span> {t.consentDescription}</span>
      </div>
      <div className="consent-actions">
        <button className="text-button" type="button" onClick={() => decide(false)}>
          {t.reject}
        </button>
        <button className="button button-accent" type="button" onClick={() => decide(true)}>
          {t.allowAnalytics}
        </button>
      </div>
    </aside>
  );
}
