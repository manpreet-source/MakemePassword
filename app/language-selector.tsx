"use client";

import { localeNames } from "@/lib/i18n";
import { supportedLocales } from "@/lib/site-config";
import { useI18n } from "./i18n-provider";

export default function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="language-selector">
      <span aria-hidden="true">◎</span>
      <span className="sr-only">{t.language}</span>
      <select value={locale} aria-label={t.language} onChange={(event) => setLocale(event.target.value as typeof locale)}>
        {supportedLocales.map((item) => <option value={item} key={item}>{localeNames[item]}</option>)}
      </select>
    </label>
  );
}
