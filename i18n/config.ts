/**
 * Locale-in-cookie i18n (ADR 0002): mipin serves one canonical URL per page and
 * carries the chosen language in a cookie instead of a URL prefix. This module is
 * the single source of truth shared by the request config, the middleware, and
 * the toggle server action.
 */
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

/** Spanish is the source language and the default when nothing else applies. */
export const defaultLocale: Locale = "es";

/** The cookie next-intl reads to pick a locale; also written by the toggle. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * ~13 months (400 days) — the browser cap on cookie lifetime. Shared by every
 * writer of the locale and first-touch cookies so the lifetime lives in one place.
 */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Pick a locale from an `Accept-Language` header. English wins only when the
 * browser expresses a stronger preference for it than for Spanish; every other
 * case (no header, Spanish-first, unknown languages) falls back to Spanish.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  let esQ = -1;
  let enQ = -1;
  for (const part of acceptLanguage.split(",")) {
    const [tag, ...params] = part.trim().split(";");
    const base = tag.trim().toLowerCase().split("-")[0];
    if (!isLocale(base)) continue;

    const qParam = params
      .map((p) => p.trim())
      .find((p) => p.startsWith("q="));
    const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
    const quality = Number.isFinite(q) ? q : 1;

    if (base === "es") esQ = Math.max(esQ, quality);
    else enQ = Math.max(enQ, quality);
  }

  return enQ > esQ ? "en" : defaultLocale;
}
