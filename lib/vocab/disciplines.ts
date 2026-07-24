/**
 * The 55 picker-level disciplines of the Central American and Caribbean Games,
 * Santo Domingo 2026 — the single source of truth for the sport picker, card
 * rendering, and future CHECK-constraint generation (issue #33 / spec #29).
 * This is the official venue-filter discipline list (e.g. cycling split into 4,
 * aquatics into 5), not the coarser "40 sports" grouping.
 *
 * `code` is a stable, URL-safe kebab-case slug and is the identifier stored in
 * the database. Slugs are hand-authored from the English name once and then
 * frozen: they are the stable key, deliberately decoupled from the display
 * names, so fixing a name's wording later never silently changes a stored code.
 * `es` and `en` are the official names exactly as they appear in the jcc2026.org
 * "Deporte" dropdown, curated in research/delegations-sports.md (issue #13),
 * where the per-row citations and the 55-vs-56 count conflict are recorded —
 * they are deliberately not duplicated here. Count, slug uniqueness/URL-safety,
 * and bilingual completeness are asserted at the repo's test seam in
 * e2e/vocab.spec.ts.
 */
export type Discipline = {
  /** Stable, URL-safe kebab-case slug. Stable identifier and DB value. */
  readonly code: string;
  /** Official Spanish name (jcc2026.org "Deporte" dropdown). */
  readonly es: string;
  /** Official English name (jcc2026.org/en "Deporte" dropdown). */
  readonly en: string;
};

export const DISCIPLINES = [
  { code: "open-water-swimming", es: "Aguas abiertas", en: "Open Water Swimming" },
  { code: "chess", es: "Ajedrez", en: "Chess" },
  { code: "athletics", es: "Atletismo", en: "Athletics" },
  { code: "badminton", es: "Bádminton", en: "Badminton" },
  { code: "basketball", es: "Baloncesto", en: "Basketball" },
  { code: "basketball-3x3", es: "Baloncesto 3x3", en: "Basketball 3x3" },
  { code: "handball", es: "Balonmano", en: "Handball" },
  { code: "baseball", es: "Beisbol", en: "Baseball" },
  { code: "bowling", es: "Boliche", en: "Bowling" },
  { code: "boxing", es: "Boxeo", en: "Boxing" },
  { code: "canoe-sprint", es: "Canotaje Velocidad", en: "Canoe Sprint" },
  { code: "bmx-racing", es: "Ciclismo BMX Racing", en: "BMX Racing" },
  { code: "mountain-bike", es: "Ciclismo Mountain Bike", en: "Mountain Bike" },
  { code: "cycling-track", es: "Ciclismo Pista", en: "Cycling - Track" },
  { code: "cycling-road", es: "Ciclismo Ruta", en: "Cycling Road" },
  { code: "diving", es: "Clavados", en: "Diving" },
  { code: "e-sports", es: "E-Sports", en: "E-Sports" },
  {
    code: "equestrian-dressage",
    es: "Ecuestre - Adiestramiento",
    en: "Equestrian Dressage",
  },
  {
    code: "equestrian-eventing",
    es: "Ecuestre - Evento Completo",
    en: "Equestrian Eventing",
  },
  { code: "equestrian-jumping", es: "Ecuestre - Salto", en: "Equestrian Jumping" },
  { code: "fencing", es: "Esgrima", en: "Fencing" },
  { code: "water-ski", es: "Esquí Acuático", en: "Water Ski" },
  { code: "football", es: "Fútbol", en: "Football" },
  { code: "artistic-gymnastics", es: "Gimnasia Artística", en: "Artistic Gymnastics" },
  { code: "gymnastics-rhythmic", es: "Gimnasia Rítmica", en: "Gymnastics - Rhythmic" },
  {
    code: "gymnastics-trampoline",
    es: "Gimnasia Trampolín",
    en: "Gymnastics - Trampoline",
  },
  { code: "golf", es: "Golf", en: "Golf" },
  { code: "hockey", es: "Hockey", en: "Hockey" },
  { code: "judo", es: "Judo", en: "Judo" },
  { code: "karate", es: "Karate", en: "Karate" },
  { code: "weightlifting", es: "Levantamiento de Pesas", en: "Weightlifting" },
  { code: "wrestling", es: "Lucha", en: "Wrestling" },
  { code: "swimming", es: "Natación", en: "Swimming" },
  { code: "artistic-swimming", es: "Natación Artística", en: "Artistic Swimming" },
  { code: "netball", es: "Netball", en: "Netball" },
  { code: "artistic-skating", es: "Patinaje Artístico", en: "Artistic Skating" },
  { code: "speed-skating", es: "Patinaje Velocidad", en: "Speed Skating" },
  { code: "modern-pentathlon", es: "Pentatlón Moderno", en: "Modern Pentathlon" },
  { code: "waterpolo", es: "Polo Acuático", en: "Waterpolo" },
  { code: "racquetball", es: "Ráquetbol", en: "Racquetball" },
  { code: "rowing", es: "Remo", en: "Rowing" },
  { code: "rugby-7", es: "Rugby 7", en: "Rugby 7" },
  { code: "skateboarding", es: "Skateboarding", en: "Skateboarding" },
  { code: "softball", es: "Sóftbol", en: "Softball" },
  { code: "squash", es: "Squash", en: "Squash" },
  { code: "surf", es: "Surf", en: "Surf" },
  { code: "taekwondo", es: "Taekwondo", en: "Taekwondo" },
  { code: "tennis", es: "Tenis", en: "Tennis" },
  { code: "table-tennis", es: "Tenis de Mesa", en: "Table Tennis" },
  { code: "shooting", es: "Tiro", en: "Shooting" },
  { code: "archery", es: "Tiro con Arco", en: "Archery" },
  { code: "triathlon", es: "Triatlón", en: "Triathlon" },
  { code: "sailing", es: "Vela", en: "Sailing" },
  { code: "beach-volleyball", es: "Voleibol Playa", en: "Beach Volleyball" },
  { code: "volleyball", es: "Voleibol Sala", en: "Volleyball" },
] as const satisfies readonly Discipline[];
