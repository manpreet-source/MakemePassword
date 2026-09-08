import type { MetadataRoute } from "next";
import { siteConfig, supportedLocales } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    ...supportedLocales.map((locale) => ({
      url: locale === "en" ? `${siteConfig.url}/` : `${siteConfig.url}/${locale}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 1,
      alternates: { languages: Object.fromEntries(supportedLocales.map((item) => [item, item === "en" ? `${siteConfig.url}/` : `${siteConfig.url}/${item}`])) },
    })),
    { url: `${siteConfig.url}/support`, lastModified, changeFrequency: "monthly" as const, priority: 0.6 },
  ];
}
