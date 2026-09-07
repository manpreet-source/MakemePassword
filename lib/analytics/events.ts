export const analyticsEvents = {
  pageView: "page_view",
  generatorOpened: "generator_opened",
  usernameGenerated: "username_generated",
  passwordGenerated: "password_generated",
  bothGenerated: "both_generated",
  usernameChecked: "username_checked",
  passwordChecked: "password_checked",
  usernameRegenerated: "username_regenerated",
  passwordRegenerated: "password_regenerated",
  credentialCopied: "credential_copied",
  presetSelected: "preset_selected",
  advancedOptionsOpened: "advanced_options_opened",
  themeChanged: "theme_changed",
} as const;

export const CONSENT_STORAGE_KEY = "makemepassword-analytics-consent";
export const THEME_STORAGE_KEY = "makemepassword-theme";

type SafeParam = string | number | boolean;
export type SafeAnalyticsParams = Record<string, SafeParam>;

/** Fields that must never be sent to analytics, even by accident. */
const FORBIDDEN_PARAM_NAMES = new Set(["username", "password", "credential", "clipboard", "value", "text"]);

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function hasConsentDecision(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}

export function setAnalyticsConsent(accepted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, accepted ? "accepted" : "rejected");
  } catch {
    // Ignore storage failures (private browsing, quota); consent simply won't persist.
  }
}

export function track(event: string, params: SafeAnalyticsParams = {}): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  for (const key of Object.keys(params)) {
    if (FORBIDDEN_PARAM_NAMES.has(key.toLowerCase())) {
      throw new Error(`Refusing to send potentially sensitive analytics parameter "${key}"`);
    }
  }
  if (typeof window.gtag === "function") window.gtag("event", event, params);
}
