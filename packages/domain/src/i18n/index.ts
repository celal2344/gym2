import en from "./en.json";
import tr from "./tr.json";

export type Locale = "en" | "tr";
export type TranslationKey = keyof typeof en;

export const translations = { en, tr } as const;

export function getLocale(locale?: string): Locale {
  return locale?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function t(key: TranslationKey, locale: Locale = "en"): string {
  return translations[locale][key] ?? translations.en[key] ?? key;
}
