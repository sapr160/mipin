import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

/**
 * Service-role Supabase client: authenticates with the secret key and bypasses
 * RLS. Reserved for trusted server code (account deletion via `auth.admin`,
 * moderation reads, the connectivity probe).
 *
 * The `server-only` import turns any attempt to import this from a Client
 * Component into a build error, so the secret key can never reach the browser
 * bundle (issue #30 / ADR 0003). No session is persisted — each call is a
 * fresh, stateless admin context authenticated by the key, not a user cookie.
 */
export function createServiceClient() {
  return createSupabaseClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
