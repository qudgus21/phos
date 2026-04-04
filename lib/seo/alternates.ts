import { locales } from "@/lib/i18n/config";

const BASE_URL = "https://phos.studio";

/**
 * Generate hreflang alternates for a given page path.
 * @param pagePath - The path segment after locale, e.g. "image-edit", "pricing", or "" for root.
 */
export function generateAlternates(pagePath: string = "") {
  const suffix = pagePath ? `/${pagePath}` : "";
  return {
    languages: {
      ...Object.fromEntries(
        locales.map((l) => [l, `${BASE_URL}/${l}${suffix}`])
      ),
      "x-default": `${BASE_URL}/en${suffix}`,
    },
  };
}
