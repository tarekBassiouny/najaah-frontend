"use client";

import { useId } from "react";
import { useTenant } from "@/app/tenant-provider";
import { cn } from "@/lib/utils";
import { setTenantState } from "@/lib/tenant-store";
import { useCenters } from "../hooks/use-centers";

type CenterPickerProps = {
  className?: string;
  selectClassName?: string;
  allLabel?: string;
  hideWhenCenterScoped?: boolean;
};

export function CenterPicker({
  className,
  selectClassName,
  allLabel = "All Centers",
  hideWhenCenterScoped = true,
}: CenterPickerProps) {
  const inputId = useId();
  const { centerSlug, centerId } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const shouldHide = hideWhenCenterScoped && !isPlatformAdmin;

  const { data: centersData } = useCenters(
    { page: 1, per_page: 100 },
    { enabled: isPlatformAdmin },
  );
  const centers = centersData?.items ?? [];

  if (shouldHide) {
    return null;
  }

  return (
    <div className={cn("min-w-[12rem]", className)}>
      <label className="sr-only" htmlFor={inputId}>
        Center
      </label>
      <select
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200",
          selectClassName,
        )}
        value={centerId ?? ""}
        onChange={(event) => {
          const selectedId = event.target.value;

          if (!selectedId) {
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
        <option value="">{allLabel}</option>
        {centers.map((center) => (
          <option key={center.id} value={center.id}>
            {center.name ?? `Center ${center.id}`}
          </option>
        ))}
      </select>
    </div>
  );
}
