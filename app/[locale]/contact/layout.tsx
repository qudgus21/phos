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
      title: dict.metadata.contactTitle,
      description: dict.metadata.contactDescription,
      images: ["/opengraph-image?v=2"],
    },
    alternates: generateAlternates("contact", locale),
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
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol>
          <li>
            <a href={`/${locale}`}>{dict.footer.links.home}</a>
          </li>
          <li aria-current="page">{dict.contact.title}</li>
        </ol>
      </nav>
      <main>
        <h1 className="sr-only">{dict.metadata.contactTitle}</h1>
        {children}
      </main>
    </>
  );
}
