import { NextResponse, type NextRequest } from "next/server";
import {
  COOKIE_MAX_AGE,
  isLocale,
  LOCALE_COOKIE,
  negotiateLocale,
} from "@/i18n/config";
import { readFirstTouch, SRC_COOKIE } from "@/lib/first-touch";

/**
 * Two first-visit, server-side jobs (ADR 0002 + spec #18):
 *  - First-touch source: store the first valid `?src=` once, never overwrite it,
 *    so day-one attribution survives for cluster 3 to copy onto the profile row.
 *  - Locale: persist the `Accept-Language` negotiation in a cookie so later
 *    visits are cookie-driven; the toggle overwrites this to make an explicit
 *    choice win permanently.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const src = readFirstTouch(request.nextUrl.searchParams.get("src"));
  if (src && !request.cookies.has(SRC_COOKIE)) {
    response.cookies.set(SRC_COOKIE, src, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  }

  if (!isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    const locale = negotiateLocale(request.headers.get("accept-language"));
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  // Run on pages, not on Next internals or static files (anything with a dot).
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
