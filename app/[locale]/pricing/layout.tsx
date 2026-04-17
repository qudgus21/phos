import type { Metadata } from "next";
import { type Locale, locales, getDictionary } from "@/lib/i18n";
import {
  generateAlternates,
  breadcrumbJsonLd,
  faqPageJsonLd,
  JsonLdScript,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const dict = await getDictionary(locale as Locale);

  return {
    title: dict.metadata.pricingTitle,
    description: dict.metadata.pricingDescription,
    openGraph: {
      title: dict.metadata.pricingTitle,
      description: dict.metadata.pricingDescription,
      url: `https://phos.studio/${locale}/pricing`,
      siteName: "Phos AI",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      type: "website",
      images: [
        {
          url: "/opengraph-image?v=2",
          width: 1200,
          height: 630,
          alt: "Phos AI — AI Image Editing & Retouching",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.pricingTitle,
      description: dict.metadata.pricingDescription,
      images: ["/opengraph-image?v=2"],
    },
    alternates: generateAlternates("pricing", locale),
  };
}

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const faqItems = dict.pricing.faq.items;

  return (
    <>
      <JsonLdScript
        data={breadcrumbJsonLd(locale, [
          { name: dict.nav.pricing, path: "/pricing" },
        ], dict.footer.links.home)}
      />
      {faqItems.length > 0 && (
        <JsonLdScript data={faqPageJsonLd(faqItems)} />
      )}
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol>
          <li>
            <a href={`/${locale}`}>{dict.footer.links.home}</a>
          </li>
          <li aria-current="page">{dict.nav.pricing}</li>
        </ol>
      </nav>
      <main>
        <h1 className="sr-only">{dict.metadata.pricingTitle}</h1>
        {children}
      </main>
    </>
  );
}
