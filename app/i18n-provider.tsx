"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { analyticsEvents, track } from "@/lib/analytics/events";
import { getLocale, getTranslations, LOCALE_STORAGE_KEY } from "@/lib/i18n";
import { localeDirection } from "@/lib/i18n";
import { siteConfig, type Locale } from "@/lib/site-config";

type I18nContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: ReturnType<typeof getTranslations> };
const I18nContext = createContext<I18nContextValue | null>(null);

function initialLocale(): Locale {
  if (typeof window === "undefined") return siteConfig.defaultLocale;
  const pathLocale = window.location.pathname.split("/")[1];
  if (pathLocale && getLocale(pathLocale) === pathLocale) return getLocale(pathLocale);
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && getLocale(stored) === stored) return getLocale(stored);
  } catch { /* Use browser settings when storage is unavailable. */ }
  const browserLocale = navigator.language.split("-")[0];
  return getLocale(browserLocale);
}

export function I18nProvider({ children, initialLocale: requestedLocale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState(requestedLocale ?? siteConfig.defaultLocale);
  const preferenceChecked = useRef(Boolean(requestedLocale));

  useEffect(() => {
    if (!preferenceChecked.current) {
      preferenceChecked.current = true;
      const preferred = initialLocale();
      if (preferred !== locale) {
        setLocaleState(preferred);
        return;
      }
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection[locale];
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, locale); } catch { /* Preference is best effort. */ }
  }, [locale]);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    const nextPath = nextLocale === siteConfig.defaultLocale ? "/" : `/${nextLocale}`;
    window.history.replaceState({}, "", nextPath);
    track(analyticsEvents.languageChanged, { locale: nextLocale });
  }

  return <I18nContext.Provider value={{ locale, setLocale, t: getTranslations(locale) }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
