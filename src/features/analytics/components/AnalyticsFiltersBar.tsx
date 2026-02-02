"use client";

import { Button } from "@/components/ui/button";
import {
  FilterField,
  FiltersActions,
  FiltersBar,
  FiltersGrid,
} from "@/components/ui/filters-bar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CenterPicker } from "@/features/centers/components/CenterPicker";

type AnalyticsFiltersBarProps = {
  isPlatformAdmin: boolean;
  from: string;
  to: string;
  timezone: string;
  onFromChange: (_value: string) => void;
  onToChange: (_value: string) => void;
  onTimezoneChange: (_value: string) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
};

const TIMEZONE_OPTIONS = [
  "UTC",
  "Africa/Cairo",
  "Asia/Riyadh",
  "Europe/London",
];

export function AnalyticsFiltersBar({
  isPlatformAdmin,
  from,
  to,
  timezone,
  onFromChange,
  onToChange,
  onTimezoneChange,
  onApply,
  onReset,
  isLoading,
}: AnalyticsFiltersBarProps) {
  return (
    <FiltersBar>
      <FiltersGrid>
        {isPlatformAdmin && (
          <FilterField label="Center" className="lg:col-span-2">
            <CenterPicker selectClassName="h-10" />
          </FilterField>
        )}

        <FilterField label="From">
          <Input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-10"
          />
        </FilterField>

        <FilterField label="To">
          <Input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => onToChange(event.target.value)}
            className="h-10"
          />
        </FilterField>

        <FilterField label="Timezone">
          <Select value={timezone} onValueChange={onTimezoneChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONE_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>

        <FiltersActions>
          <Button variant="outline" onClick={onReset} disabled={isLoading}>
            Reset
          </Button>
          <Button onClick={onApply} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Apply"}
          </Button>
        </FiltersActions>
      </FiltersGrid>
    </FiltersBar>
  );
}
