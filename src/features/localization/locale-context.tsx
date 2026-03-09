"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiLocale, setApiLocale } from "@/lib/runtime-config";

const LOCALE_STORAGE_KEY = "najaah.locale";
const SUPPORTED_LOCALES = ["en", "ar"] as const;

type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "en";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (_value: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function parseLocale(value: string | null | undefined): Locale {
  if (!value) {
    return DEFAULT_LOCALE;
  }

  const normalized = value.trim().toLowerCase();
  if (SUPPORTED_LOCALES.includes(normalized as Locale)) {
    return normalized as Locale;
  }

  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    parseLocale(getApiLocale()),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const normalized = parseLocale(stored);

    setLocaleState((current) =>
      current === normalized ? current : normalized,
    );
  }, []);

  useEffect(() => {
    setApiLocale(locale);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch (error) {
      console.warn("Failed to persist locale", error);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(parseLocale(value));
  }, []);

  const contextValue = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }

  return context;
}

export { DEFAULT_LOCALE, SUPPORTED_LOCALES };
export type { Locale };
