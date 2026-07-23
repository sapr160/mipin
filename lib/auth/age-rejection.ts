import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { isMissingTable } from "@/lib/supabase/errors";

const TABLE = "age_rejections";

/**
 * Whether this account is permanently walled — an `age_rejections` row exists for
 * it. Read through the caller's own session client (`age_rejections` is
 * owner-select-only under RLS), so an account can only ever see its own verdict.
 * The onboarding layout and the post-auth callback use this to render the Age
 * wall instead of onboarding.
 *
 * Mirrors `hasProfile`: a not-yet-created table reads as "no rejection", so the
 * gate behaves correctly on a database that predates the `age_rejections`
 * migration. Any other error is a real fault and propagates.
 */
export async function isAgeRejected(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return false;
    throw error;
  }

  return data !== null;
}

/**
 * Permanently wall an account by recording its under-18 submission. Written with
 * the service role because RLS grants no client any write on `age_rejections`
 * (the "no client writes" guarantee) — this trusted server path is the sole
 * writer.
 *
 * Idempotent: a repeat submission for an already-walled account is ignored rather
 * than overwriting the first recorded DOB, so the original evidence stands.
 */
export async function recordAgeRejection(
  userId: string,
  submittedDob: string,
): Promise<void> {
  const service = createServiceClient();
  const { error } = await service.from(TABLE).upsert(
    { user_id: userId, submitted_dob: submittedDob },
    { onConflict: "user_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}
