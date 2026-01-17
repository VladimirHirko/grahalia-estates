export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}

type Dict = Record<string, any>;

// Явная карта импортов — Turbopack это любит, и не глючит
const loaders: Record<Locale, () => Promise<Dict>> = {
  en: async () => (await import("./en.json")).default,
  es: async () => (await import("./es.json")).default,
};

export async function getDictionary(locale: Locale) {
  return loaders[locale]();
}
