"use server";

import { cookies } from "next/headers";
import {
  COOKIE_MAX_AGE,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";

/**
 * Persist an explicit language choice. Because the request config reads this
 * cookie before negotiating `Accept-Language`, writing it here makes the choice
 * win over browser auto-detection permanently (ADR 0002).
 */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}
