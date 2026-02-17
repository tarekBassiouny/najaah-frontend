"use client";

import { useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { FilterField } from "@/components/ui/filters-bar";
import { CenterPicker } from "@/features/centers/components/CenterPicker";

type AnalyticsFiltersBarProps = {
  isPlatformAdmin: boolean;
  defaultFrom: string;
  defaultTo: string;
  from: string;
  to: string;
  onFromChange: (_value: string) => void;
  onToChange: (_value: string) => void;
  onReset: () => void;
  isLoading?: boolean;
};

const DATE_PRESETS = [
  { key: "today", label: "Today", daysBack: 0 },
  { key: "last7", label: "Last 7 days", daysBack: 6 },
  { key: "last30", label: "Last 30 days", daysBack: 29 },
] as const;

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPresetRange(daysBack: number) {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - daysBack);

  return {
    from: toDateInput(fromDate),
    to: toDateInput(toDate),
  };
}

export function AnalyticsFiltersBar({
  isPlatformAdmin,
  defaultFrom,
  defaultTo,
  from,
  to,
  onFromChange,
  onToChange,
  onReset,
  isLoading,
}: AnalyticsFiltersBarProps) {
  const { centerId } = useTenant();
  const [datePreset, setDatePreset] = useState<string>("");
  const hasSelectedCenterFilter = isPlatformAdmin && Boolean(centerId);
  const hasInvalidRange = Boolean(from && to && from > to);
  const hasActiveFilters =
    hasSelectedCenterFilter || from !== defaultFrom || to !== defaultTo;
  const activeFilterCount =
    (hasSelectedCenterFilter ? 1 : 0) +
    (from !== defaultFrom ? 1 : 0) +
    (to !== defaultTo ? 1 : 0);

  const applyDatePreset = (daysBack: number, presetKey: string) => {
    const range = getPresetRange(daysBack);
    onFromChange(range.from);
    onToChange(range.to);
    setDatePreset(presetKey);
  };

  const clearDatePreset = () => setDatePreset("");

  return (
    <ListingCard>
      <ListingFilters
        activeCount={activeFilterCount}
        isFetching={isLoading}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        clearLabel="Reset"
        clearDisabled={isLoading}
        onClear={() => {
          onReset();
          clearDatePreset();
        }}
        summary={
          <div className="flex flex-wrap items-center gap-2">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.key}
                variant={datePreset === preset.key ? "default" : "outline"}
                className="h-8 px-3 text-xs"
                onClick={() => applyDatePreset(preset.daysBack, preset.key)}
                disabled={isLoading}
              >
                {preset.label}
              </Button>
            ))}
            <span className="text-xs text-dark-5 dark:text-dark-4">
              Live updates
            </span>
          </div>
        }
        gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isPlatformAdmin ? (
          <FilterField label="Center" className="lg:col-span-2">
            <CenterPicker
              className="w-full min-w-0"
              selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </FilterField>
        ) : null}

        <FilterField label="From" className="lg:col-span-1">
          <input
            type="date"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
            value={from}
            max={to || undefined}
            onChange={(event) => {
              onFromChange(event.target.value);
              clearDatePreset();
            }}
          />
        </FilterField>

        <FilterField label="To" className="lg:col-span-1">
          <input
            type="date"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
            min={from || undefined}
            value={to}
            onChange={(event) => {
              onToChange(event.target.value);
              clearDatePreset();
            }}
          />
        </FilterField>
      </ListingFilters>

      {hasInvalidRange ? (
        <div className="border-b border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            End date must be the same as or later than the start date.
          </p>
        </div>
      ) : null}
    </ListingCard>
  );
}
