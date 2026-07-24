import { isDelegationCode, isDisciplineCode } from "@/lib/vocab";

/**
 * The step-2 profile form's field vocabulary and its single server-side
 * validator (issue #34 / spec #29). Pure and framework-free — no session, no
 * database — so the form page renders its options from these constants and the
 * `createProfile` action validates every submission through `parseProfileForm`,
 * one source of truth for both. The action never trusts the client's fields; a
 * tampered or JS-off submission that skips a control fails here exactly as an
 * empty one does.
 */

/** Gender values, per spec #29: woman / man / non-binary–other. */
export const GENDERS = ["woman", "man", "nonbinary"] as const;
export type Gender = (typeof GENDERS)[number];

/** "Show me" audiences, per spec #29 / issue #4; `everyone` is the default. */
export const SHOW_ME = ["women", "men", "everyone"] as const;
export type ShowMe = (typeof SHOW_ME)[number];

/** The pre-selected "show me" value (issue #4): show everyone unless narrowed. */
export const DEFAULT_SHOW_ME: ShowMe = "everyone";

/** Name-or-nickname cap — a display name, not a legal document. */
export const MAX_DISPLAY_NAME_LENGTH = 50;

/** The optional bio's ~160-character ceiling (spec user story 13). */
export const MAX_BIO_LENGTH = 160;

/** The validated profile fields, ready to persist. Consents are gates, not fields. */
export type ProfileFields = {
  displayName: string;
  delegation: string;
  sport: string;
  gender: Gender;
  showMe: ShowMe;
  bio: string | null;
};

export type ProfileFormResult =
  | { ok: true; values: ProfileFields }
  | { ok: false };

/**
 * A WhatsApp number in canonical E.164 form: a leading `+`, a non-zero
 * country-code digit, then up to 14 more digits (15 digits total, the E.164
 * maximum). This is the exact string stored in `profiles_private.whatsapp` and
 * mirrored by that column's CHECK constraint (issue #35). It is deliberately
 * strict: we require the `+` because without a country code there is no number to
 * normalise to.
 */
export const WHATSAPP_PATTERN = /^\+[1-9]\d{1,14}$/;

export type WhatsAppResult = { ok: true; value: string | null } | { ok: false };

/**
 * Normalise a raw WhatsApp number to E.164, or reject it. Empty or
 * whitespace-only collapses to `null` (the number is optional, so a blank field
 * stores nothing). Otherwise the common formatting characters a person types —
 * spaces, hyphens, parentheses, dots — are stripped and the result must be a
 * valid E.164 string; anything else (a missing `+`, letters, an over-length or
 * `+0…` number) is rejected so the action can re-render the form generically,
 * exactly as `parseProfileForm` does for the other fields.
 */
export function normalizeWhatsApp(
  value: FormDataEntryValue | null,
): WhatsAppResult {
  const raw = trimmed(value);
  if (raw.length === 0) return { ok: true, value: null };

  const compact = raw.replace(/[\s().-]/g, "");
  if (!WHATSAPP_PATTERN.test(compact)) return { ok: false };
  return { ok: true, value: compact };
}

function isGender(value: unknown): value is Gender {
  return (
    typeof value === "string" && (GENDERS as readonly string[]).includes(value)
  );
}

function isShowMe(value: unknown): value is ShowMe {
  return (
    typeof value === "string" && (SHOW_ME as readonly string[]).includes(value)
  );
}

/** A trimmed string value, or `""` for anything that isn't a string field. */
function trimmed(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A checkbox submits a value only when ticked, and nothing when unticked — so a
 * present, non-empty value is the "checked" signal and absence is "unchecked".
 */
function isChecked(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validate the six profile fields — name, delegation, sport, gender, show-me,
 * bio — shared by onboarding's `createProfile` and the Perfil tab's
 * `updateProfile` (issue #35), so both enforce the identical rules. Returns the
 * persist-ready fields, or `null` when any control is missing or out of range;
 * the callers re-render their form generically rather than narrate which field a
 * tampering client omitted. The bio is the only optional field; empty or
 * whitespace-only collapses to `null` so a blank textarea stores no bio. Consent
 * is deliberately not checked here — it gates creation, not the fields.
 */
export function parseProfileFields(formData: FormData): ProfileFields | null {
  const displayName = trimmed(formData.get("display_name"));
  if (!displayName || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return null;
  }

  const delegation = formData.get("delegation");
  if (!isDelegationCode(delegation)) return null;

  const sport = formData.get("sport");
  if (!isDisciplineCode(sport)) return null;

  const gender = formData.get("gender");
  if (!isGender(gender)) return null;

  const showMe = formData.get("show_me");
  if (!isShowMe(showMe)) return null;

  const bioText = trimmed(formData.get("bio"));
  const bio = bioText.length === 0 ? null : bioText;
  if (bio !== null && bio.length > MAX_BIO_LENGTH) return null;

  return { displayName, delegation, sport, gender, showMe, bio };
}

/**
 * Validate a step-2 (onboarding) submission end to end: the shared fields plus
 * the two required consent checkboxes (spec user story 14): 18+/accuracy and
 * ToS + Privacy. Their acceptance is recorded as timestamps by the creation RPC,
 * so they gate the submission but carry no stored value here.
 */
export function parseProfileForm(formData: FormData): ProfileFormResult {
  const values = parseProfileFields(formData);
  if (!values) return { ok: false };

  if (
    !isChecked(formData.get("consent_age")) ||
    !isChecked(formData.get("consent_terms"))
  ) {
    return { ok: false };
  }

  return { ok: true, values };
}

/** The edit form's fields: the shared profile fields plus the WhatsApp number. */
export type ProfileEditFields = ProfileFields & { whatsapp: string | null };

export type ProfileEditResult =
  | { ok: true; values: ProfileEditFields }
  | { ok: false };

/**
 * Validate a Perfil-tab edit submission (issue #35): the same six fields as
 * onboarding — with the same rules, via `parseProfileFields` — plus the optional
 * E.164 WhatsApp number. No consent is required; consent was recorded at
 * creation and editing never re-collects it. Any invalid field or a present but
 * malformed number fails the whole submission, and the action re-renders the
 * form generically.
 */
export function parseProfileEdit(formData: FormData): ProfileEditResult {
  const fields = parseProfileFields(formData);
  if (!fields) return { ok: false };

  const whatsapp = normalizeWhatsApp(formData.get("whatsapp"));
  if (!whatsapp.ok) return { ok: false };

  return { ok: true, values: { ...fields, whatsapp: whatsapp.value } };
}
