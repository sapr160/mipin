import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/**
 * The shared frame for the three legal pages (spec #18 / #23): the Shell's
 * Header (so the ES/EN toggle switches the document in place) and Footer (so its
 * links reach the other legal routes), wrapping the MDX content in a centered,
 * readable column. No tab bar — these pages are reachable logged-out, like the
 * Landing. Typography for the MDX elements comes from the root
 * `mdx-components.tsx`.
 *
 * Forced dynamic so the Footer's `KOFI_URL` read and the cookie-driven locale
 * resolve per request rather than being inlined at build time.
 */
export const dynamic = "force-dynamic";

export default function LegalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header />
      <main className="flex flex-1 justify-center px-6 py-10">
        <article className="w-full max-w-2xl">{children}</article>
      </main>
      <Footer />
    </div>
  );
}
