import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { DELEGATION_CODES, DISCIPLINE_CODES } from "@/lib/vocab";

/**
 * The drift guard for the generated `profiles` CHECK constraints (issue #34).
 * The migration's delegation and sport value lists are produced from the
 * vocabulary source arrays by scripts/gen-profiles-migration.mjs; a pushed
 * migration is append-only (ADR 0001), so nothing re-runs the generator after the
 * fact. This spec is what keeps the checked-in SQL honest: it reads the migration
 * and asserts each CHECK list is exactly the vocabulary, in order. If the arrays
 * change, this fails until a NEW migration re-generates the constraint — never by
 * editing the old one.
 *
 * Like vocab.spec.ts it drives no page; it lives in the e2e dir only because
 * Playwright is the repo's single test runner.
 */

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

function profilesMigration(): string {
  const file = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith("_profiles.sql"))
    .sort()
    .at(-1);
  expect(file, "a *_profiles.sql migration exists").toBeTruthy();
  return readFileSync(join(MIGRATIONS_DIR, file!), "utf8");
}

/** The quoted codes inside `<column> in ( … )`, in file order. */
function checkList(sql: string, column: string): string[] {
  const match = new RegExp(`\\b${column} in \\(([\\s\\S]*?)\\)`).exec(sql);
  expect(match, `${column} CHECK list is present`).toBeTruthy();
  return [...match![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

test.describe("the profiles migration CHECK constraints", () => {
  test("delegation values are exactly the vocabulary, in order", () => {
    expect(checkList(profilesMigration(), "delegation")).toEqual([
      ...DELEGATION_CODES,
    ]);
  });

  test("sport values are exactly the vocabulary, in order", () => {
    expect(checkList(profilesMigration(), "sport")).toEqual([
      ...DISCIPLINE_CODES,
    ]);
  });
});
