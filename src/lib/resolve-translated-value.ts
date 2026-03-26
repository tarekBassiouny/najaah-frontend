/**
 * Resolves a locale-aware value from a `_translations` record,
 * falling back to the other language then to a flat legacy field.
 *
 * Usage:
 * ```ts
 * const title = resolveTranslatedValue(
 *   course.title_translations,
 *   locale,
 *   course.title ?? course.name,
 * );
 * ```
 */
export function resolveTranslatedValue(
  translations: Record<string, string> | null | undefined,
  locale: string,
  fallback?: string | null,
): string | null {
  if (translations && typeof translations === "object") {
    const primary = translations[locale];
    if (typeof primary === "string" && primary.trim()) return primary.trim();

    const fallbackLang = locale === "ar" ? "en" : "ar";
    const secondary = translations[fallbackLang];
    if (typeof secondary === "string" && secondary.trim())
      return secondary.trim();
  }

  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();

  return null;
}
