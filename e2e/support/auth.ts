import { type Page, test as base, expect } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * The Playwright auth fixture (spec #29 / ADR 0003 / issue #31). It replaces
 * only the undrivable third-party leg — Google's consent screen and the email
 * inbox — with a real session minted through the `mipin-test` project's service
 * role; everything downstream (the callback's routing, the Shell gate, RLS)
 * runs against the real project.
 *
 * The `authedPage` fixture, per test: creates a confirmed user via the service
 * role, mints a real session, plants the exact `@supabase/ssr` cookies in the
 * page's context, then deletes the user on teardown — cleanup that doubles as
 * a smoke of the service-role deletion path. A test just navigates with the
 * returned page; no user object to reference.
 *
 * Gated behind `RUN_DB_CONNECTIVITY=1` (the same flag `db-connectivity.spec.ts`
 * uses, per the carried-forward CI note on #31): specs that need it must skip
 * when the flag is unset, since the `mipin-test` credentials are not wired in
 * every lane.
 */
export const liveAuthEnabled = process.env.RUN_DB_CONNECTIVITY === "1";

/**
 * Skip a describe when the live-DB credentials aren't wired — call at the top of
 * a describe that uses `authedPage`, so the auth-fixture specs stay skipped (not
 * failed) in lanes without `mipin-test`, mirroring `db-connectivity.spec.ts`.
 */
export function skipWithoutLiveAuth(): void {
  test.skip(
    !liveAuthEnabled,
    "set RUN_DB_CONNECTIVITY=1 (with mipin-test env wired) to run the auth-fixture e2e",
  );
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

// The service-role client (like the app's) pulls in realtime, whose constructor
// wants a global WebSocket that Node < 22 lacks. Realtime is never connected
// here, so a stub constructor satisfies the check without side effects.
if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = class {
    constructor() {
      throw new Error("realtime WebSocket is unused in tests");
    }
  };
}

function requireSupabaseEnv(): {
  url: string;
  publishable: string;
  secret: string;
} {
  if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SECRET_KEY) {
    throw new Error(
      "The auth fixture needs mipin-test credentials (NEXT_PUBLIC_SUPABASE_URL, " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY). Wire .env.local " +
        "or the CI secrets, and gate the spec behind RUN_DB_CONNECTIVITY=1.",
    );
  }
  return { url: SUPABASE_URL, publishable: PUBLISHABLE_KEY, secret: SECRET_KEY };
}

function adminClient() {
  const { url, secret } = requireSupabaseEnv();
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type MintedUser = { id: string; email: string };

/** Create a confirmed test user via the service role. */
async function createUser(): Promise<MintedUser & { password: string }> {
  const email = `e2e+${crypto.randomUUID()}@mipin.test`;
  const password = crypto.randomUUID();
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("createUser returned no user");
  }
  return { id: data.user.id, email, password };
}

/**
 * Delete a test user via the service role — the same `auth.admin.deleteUser`
 * primitive the app's account-deletion action will use.
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) throw error;
}

/**
 * Mint a real session for the user and serialize it into the exact cookies the
 * app's SSR server client reads — by round-tripping through `@supabase/ssr`
 * itself, so the cookie name, encoding and any chunking are never hand-rolled.
 * Cookies are pinned to the localhost test server (non-secure, so they ride
 * over plain http).
 */
async function sessionCookies(email: string, password: string) {
  const { url, publishable } = requireSupabaseEnv();

  const signIn = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await signIn.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw error ?? new Error("signInWithPassword returned no session");
  }

  const jar: { name: string; value: string; options?: { path?: string } }[] =
    [];
  const ssr = createServerClient(url, publishable, {
    cookies: {
      getAll: () => [],
      setAll: (toSet) => {
        jar.push(...toSet);
      },
    },
  });
  await ssr.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  if (jar.length === 0) {
    throw new Error("no auth cookies were serialized from the minted session");
  }

  return jar.map(({ name, value, options }) => ({
    name,
    value,
    domain: "localhost",
    path: options?.path ?? "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  }));
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    const user = await createUser();
    await page
      .context()
      .addCookies(await sessionCookies(user.email, user.password));
    // `use` is Playwright's fixture runner, not a React hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    await deleteUser(user.id);
  },
});

export { expect };
