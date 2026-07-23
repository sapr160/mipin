import "server-only";

/**
 * Reads the Supabase environment variables shared by the server and
 * service-role clients. Dev and e2e point these at the `mipin-test` project;
 * production values live only in Vercel (ADR 0003).
 *
 * Server-side only — enforced by the `server-only` import above: `process.env`
 * dynamic access works in the Node runtime, but would silently be `undefined`
 * in a client bundle. The browser client (`client.ts`) deliberately reads its
 * two public vars with *static* `NEXT_PUBLIC_*` keys instead, because Next only
 * inlines those into the client bundle when the key is a literal.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `See .env.example — dev/e2e point at mipin-test, production keys live in Vercel.`,
    );
  }
  return value;
}
