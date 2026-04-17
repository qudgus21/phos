import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const BASE_URL = "https://phos.studio";

const pages: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/image-edit", changeFrequency: "weekly", priority: 0.9 },
  { path: "/retouching", changeFrequency: "weekly", priority: 0.9 },
  { path: "/face-edit", changeFrequency: "weekly", priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date("2026-04-17"),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l, `${BASE_URL}/${l}${page.path}`]),
            ["x-default", `${BASE_URL}/en${page.path}`],
          ]),
        },
      });
    }
  }

  return entries;
}
