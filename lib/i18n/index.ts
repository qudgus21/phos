export {
  locales,
  defaultLocale,
  isValidLocale,
  type Locale,
  type Dictionary,
} from "./config";
export { getDictionary } from "./get-dictionary";
export { detectLocale } from "./detect-locale";
export { DictionaryProvider, useDictionary } from "./dictionary-context";
