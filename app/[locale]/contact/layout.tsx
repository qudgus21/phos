import type { Metadata } from "next";
import { type Locale, locales, getDictionary } from "@/lib/i18n";
import { generateAlternates, breadcrumbJsonLd, JsonLdScript } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const dict = await getDictionary(locale as Locale);

  return {
    title: dict.metadata.contactTitle,
    description: dict.metadata.contactDescription,
    openGraph: {
      title: dict.metadata.contactTitle,
      description: dict.metadata.contactDescription,
      url: `https://phos.studio/${locale}/contact`,
      siteName: "Phos AI",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.contactTitle,
      description: dict.metadata.contactDescription,
    },
    alternates: generateAlternates("contact"),
  };
}

export default async function ContactLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd(locale, [
          { name: dict.contact.title, path: "/contact" },
        ], dict.footer.links.home)}
      />
      {children}
    </>
  );
}
