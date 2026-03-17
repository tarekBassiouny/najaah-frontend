import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shouldPollAIJob } from "@/features/ai/lib/job-status";
import { formatDateTime } from "@/lib/format-date-time";
import { useTranslation } from "@/features/localization";
import { STATUS_BADGE_VARIANTS } from "../lib/slot-badge";

type ReviewActionBarProps = {
  reviewJobId: number | null;
  statusTone: keyof typeof STATUS_BADGE_VARIANTS;
  statusLabel: string;
  currentStatus: number;
  canSaveReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  canDiscard: boolean;
  isAnyJobActionPending: boolean;
  isSavingReview: boolean;
  isApprovingJob: boolean;
  isPublishingJob: boolean;
  isDiscardingJob: boolean;
  isJobFetching: boolean;
  reviewJsonError: string | null;
  isReviewDirty: boolean;
  lastReviewSavedAt: string | null;
  onSaveReview: () => void;
  onApprove: () => void;
  onPublish: () => void;
  onDiscard: (_jobId: number) => void;
  onRefresh: () => void;
};

export function ReviewActionBar({
  reviewJobId,
  statusTone,
  statusLabel,
  currentStatus,
  canSaveReview,
  canApprove,
  canPublish,
  canDiscard,
  isAnyJobActionPending,
  isSavingReview,
  isApprovingJob,
  isPublishingJob,
  isDiscardingJob,
  isJobFetching,
  reviewJsonError,
  isReviewDirty,
  lastReviewSavedAt,
  onSaveReview,
  onApprove,
  onPublish,
  onDiscard,
  onRefresh,
}: ReviewActionBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky bottom-0 space-y-2 rounded-xl border border-gray-200 bg-white/95 p-3 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/95">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE_VARIANTS[statusTone]}>
            {statusLabel}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {isReviewDirty
                ? t("pages.centerAIContent.workspace.details.dirty")
                : t("pages.centerAIContent.workspace.details.synced")}
            </span>
            {lastReviewSavedAt ? (
              <span>
                {t("pages.centerAIContent.workspace.details.savedAt")}:{" "}
                {formatDateTime(lastReviewSavedAt)}
              </span>
            ) : null}
            {shouldPollAIJob(currentStatus) ? (
              <span>
                {t("pages.centerAIContent.workspace.details.polling")}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={onSaveReview}
          disabled={
            !canSaveReview || isAnyJobActionPending || !!reviewJsonError
          }
        >
          {isSavingReview
            ? t("common.actions.saving")
            : t("pages.centerAIContent.workspace.details.actions.saveReview")}
        </Button>

        <Button
          variant="outline"
          onClick={onApprove}
          disabled={!canApprove || isAnyJobActionPending}
        >
          {isApprovingJob
            ? t("common.actions.loading")
            : t("pages.centerAIContent.workspace.details.actions.approve")}
        </Button>

        <Button
          variant="outline"
          onClick={onPublish}
          disabled={!canPublish || isAnyJobActionPending}
        >
          {isPublishingJob
            ? t("common.actions.loading")
            : t("pages.centerAIContent.workspace.details.actions.publish")}
        </Button>

        <Button
          variant="outline"
          onClick={() => reviewJobId && onDiscard(reviewJobId)}
          disabled={!canDiscard || isAnyJobActionPending}
        >
          {isDiscardingJob
            ? t("common.actions.loading")
            : t("pages.centerAIContent.workspace.jobs.actions.discard")}
        </Button>

        <Button
          variant="ghost"
          onClick={onRefresh}
          disabled={isJobFetching || isAnyJobActionPending}
        >
          {isJobFetching
            ? t("common.actions.loading")
            : t("common.actions.refresh")}
        </Button>
      </div>
    </div>
  );
}
