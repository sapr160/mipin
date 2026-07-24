import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasProfile } from "@/lib/auth/profile";
import { ONBOARDING_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * The Shell's admission gate (issue #34): return the request's Onboarded athlete,
 * or redirect away — no session → sign-in; a session without a profile row →
 * onboarding. One expression of "admit only Onboarded", shared by the Shell
 * layout and the post-onboarding interstitial so they can't drift apart. It is
 * the exact inverse of the onboarding gate, so the two can never both admit the
 * same visitor. (The sign-in page and `createProfile` route on the same profile
 * signal but branch differently — bounce-into-app vs. create — so they read it
 * directly rather than through this redirect-on-miss helper.)
 */
export async function requireOnboarded(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);
  if (!(await hasProfile(supabase, user.id))) redirect(ONBOARDING_PATH);
  return user;
}
