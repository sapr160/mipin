import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import EnContent from "@/content/legal/encuentros-seguros.en.mdx";
import EsContent from "@/content/legal/encuentros-seguros.es.mdx";

/**
 * The standalone "Meet safely" page at `/encuentros-seguros` (ADR 0002). Picks
 * the MDX document by resolved locale so the header toggle switches it in place.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return { title: t("safetyTitle") };
}

export default async function EncuentrosSegurosPage() {
  const locale = await getLocale();
  const Content = locale === "en" ? EnContent : EsContent;
  return <Content />;
}
