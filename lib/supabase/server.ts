import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "./env";

/**
 * Server Supabase client for Server Components, Route Handlers, and Server
 * Actions. Reads and refreshes the cookie session per request (official SSR
 * `getAll`/`setAll` pattern). Create a fresh client for every request — never
 * cache one across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` was invoked from a Server Component, where the cookie
            // store is read-only. Safe to ignore: session writes happen in
            // Route Handlers and Server Actions (the spec keeps the proxy
            // DB-free), where this branch succeeds.
          }
        },
      },
    },
  );
}
