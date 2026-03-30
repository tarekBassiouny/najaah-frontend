"use client";

import { useMemo } from "react";
import { useLocale, type Locale } from "./locale-context";
import { getDictionary, type Dictionary } from "./dictionaries";

type TranslationParams = Record<string, string | number>;

/**
 * Get a nested value from an object using a dot-separated path.
 * E.g., getNestedValue(obj, "sidebar.items.dashboard") returns obj.sidebar.items.dashboard
 */
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Interpolate parameters into a translation string.
 * E.g., interpolate("Hello {name}", { name: "World" }) returns "Hello World"
 */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

/**
 * Create a translation function for the given dictionary.
 */
function createTranslator(
  dictionary: Dictionary,
  fallbackDictionary?: Dictionary,
) {
  return function t(key: string, params?: TranslationParams): string {
    const value = getNestedValue(dictionary, key);
    const fallbackValue =
      value === undefined && fallbackDictionary
        ? getNestedValue(fallbackDictionary, key)
        : undefined;

    if (value === undefined && fallbackValue === undefined) {
      // In development, warn about missing translations
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation for key: "${key}"`);
      }
      // Return the key itself as fallback
      return key;
    }

    if (value === undefined && process.env.NODE_ENV === "development") {
      console.warn(`Missing translation for key: "${key}" in active locale`);
    }

    return interpolate(value ?? fallbackValue ?? key, params);
  };
}

export type TranslateFunction = ReturnType<typeof createTranslator>;

export interface UseTranslationReturn {
  t: TranslateFunction;
  locale: Locale;
  dictionary: Dictionary;
}

/**
 * Hook to access translations in components.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t } = useTranslation();
 *   return <button>{t("common.actions.save")}</button>;
 * }
 * ```
 *
 * @example
 * With parameters:
 * ```tsx
 * function Greeting({ name }: { name: string }) {
 *   const { t } = useTranslation();
 *   return <p>{t("greeting", { name })}</p>; // "Hello {name}" -> "Hello John"
 * }
 * ```
 */
export function useTranslation(): UseTranslationReturn {
  const { locale } = useLocale();

  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const fallbackDictionary = useMemo(() => getDictionary("en"), []);
  const t = useMemo(
    () => createTranslator(dictionary, fallbackDictionary),
    [dictionary, fallbackDictionary],
  );

  return { t, locale, dictionary };
}

/**
 * Get translation for server components.
 * Note: For client components, prefer useTranslation() hook.
 */
export function getTranslation(locale: Locale) {
  const dictionary = getDictionary(locale);
  const fallbackDictionary = getDictionary("en");
  const t = createTranslator(dictionary, fallbackDictionary);
  return { t, locale, dictionary };
}
