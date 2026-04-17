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
    title: dict.metadata.faceEditTitle,
    description: dict.metadata.faceEditDescription,
    openGraph: {
      title: dict.metadata.faceEditTitle,
      description: dict.metadata.faceEditDescription,
      url: `https://phos.studio/${locale}/face-edit`,
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
      title: dict.metadata.faceEditTitle,
      description: dict.metadata.faceEditDescription,
      images: ["/opengraph-image?v=2"],
    },
    alternates: generateAlternates("face-edit", locale),
  };
}

export default async function FaceEditLayout({
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
          dict.metadata.faceEditTitle,
          dict.metadata.faceEditDescription,
          `/${locale}/face-edit`
        )}
      />
      <JsonLdScript
        data={breadcrumbJsonLd(locale, [
          { name: dict.nav.faceEdit, path: "/face-edit" },
        ], dict.footer.links.home)}
      />
      <nav aria-label="Breadcrumb" className="sr-only">
        <ol>
          <li>
            <a href={`/${locale}`}>{dict.footer.links.home}</a>
          </li>
          <li aria-current="page">{dict.nav.faceEdit}</li>
        </ol>
      </nav>
      <main>
        <section className="sr-only" aria-label={dict.metadata.faceEditTitle}>
          <h1>{dict.metadata.faceEditTitle}</h1>
          <p>{dict.metadata.faceEditDescription}</p>
        </section>
        {children}
      </main>
    </>
  );
}
