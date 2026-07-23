import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingTable } from "@/lib/supabase/errors";

/**
 * Whether the signed-in user has an onboarding-complete `profiles` row — the
 * single signal the callback uses to route a fresh sign-in to the app vs. to
 * onboarding.
 *
 * The `profiles` table lands in cluster 3.3 (spec #29). Until it exists this
 * necessarily reports `false`, so every sign-in routes to onboarding — which is
 * the correct behaviour for a brand-new account anyway. Written to light up
 * unchanged once the table and its RLS exist: it selects the caller's own row
 * and treats a not-yet-created table exactly like a missing row. Any other error
 * is a real fault and propagates.
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
