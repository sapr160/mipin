import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for Client Components. Uses the publishable
 * ("anon") key and stays in sync with the cookie session the server writes,
 * following the official SSR pattern. Safe to bundle — it carries no secret.
 *
 * The two vars are referenced by *literal* name so Next inlines them into the
 * client bundle; a dynamic `process.env[name]` lookup would resolve to
 * `undefined` in the browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
