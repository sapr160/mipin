import {
  type TabBadgeRegistry,
  type TabKey,
  TAB_KEYS,
} from "@/components/tab-badge/types";

/**
 * The stub registry this cluster ships: every Tab reports zero unread items and
 * its mark-seen is a no-op, so production shows no badges (spec #22). Cluster 4
 * replaces the Intercambios entry (proposal received / accepted) and cluster 6
 * the Matches entry (new match / consent reveal).
 */
const stubRegistry: TabBadgeRegistry = Object.fromEntries(
  TAB_KEYS.map((key) => [
    key,
    { fetchCount: async () => 0, markSeen: async () => {} },
  ]),
);

/**
 * The registry actually read, resolved fresh on every lookup so a test-injected
 * override (`window.__mipinTabBadges`) takes effect immediately and per-tab.
 * Injected entries win over the stubs; untouched tabs keep theirs.
 */
function effectiveRegistry(): TabBadgeRegistry {
  const injected =
    typeof window !== "undefined" ? window.__mipinTabBadges : undefined;
  return { ...stubRegistry, ...injected };
}

/** The one accessor the provider uses to fetch or mark-seen a single Tab. */
export function registrationFor(tab: TabKey) {
  return effectiveRegistry()[tab];
}
