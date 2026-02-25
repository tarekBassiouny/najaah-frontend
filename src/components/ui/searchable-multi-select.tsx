"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("h-4 w-4", className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("h-4 w-4", className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const LoadingSpinner = ({ className }: { className?: string }) => (
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

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("h-4 w-4", className)}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export type SearchableMultiSelectOption<T = string> = {
  value: T;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
};

type SearchableMultiSelectProps<T = string> = {
  values: T[];
  onValuesChange: (_nextValues: T[]) => void;
  options: SearchableMultiSelectOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchValueChange?: (_value: string) => void;
  filterOptions?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onReachEnd?: () => void;
  maxVisibleSelected?: number;
};

function toKey(value: unknown) {
  return String(value);
}

export function SearchableMultiSelect<T = string>({
  values,
  onValuesChange,
  options,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  disabled = false,
  isLoading = false,
  className,
  triggerClassName,
  contentClassName,
  showSearch = true,
  searchValue,
  onSearchValueChange,
  filterOptions = true,
  hasMore = false,
  isLoadingMore = false,
  onReachEnd,
  maxVisibleSelected = 2,
}: SearchableMultiSelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalSearch, setInternalSearch] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const search = searchValue ?? internalSearch;

  const selectedKeys = React.useMemo(
    () => new Set(values.map((value) => toKey(value))),
    [values],
  );

  const updateSearch = React.useCallback(
    (nextValue: string) => {
      if (searchValue === undefined) {
        setInternalSearch(nextValue);
      }
      onSearchValueChange?.(nextValue);
    },
    [onSearchValueChange, searchValue],
  );

  const optionsByKey = React.useMemo(() => {
    const map = new Map<string, SearchableMultiSelectOption<T>>();
    options.forEach((option) => {
      map.set(toKey(option.value), option);
    });
    return map;
  }, [options]);

  const filteredOptions = React.useMemo(() => {
    if (!filterOptions) {
      return options;
    }

    const query = search.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const description = option.description?.toLowerCase() ?? "";
      return label.includes(query) || description.includes(query);
    });
  }, [filterOptions, options, search]);

  const selectedLabels = React.useMemo(() => {
    return values.map((value) => {
      const option = optionsByKey.get(toKey(value));
      if (option?.label) {
        return option.label;
      }
      return `#${toKey(value)}`;
    });
  }, [optionsByKey, values]);

  const triggerLabel = React.useMemo(() => {
    if (selectedLabels.length === 0) {
      return placeholder;
    }

    if (selectedLabels.length <= maxVisibleSelected) {
      return selectedLabels.join(", ");
    }

    const shown = selectedLabels.slice(0, maxVisibleSelected).join(", ");
    const remaining = selectedLabels.length - maxVisibleSelected;
    return `${shown} +${remaining} more`;
  }, [maxVisibleSelected, placeholder, selectedLabels]);

  const toggleSelection = React.useCallback(
    (option: SearchableMultiSelectOption<T>) => {
      if (option.disabled) return;

      const key = toKey(option.value);
      if (selectedKeys.has(key)) {
        onValuesChange(values.filter((value) => toKey(value) !== key));
        return;
      }

      onValuesChange([...values, option.value]);
    },
    [onValuesChange, selectedKeys, values],
  );

  React.useEffect(() => {
    if (!isOpen || !showSearch) return;
    const timeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);
    return () => clearTimeout(timeout);
  }, [isOpen, showSearch]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleInteractionOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        setIsOpen(false);
        updateSearch("");
      }
    };

    document.addEventListener("pointerdown", handleInteractionOutside);
    return () => {
      document.removeEventListener("pointerdown", handleInteractionOutside);
    };
  }, [isOpen, updateSearch]);

  const clearSelections = (event: React.MouseEvent) => {
    event.stopPropagation();
    onValuesChange([]);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled || isLoading}
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        className={cn(
          "group flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm outline-none transition-all duration-200",
          "border-gray-200 bg-white text-gray-900 shadow-sm",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
          "hover:border-gray-300 hover:shadow-md dark:hover:border-gray-600",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          isOpen && "border-primary ring-2 ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
        )}
      >
        {isLoading ? (
          <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <LoadingSpinner />
            Loading...
          </span>
        ) : (
          <span
            className={cn(
              "truncate text-left",
              values.length === 0 && "text-gray-500 dark:text-gray-400",
            )}
          >
            {triggerLabel}
          </span>
        )}

        <span className="flex items-center gap-2">
          {values.length > 0 && !isLoading ? (
            <button
              type="button"
              onClick={clearSelections}
              className="rounded-md p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="Clear selections"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}
          <ChevronDownIcon
            className={cn(
              "flex-shrink-0 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>

      {isOpen ? (
        <div
          ref={contentRef}
          role="listbox"
          aria-multiselectable="true"
          className={cn(
            "absolute z-50 mt-1.5 w-full min-w-[12rem] overflow-hidden rounded-xl border bg-white shadow-xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 origin-top duration-200",
            "dark:border-gray-700 dark:bg-gray-900",
            contentClassName,
          )}
          style={{ maxHeight: "min(24rem, calc(100vh - 200px))" }}
        >
          {showSearch ? (
            <div className="border-b border-gray-100 p-2.5 dark:border-gray-800">
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(event) => updateSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "h-9 w-full rounded-lg border bg-gray-50 pl-9 pr-3 text-sm outline-none transition-all duration-200",
                    "border-gray-200 text-gray-700 placeholder:text-gray-400",
                    "focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20",
                    "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500",
                    "dark:focus:border-primary dark:focus:bg-gray-900",
                  )}
                />
              </div>
            </div>
          ) : null}

          <div
            className="overflow-y-auto p-1.5"
            style={{ maxHeight: showSearch ? "16rem" : "18rem" }}
            onScroll={(event) => {
              if (!hasMore || isLoadingMore || !onReachEnd) return;
              const element = event.currentTarget;
              const distanceToBottom =
                element.scrollHeight - element.scrollTop - element.clientHeight;
              if (distanceToBottom <= 24) {
                onReachEnd();
              }
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = selectedKeys.has(toKey(option.value));

                return (
                  <div
                    key={toKey(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => toggleSelection(option)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors duration-150",
                      "text-gray-700 dark:text-gray-200",
                      "hover:bg-gray-100 dark:hover:bg-gray-800",
                      isSelected &&
                        "bg-primary/10 font-medium text-primary dark:bg-primary/20",
                      option.disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-gray-300 bg-white text-transparent dark:border-gray-600 dark:bg-gray-900",
                      )}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {option.icon ? (
                      <span
                        className={cn(
                          "flex-shrink-0 text-gray-400 dark:text-gray-500",
                          isSelected && "text-primary",
                        )}
                      >
                        {option.icon}
                      </span>
                    ) : null}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate">{option.label}</span>
                      {option.description ? (
                        <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                <SearchIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {emptyMessage}
                </span>
              </div>
            )}

            {hasMore || isLoadingMore ? (
              <div className="flex items-center justify-center px-2 py-2 text-xs text-gray-500 dark:text-gray-400">
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner className="h-3.5 w-3.5" />
                    Loading more...
                  </span>
                ) : (
                  <span>Scroll to load more</span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
