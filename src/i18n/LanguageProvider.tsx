import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "./types";
import en from "./locales/en";
import pt from "./locales/pt";
import { getMessage, interpolate } from "./getMessage";

const STORAGE_KEY = "doccompare_locale";

const dictionaries = { en, pt };

function readStoredLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "pt") return stored;
  return "en";
}

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
    document.documentElement.lang = next === "pt" ? "pt-BR" : "en";
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const dict = dictionaries[locale];
      const message = getMessage(dict, key) ?? getMessage(en, key) ?? key;
      return interpolate(message, params);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}

export function getStoredLocale(): Locale {
  return readStoredLocale();
}
