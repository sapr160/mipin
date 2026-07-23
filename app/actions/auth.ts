"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LANDING_PATH } from "@/lib/auth/routes";

/**
 * Sign out and return to the Landing (issue #31). Runs as a Server Action, so
 * the SSR client's cookie writes (clearing the session) reach the response;
 * `redirect` then sends the now-signed-out visitor back to the logged-out home.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LANDING_PATH);
}
