import { cache } from "react";
import type { Locale, Dictionary } from "./config";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  ko: () => import("./dictionaries/ko").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
  zh: () => import("./dictionaries/zh").then((m) => m.default),
  es: () => import("./dictionaries/es").then((m) => m.default),
  ar: () => import("./dictionaries/ar").then((m) => m.default),
  id: () => import("./dictionaries/id").then((m) => m.default),
  pt: () => import("./dictionaries/pt").then((m) => m.default),
  fr: () => import("./dictionaries/fr").then((m) => m.default),
  ja: () => import("./dictionaries/ja").then((m) => m.default),
  ru: () => import("./dictionaries/ru").then((m) => m.default),
  de: () => import("./dictionaries/de").then((m) => m.default),
};

export const getDictionary = cache(
  async (locale: Locale): Promise<Dictionary> => {
    return dictionaries[locale]();
  }
);
