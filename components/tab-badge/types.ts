/**
 * The Tab-badge contract (spec #22 / domain "Tab badge"): the typed seam later
 * clusters plug real notification counts into. Each Tab registers a
 * count-fetcher (how many unread items it has) and a mark-seen action (clear
 * them). The Shell-owned provider fetches on load and on `visibilitychange`,
 * and the tab bar renders a badge for any non-zero count.
 *
 * This cluster ships only stub fetchers (see `registry.ts`); the real ones
 * arrive with clusters 4 (Intercambios) and 6 (Matches), and per-tab
 * `last_seen_at` persistence lands in cluster 3.
 */

/** One of the four bottom-bar destinations (domain "Tab"). */
export type TabKey = "pines" | "intercambios" | "matches" | "perfil";

/** Canonical tab order; the provider iterates this to fetch every count. */
export const TAB_KEYS: readonly TabKey[] = [
  "pines",
  "intercambios",
  "matches",
  "perfil",
];

/** How many unread items a Tab has right now. */
export type CountFetcher = () => Promise<number>;

/** Mark a Tab's items seen. Cluster 3+ wires this to `last_seen_at`. */
export type MarkSeen = () => Promise<void>;

export interface TabBadgeRegistration {
  fetchCount: CountFetcher;
  markSeen: MarkSeen;
}

/** A partial map of Tab → registration; unregistered tabs count as zero. */
export type TabBadgeRegistry = Partial<Record<TabKey, TabBadgeRegistration>>;

declare global {
  interface Window {
    /**
     * Test-injection seam (the browser boundary is the repo's only test seam,
     * spec #18). Playwright sets this via `addInitScript` to override the stub
     * registry with a fetcher that returns a real count, proving the
     * provider's behaviour without the not-yet-built cluster 4/6 fetchers.
     */
    __mipinTabBadges?: TabBadgeRegistry;
  }
}
