/**
 * The profile photo's pending-model logic (issue #36 / spec #29, the one-photo /
 * one-state model of issue #5). Pure and framework-free — no session, no
 * database, no Storage client — so it is the single source of truth both the
 * server-only signed-URL helper and the presentational `ProfileCard` funnel
 * through, and it can be asserted directly (e2e/profile-photo.spec.ts).
 *
 * The state machine itself lives in the database (only the dashboard flips
 * approved/rejected until the admin panel ships); this module owns the *render*
 * decision derived from that state, plus the upload validation and the fixed
 * storage path scheme.
 */

/** The three photo states; a null state (elsewhere) means "no photo". */
export const PHOTO_STATES = ["pending", "approved", "rejected"] as const;
export type PhotoState = (typeof PHOTO_STATES)[number];

/**
 * The private Storage bucket every profile photo lives in. Never public: the
 * only read path is a short-lived signed URL minted server-side (see the
 * signed-URL helper), so the visibility rule above — not the bucket ACL — decides
 * who sees a photo.
 */
export const PHOTO_BUCKET = "profile-photos";

/**
 * The one fixed object path a user's photo occupies — a single object per owner,
 * folder-scoped by their auth id. The first path segment being the user id is
 * exactly what the storage RLS keys the owner-write policy on
 * (`(storage.foldername(name))[1] = auth.uid()`), and `set_profile_photo()`
 * recomputes the identical string when it records the path. This function and
 * that RPC are the two halves that must agree; keep them in lockstep. A fixed
 * name (no extension) means a replacement upsert overwrites the same object
 * regardless of the new file's type.
 */
export function profilePhotoPath(userId: string): string {
  return `${userId}/photo`;
}

/**
 * The content types a profile photo may be. Mirrors the `allowed_mime_types` on
 * the bucket (the migration), so the app rejects the same set the Storage API
 * would — defence in depth, and a friendlier error than a raw 400 from Storage.
 */
export const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/**
 * The upload size ceiling in bytes (5 MiB). Mirrors the bucket's
 * `file_size_limit`; the same two-source rule as the WhatsApp pattern's CHECK.
 */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * The result of validating a submitted upload: a valid image `file` to send to
 * Storage, `file: null` when the (optional) input was left empty so there is
 * nothing to upload, or `ok: false` when a file was chosen but is the wrong type
 * or too large — the callers re-render their form with a generic notice, exactly
 * as `parseProfileForm` does for a bad field.
 */
export type PhotoUploadResult =
  | { ok: true; file: File | null }
  | { ok: false };

/**
 * Validate a photo submitted through a multipart form field. An untouched file
 * input submits a zero-byte `File` (and an absent field is `null`); either is
 * "no photo" — reported as `file: null`, not an error, so the optional onboarding
 * upload simply skips it. A chosen file must be an allowed image type and within
 * the size limit; anything else fails the whole submission.
 */
export function validatePhotoUpload(
  value: FormDataEntryValue | null,
): PhotoUploadResult {
  // Not a file part, or an empty file input → nothing to upload.
  if (!(value instanceof File) || value.size === 0) {
    return { ok: true, file: null };
  }
  if (value.size > MAX_PHOTO_BYTES) return { ok: false };
  if (!(ALLOWED_PHOTO_TYPES as readonly string[]).includes(value.type)) {
    return { ok: false };
  }
  return { ok: true, file: value };
}

/** The neutral no-photo placeholder: an initial to draw on a coloured disc. */
export type PhotoPlaceholder = { initial: string; hue: number };

/**
 * The neutral placeholder shown wherever a real photo isn't (no photo, another
 * athlete's un-approved photo, the owner's rejected photo): the display name's
 * first letter on a coloured disc (AC "initial on colored disc"). The hue is a
 * deterministic hash of the name, so the same athlete always gets the same colour
 * across sessions and viewers, and different athletes spread across the wheel.
 * Presentational callers turn `hue` into the disc colour; leading/trailing
 * whitespace is ignored so it can't shift the letter or the colour. An empty name
 * (nothing usable) falls back to a neutral glyph.
 */
export function photoPlaceholder(displayName: string): PhotoPlaceholder {
  const trimmed = displayName.trim();
  const initial = trimmed ? [...trimmed][0].toUpperCase() : "?";

  // FNV-1a over the trimmed name (or the fallback glyph, so an empty name still
  // has a defined hue). A stable string hash, not cryptographic — colour only.
  let hash = 0x811c9dc5;
  for (const ch of trimmed || "?") {
    hash ^= ch.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  const hue = Math.abs(hash) % 360;

  return { initial, hue };
}

/**
 * What to render for a profile photo, given its moderation state and whether the
 * viewer is the photo's owner — the whole visibility rule in one pure function:
 *
 *   - approved            → the photo, to everyone (no badge);
 *   - pending, to owner   → the photo, with the "Pending approval" badge;
 *   - pending, to others  → the neutral placeholder (unreviewed is never shown);
 *   - rejected, to owner  → the placeholder, and `rejected` so the owner gets the
 *                           generic "try another" notice + a re-upload slot;
 *   - rejected, to others → the placeholder (others never learn it was rejected);
 *   - no photo (null)     → the placeholder, for everyone.
 *
 * The invariant the whole feature rests on: a photo is shown to a non-owner only
 * when its state is exactly `approved`.
 */
export type PhotoDisposition =
  | { render: "photo"; pending: boolean }
  | { render: "placeholder"; rejected: boolean };

/**
 * A resolved, renderable photo: the signed image URL and whether to draw the
 * "pending approval" badge over it. The shared shape between the signed-URL
 * helper's output (`ResolvedPhoto.photo`) and what `ProfileCard` renders, so the
 * two can't drift.
 */
export type ProfilePhoto = { url: string; pending: boolean };

export function photoDisposition(
  state: PhotoState | null,
  isOwner: boolean,
): PhotoDisposition {
  if (state === "approved") return { render: "photo", pending: false };
  if (state === "pending" && isOwner) return { render: "photo", pending: true };
  return { render: "placeholder", rejected: isOwner && state === "rejected" };
}
