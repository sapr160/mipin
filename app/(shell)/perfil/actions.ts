"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseProfileEdit } from "@/lib/auth/profile-form";
import { validatePhotoUpload } from "@/lib/auth/profile-photo";
import { storeProfilePhoto } from "@/lib/auth/profile";
import { PERFIL_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * The Perfil tab's edit submit (issue #35): an Onboarded athlete updates their
 * own profile. The sibling of onboarding's `createProfile`, and like it every
 * decision is the server's — the client is never trusted:
 *   - no session → sign-in (the Shell gate enforces this on GET; re-checked here
 *     so a direct POST can't slip past it);
 *   - every field is validated by `parseProfileEdit` (the same rules as
 *     onboarding, plus the optional E.164 WhatsApp number); a tampered or JS-off
 *     submission re-renders the form generically;
 *   - `update_profile` writes the public card and private show-me/WhatsApp fields
 *     in one transaction, scoped by RLS to the caller's own rows.
 *
 * On success it revalidates and returns to the card with a saved notice; the
 * language is not touched here (the header toggle owns `profiles.locale`).
 */
export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);

  const parsed = parseProfileEdit(formData);
  if (!parsed.ok) redirect(`${PERFIL_PATH}?error=1`);
  const { displayName, delegation, sport, gender, showMe, bio, whatsapp } =
    parsed.values;

  const { error } = await supabase.rpc("update_profile", {
    p_display_name: displayName,
    p_delegation: delegation,
    p_sport: sport,
    p_gender: gender,
    p_bio: bio,
    p_show_me: showMe,
    p_whatsapp: whatsapp,
  });
  if (error) throw error;

  revalidatePath(PERFIL_PATH);
  redirect(`${PERFIL_PATH}?saved=1`);
}

/**
 * The Perfil tab's photo upload / replace (issue #36). A dedicated multipart
 * form separate from the field-edit form: uploading is a different concern (and
 * encoding) from editing the text fields, and either can be used without the
 * other. Like every action here the server re-checks the session and never trusts
 * the client — the file is re-validated server-side (`validatePhotoUpload`) against
 * the same type/size rules the bucket enforces.
 *
 * A valid image is stored and its state set to 'pending' by `storeProfilePhoto`;
 * this always resets an existing approved photo to pending, which is the warned
 * "you'll be photo-less until re-approval" behaviour. A missing or invalid file,
 * or a storage failure, re-renders the tab with a generic photo error rather than
 * a 500 — a photo upload is the most failure-prone action in the app.
 */
export async function uploadProfilePhoto(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);

  const result = validatePhotoUpload(formData.get("photo"));
  // The form's file input is required, so an empty submission is a tamper/JS-off
  // case: treat it exactly like an invalid file.
  if (!result.ok || !result.file) redirect(`${PERFIL_PATH}?photoError=1`);

  try {
    await storeProfilePhoto(supabase, user.id, result.file);
  } catch {
    redirect(`${PERFIL_PATH}?photoError=1`);
  }

  revalidatePath(PERFIL_PATH);
  redirect(`${PERFIL_PATH}?photoSaved=1`);
}
