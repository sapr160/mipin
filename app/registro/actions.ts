"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkDob } from "@/lib/auth/age";
import { isAgeRejected, recordAgeRejection } from "@/lib/auth/age-rejection";
import { hasProfile, storeProfilePhoto } from "@/lib/auth/profile";
import { parseProfileForm } from "@/lib/auth/profile-form";
import { validatePhotoUpload } from "@/lib/auth/profile-photo";
import {
  DOB_COOKIE,
  ONBOARDING_COOKIE_MAX_AGE,
  WELCOME_COOKIE,
} from "@/lib/auth/onboarding";
import {
  ONBOARDING_PATH,
  ONBOARDING_PROFILE_PATH,
  WELCOME_PATH,
  APP_HOME_PATH,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";
import { defaultLocale, isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { readFirstTouch, SRC_COOKIE } from "@/lib/first-touch";

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
    // The Age wall is decided by the onboarding layout, and this redirect targets
    // the same `/registro` URL the form is on — a soft client navigation that
    // wouldn't re-run that (force-dynamic) layout, leaving the form on screen
    // instead of the wall. Revalidate the path so the layout re-evaluates and
    // renders the wall from the row just recorded.
    revalidatePath(ONBOARDING_PATH);
    redirect(ONBOARDING_PATH);
  }

  // 18+. Carry the eligible DOB to step 2 in a short-lived httpOnly cookie so the
  // client — not the database — holds it between steps. `createProfile` re-runs
  // `checkDob` on it (the server never trusts an age claim twice) and clears it on
  // success, so no profile data is written here.
  const cookieStore = await cookies();
  cookieStore.set(DOB_COOKIE, result.dob, {
    maxAge: ONBOARDING_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  redirect(ONBOARDING_PROFILE_PATH);
}

/**
 * Onboarding step 2 (issue #34): the profile form's submit. This is the moment a
 * signed-in account becomes an Onboarded athlete — it creates the public
 * `profiles` row and the private `profiles_private` row in one transaction, and
 * the existence of that public row is the Onboarded state the Shell admits on.
 *
 * The order is deliberate, and every step is the server's decision (the client is
 * never trusted):
 *   - no session / walled / already onboarded → same guards the layout enforces
 *     on GET, re-checked here so a direct POST can't slip past them;
 *   - the DOB is re-validated from the cookie step 1 set (never trusted twice):
 *     absent → back to step 1; malformed → step-1 error; under-18 → the rejection
 *     is recorded and the account walled, exactly as at step 1;
 *   - every profile field is validated (`parseProfileForm`); a tampered or JS-off
 *     submission re-renders the form generically;
 *   - `create_profile` writes both rows atomically, stamping the two consent
 *     timestamps and copying in the request's locale and first-touch source;
 *   - the carried DOB is cleared and the one-shot Share-prompt cookie is set, then
 *     the athlete lands on the "comparte con tu equipo" interstitial.
 */
export async function createProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);

  if (await isAgeRejected(supabase, user.id)) redirect(ONBOARDING_PATH);
  if (await hasProfile(supabase, user.id)) redirect(APP_HOME_PATH);

  const cookieStore = await cookies();

  // Re-validate the DOB carried from step 1. A missing cookie means step 1 wasn't
  // completed (start over); anything malformed or under-18 is treated exactly as
  // it would be at step 1 — an under-18 claim here still permanently walls the
  // account, so the gate can't be bypassed by posting straight to step 2.
  const carriedDob = cookieStore.get(DOB_COOKIE)?.value;
  if (!carriedDob) redirect(ONBOARDING_PATH);
  const dob = checkDob(carriedDob);
  if (!dob.valid) redirect(`${ONBOARDING_PATH}?error=invalid`);
  if (!dob.eligible) {
    await recordAgeRejection(user.id, dob.dob);
    // Same as step 1: revalidate so the onboarding layout re-evaluates and shows
    // the Age wall rather than leaving a stale form after the soft redirect.
    revalidatePath(ONBOARDING_PATH);
    redirect(ONBOARDING_PATH);
  }

  const parsed = parseProfileForm(formData);
  if (!parsed.ok) redirect(`${ONBOARDING_PROFILE_PATH}?error=1`);
  const { displayName, delegation, sport, gender, showMe, bio } = parsed.values;

  // The optional photo (issue #36) is validated BEFORE the profile is created, so
  // a bad file re-renders the form generically like any other field — once
  // create_profile commits there is no form to return to. The bytes are stored
  // only after the commit (below), as best-effort.
  const photo = validatePhotoUpload(formData.get("photo"));
  if (!photo.ok) redirect(`${ONBOARDING_PROFILE_PATH}?error=1`);

  // Copy the request's language and first-touch attribution onto the rows (spec
  // user stories 24 & 29). Locale falls back to the default; first-touch is null
  // for a visitor who never arrived via a tagged link.
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(localeCookie) ? localeCookie : defaultLocale;
  const firstTouch = readFirstTouch(cookieStore.get(SRC_COOKIE)?.value);

  const { error } = await supabase.rpc("create_profile", {
    p_display_name: displayName,
    p_delegation: delegation,
    p_sport: sport,
    p_gender: gender,
    p_bio: bio,
    p_locale: locale,
    p_dob: dob.dob,
    p_show_me: showMe,
    p_first_touch_source: firstTouch,
  });
  if (error) throw error;

  // Onboarded now (create_profile committed). Store the optional photo
  // best-effort: the account is already onboarded, so a storage hiccup must not
  // fail the flow — the athlete can add a photo later in Perfil. A successful
  // upload lands it in the 'pending' state, shown to no one until approved.
  if (photo.file) {
    try {
      await storeProfilePhoto(supabase, user.id, photo.file);
    } catch {
      // Swallowed deliberately: onboarding succeeded; the photo is optional.
    }
  }

  // Drop the carried DOB and arm the one-time Share prompt.
  cookieStore.delete(DOB_COOKIE);
  cookieStore.set(WELCOME_COOKIE, "1", {
    maxAge: ONBOARDING_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  redirect(WELCOME_PATH);
}
