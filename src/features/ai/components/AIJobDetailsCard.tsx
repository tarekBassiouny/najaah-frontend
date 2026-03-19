"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isRetryingAIJob, shouldPollAIJob } from "@/features/ai/lib/job-status";
import type {
  EditablePayload,
  ReviewLocale,
} from "@/features/ai/lib/review-payload";
import type {
  AIContentJob,
  AIContentLanguage,
  AIContentSourceType,
  AIContentTargetType,
} from "@/features/ai/types/ai";
import { ReviewAssetPreview } from "@/features/course-assets/components/ReviewAssetPreview";
import { ReviewEditPanel } from "@/features/course-assets/components/ReviewEditPanel";
import { formatDateTime } from "@/lib/format-date-time";

const STATUS_BADGE_VARIANTS = {
  neutral: "outline",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
} as const;

type TranslateFn = (
  _key: string,
  _params?: Record<string, string | number>,
) => string;

type AIJobDetailsCardProps = {
  t: TranslateFn;
  selectedJobId: number | null;
  selectedJob: AIContentJob | null;
  selectedStatusTone: keyof typeof STATUS_BADGE_VARIANTS;
  selectedStatusLabel: string;
  isSelectedJobLoading: boolean;
  isSelectedJobError: boolean;
  generatedPayloadPreview: string;
  reviewedPayloadPreview: string;
  generatedPayload: EditablePayload;
  reviewPayload: EditablePayload;
  reviewLanguage: AIContentLanguage;
  activeReviewLocale: ReviewLocale;
  targetLabelMap: Record<AIContentTargetType, string>;
  sourceLabelMap: Record<AIContentSourceType, string>;
  canReviewPublishAI: boolean;
  canSaveReview: boolean;
  canApprove: boolean;
  canPublish: boolean;
  canDiscard: boolean;
  isAnyJobActionPending: boolean;
  isSavingReview: boolean;
  isApprovingJob: boolean;
  isPublishingJob: boolean;
  isDiscardingJob: boolean;
  isSelectedJobFetching: boolean;
  reviewJson: string;
  reviewJsonError: string | null;
  jobActionError: string | null;
  summaryTitle: string;
  summaryContent: string;
  quizTitle: string;
  quizDescription: string;
  quizQuestionsCount: number;
  assignmentTitle: string;
  assignmentDescription: string;
  assignmentMaxPoints: number | null;
  assignmentPassingScore: number | null;
  assignmentSubmissionTypes: string;
  flashcardsTitle: string;
  flashcardsCount: number;
  interactiveTitle: string;
  interactiveInstructions: string;
  interactiveStepsCount: number;
  isReviewDirty: boolean;
  lastReviewSavedAt: string | null;
  currentStatus: number;
  onActiveReviewLocaleChange: (_value: ReviewLocale) => void;
  onUpdatePayloadStringField: (_paths: string[][], _value: string) => void;
  onUpdatePayloadNumberField: (_paths: string[][], _value: string) => void;
  onUpdatePayloadNumberArrayField: (_paths: string[][], _value: string) => void;
  onReviewJsonChange: (_value: string) => void;
  onSaveReview: () => void;
  onApprove: () => void;
  onPublish: () => void;
  onDiscard: (_jobId: number) => void;
  onRefresh: () => void;
};

