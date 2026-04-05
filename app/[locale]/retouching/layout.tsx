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
    title: dict.metadata.retouchingTitle,
    description: dict.metadata.retouchingDescription,
    openGraph: {
      title: dict.metadata.retouchingTitle,
      description: dict.metadata.retouchingDescription,
      url: `https://phos.studio/${locale}/retouching`,
      siteName: "Phos AI",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.retouchingTitle,
      description: dict.metadata.retouchingDescription,
      images: ["/opengraph-image"],
    },
    alternates: generateAlternates("retouching"),
  };
}

export default async function RetouchingLayout({
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
          dict.metadata.retouchingTitle,
          dict.metadata.retouchingDescription,
          `/${locale}/retouching`
        )}
      />
      <JsonLdScript
        data={breadcrumbJsonLd(locale, [
          { name: dict.nav.skinRetouch, path: "/retouching" },
        ], dict.footer.links.home)}
      />
      <main>
        <section className="sr-only" aria-label={dict.metadata.retouchingTitle}>
          <h1>{dict.metadata.retouchingTitle}</h1>
          <p>{dict.metadata.retouchingDescription}</p>
        </section>
        {children}
      </main>
    </>
  );
}
