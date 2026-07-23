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
 * exchanges the code for a cookie session, then owns the one routing decision —
 * a user with no profile goes to onboarding, everyone else into the app. (The
 * age-wall branch and the real profile lookup arrive with cluster 3.3; until
 * then `hasProfile` reports false, so every fresh sign-in reaches onboarding.)
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
