import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTable } from "@/lib/supabase/errors";
import {
  DEFAULT_SHOW_ME,
  type Gender,
  type ShowMe,
} from "@/lib/auth/profile-form";

/**
 * Whether the signed-in user has an onboarding-complete `profiles` row — the
 * single signal (domain term "Onboarded") the Shell gate, the sign-in page, and
 * the callback all use to route between the app and onboarding.
 *
 * The `profiles` table and its RLS arrive with issue #34; this selects the
 * caller's own row (authenticated-read RLS admits it) and treats a not-yet-created
 * table exactly like a missing row, so the gate still behaves correctly on a
 * database that predates the migration — the correct pre-migration answer is
 * always "not onboarded". Any other error is a real fault and propagates.
 */
export async function hasProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return false;
    throw error;
  }

  return data !== null;
}

/**
 * An athlete's public card — the fields any authenticated feature (feeds, swipe,
 * trade proposals) may read of any profile, and the shape `ProfileCard` renders.
 * Delegation and sport are the stored codes; the caller resolves them to names in
 * the reader's language (issue #35, domain "profiles").
 */
export type PublicProfile = {
  id: string;
  displayName: string;
  delegation: string;
  sport: string;
  gender: Gender;
  bio: string | null;
};

/**
 * The owner's full editable profile: their public card plus the two private
 * fields the Perfil edit form owns — the "show me" audience and the WhatsApp
 * number. Only ever the caller's own rows; RLS wouldn't return another user's
 * private row anyway.
 */
export type OwnProfile = PublicProfile & {
  showMe: ShowMe;
  whatsapp: string | null;
};

/**
 * Read the signed-in athlete's own profile — the public card and the private
 * show-me/WhatsApp fields — for the Perfil tab (issue #35). Returns `null` if the
 * public row is gone (a deleted account racing the Shell gate); a missing private
 * row falls back to the documented defaults rather than failing the page. Unlike
 * `hasProfile` this does not tolerate a missing table: the feature ships with its
 * migration applied, so a missing table here is a real fault and propagates.
 */
export async function getOwnProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<OwnProfile | null> {
  const { data: pub, error: pubError } = await supabase
    .from("profiles")
    .select("id, display_name, delegation, sport, gender, bio")
    .eq("id", userId)
    .maybeSingle();
  if (pubError) throw pubError;
  if (!pub) return null;

  const { data: priv, error: privError } = await supabase
    .from("profiles_private")
    .select("show_me, whatsapp")
    .eq("id", userId)
    .maybeSingle();
  if (privError) throw privError;

  return {
    id: pub.id,
    displayName: pub.display_name,
    delegation: pub.delegation,
    sport: pub.sport,
    gender: pub.gender,
    bio: pub.bio,
    showMe: priv?.show_me ?? DEFAULT_SHOW_ME,
    whatsapp: priv?.whatsapp ?? null,
  };
}
