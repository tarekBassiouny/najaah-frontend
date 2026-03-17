import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/features/localization";
import type {
  AssetSlotState,
  AssetSlotType,
  CourseAssetSource,
} from "../types/asset-catalog";

type SlotActionButtonsProps = {
  source: CourseAssetSource;
  slotType: AssetSlotType;
  slotState: AssetSlotState;
  canonical: { id: number; kind: string } | null;
  latestJobBatchKey: string | null;
  latestJobId: number | null;
  centerId: string;
  courseId: string;
  assetsWorkspacePath: string;
  canGenerateAI: boolean;
  canReviewPublishAI: boolean;
  canManageLearningAssets: boolean;
  onOpenGenerateModal: (
    _source: CourseAssetSource,
    _presetAssetType: AssetSlotType,
    _presetTargetId: number | null,
  ) => void;
  onOpenReviewDialog: (_jobId: number, _batchKey: string | null) => void;
  onOpenBatchDrawer: (_batchKey: string) => void;
};

export function SlotActionButtons({
  source,
  slotType,
  slotState,
  canonical,
  latestJobBatchKey,
  latestJobId,
  centerId,
  courseId,
  assetsWorkspacePath,
  canGenerateAI,
  canReviewPublishAI,
  canManageLearningAssets,
  onOpenGenerateModal,
  onOpenReviewDialog,
  onOpenBatchDrawer,
}: SlotActionButtonsProps): ReactNode[] {
  const { t } = useTranslation();
  const actions: ReactNode[] = [];

  const addGenerate = (mode: "generate" | "regenerate" = "generate") => {
    if (!canGenerateAI) return;
    actions.push(
      <Button
        key="generate"
        size="sm"
        variant="outline"
        onClick={() =>
          onOpenGenerateModal(source, slotType, canonical?.id ?? null)
        }
      >
        {t(`pages.courseAssets.actions.${mode}`)}
      </Button>,
    );
  };

  const addReview = () => {
    if (!canReviewPublishAI || !latestJobId) return;
    actions.push(
      <Button
        key="review"
        size="sm"
        variant="outline"
        onClick={() => onOpenReviewDialog(latestJobId, latestJobBatchKey)}
      >
        {t("pages.courseAssets.actions.review")}
      </Button>,
    );
  };

  const addViewEdit = () => {
    if (!canonical) return;

    if (canonical.kind === "learning_asset") {
      if (canManageLearningAssets) {
        actions.push(
          <Link
            key="edit-learning-asset"
            href={`/centers/${centerId}/learning-assets/${canonical.id}`}
          >
            <Button size="sm" variant="outline">
              {t("pages.courseAssets.actions.edit")}
            </Button>
          </Link>,
        );
      }
      return;
    }

    if (canonical.kind === "quiz") {
      actions.push(
        <Link
          key="view-quiz"
          href={`/centers/${centerId}/quizzes/${canonical.id}?course_id=${courseId}&return_to=${encodeURIComponent(assetsWorkspacePath)}`}
        >
          <Button size="sm" variant="outline">
            {t("pages.courseAssets.actions.edit")}
          </Button>
        </Link>,
      );
      return;
    }

    if (canonical.kind === "assignment") {
      actions.push(
        <Link
          key="view-assignment"
          href={`/centers/${centerId}/courses/${courseId}/assignments?highlight_id=${canonical.id}&return_to=${encodeURIComponent(assetsWorkspacePath)}`}
        >
          <Button size="sm" variant="outline">
            {t("pages.courseAssets.actions.edit")}
          </Button>
        </Link>,
      );
    }
  };

  switch (slotState) {
    case "missing":
      addGenerate("generate");
      break;
    case "generating":
      if (latestJobBatchKey) {
        actions.push(
          <Button
            key="progress"
            size="sm"
            variant="outline"
            onClick={() => onOpenBatchDrawer(latestJobBatchKey)}
          >
            {t("pages.courseAssets.actions.viewProgress")}
          </Button>,
        );
      }
      break;
    case "review_required":
      addReview();
      addGenerate("regenerate");
      break;
    case "approved":
      addReview();
      addGenerate("regenerate");
      break;
    case "published":
      addViewEdit();
      addGenerate("regenerate");
      break;
    case "draft":
      addViewEdit();
      addGenerate("regenerate");
      break;
    case "failed":
      addGenerate("generate");
      break;
    default:
      break;
  }

  return actions;
}
