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
    title: dict.legal.privacy.title,
    description: dict.metadata.siteDescription,
    robots: { index: false, follow: true },
    openGraph: {
      title: dict.legal.privacy.title,
      description: dict.metadata.siteDescription,
      url: `https://phos.studio/${locale}/privacy`,
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
      title: dict.legal.privacy.title,
      description: dict.metadata.siteDescription,
      images: ["/opengraph-image?v=2"],
    },
    alternates: generateAlternates("privacy", locale),
  };
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
