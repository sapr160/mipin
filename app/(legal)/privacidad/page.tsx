import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import EnContent from "@/content/legal/privacidad.en.mdx";
import EsContent from "@/content/legal/privacidad.es.mdx";

/**
 * Privacy policy at the single Spanish slug `/privacidad` (ADR 0002). Picks the
 * MDX document by resolved locale so the header toggle switches it in place.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal");
  return { title: t("privacyTitle") };
}

export default async function PrivacidadPage() {
  const locale = await getLocale();
  const Content = locale === "en" ? EnContent : EsContent;
  return <Content />;
}
