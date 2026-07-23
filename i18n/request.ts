import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isLocale, LOCALE_COOKIE, negotiateLocale } from "./config";

/**
 * next-intl "without i18n routing" mode: the active locale comes from the
 * cookie when present (an explicit toggle choice, per ADR 0002), otherwise it
 * is negotiated from `Accept-Language` so the very first visit renders in the
 * right language before the persistence cookie has taken effect.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  const locale = isLocale(cookieLocale)
    ? cookieLocale
    : negotiateLocale((await headers()).get("accept-language"));

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
