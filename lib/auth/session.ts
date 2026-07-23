import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * The signed-in user for the current request, or null. Wraps the SSR client's
 * `getUser` (which validates the JWT with Supabase, not just the cookie), so the
 * Shell gate and the sign-in page share one session read instead of each
 * re-deriving it.
 */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
