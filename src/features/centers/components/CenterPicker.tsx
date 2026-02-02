"use client";

import { useId, useMemo, useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { cn } from "@/lib/utils";
import { setTenantState } from "@/lib/tenant-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCenters } from "../hooks/use-centers";

const BuildingIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="h-4 w-4 text-gray-400"
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

const GlobeIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
    />
  </svg>
);

type CenterPickerProps = {
  className?: string;
  selectClassName?: string;
  allLabel?: string;
  hideWhenCenterScoped?: boolean;
  disabled?: boolean;
};

export function CenterPicker({
  className,
  selectClassName,
  allLabel = "All Centers",
  hideWhenCenterScoped = true,
  disabled = false,
}: CenterPickerProps) {
  const inputId = useId();
  const [search, setSearch] = useState("");
  const { centerSlug, centerId, centerName } = useTenant();
  const isPlatformAdmin = !centerSlug;

  const { data: centersData, isLoading } = useCenters(
    { page: 1, per_page: 100 },
    { enabled: isPlatformAdmin },
  );
  const centers = useMemo(() => centersData?.items ?? [], [centersData]);
  const shouldHide = hideWhenCenterScoped && !isPlatformAdmin;

  const ALL_CENTERS_VALUE = "__all_centers__";
  const filteredCenters = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return centers;
    return centers.filter((center) =>
      String(center.name ?? `Center ${center.id}`)
        .toLowerCase()
        .includes(query),
    );
  }, [centers, search]);

  const selectedLabel = useMemo(() => {
    if (isLoading) return "Loading...";
    if (centerId == null) return allLabel;
    return centerName ?? `Center ${centerId}`;
  }, [isLoading, centerId, centerName, allLabel]);

  if (shouldHide) {
    return null;
  }

  return (
    <div className={cn("min-w-[13rem]", className)}>
      <label className="sr-only" htmlFor={`center-picker-${inputId}`}>
        Center
      </label>
      <Select
        value={centerId != null ? String(centerId) : ALL_CENTERS_VALUE}
        onValueChange={(selectedId) => {
          if (disabled) return;

          if (selectedId === ALL_CENTERS_VALUE) {
            setTenantState({ centerId: null, centerName: null });
            return;
          }

          const selected = centers.find(
            (center) => String(center.id) === selectedId,
          );

          setTenantState({
            centerId: selected?.id ?? null,
            centerName: selected?.name ?? null,
          });
        }}
      >
        <SelectTrigger
          id={`center-picker-${inputId}`}
          className={cn(
            "h-10 w-full bg-gradient-to-r from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/80",
            selectClassName,
          )}
          disabled={disabled || isLoading}
          icon={<BuildingIcon />}
        >
          <SelectValue placeholder={selectedLabel} />
        </SelectTrigger>
        <SelectContent className="min-w-[14rem]">
          {/* Search input */}
          <div className="p-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="Search centers..."
                className={cn(
                  "h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 outline-none transition-all duration-200",
                  "placeholder:text-gray-400",
                  "focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20",
                  "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500",
                  "dark:focus:border-primary dark:focus:bg-gray-900",
                )}
              />
            </div>
          </div>

          <SelectSeparator />

          {/* All centers option */}
          <SelectItem value={ALL_CENTERS_VALUE} icon={<GlobeIcon />}>
            {allLabel}
          </SelectItem>

          {/* Center list */}
          {filteredCenters.length > 0 && (
            <>
              <SelectSeparator />
              {filteredCenters.map((center) => (
                <SelectItem
                  key={center.id}
                  value={String(center.id)}
                  icon={<BuildingIcon />}
                >
                  {center.name ?? `Center ${center.id}`}
                </SelectItem>
              ))}
            </>
          )}

          {/* Empty state */}
          {!isLoading && search && filteredCenters.length === 0 && (
            <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
              <span className="text-2xl">🏢</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                No centers found
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Try a different search term
              </span>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
