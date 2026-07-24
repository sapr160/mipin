import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { TabBadgeProvider } from "@/components/tab-badge/TabBadgeProvider";
import { requireOnboarded } from "@/lib/auth/gate";

/**
 * The Shell — the permanent frame every feature ships into (spec #20 / domain
 * "Shell"): header on top, feature content in the middle, footer, and the
 * bottom-fixed tab bar overlaying the reserved `pb-16` gutter.
 *
 * The admission gate lives here, not in the proxy (spec #29 keeps the proxy
 * DB-free), and the Shell now admits only an Onboarded athlete (issue #34): no
 * session bounces to sign-in; a signed-in account without a profile row is sent
 * to onboarding (where the layout may render the Age wall). This is the exact
 * inverse of the onboarding gate, so the two can't both admit the same visitor.
 *
 * Forced dynamic so the session/profile read and the footer's `KOFI_URL` read
 * happen per request rather than being inlined at build time.
 */
export const dynamic = "force-dynamic";

export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireOnboarded();

  return (
    <TabBadgeProvider>
      <div className="flex min-h-full flex-1 flex-col pb-16">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <TabBar />
      </div>
    </TabBadgeProvider>
  );
}
