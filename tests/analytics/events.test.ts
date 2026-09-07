import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasAnalyticsConsent, hasConsentDecision, setAnalyticsConsent, track, CONSENT_STORAGE_KEY } from "@/lib/analytics/events";

function installFakeWindow() {
  const store = new Map<string, string>();
  const fakeWindow = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    },
    gtag: vi.fn(),
  };
  // @ts-expect-error -- assigning a minimal fake window for a Node test environment
  globalThis.window = fakeWindow;
  return fakeWindow;
}

function removeFakeWindow() {
  // @ts-expect-error -- cleaning up the fake window between tests
  delete globalThis.window;
}

describe("analytics consent", () => {
  afterEach(() => removeFakeWindow());

  it("has no consent decision until one is made", () => {
    installFakeWindow();
    expect(hasConsentDecision()).toBe(false);
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("records acceptance and rejection", () => {
    const fakeWindow = installFakeWindow();
    setAnalyticsConsent(true);
    expect(fakeWindow.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe("accepted");
    expect(hasAnalyticsConsent()).toBe(true);

    setAnalyticsConsent(false);
    expect(hasAnalyticsConsent()).toBe(false);
    expect(hasConsentDecision()).toBe(true);
  });
});

describe("track", () => {
  afterEach(() => removeFakeWindow());

  it("does not call gtag without consent", () => {
    const fakeWindow = installFakeWindow();
    track("password_generated", { generator_type: "password" });
    expect(fakeWindow.gtag).not.toHaveBeenCalled();
  });

  it("calls gtag with safe parameters once consent is given", () => {
    const fakeWindow = installFakeWindow();
    setAnalyticsConsent(true);
    track("password_generated", { generator_type: "password", length_bucket: "standard" });
    expect(fakeWindow.gtag).toHaveBeenCalledWith("event", "password_generated", { generator_type: "password", length_bucket: "standard" });
  });

  it("refuses to send a parameter named like a credential field", () => {
    installFakeWindow();
    setAnalyticsConsent(true);
    expect(() => track("password_generated", { password: "hunter2" } as unknown as Record<string, string>)).toThrow();
  });
});
