const BASE_URL = "https://phos.studio";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Phos AI",
    url: BASE_URL,
    logo: `${BASE_URL}/opengraph-image`,
    sameAs: [],
  };
}

export function webApplicationJsonLd(locale: string, title: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Phos AI",
    url: `${BASE_URL}/${locale}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description,
    inLanguage: locale,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "9.9",
      highPrice: "39.9",
      offerCount: "4",
      url: `${BASE_URL}/${locale}/pricing`,
    },
    author: {
      "@type": "Organization",
      name: "Phos AI",
    },
  };
}

export function softwareApplicationJsonLd(
  locale: string,
  name: string,
  description: string,
  url: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url: `${BASE_URL}${url}`,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    inLanguage: locale,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "9.9",
      highPrice: "39.9",
      offerCount: "4",
      url: `${BASE_URL}/${locale}/pricing`,
    },
    author: {
      "@type": "Organization",
      name: "Phos AI",
    },
  };
}

export function breadcrumbJsonLd(locale: string, items: BreadcrumbItem[], homeLabel: string = "Home") {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: `${BASE_URL}/${locale}`,
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: item.name,
        item: `${BASE_URL}/${locale}${item.path}`,
      })),
    ],
  };
}

export function faqPageJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
