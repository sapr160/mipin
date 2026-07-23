import Link from "next/link";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ShareButton } from "@/components/ShareButton";

/**
 * The Shell header: wordmark, the ES/EN toggle (its permanent home, per spec
 * #20), and the Share prompt. Rendered on every Shell page by the layout.
 */
export function Header() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <Link href="/" className="text-xl font-semibold tracking-tight">
        mipin
      </Link>
      <div className="flex items-center gap-3">
        <LocaleToggle />
        <ShareButton />
      </div>
    </header>
  );
}
