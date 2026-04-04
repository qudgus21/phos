"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { locales, type Locale } from "@/lib/i18n";
import { useDictionary } from "@/lib/i18n/dictionary-context";

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  es: "Español",
  ar: "العربية",
  pt: "Português",
  fr: "Français",
  ja: "日本語",
  ru: "Русский",
  de: "Deutsch",
  id: "Bahasa Indonesia",
  ko: "한국어",
};

interface LanguageSelectorProps {
  locale: string;
}

export function LanguageSelector({ locale }: LanguageSelectorProps) {
  const dict = useDictionary();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function switchLocale(newLocale: Locale) {
    setOpen(false);
    // Replace the current locale prefix in pathname
    const newPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, `/${newLocale}$1`);
    router.push(newPath);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label={dict.nav.switchLanguage}
      >
        <Globe className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden z-50"
          >
            <div className="p-1.5 max-h-72 overflow-y-auto">
              {locales.map((l) => (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left",
                    l === locale
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span className="font-medium">{LOCALE_NAMES[l]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
