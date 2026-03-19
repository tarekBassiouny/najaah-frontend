import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/features/localization";
import { resolveCourseAssetSourceReadiness } from "../lib/source-readiness";
import type { AssetSlotType, CourseAssetSource } from "../types/asset-catalog";
import { SLOT_ORDER } from "../types/generate-form";
import { AssetSlotRow } from "./AssetSlotRow";
import { SlotActionButtons } from "./SlotActionButtons";

type AssetSourceRowProps = {
  source: CourseAssetSource;
  centerId: string;
  courseId: string;
  assetsWorkspacePath: string;
  canGenerateAI: boolean;
  canReviewPublishAI: boolean;
  canManageQuizzes: boolean;
  canManageAssignments: boolean;
  canManageLearningAssets: boolean;
  onOpenGenerateModal: (
    _source: CourseAssetSource,
    _presetAssetType?: AssetSlotType,
    _presetTargetId?: number | null,
  ) => void;
  onOpenManualDialog: (_source: CourseAssetSource) => void;
  onOpenReviewDialog: (_jobId: number, _batchKey: string | null) => void;
  onOpenBatchDrawer: (_batchKey: string) => void;
};

export function AssetSourceRow({
  source,
  centerId,
  courseId,
  assetsWorkspacePath,
  canGenerateAI,
  canReviewPublishAI,
  canManageQuizzes,
  canManageAssignments,
  canManageLearningAssets,
  onOpenGenerateModal,
  onOpenManualDialog,
  onOpenReviewDialog,
  onOpenBatchDrawer,
}: AssetSourceRowProps) {
  const { t } = useTranslation();
  const sourceReadiness = resolveCourseAssetSourceReadiness(source);

  const slotsByType = new Map(
    source.assets.map((slot) => [slot.asset_type, slot] as const),
  );

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {source.title || `#${source.id}`}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {source.type === "video"
                ? t("pages.courseAssets.labels.video")
                : t("pages.courseAssets.labels.pdf")}{" "}
              • #{source.id}
            </span>
            {sourceReadiness.isKnown ? (
              <Badge
                variant={sourceReadiness.isReady ? "success" : "warning"}
                className="text-[10px]"
              >
                {t(`pages.courseAssets.readiness.${sourceReadiness.key}.badge`)}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canGenerateAI ? (
            <Button
              size="sm"
              onClick={() => onOpenGenerateModal(source)}
              disabled={!sourceReadiness.isReady}
              title={
                sourceReadiness.isReady
                  ? undefined
                  : t(
                      `pages.courseAssets.readiness.${sourceReadiness.key}.description`,
                    )
              }
            >
              {t("pages.courseAssets.actions.generateWithAI")}
            </Button>
          ) : null}
          {canManageQuizzes || canManageAssignments ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenManualDialog(source)}
            >
              {t("pages.courseAssets.actions.createManually")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {SLOT_ORDER.map((slotType) => {
          const slot = slotsByType.get(slotType) ?? {
            asset_type: slotType,
            slot_state: "missing" as const,
            canonical: null,
            latest_job: null,
          };

          const actions = SlotActionButtons({
            source,
            slotType,
            slotState: slot.slot_state,
            canonical: slot.canonical
              ? {
                  id: Number(slot.canonical.id),
                  kind: String(slot.canonical.kind),
                }
              : null,
            latestJobBatchKey: slot.latest_job?.batch_key ?? null,
            latestJobId:
              slot.latest_job?.id != null ? Number(slot.latest_job.id) : null,
            centerId,
            courseId,
            assetsWorkspacePath,
            canGenerateAI,
            canReviewPublishAI,
            canManageLearningAssets,
            isSourceReady: sourceReadiness.isReady,
            generateDisabledTitle: !sourceReadiness.isReady
              ? t(
                  `pages.courseAssets.readiness.${sourceReadiness.key}.description`,
                )
              : undefined,
            onOpenGenerateModal: (src, preset, targetId) =>
              onOpenGenerateModal(src, preset, targetId),
            onOpenReviewDialog,
            onOpenBatchDrawer,
          });

          return (
            <AssetSlotRow
              key={`${source.type}-${source.id}-${slotType}`}
              sourceType={source.type}
              sourceId={source.id}
              slotType={slotType}
              slotState={slot.slot_state}
              canonicalTitle={slot.canonical?.title ?? null}
              actions={actions}
            />
          );
        })}
      </div>
    </div>
  );
}
