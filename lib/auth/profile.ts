import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTable } from "@/lib/supabase/errors";
import { createServiceClient } from "@/lib/supabase/service";
import {
  DEFAULT_SHOW_ME,
  type Gender,
  type ShowMe,
} from "@/lib/auth/profile-form";
import {
  PHOTO_BUCKET,
  photoDisposition,
  profilePhotoPath,
  type PhotoState,
  type ProfilePhoto,
} from "@/lib/auth/profile-photo";

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
  /**
   * The photo's Storage object key and moderation state (issue #36); both null
   * when there's no photo. Never render the path directly — it names a private
   * object with no client read policy. Pass these to `resolveProfilePhoto`, which
   * applies the visibility rule and mints the only valid read URL.
   */
  photoPath: string | null;
  photoState: PhotoState | null;
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
    .select("id, display_name, delegation, sport, gender, bio, photo_path, photo_state")
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
    photoPath: pub.photo_path,
    photoState: pub.photo_state as PhotoState | null,
    showMe: priv?.show_me ?? DEFAULT_SHOW_ME,
    whatsapp: priv?.whatsapp ?? null,
  };
}

/**
 * What to render for a profile's photo (issue #36): a signed image URL, or null
 * to fall back to the placeholder, plus the owner-only `rejected` flag that
 * drives the generic "try another" notice. This is the ONLY path that turns a
 * stored photo into something renderable.
 */
export type ResolvedPhoto = {
  photo: ProfilePhoto | null;
  rejected: boolean;
};

/**
 * How long a minted photo URL stays valid. The card is server-rendered per
 * request and the browser fetches the image immediately, so this only needs to
 * outlast page load; short by design, since a signed URL is a bearer token.
 */
const PHOTO_URL_TTL_SECONDS = 120;

/**
 * Resolve a profile's photo for rendering, enforcing the visibility rule
 * (`photoDisposition`) and then — only when a photo should be shown — minting a
 * short-lived signed URL through the service role. The service role is used
 * deliberately: the bucket is private with no client read policy, so this helper
 * is the single gate deciding who sees a photo, not Storage's ACL. A viewer is
 * the owner iff they're looking at their own row; callers pass that in.
 *
 * Fails safe to the placeholder if the state says a photo exists but the object
 * can't be signed (e.g. an upload that never completed) — a broken image should
 * never reach the page, and an un-signable object is indistinguishable from none.
 */
export async function resolveProfilePhoto(
  profile: Pick<PublicProfile, "photoPath" | "photoState">,
  isOwner: boolean,
): Promise<ResolvedPhoto> {
  const disposition = photoDisposition(profile.photoState, isOwner);
  if (disposition.render === "placeholder") {
    return { photo: null, rejected: disposition.rejected };
  }

  // render === "photo": the state admits it and, for a non-owner, that state is
  // necessarily 'approved'. Mint the signed URL.
  if (!profile.photoPath) return { photo: null, rejected: false };

  const { data, error } = await createServiceClient()
    .storage.from(PHOTO_BUCKET)
    .createSignedUrl(profile.photoPath, PHOTO_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return { photo: null, rejected: false };

  return {
    photo: { url: data.signedUrl, pending: disposition.pending },
    rejected: false,
  };
}

/**
 * Upload an athlete's photo and move it to 'pending' — the app's only photo write
 * path (issue #36), shared by onboarding and the Perfil replace.
 *
 * The bytes are written by the SERVICE role, not the caller's client. This
 * project's Storage API does not verify end-user JWTs — it treats even a valid
 * authenticated upload as anonymous — so an athlete's own client cannot write to
 * Storage at all. The service role writes to the path derived from the *session's*
 * user id (`profilePhotoPath(userId)`), so a caller can still only ever touch
 * their own `<uid>/photo`: the ownership guarantee moves from Storage RLS to this
 * server-side path binding. The owner-write RLS stays as defence in depth for a
 * Storage service that does verify user JWTs. Recording the path+state, by
 * contrast, goes through PostgREST — which DOES verify the JWT — so
 * `set_profile_photo` runs as the caller (`supabase`), auth.uid() resolves, and
 * the RPC can only ever set 'pending' (never approve/reject).
 *
 * Order is upload-then-record, deliberately: the object exists before the row
 * claims it, so a failed upload never leaves a row pointing at nothing (the RPC
 * simply doesn't run), which keeps the optional onboarding upload safe to treat
 * as best-effort. The cost is a sub-second window on *replacing* an
 * already-approved photo where the new bytes sit under the old 'approved' state;
 * for a hand-moderated MVP that window is an accepted trade-off, to be closed when
 * the moderation state machine ships (cluster 5). Throws on either failure; the
 * caller decides whether that blocks its flow.
 */
export async function storeProfilePhoto(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<void> {
  const { error: uploadError } = await createServiceClient()
    .storage.from(PHOTO_BUCKET)
    .upload(profilePhotoPath(userId), file, {
      upsert: true,
      contentType: file.type,
    });
  if (uploadError) throw uploadError;

  const { error: rpcError } = await supabase.rpc("set_profile_photo");
  if (rpcError) throw rpcError;
}
