"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./config";

const DictionaryContext = createContext<{
  dict: Dictionary;
  locale: string;
} | null>(null);

export function DictionaryProvider({
  dict,
  locale,
  children,
}: {
  dict: Dictionary;
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={{ dict, locale }}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary(): Dictionary {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error("useDictionary must be used inside DictionaryProvider");
  }
  return ctx.dict;
}

export function useLocale(): string {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside DictionaryProvider");
  }
  return ctx.locale;
}
