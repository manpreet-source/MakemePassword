import { notFound } from "next/navigation";
import type { Metadata } from "next";
import HomePage from "../page";
import { getTranslations } from "@/lib/i18n";
import { isLocale, siteConfig, supportedLocales } from "@/lib/site-config";
import { I18nProvider } from "../i18n-provider";

export function generateStaticParams() { return supportedLocales.filter((locale) => locale !== "en").map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: value } = await params;
  if (!isLocale(value) || value === "en") return {};
  const translations = getTranslations(value);
  return {
    title: `${translations.password} and ${translations.username} | ${siteConfig.name}`,
    description: translations.heroDescription,
    alternates: {
      canonical: `/${value}`,
      languages: Object.fromEntries(supportedLocales.map((locale) => [locale, locale === "en" ? "/" : `/${locale}`])),
    },
    openGraph: { title: `${translations.password} and ${translations.username} | ${siteConfig.name}`, description: translations.heroDescription, url: `${siteConfig.url}/${value}`, type: "website" },
  };
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale) || locale === "en") notFound();
  return <I18nProvider initialLocale={locale}><HomePage /></I18nProvider>;
}
