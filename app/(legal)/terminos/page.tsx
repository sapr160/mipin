import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import EnContent from "@/content/legal/terminos.en.mdx";
import EsContent from "@/content/legal/terminos.es.mdx";

/**
 * Terms of Service at the single Spanish slug `/terminos` (ADR 0002). The route
 * picks the MDX document by the resolved locale (cookie, else negotiated), so
 * the header toggle switches the language in place without changing the URL.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return { title: t("termsTitle") };
}

export default async function TerminosPage() {
  const locale = await getLocale();
  const Content = locale === "en" ? EnContent : EsContent;
  return <Content />;
}
