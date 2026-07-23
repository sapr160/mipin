import { redirect } from "next/navigation";
import { AgeWall } from "@/components/auth/AgeWall";
import { createClient } from "@/lib/supabase/server";
import { hasProfile } from "@/lib/auth/profile";
import { isAgeRejected } from "@/lib/auth/age-rejection";
import { SIGN_IN_PATH, APP_HOME_PATH } from "@/lib/auth/routes";

/**
 * The onboarding gate (spec #29 / issue #32), the single owner of "wall vs.
 * form" for every route under `/registro`. It asserts the inverse of the Shell
 * gate — a session, but not yet an app-ready identity:
 *
 *   - no session   → sign-in;
 *   - Age wall      → the permanent refusal screen (a rejection row exists);
 *   - onboarded     → into the app (an Onboarded athlete never sees stale flows;
 *                     `hasProfile` is always false until the profile-table ticket,
 *                     so this branch is wired now and lights up then);
 *   - otherwise     → the onboarding step (children).
 *
 * Because every onboarding route is wrapped here, a walled account sees the wall
 * on step 1, step 2, or any deep link alike — the gate can't be walked around.
 *
 * Forced dynamic: it reads the session and the account's wall/profile state per
 * request, never at build time.
 */
export const dynamic = "force-dynamic";

export default async function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(SIGN_IN_PATH);
  if (await isAgeRejected(supabase, user.id)) return <AgeWall />;
  if (await hasProfile(supabase, user.id)) redirect(APP_HOME_PATH);

  return <>{children}</>;
}
