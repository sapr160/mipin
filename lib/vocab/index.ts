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
