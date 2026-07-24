/**
 * The Santo Domingo 2026 vocabulary: the two picker-level source-of-truth
 * arrays for delegations and disciplines (issue #33 / spec #29). Pure data with
 * no framework dependencies, so it can be imported by Server Components, Client
 * Components, and future migration/CHECK-constraint tooling alike.
 */
export type { Delegation } from "./delegations";
export { DELEGATIONS } from "./delegations";
export type { Discipline } from "./disciplines";
export { DISCIPLINES } from "./disciplines";

import { DELEGATIONS } from "./delegations";
import { DISCIPLINES } from "./disciplines";

/**
 * The bare `code` values, in source order — the exact strings stored in the
 * database and guarded by the `profiles` CHECK constraints. Derived from the
 * source arrays so the picker, the form validator, and the migration generator
 * all read one list (issue #34).
 */
export const DELEGATION_CODES: readonly string[] = DELEGATIONS.map(
  (d) => d.code,
);
export const DISCIPLINE_CODES: readonly string[] = DISCIPLINES.map(
  (d) => d.code,
);

const delegationCodeSet = new Set<string>(DELEGATION_CODES);
const disciplineCodeSet = new Set<string>(DISCIPLINE_CODES);

/** Whether `value` is a recognised delegation code (a valid `profiles.delegation`). */
export function isDelegationCode(value: unknown): value is string {
  return typeof value === "string" && delegationCodeSet.has(value);
}

/** Whether `value` is a recognised discipline code (a valid `profiles.sport`). */
export function isDisciplineCode(value: unknown): value is string {
  return typeof value === "string" && disciplineCodeSet.has(value);
}
