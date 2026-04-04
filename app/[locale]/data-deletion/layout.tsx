import type { Metadata } from "next";
import { type Locale, locales, getDictionary } from "@/lib/i18n";
import { generateAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const dict = await getDictionary(locale as Locale);

  return {
    title: dict.legal.dataDeletion.title,
    description: dict.metadata.siteDescription,
    robots: { index: false, follow: true },
    alternates: generateAlternates("data-deletion"),
  };
}

export default function DataDeletionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
