import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/features/localization";
import type { AssetSlotState, AssetSlotType } from "../types/asset-catalog";
import { slotStateBadgeVariant } from "../lib/slot-badge";

type AssetSlotRowProps = {
  sourceType: "video" | "pdf";
  sourceId: number;
  slotType: AssetSlotType;
  slotState: AssetSlotState;
  canonicalTitle: string | null;
  actions: ReactNode[];
};

export function AssetSlotRow({
  sourceType,
  sourceId,
  slotType,
  slotState,
  canonicalTitle,
  actions,
}: AssetSlotRowProps) {
  const { t } = useTranslation();

  return (
    <div
      key={`${sourceType}-${sourceId}-${slotType}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {t(`pages.courseAssets.slotTypes.${slotType}`)}
        </span>
        <Badge variant={slotStateBadgeVariant(slotState)}>
          {t(`pages.courseAssets.slotStates.${slotState}`)}
        </Badge>
        {canonicalTitle ? (
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">
            {canonicalTitle}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {actions.length > 0 ? (
          actions
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </div>
    </div>
  );
}
