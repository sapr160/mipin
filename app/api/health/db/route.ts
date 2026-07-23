import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Database connectivity probe (issue #30 / ADR 0003). Proves the running app
 * can reach its configured Supabase project — `mipin-test` in dev/e2e, the
 * production project in production. It performs a schema-free,
 * authenticated-infrastructure check (a minimal service-role Auth admin call)
 * and returns only a boolean, so it leaks no data and works before any product
 * tables exist. Not product UI — infrastructure only.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Surface the reason only outside production, where it aids debugging
    // without exposing configuration details on the live site.
    const detail =
      process.env.NODE_ENV === "production"
        ? undefined
        : error instanceof Error
          ? error.message
          : String(error);
    return NextResponse.json({ ok: false, error: detail }, { status: 503 });
  }
}
