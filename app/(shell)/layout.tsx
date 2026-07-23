import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { TabBadgeProvider } from "@/components/tab-badge/TabBadgeProvider";

/**
 * The Shell — the permanent frame every feature ships into (spec #20 / domain
 * "Shell"): header on top, feature content in the middle, footer, and the
 * bottom-fixed tab bar overlaying the reserved `pb-16` gutter.
 *
 * Forced dynamic so the footer's `KOFI_URL` read happens per request rather
 * than being inlined at build time.
 */
export const dynamic = "force-dynamic";

export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
