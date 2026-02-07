"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Icons
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

// Types
export type SearchableSelectOption<T = string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
};

type SearchableSelectProps<T = string> = {
  value: T | null;
  onValueChange: (_value: T | null) => void;
  options: SearchableSelectOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  icon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  showSearch?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  clearIcon?: React.ReactNode;
  groupedOptions?: { label: string; options: SearchableSelectOption<T>[] }[];
};

export function SearchableSelect<T = string>({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  emptyIcon,
  icon,
  isLoading = false,
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  showSearch = true,
  allowClear = false,
  clearLabel = "Clear selection",
  clearIcon,
  groupedOptions,
}: SearchableSelectProps<T>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Flatten grouped options or use regular options
  const allOptions = React.useMemo(() => {
    if (groupedOptions) {
      return groupedOptions.flatMap((group) => group.options);
    }
    return options;
  }, [options, groupedOptions]);

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allOptions;
    return allOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query),
    );
  }, [allOptions, search]);

  // Get selected option label
  const selectedOption = React.useMemo(
    () => allOptions.find((option) => option.value === value),
    [allOptions, value],
  );

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown"
        ) {
          event.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            Math.min(prev + 1, filteredOptions.length - 1),
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          event.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            const option = filteredOptions[highlightedIndex];
            if (!option.disabled) {
              onValueChange(option.value);
              setIsOpen(false);
              setSearch("");
            }
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setSearch("");
          triggerRef.current?.focus();
          break;
        case "Tab":
          setIsOpen(false);
          setSearch("");
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, onValueChange],
  );

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && showSearch) {
      // Small delay to ensure the dropdown is rendered
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, showSearch]);

  // Reset highlighted index when search changes
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`,
      );
      highlightedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (option: SearchableSelectOption<T>) => {
    if (option.disabled) return;
    onValueChange(option.value);
    setIsOpen(false);
    setSearch("");
    triggerRef.current?.focus();
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onValueChange(null);
  };

  return (
    <div className={cn("relative", className)} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="searchable-select-content"
        disabled={disabled || isLoading}
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        className={cn(
          "group flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm outline-none transition-all duration-200",
          // Base styles
          "border-gray-200 bg-white text-gray-900 shadow-sm",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
          // Hover styles
          "hover:border-gray-300 hover:shadow-md",
          "dark:hover:border-gray-600",
          // Focus styles
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          // Open state
          isOpen && "border-primary ring-2 ring-primary/20",
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && (
            <span
              className={cn(
                "flex-shrink-0 text-gray-400 transition-colors",
                "group-hover:text-gray-600 group-focus:text-primary",
                "dark:text-gray-500 dark:group-hover:text-gray-300",
                isOpen && "text-primary",
              )}
            >
              {icon}
            </span>
          )}
          {isLoading ? (
            <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <LoadingSpinner />
              Loading...
            </span>
          ) : selectedOption ? (
            <span className="flex items-center gap-2 truncate">
              {!icon && selectedOption.icon && (
                <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {placeholder}
            </span>
          )}
        </span>

        <span className="flex items-center gap-1">
          {allowClear && selectedOption && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "rounded-md p-0.5 text-gray-400 transition-colors",
                "hover:bg-gray-100 hover:text-gray-600",
                "dark:hover:bg-gray-800 dark:hover:text-gray-300",
              )}
              aria-label={clearLabel}
            >
              {clearIcon || (
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
              )}
            </button>
          )}
          <ChevronDownIcon
            className={cn(
              "flex-shrink-0 text-gray-400 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          ref={contentRef}
          id="searchable-select-content"
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 w-full min-w-[12rem] overflow-hidden rounded-xl border bg-white shadow-xl",
            "dark:border-gray-700 dark:bg-gray-900",
            // Animation
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
            "origin-top duration-200",
            contentClassName,
          )}
          style={{ maxHeight: "min(24rem, calc(100vh - 200px))" }}
        >
          {/* Search Input */}
          {showSearch && (
            <div className="border-b border-gray-100 p-2.5 dark:border-gray-800">
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="overflow-y-auto p-1.5"
            style={{ maxHeight: showSearch ? "16rem" : "18rem" }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={String(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  data-index={index}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors duration-150",
                    // Default state
                    "text-gray-700 dark:text-gray-200",
                    // Hover/highlighted state
                    highlightedIndex === index &&
                      "bg-gray-100 dark:bg-gray-800",
                    // Selected state
                    option.value === value &&
                      "bg-primary/10 font-medium text-primary dark:bg-primary/20",
                    // Disabled state
                    option.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  {option.icon && (
                    <span
                      className={cn(
                        "flex-shrink-0 text-gray-400 dark:text-gray-500",
                        option.value === value && "text-primary",
                      )}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span className="flex flex-1 flex-col gap-0.5 truncate">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {option.value === value && (
                    <CheckIcon className="flex-shrink-0 text-primary" />
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
                {emptyIcon || (
                  <span className="text-3xl opacity-60">
                    <SearchIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  </span>
                )}
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {emptyMessage}
                </span>
                {search && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Try a different search term
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Grouped variant for better organization
export function SearchableSelectGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <div className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </div>
      {children}
    </div>
  );
}
