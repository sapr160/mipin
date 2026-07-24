import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTable } from "@/lib/supabase/errors";

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
