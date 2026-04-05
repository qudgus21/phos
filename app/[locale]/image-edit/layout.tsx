import type { Metadata } from "next";
import { type Locale, locales, getDictionary } from "@/lib/i18n";
import {
  generateAlternates,
  softwareApplicationJsonLd,
  breadcrumbJsonLd,
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
    title: dict.metadata.imageEditTitle,
    description: dict.metadata.imageEditDescription,
    openGraph: {
      title: dict.metadata.imageEditTitle,
      description: dict.metadata.imageEditDescription,
      url: `https://phos.studio/${locale}/image-edit`,
      siteName: "Phos AI",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.imageEditTitle,
      description: dict.metadata.imageEditDescription,
      images: ["/opengraph-image"],
    },
    alternates: generateAlternates("image-edit"),
  };
}

export default async function ImageEditLayout({
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
        data={softwareApplicationJsonLd(
          locale,
          dict.metadata.imageEditTitle,
          dict.metadata.imageEditDescription,
          `/${locale}/image-edit`
        )}
      />
      <JsonLdScript
        data={breadcrumbJsonLd(locale, [
          { name: dict.nav.imageEdit, path: "/image-edit" },
        ], dict.footer.links.home)}
      />
      <main>
        <section className="sr-only" aria-label={dict.metadata.imageEditTitle}>
          <h1>{dict.metadata.imageEditTitle}</h1>
          <p>{dict.metadata.imageEditDescription}</p>
        </section>
        {children}
      </main>
    </>
  );
}
