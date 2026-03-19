"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { isRetryingAIJob } from "@/features/ai/lib/job-status";
import { useTranslation } from "@/features/localization";
import { formatDateTime } from "@/lib/format-date-time";
import { STATUS_BADGE_VARIANTS } from "../lib/slot-badge";
import type { useReviewState } from "../hooks/use-review-state";
import { ReviewAssetPreview } from "./ReviewAssetPreview";
import { ReviewEditPanel } from "./ReviewEditPanel";
import { ReviewActionBar } from "./ReviewActionBar";

type ReviewDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  review: ReturnType<typeof useReviewState>;
  canReviewPublishAI: boolean;
};

export function ReviewDialog({
  open,
  onOpenChange,
  review,
  canReviewPublishAI,
}: ReviewDialogProps) {
  const { t } = useTranslation();
  const isRetrying = isRetryingAIJob(review.reviewJob);
  const validationWarnings = review.reviewJob?.validation_warnings ?? [];

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      review.resetReviewState();
    }
  };

  const handleDiscard = async (jobId: number) => {
    const result = await review.onDiscardReviewJob(jobId);
    if (result === "closed") {
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle>
              {t("pages.courseAssets.actions.review")}
              {review.reviewJobId ? ` #${review.reviewJobId}` : ""}
            </DialogTitle>
            {review.reviewJob ? (
              <Badge
                variant={STATUS_BADGE_VARIANTS[review.reviewStatusBadge.tone]}
              >
                {review.reviewStatusLabel}
              </Badge>
            ) : null}
          </div>
          <DialogDescription>
            {t("pages.centerAIContent.workspace.details.description")}
          </DialogDescription>
        </DialogHeader>

        {review.reviewJobId == null ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerAIContent.workspace.details.noSelection")}
          </p>
        ) : review.isReviewJobLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : review.isReviewJobError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
            <AlertDescription>
              {t("pages.centerAIContent.workspace.details.loadFailed")}
            </AlertDescription>
          </Alert>
        ) : review.reviewJob ? (
          <div className="space-y-4">
            {/* Meta grid */}
            <div className="grid gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-700 md:grid-cols-3">
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.target")}:
                </span>{" "}
                {review.targetLabelMap[review.reviewJob.target_type] ??
                  review.reviewJob.target_type}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.source")}:
                </span>{" "}
                {review.sourceLabelMap[review.reviewJob.source_type] ??
                  review.reviewJob.source_type}{" "}
                #{review.reviewJob.source_id}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.model")}:
                </span>{" "}
                {review.reviewJob.ai_provider || "-"} /{" "}
                {review.reviewJob.ai_model || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.createdAt")}:
                </span>{" "}
                {review.reviewJob.created_at
                  ? formatDateTime(String(review.reviewJob.created_at))
                  : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.startedAt")}:
                </span>{" "}
                {review.reviewJob.started_at
                  ? formatDateTime(String(review.reviewJob.started_at))
                  : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t(
                    "pages.centerAIContent.workspace.details.meta.completedAt",
                  )}
                  :
                </span>{" "}
                {review.reviewJob.completed_at
                  ? formatDateTime(String(review.reviewJob.completed_at))
                  : "-"}
              </p>
            </div>

            {validationWarnings.length > 0 ? (
              <Alert>
                <AlertTitle>
                  {t(
                    "pages.centerAIContent.workspace.details.validationWarningsTitle",
                  )}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    {t(
                      "pages.centerAIContent.workspace.details.validationWarningsDescription",
                    )}
                  </p>
                  <ul className="list-disc space-y-1 ps-5">
                    {validationWarnings.map((warning, index) => (
                      <li key={`${warning}-${index}`}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}

            {isRetrying ? (
              <Alert>
                <AlertTitle>
                  {t("pages.centerAIContent.workspace.details.retryingTitle")}
                </AlertTitle>
                <AlertDescription>
                  {review.reviewJob.error_message}
                </AlertDescription>
              </Alert>
            ) : review.reviewJob.error_message ? (
              <Alert variant="destructive">
                <AlertTitle>
                  {t("pages.centerAIContent.workspace.details.failureTitle")}
                </AlertTitle>
                <AlertDescription>
                  {review.reviewJob.error_message}
                </AlertDescription>
              </Alert>
            ) : null}

            {/* Split-pane: Preview (left) + Edit (right) */}
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                <ReviewAssetPreview
                  targetType={review.reviewJob.target_type}
                  payload={
                    (review.reviewJob.reviewed_payload ??
                      review.reviewJob.generated_payload ??
                      {}) as Record<string, unknown>
                  }
                  activeLocale={review.activeLocale}
                />
              </div>

              {review.canSaveReview ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700">
                  <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {t("pages.centerAIContent.workspace.details.reviewEditor")}
                  </p>
                  <ReviewEditPanel
                    targetType={review.reviewJob.target_type}
                    jobLanguage={review.reviewLanguage}
                    activeLocale={review.activeLocale}
                    onActiveLocaleChange={review.setActiveLocale}
                    isAnyJobActionPending={review.isAnyJobActionPending}
                    summaryTitle={review.summaryTitle}
                    summaryContent={review.summaryContent}
                    quizTitle={review.quizTitle}
                    quizDescription={review.quizDescription}
                    quizQuestionsCount={review.quizQuestionsCount}
                    assignmentTitle={review.assignmentTitle}
                    assignmentDescription={review.assignmentDescription}
                    assignmentMaxPoints={review.assignmentMaxPoints}
                    assignmentPassingScore={review.assignmentPassingScore}
                    assignmentSubmissionTypes={review.assignmentSubmissionTypes}
                    flashcardsTitle={review.flashcardsTitle}
                    flashcardsCount={review.flashcardsCount}
                    interactiveTitle={review.interactiveTitle}
                    interactiveInstructions={review.interactiveInstructions}
                    interactiveStepsCount={review.interactiveStepsCount}
                    reviewJson={review.reviewJson}
                    reviewJsonError={review.reviewJsonError}
                    onUpdatePayloadStringField={review.updatePayloadStringField}
                    onUpdatePayloadNumberField={review.updatePayloadNumberField}
                    onUpdatePayloadNumberArrayField={
                      review.updatePayloadNumberArrayField
                    }
                    onReviewJsonChange={review.onReviewJsonChange}
                  />
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    {canReviewPublishAI
                      ? t(
                          "pages.centerAIContent.workspace.details.reviewLocked",
                        )
                      : t(
                          "pages.centerAIContent.workspace.details.reviewPermissionRequired",
                        )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {review.jobActionError ? (
              <Alert variant="destructive">
                <AlertDescription>{review.jobActionError}</AlertDescription>
              </Alert>
            ) : null}

            {/* Sticky action bar */}
            <ReviewActionBar
              reviewJobId={review.reviewJobId}
              statusTone={review.reviewStatusBadge.tone}
              statusLabel={review.reviewStatusLabel}
              currentStatus={review.reviewStatus}
              canSaveReview={review.canSaveReview}
              canApprove={review.canApprove}
              canPublish={review.canPublish}
              canDiscard={review.canDiscardReviewJob}
              isAnyJobActionPending={review.isAnyJobActionPending}
              isSavingReview={review.isSavingReview}
              isApprovingJob={review.isApprovingJob}
              isPublishingJob={review.isPublishingJob}
              isDiscardingJob={review.isDiscardingJob}
              isJobFetching={review.isReviewJobFetching}
              reviewJsonError={review.reviewJsonError}
              isReviewDirty={review.isReviewDirty}
              lastReviewSavedAt={review.lastReviewSavedAt}
              onSaveReview={() => void review.onSaveReview()}
              onApprove={() => void review.onApproveReviewJob()}
              onPublish={() => void review.onPublishReviewJob()}
              onDiscard={(jobId) => void handleDiscard(jobId)}
              onRefresh={() => void review.refreshReviewContext()}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
