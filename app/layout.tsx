import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import "./globals.css";
import AnalyticsProvider from "./analytics-provider";
import { I18nProvider } from "./i18n-provider";
import ThemeSync from "./theme-sync";
import { siteConfig, supportedLocales } from "@/lib/site-config";

const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MakeMePassword | Private credential generator",
  description:
    "MakeMePassword generates strong passwords, memorable usernames, and checks credentials locally in your browser. Private, fast, and simple.",
  keywords: ["random username generator", "strong password generator", "password strength checker", "username checker", "secure password generator"],
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
    languages: Object.fromEntries(supportedLocales.map((locale) => [locale, locale === "en" ? "/" : `/${locale}`])),
  },
  openGraph: {
    title: "MakeMePassword | Private username and password generator",
    description: "Create a strong password and a username that fits you. Generated locally, ready in seconds.",
    type: "website",
    url: siteConfig.url,
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport = { themeColor: "#f7f4ee" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmMono.variable} ${manrope.variable}`}>
      <body>
        <AnalyticsProvider />
        <ThemeSync />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
