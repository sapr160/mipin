"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkDob } from "@/lib/auth/age";
import { isAgeRejected, recordAgeRejection } from "@/lib/auth/age-rejection";
import { hasProfile } from "@/lib/auth/profile";
import {
  ONBOARDING_PATH,
  ONBOARDING_PROFILE_PATH,
  APP_HOME_PATH,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";

/**
 * Onboarding step 1: the date-of-birth gate (issue #32). Reached from the DOB
 * form, this is the server's sole authority on eligibility — the form sends only
 * the raw date, never a verdict.
 *
 * The flow, all decided here:
 *   - no session            → sign-in (the action must never write for an anon);
 *   - already walled         → back to onboarding, where the layout shows the wall
 *                              (idempotent — a re-POST can't un-wall an account);
 *   - already onboarded      → into the app (defends the POST the layout guards on GET);
 *   - malformed / future DOB → re-prompt with an error (not an age claim, so no
 *                              rejection is recorded);
 *   - under 18               → record the permanent rejection, then onboarding →
 *                              the layout renders the Age wall from the new row;
 *   - 18+                    → step 2, creating no profile data yet.
 */
export async function submitDob(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);

  // Honour the existing verdict before doing anything else: a walled or already
  // onboarded account has no business re-running the gate.
  if (await isAgeRejected(supabase, user.id)) redirect(ONBOARDING_PATH);
  if (await hasProfile(supabase, user.id)) redirect(APP_HOME_PATH);

  const result = checkDob(formData.get("dob"));
  if (!result.valid) redirect(`${ONBOARDING_PATH}?error=invalid`);

  if (!result.eligible) {
    await recordAgeRejection(user.id, result.dob);
    redirect(ONBOARDING_PATH);
  }

  // 18+. Step 2 (the profile form) re-validates the DOB itself; this ticket
  // leaves it a stub and creates no profile data yet.
  redirect(ONBOARDING_PROFILE_PATH);
}
