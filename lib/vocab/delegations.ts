/**
 * The 37 delegations competing at the Central American and Caribbean Games,
 * Santo Domingo 2026 — the single source of truth for delegation pickers, card
 * rendering, and future CHECK-constraint generation (issue #33 / spec #29).
 *
 * `code` is the delegation's ISO 3166-1 alpha-2 code (uppercase, unique) and is
 * the stable identifier stored in the database. `es` is the official Spanish
 * name as curated in the research; `en` is the common English name. Rows are
 * sorted by Spanish name, matching research/delegations-sports.md (issue #13),
 * where the per-row source citations and the 37-vs-38 (Anguilla) conflict are
 * recorded — they are deliberately not duplicated here. Count, code
 * validity/uniqueness, and bilingual completeness are asserted at the repo's
 * test seam in e2e/vocab.spec.ts.
 */
export type Delegation = {
  /** ISO 3166-1 alpha-2 code, uppercase. Stable identifier and DB value. */
  readonly code: string;
  /** Official Spanish name (jcc2026.org, as curated in the research). */
  readonly es: string;
  /** Common English name. */
  readonly en: string;
};

export const DELEGATIONS = [
  { code: "AG", es: "Antigua y Barbuda", en: "Antigua and Barbuda" },
  { code: "AW", es: "Aruba", en: "Aruba" },
  { code: "BS", es: "Bahamas", en: "Bahamas" },
  { code: "BB", es: "Barbados", en: "Barbados" },
  { code: "BZ", es: "Belice", en: "Belize" },
  { code: "BM", es: "Bermudas", en: "Bermuda" },
  { code: "CO", es: "Colombia", en: "Colombia" },
  { code: "CR", es: "Costa Rica", en: "Costa Rica" },
  { code: "CU", es: "Cuba", en: "Cuba" },
  { code: "CW", es: "Curazao", en: "Curaçao" },
  { code: "DM", es: "Dominica", en: "Dominica" },
  { code: "SV", es: "El Salvador", en: "El Salvador" },
  { code: "GD", es: "Granada", en: "Grenada" },
  { code: "GP", es: "Guadalupe", en: "Guadeloupe" },
  { code: "GT", es: "Guatemala", en: "Guatemala" },
  { code: "GF", es: "Guayana Francesa", en: "French Guiana" },
  { code: "GY", es: "Guyana", en: "Guyana" },
  { code: "HT", es: "Haití", en: "Haiti" },
  { code: "HN", es: "Honduras", en: "Honduras" },
  { code: "KY", es: "Islas Caimán", en: "Cayman Islands" },
  { code: "TC", es: "Islas Turcas y Caicos", en: "Turks and Caicos Islands" },
  { code: "VG", es: "Islas Vírgenes Británicas", en: "British Virgin Islands" },
  { code: "VI", es: "Islas Vírgenes de EE.UU.", en: "U.S. Virgin Islands" },
  { code: "JM", es: "Jamaica", en: "Jamaica" },
  { code: "MQ", es: "Martinica", en: "Martinique" },
  { code: "MX", es: "México", en: "Mexico" },
  { code: "NI", es: "Nicaragua", en: "Nicaragua" },
  { code: "PA", es: "Panamá", en: "Panama" },
  { code: "PR", es: "Puerto Rico", en: "Puerto Rico" },
  { code: "DO", es: "República Dominicana", en: "Dominican Republic" },
  { code: "KN", es: "San Cristóbal y Nieves", en: "Saint Kitts and Nevis" },
  {
    code: "VC",
    es: "San Vicente y las Granadinas",
    en: "Saint Vincent and the Grenadines",
  },
  { code: "LC", es: "Santa Lucía", en: "Saint Lucia" },
  { code: "SX", es: "Sint Maarten", en: "Sint Maarten" },
  { code: "SR", es: "Surinam", en: "Suriname" },
  { code: "TT", es: "Trinidad y Tobago", en: "Trinidad and Tobago" },
  { code: "VE", es: "Venezuela", en: "Venezuela" },
] as const satisfies readonly Delegation[];
