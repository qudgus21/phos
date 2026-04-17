import { locales } from "@/lib/i18n/config";

const BASE_URL = "https://phos.studio";

/**
 * Generate canonical + hreflang alternates for a given page path.
 * @param pagePath - Path segment after locale (e.g. "image-edit", "pricing", "" for root).
 * @param locale - Current locale. When provided, emits a self-referencing canonical.
 */
export function generateAlternates(pagePath: string = "", locale?: string) {
  const suffix = pagePath ? `/${pagePath}` : "";
  return {
    ...(locale ? { canonical: `${BASE_URL}/${locale}${suffix}` } : {}),
    languages: {
      ...Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}${suffix}`])
      ),
      "x-default": `${BASE_URL}/en${suffix}`,
    },
  };
}
