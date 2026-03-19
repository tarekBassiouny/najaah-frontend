"use client";

import { useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";

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
  { key: "today", daysBack: 0 },
  { key: "last7", daysBack: 6 },
  { key: "last30", daysBack: 29 },
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
  const { t } = useTranslation();
  const datePresets = DATE_PRESETS.map((preset) => ({
    ...preset,
    label: t(
      `auto.features.analytics.components.analyticsfiltersbar.presets.${preset.key}`,
    ),
  }));

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
        titleLabel={t(
          "auto.features.analytics.components.analyticsfiltersbar.title",
        )}
        updatingLabel={t(
          "auto.features.analytics.components.analyticsfiltersbar.updating",
        )}
        clearLabel={t(
          "auto.features.analytics.components.analyticsfiltersbar.reset",
        )}
        clearDisabled={isLoading}
        onClear={() => {
          onReset();
          clearDatePreset();
        }}
        summary={
          <div className="flex flex-wrap items-center gap-2">
            {datePresets.map((preset) => (
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
              {t("auto.features.analytics.components.analyticsfiltersbar.s1")}
            </span>
          </div>
        }
        gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isPlatformAdmin ? (
          <div className="lg:col-span-2">
            <CenterPicker
              className="w-full min-w-0"
              selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
              label={t("common.labels.center")}
              allLabel={t(
                "auto.features.centers.components.centerpicker.allCenters",
              )}
              searchPlaceholder={t(
                "auto.features.centers.components.centerpicker.searchPlaceholder",
              )}
            />
          </div>
        ) : null}

        <div className="lg:col-span-1">
          <input
            type="date"
            title={t(
              "auto.features.analytics.components.analyticsfiltersbar.s2",
            )}
            className={cn(
              "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900",
              !from && "text-gray-500",
            )}
            value={from}
            max={to || undefined}
            onChange={(event) => {
              onFromChange(event.target.value);
              clearDatePreset();
            }}
          />
        </div>

        <div className="lg:col-span-1">
          <input
            type="date"
            title={t(
              "auto.features.analytics.components.analyticsfiltersbar.s3",
            )}
            className={cn(
              "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900",
              !to && "text-gray-500",
            )}
            min={from || undefined}
            value={to}
            onChange={(event) => {
              onToChange(event.target.value);
              clearDatePreset();
            }}
          />
        </div>
      </ListingFilters>

      {hasInvalidRange ? (
        <div className="border-b border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
          <p className="text-xs font-medium text-red-600 dark:text-red-400">
            {t("auto.features.analytics.components.analyticsfiltersbar.s4")}
          </p>
        </div>
      ) : null}
    </ListingCard>
  );
}