export function AIJobDetailsCard({
  t,
  selectedJobId,
  selectedJob,
  selectedStatusTone,
  selectedStatusLabel,
  isSelectedJobLoading,
  isSelectedJobError,
  generatedPayloadPreview,
  reviewedPayloadPreview,
  generatedPayload,
  reviewPayload,
  reviewLanguage,
  activeReviewLocale,
  targetLabelMap,
  sourceLabelMap,
  canReviewPublishAI,
  canSaveReview,
  canApprove,
  canPublish,
  canDiscard,
  isAnyJobActionPending,
  isSavingReview,
  isApprovingJob,
  isPublishingJob,
  isDiscardingJob,
  isSelectedJobFetching,
  reviewJson,
  reviewJsonError,
  jobActionError,
  summaryTitle,
  summaryContent,
  quizTitle,
  quizDescription,
  quizQuestionsCount,
  assignmentTitle,
  assignmentDescription,
  assignmentMaxPoints,
  assignmentPassingScore,
  assignmentSubmissionTypes,
  flashcardsTitle,
  flashcardsCount,
  interactiveTitle,
  interactiveInstructions,
  interactiveStepsCount,
  isReviewDirty,
  lastReviewSavedAt,
  currentStatus,
  onActiveReviewLocaleChange,
  onUpdatePayloadStringField,
  onUpdatePayloadNumberField,
  onUpdatePayloadNumberArrayField,
  onReviewJsonChange,
  onSaveReview,
  onApprove,
  onPublish,
  onDiscard,
  onRefresh,
}: AIJobDetailsCardProps) {
  const isRetrying = isRetryingAIJob(selectedJob);
  const validationWarnings = selectedJob?.validation_warnings ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>
            {selectedJobId
              ? t("pages.centerAIContent.workspace.details.title", {
                  id: selectedJobId,
                })
              : t("pages.centerAIContent.workspace.details.emptyTitle")}
          </CardTitle>
          {selectedJob ? (
            <Badge variant={STATUS_BADGE_VARIANTS[selectedStatusTone]}>
              {selectedStatusLabel}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("pages.centerAIContent.workspace.details.description")}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {selectedJobId == null ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerAIContent.workspace.details.noSelection")}
          </p>
        ) : isSelectedJobLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : isSelectedJobError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
            <AlertDescription>
              {t("pages.centerAIContent.workspace.details.loadFailed")}
            </AlertDescription>
          </Alert>
        ) : selectedJob ? (
          <>
            <div className="grid gap-3 rounded-xl border border-gray-200 p-4 text-sm dark:border-gray-700 md:grid-cols-3">
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.target")}:
                </span>
                {targetLabelMap[selectedJob.target_type] ??
                  selectedJob.target_type}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.source")}:
                </span>
                {sourceLabelMap[selectedJob.source_type] ??
                  selectedJob.source_type}{" "}
                #{selectedJob.source_id}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.model")}:
                </span>
                {selectedJob.ai_provider || "-"} / {selectedJob.ai_model || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.createdAt")}:
                </span>
                {selectedJob.created_at
                  ? formatDateTime(String(selectedJob.created_at))
                  : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.startedAt")}:
                </span>
                {selectedJob.started_at
                  ? formatDateTime(String(selectedJob.started_at))
                  : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t(
                    "pages.centerAIContent.workspace.details.meta.completedAt",
                  )}
                  :
                </span>
                {selectedJob.completed_at
                  ? formatDateTime(String(selectedJob.completed_at))
                  : "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.meta.language")}:
                </span>
                {t(
                  `pages.centerAIContent.workspace.languages.${reviewLanguage}`,
                )}
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
                <AlertDescription>{selectedJob.error_message}</AlertDescription>
              </Alert>
            ) : selectedJob.error_message ? (
              <Alert variant="destructive">
                <AlertTitle>
                  {t("pages.centerAIContent.workspace.details.failureTitle")}
                </AlertTitle>
                <AlertDescription>{selectedJob.error_message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t(
                    "pages.centerAIContent.workspace.details.generatedPayload",
                  )}
                </p>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <ReviewAssetPreview
                    targetType={selectedJob.target_type}
                    payload={generatedPayload}
                    activeLocale={activeReviewLocale}
                  />
                </div>
                <pre className="max-h-48 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  {generatedPayloadPreview}
                </pre>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAIContent.workspace.details.reviewedPayload")}
                </p>
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <ReviewAssetPreview
                    targetType={selectedJob.target_type}
                    payload={reviewPayload}
                    activeLocale={activeReviewLocale}
                  />
                </div>
                <pre className="max-h-48 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                  {reviewedPayloadPreview}
                </pre>
              </div>
            </div>

            {canSaveReview ? (
              <Card className="border-dashed border-gray-300 dark:border-gray-700">
                <CardContent className="space-y-4 py-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("pages.centerAIContent.workspace.details.reviewEditor")}
                  </p>
                  <ReviewEditPanel
                    targetType={selectedJob.target_type}
                    jobLanguage={reviewLanguage}
                    activeLocale={activeReviewLocale}
                    onActiveLocaleChange={onActiveReviewLocaleChange}
                    isAnyJobActionPending={isAnyJobActionPending}
                    summaryTitle={summaryTitle}
                    summaryContent={summaryContent}
                    quizTitle={quizTitle}
                    quizDescription={quizDescription}
                    quizQuestionsCount={quizQuestionsCount}
                    assignmentTitle={assignmentTitle}
                    assignmentDescription={assignmentDescription}
                    assignmentMaxPoints={assignmentMaxPoints}
                    assignmentPassingScore={assignmentPassingScore}
                    assignmentSubmissionTypes={assignmentSubmissionTypes}
                    flashcardsTitle={flashcardsTitle}
                    flashcardsCount={flashcardsCount}
                    interactiveTitle={interactiveTitle}
                    interactiveInstructions={interactiveInstructions}
                    interactiveStepsCount={interactiveStepsCount}
                    reviewJson={reviewJson}
                    reviewJsonError={reviewJsonError}
                    onUpdatePayloadStringField={onUpdatePayloadStringField}
                    onUpdatePayloadNumberField={onUpdatePayloadNumberField}
                    onUpdatePayloadNumberArrayField={
                      onUpdatePayloadNumberArrayField
                    }
                    onReviewJsonChange={onReviewJsonChange}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.centerAIContent.workspace.details.reviewHint")}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Alert>
                <AlertDescription>
                  {canReviewPublishAI
                    ? t("pages.centerAIContent.workspace.details.reviewLocked")
                    : t(
                        "pages.centerAIContent.workspace.details.reviewPermissionRequired",
                      )}
                </AlertDescription>
              </Alert>
            )}

            {jobActionError ? (
              <Alert variant="destructive">
                <AlertDescription>{jobActionError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={onSaveReview}
                disabled={
                  !canSaveReview || isAnyJobActionPending || !!reviewJsonError
                }
              >
                {isSavingReview
                  ? t("common.actions.saving")
                  : t(
                      "pages.centerAIContent.workspace.details.actions.saveReview",
                    )}
              </Button>

              <Button
                variant="outline"
                onClick={onApprove}
                disabled={!canApprove || isAnyJobActionPending}
              >
                {isApprovingJob
                  ? t("common.actions.loading")
                  : t(
                      "pages.centerAIContent.workspace.details.actions.approve",
                    )}
              </Button>

              <Button
                variant="outline"
                onClick={onPublish}
                disabled={!canPublish || isAnyJobActionPending}
              >
                {isPublishingJob
                  ? t("common.actions.loading")
                  : t(
                      "pages.centerAIContent.workspace.details.actions.publish",
                    )}
              </Button>

              <Button
                variant="outline"
                onClick={() => onDiscard(selectedJob.id)}
                disabled={!canDiscard || isAnyJobActionPending}
              >
                {isDiscardingJob
                  ? t("common.actions.loading")
                  : t("pages.centerAIContent.workspace.jobs.actions.discard")}
              </Button>

              <Button
                variant="ghost"
                onClick={onRefresh}
                disabled={isSelectedJobFetching || isAnyJobActionPending}
              >
                {isSelectedJobFetching
                  ? t("common.actions.loading")
                  : t("common.actions.refresh")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
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
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
