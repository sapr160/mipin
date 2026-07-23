"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { registrationFor } from "@/components/tab-badge/registry";
import { type TabKey, TAB_KEYS } from "@/components/tab-badge/types";

type Counts = Partial<Record<TabKey, number>>;

interface TabBadgeContextValue {
  /** Current unread count per Tab; absent or zero means no badge. */
  counts: Counts;
  /**
   * Clear a Tab's badge: runs its registered mark-seen action, then zeroes the
   * count locally. This is the seam clusters 3/4/6 call when a Tab is opened —
   * durable clearing needs the `last_seen_at` columns from cluster 3, so this
   * cluster exposes the action but does not yet invoke it.
   */
  markSeen: (tab: TabKey) => void;
}

const TabBadgeContext = createContext<TabBadgeContextValue | null>(null);

/** Fetch one Tab's count, defaulting to zero if its fetcher throws or is absent. */
async function countFor(tab: TabKey): Promise<number> {
  const registration = registrationFor(tab);
  if (!registration) return 0;
  try {
    return await registration.fetchCount();
  } catch {
    // A broken fetcher must never break the Shell — just show no badge.
    return 0;
  }
}

/**
 * The Shell-owned Tab-badge provider (spec #22 / domain "Tab badge"). It fetches
 * every Tab's unread count on load and refetches when the tab becomes visible
 * again (`visibilitychange`) — no interval polling, no Supabase Realtime. The
 * tab bar reads the counts to render badges. Counts survive tab navigation
 * because the Shell layout (and thus this provider) stays mounted across the
 * four Tabs.
 */
export function TabBadgeProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<Counts>({});

  const refresh = useCallback(async () => {
    const entries = await Promise.all(
      TAB_KEYS.map(async (tab) => [tab, await countFor(tab)] as const),
    );
    setCounts(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    // Fetch-on-load. `refresh` only setState()s after awaiting the fetchers, so
    // there is no synchronous cascading render — the concern the rule guards.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [refresh]);

  const markSeen = useCallback((tab: TabKey) => {
    // Optimistically clear the badge; persistence (last_seen_at) is cluster 3.
    setCounts((prev) => ({ ...prev, [tab]: 0 }));
    void registrationFor(tab)?.markSeen();
  }, []);

  return (
    <TabBadgeContext.Provider value={{ counts, markSeen }}>
      {children}
    </TabBadgeContext.Provider>
  );
}

export function useTabBadges(): TabBadgeContextValue {
  const value = useContext(TabBadgeContext);
  if (!value) {
    throw new Error("useTabBadges must be used within a TabBadgeProvider");
  }
  return value;
}
