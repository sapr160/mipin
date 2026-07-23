import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Whether a PostgREST query failed only because the table doesn't exist yet.
 * PostgREST reports a not-yet-created table as `PGRST205`; some versions surface
 * the raw Postgres `42P01`. Either means the migration that creates the table
 * hasn't been pushed to this project yet.
 *
 * Lets a read treat "table not created" exactly like "no matching row", so
 * profile/age-wall lookups behave correctly on a database that predates their
 * migration — the correct pre-migration answer is always "no row".
 */
export function isMissingTable(error: PostgrestError): boolean {
  return error.code === "PGRST205" || error.code === "42P01";
}
