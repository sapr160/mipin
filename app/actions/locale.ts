"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isMissingTable } from "@/lib/supabase/errors";
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
 *
 * For a signed-in athlete the choice is ALSO written onto their `profiles` row,
 * so it follows the account rather than just the browser — completing the locale
 * persistence chain begun at onboarding (issue #5 / #35). The cookie is set
 * first and unconditionally, so the language always switches even for a
 * signed-out visitor or if the profile write is a no-op; a pre-migration
 * database (no `profiles` table) is tolerated exactly as `hasProfile` does.
 */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  // Signed-in only: also persist onto the profile row so the choice follows the
  // account, not just the browser (issue #5 / #35). `getUser` is the authenticated
  // check the rest of the app uses; for a signed-out visitor it returns null
  // without a network round-trip (there is no session to validate), so the
  // cookie-only path is unchanged. The update is RLS-scoped to the caller's own
  // row (`auth.uid() = id`); a not-yet-onboarded account matches zero rows, and a
  // pre-migration database is tolerated exactly as `hasProfile` does.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ locale })
    .eq("id", user.id);
  if (error && !isMissingTable(error)) throw error;
}
