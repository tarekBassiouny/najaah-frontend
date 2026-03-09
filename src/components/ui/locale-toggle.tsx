"use client";

import { cn } from "@/lib/utils";
import {
  SUPPORTED_LOCALES,
  useLocale,
} from "@/features/localization/locale-context";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LOCALES.map((candidate) => {
        const isActive = locale === candidate;

        return (
          <button
            key={candidate}
            type="button"
            onClick={() => setLocale(candidate)}
            className={cn(
              "flex h-9 items-center justify-center rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              isActive
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500",
            )}
            aria-pressed={isActive}
          >
            {candidate.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
