import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Locale, locales, getDictionary } from "@/lib/i18n";
import { Navigation } from "@/components/sections/navigation";
import { DictionaryProvider } from "@/lib/i18n/dictionary-context";
import { generateAlternates, webApplicationJsonLd, JsonLdScript } from "@/lib/seo";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) return {};
  const dict = await getDictionary(locale as Locale);

  return {
    title: {
      default: dict.metadata.siteTitle,
      template: `Phos AI — %s`,
    },
    description: dict.metadata.siteDescription,
    metadataBase: new URL("https://phos.studio"),
    openGraph: {
      title: dict.metadata.siteTitle,
      description: dict.metadata.siteDescription,
      siteName: "Phos AI",
      locale,
      alternateLocale: locales.filter((l) => l !== locale),
      type: "website",
      url: `https://phos.studio/${locale}`,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Phos AI — AI Image Editing & Retouching",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.siteTitle,
      description: dict.metadata.siteDescription,
      images: ["/opengraph-image"],
    },
    alternates: generateAlternates(""),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const dict = await getDictionary(locale as Locale);

  return (
    <DictionaryProvider dict={dict} locale={locale}>
      <JsonLdScript
        data={webApplicationJsonLd(
          locale,
          dict.metadata.siteTitle,
          dict.metadata.siteDescription
        )}
      />
      <Navigation dict={dict} locale={locale} />
      {children}
    </DictionaryProvider>
  );
}
