export const supportedLocales = ["en", "hi", "es", "fr", "de", "pt", "ar", "zh", "ja", "ko"] as const;

export type Locale = (typeof supportedLocales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ar: "العربية",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

export const siteConfig = {
  name: "MakeMePassword",
  url: "https://makemepassword.com",
  defaultLocale: "en" as Locale,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
  socialLinks: {
    x: process.env.NEXT_PUBLIC_SOCIAL_X ?? "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "",
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "",
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? "",
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "",
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK ?? "",
    github: process.env.NEXT_PUBLIC_SOCIAL_GITHUB ?? "",
    reddit: process.env.NEXT_PUBLIC_SOCIAL_REDDIT ?? "",
    discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD ?? "",
  },
  legalLinks: {
    privacy: "/#faq",
    terms: "/#faq",
  },
} as const;

export function isLocale(value: string): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function localePath(locale: Locale): string {
  return locale === siteConfig.defaultLocale ? "/" : `/${locale}`;
}
