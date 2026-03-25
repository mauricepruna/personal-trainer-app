"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Dictionary, Locale } from "./index";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextType | null>(null);

// Default fallback dictionary (loaded synchronously to avoid flash)
import en from "./dictionaries/en.json";

export function LocaleProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [dictionary, setDictionary] = useState<Dictionary>(en);

  useEffect(() => {
    import(`./dictionaries/${locale}.json`).then((mod) =>
      setDictionary(mod.default)
    );
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionary }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LocaleProvider");
  }
  return context;
}
