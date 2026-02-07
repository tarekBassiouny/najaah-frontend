import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListingFiltersProps = {
  children?: ReactNode;
  summary?: ReactNode;
  activeCount?: number;
  isFetching?: boolean;
  isLoading?: boolean;
  hasActiveFilters?: boolean;
  onClear?: () => void;
  clearLabel?: string;
  clearDisabled?: boolean;
  className?: string;
  gridClassName?: string;
};

const InlineSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn("h-4 w-4 animate-spin", className)}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export function ListingFilters({
  children,
  summary,
  activeCount = 0,
  isFetching = false,
  isLoading = false,
  hasActiveFilters = false,
  onClear,
  clearLabel = "Clear filters",
  clearDisabled = false,
  className,
  gridClassName,
}: ListingFiltersProps) {
  return (
    <div
      className={cn(
        "relative z-20 space-y-4 border-b border-gray-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <div className="flex items-center gap-2">
          <span>Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700">
              {activeCount}
            </span>
          ) : null}
        </div>
        {isFetching && !isLoading ? (
          <span className="flex items-center gap-2 text-[11px] text-gray-400">
            <InlineSpinner className="text-primary/70" />
            Updating
          </span>
        ) : null}
      </div>

      {children ? (
        <div className={cn("grid gap-4", gridClassName)}>{children}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
        <div>{summary}</div>
        {onClear ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={clearDisabled}
            className={cn(
              "transition-opacity",
              hasActiveFilters
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            {clearLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
