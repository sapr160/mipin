import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { TabBadgeProvider } from "@/components/tab-badge/TabBadgeProvider";
import { getSessionUser } from "@/lib/auth/session";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * The Shell — the permanent frame every feature ships into (spec #20 / domain
 * "Shell"): header on top, feature content in the middle, footer, and the
 * bottom-fixed tab bar overlaying the reserved `pb-16` gutter.
 *
 * The session gate lives here, not in the proxy (spec #29 keeps the proxy
 * DB-free): any Shell URL reached without a session bounces to the sign-in page.
 * The profile/age-wall half of the gate arrives with cluster 3.3; this slice
 * gates on the session alone.
 *
 * Forced dynamic so the session read and the footer's `KOFI_URL` read happen
 * per request rather than being inlined at build time.
 */
export const dynamic = "force-dynamic";

export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!(await getSessionUser())) redirect(SIGN_IN_PATH);

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
