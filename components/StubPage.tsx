import { useTranslations } from "next-intl";

/**
 * The "muy pronto" placeholder each Tab renders until cluster 3 fills it in.
 * Publicly reachable for now; gating comes later (spec #20).
 */
export function StubPage({
  tab,
}: {
  tab: "pines" | "intercambios" | "matches" | "perfil";
}) {
  const nav = useTranslations("Nav");
  const stub = useTranslations("Stub");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{nav(tab)}</h1>
      <p className="text-lg text-zinc-500">{stub("comingSoon")}</p>
    </div>
  );
}
