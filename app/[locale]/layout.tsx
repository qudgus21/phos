import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Locale, locales, getDictionary } from "@/lib/i18n";
import { Navigation } from "@/components/sections/navigation";
import { DictionaryProvider } from "@/lib/i18n/dictionary-context";

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
      template: `%s — Phos AI`,
    },
    description: dict.metadata.siteDescription,
    metadataBase: new URL("https://phos.studio"),
    openGraph: {
      title: dict.metadata.siteTitle,
      description: dict.metadata.siteDescription,
      siteName: "Phos AI",
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.siteTitle,
      description: dict.metadata.siteDescription,
    },
    alternates: {
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}`])),
        "x-default": "/en",
      },
    },
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

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="${locale}";document.documentElement.dir="${dir}";`,
        }}
      />
      <DictionaryProvider dict={dict} locale={locale}>
        <Navigation dict={dict} locale={locale} />
        {children}
      </DictionaryProvider>
    </>
  );
}
