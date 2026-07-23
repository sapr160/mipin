import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasProfile } from "@/lib/auth/profile";
import {
  APP_HOME_PATH,
  ONBOARDING_PATH,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";

/**
 * The single post-auth handler for both sign-in methods (spec #29 / issue #31):
 * Google OAuth and the email magic link both land here with a PKCE `code`. It
 * exchanges the code for a cookie session, then owns the one post-auth routing
 * decision: an account with a profile goes into the app, everyone else to
 * onboarding.
 *
 * That routing honours the Age wall (issue #32) without a branch here: a walled
 * account has no profile, so it lands on onboarding — where the onboarding layout
 * renders the wall from the account's rejection row. The layout is the single
 * owner of wall-vs-form, so it can't be walked around by a deep link, and the
 * callback needs only to route profile-less accounts there. (`hasProfile` still
 * reports false for everyone until the profile-table ticket, so every fresh
 * sign-in reaches onboarding for now.)
 *
 * A missing or unusable code bounces back to the sign-in page rather than
 * erroring, so a stale or tampered link is a soft failure, not a 500.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL(`${SIGN_IN_PATH}?error=missing_code`, origin),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`${SIGN_IN_PATH}?error=exchange_failed`, origin),
    );
  }

  const destination = (await hasProfile(supabase, data.user.id))
    ? APP_HOME_PATH
    : ONBOARDING_PATH;

  return NextResponse.redirect(new URL(destination, origin));
}
