import { useCallback, useEffect, useState } from "react";
import { useModal } from "@/components/ui/modal-store";
import {
  useAIJob,
  useApproveAIJob,
  useDiscardAIJob,
  usePublishAIJob,
  useReviewAIJob,
} from "@/features/ai/hooks/use-ai";
import { mapAIErrorCodeToMessage } from "@/features/ai/lib/error-mapper";
import {
  AI_JOB_STATUS,
  aiJobStatusBadge,
  isRetryingAIJob,
} from "@/features/ai/lib/job-status";
import {
  type EditablePayload,
  getEditablePayload,
  getFirstExistingPath,
  readArrayFromPaths,
  readLocalizedStringFromPaths,
  readNumberFromPaths,
  type ReviewLocale,
  toPrettyJson,
  writePath,
  writeLocalizedStringPath,
} from "@/features/ai/lib/review-payload";
import type {
  AIContentLanguage,
  AIContentSourceType,
  AIContentTargetType,
} from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";

type UseReviewStateParams = {
  centerId: string;
  isOpen: boolean;
  canGenerateAI: boolean;
  canReviewPublishAI: boolean;
  refetchCatalog: () => Promise<unknown>;
};

export function useReviewState({
  centerId,
  isOpen,
  canGenerateAI,
  canReviewPublishAI,
  refetchCatalog,
}: UseReviewStateParams) {
  const { t } = useTranslation();
  const { showToast } = useModal();

  const [reviewJobId, setReviewJobId] = useState<number | null>(null);
  const [reviewPayloadJobId, setReviewPayloadJobId] = useState<number | null>(
    null,
  );
  const [reviewPayload, setReviewPayload] = useState<EditablePayload>({});
  const [reviewJson, setReviewJson] = useState("{}");
  const [reviewJsonError, setReviewJsonError] = useState<string | null>(null);
  const [isReviewDirty, setIsReviewDirty] = useState(false);
  const [jobActionError, setJobActionError] = useState<string | null>(null);
  const [lastReviewSavedAt, setLastReviewSavedAt] = useState<string | null>(
    null,
  );
  const [activeLocale, setActiveLocale] = useState<ReviewLocale>("ar");

  const {
    data: reviewJobResponse,
    isLoading: isReviewJobLoading,
    isFetching: isReviewJobFetching,
    isError: isReviewJobError,
    refetch: refetchReviewJob,
  } = useAIJob(centerId, reviewJobId ?? undefined, {
    enabled: isOpen && reviewJobId != null,
    staleTime: 0,
  });

  const { mutateAsync: saveReview, isPending: isSavingReview } =
    useReviewAIJob();
  const { mutateAsync: approveJob, isPending: isApprovingJob } =
    useApproveAIJob();
  const { mutateAsync: publishJob, isPending: isPublishingJob } =
    usePublishAIJob();
  const { mutateAsync: discardJob, isPending: isDiscardingJob } =
    useDiscardAIJob();

  const reviewJob = reviewJobResponse?.data ?? null;
  const reviewStatus = Number(reviewJob?.status ?? -1);
  const reviewIsRetrying = isRetryingAIJob(reviewJob);
  const reviewStatusBadge = aiJobStatusBadge(reviewStatus, reviewIsRetrying);
  const reviewStatusLabel = reviewIsRetrying
    ? t("pages.centerAIContent.workspace.statusLabels.retrying")
    : reviewJob?.status_label || reviewStatusBadge.label;
  const canSaveReview =
    canReviewPublishAI &&
    (reviewStatus === AI_JOB_STATUS.completed ||
      reviewStatus === AI_JOB_STATUS.approved);
  const canApprove =
    canReviewPublishAI && reviewStatus === AI_JOB_STATUS.completed;
  const canPublish =
    canReviewPublishAI && reviewStatus === AI_JOB_STATUS.approved;
  const canDiscardReviewJob =
    canGenerateAI &&
    reviewJob != null &&
    reviewStatus !== AI_JOB_STATUS.published &&
    reviewStatus !== AI_JOB_STATUS.discarded;
  const isAnyJobActionPending =
    isSavingReview || isApprovingJob || isPublishingJob || isDiscardingJob;

  const targetLabelMap: Record<AIContentTargetType, string> = {
    summary: t("pages.courseAssets.slotTypes.summary"),
    quiz: t("pages.courseAssets.slotTypes.quiz"),
    assignment: t("pages.courseAssets.slotTypes.assignment"),
    flashcards: t("pages.courseAssets.slotTypes.flashcards"),
    interactive_activity: t(
      "pages.centerCourseDetail.panels.interactiveActivity",
    ),
  };

  const sourceLabelMap: Record<AIContentSourceType, string> = {
    video: t("pages.courseAssets.labels.video"),
    pdf: t("pages.courseAssets.labels.pdf"),
    section: t("pages.centerAIContent.workspace.sourceTypes.section"),
    course: t("pages.centerAIContent.workspace.sourceTypes.course"),
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!reviewJob) {
      if (reviewPayloadJobId != null) {
        setReviewPayload({});
        setReviewJson("{}");
        setReviewJsonError(null);
        setIsReviewDirty(false);
        setJobActionError(null);
        setLastReviewSavedAt(null);
        setReviewPayloadJobId(null);
      }
      return;
    }

    if (isReviewDirty && reviewPayloadJobId === reviewJob.id) return;

    const nextPayload = getEditablePayload(reviewJob);
    setReviewPayload(nextPayload);
    setReviewJson(toPrettyJson(nextPayload));
    setReviewJsonError(null);
    setIsReviewDirty(false);
    setJobActionError(null);
    setLastReviewSavedAt(null);
    setReviewPayloadJobId(reviewJob.id);
    setActiveLocale(reviewJob.language === "en" ? "en" : "ar");
  }, [isOpen, isReviewDirty, reviewJob, reviewPayloadJobId]);

  const applyPayloadUpdate = (nextPayload: EditablePayload) => {
    setReviewPayload(nextPayload);
    setReviewJson(toPrettyJson(nextPayload));
    setReviewJsonError(null);
    setIsReviewDirty(true);
    setJobActionError(null);
    setLastReviewSavedAt(null);
  };

  const updatePayloadStringField = useCallback(
    (paths: string[][], value: string) => {
      const nextPayload = writeLocalizedStringPath(
        reviewPayload,
        paths,
        (reviewJob?.language ?? "ar") as AIContentLanguage,
        activeLocale,
        value,
      );
      applyPayloadUpdate(nextPayload);
    },
    [activeLocale, reviewJob?.language, reviewPayload],
  );

  const updatePayloadNumberField = useCallback(
    (paths: string[][], value: string) => {
      const path = getFirstExistingPath(reviewPayload, paths);
      if (path.length === 0) return;
      const trimmed = value.trim();
      const parsed = trimmed === "" ? null : Number(trimmed);
      const payloadValue = Number.isFinite(parsed) ? parsed : null;
      applyPayloadUpdate(writePath(reviewPayload, path, payloadValue));
    },
    [reviewPayload],
  );

  const updatePayloadNumberArrayField = useCallback(
    (paths: string[][], value: string) => {
      const path = getFirstExistingPath(reviewPayload, paths);
      if (path.length === 0) return;
      const parsed = value
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
      applyPayloadUpdate(writePath(reviewPayload, path, parsed));
    },
    [reviewPayload],
  );

  const onReviewJsonChange = useCallback(
    (nextJson: string) => {
      setReviewJson(nextJson);
      setIsReviewDirty(true);
      setLastReviewSavedAt(null);

      try {
        const parsed = JSON.parse(nextJson) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          setReviewJsonError(
            t("pages.centerAIContent.workspace.details.invalidPayload"),
          );
          return;
        }
        setReviewPayload(parsed as EditablePayload);
        setReviewJsonError(null);
      } catch {
        setReviewJsonError(
          t("pages.centerAIContent.workspace.details.invalidJson"),
        );
      }
    },
    [t],
  );

  const toMappedErrorMessage = (error: unknown, fallback: string) => {
    const code = getAdminApiErrorCode(error);
    const backendMessage = getAdminApiErrorMessage(error, fallback);
    return mapAIErrorCodeToMessage(code, backendMessage);
  };

  const refreshReviewContext = async (options?: {
    skipJobRefetch?: boolean;
    skipBatchRefetch?: boolean;
  }) => {
    const refreshes: Array<Promise<unknown>> = [refetchCatalog()];
    if (!options?.skipJobRefetch && reviewJobId != null) {
      refreshes.push(refetchReviewJob());
    }
    await Promise.all(refreshes);
  };

  const onSaveReview = async () => {
    if (!reviewJobId) return;
    if (reviewJsonError) {
      setJobActionError(reviewJsonError);
      return;
    }
    try {
      const result = await saveReview({
        centerId,
        jobId: reviewJobId,
        reviewedPayload: reviewPayload,
      });
      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.reviewSaved"),
        ),
        "success",
      );
      setIsReviewDirty(false);
      setJobActionError(null);
      setLastReviewSavedAt(new Date().toISOString());
      await refreshReviewContext();
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.reviewFailed"),
        ),
      );
    }
  };

  const onApproveReviewJob = async () => {
    if (!reviewJobId) return;
    try {
      const result = await approveJob({ centerId, jobId: reviewJobId });
      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.jobApproved"),
        ),
        "success",
      );
      setJobActionError(null);
      await refreshReviewContext();
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.approveFailed"),
        ),
      );
    }
  };

  const onPublishReviewJob = async () => {
    if (!reviewJobId) return;
    try {
      const result = await publishJob({ centerId, jobId: reviewJobId });
      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.jobPublished"),
        ),
        "success",
      );
      setJobActionError(null);
      await refreshReviewContext();
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.publishFailed"),
        ),
      );
    }
  };

  const onDiscardReviewJob = async (jobId: number) => {
    const confirmed = window.confirm(
      t("pages.centerAIContent.workspace.jobs.discardConfirm"),
    );
    if (!confirmed) return;
    try {
      const result = await discardJob({ centerId, jobId });
      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.jobDiscarded"),
        ),
        "success",
      );
      setJobActionError(null);
      if (reviewJobId === jobId) {
        return "closed" as const;
      }
      await refreshReviewContext({ skipJobRefetch: true });
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.discardFailed"),
        ),
      );
    }
    return undefined;
  };

  const reviewGeneratedPayloadPreview = toPrettyJson(
    reviewJob?.generated_payload ?? {},
  );
  const reviewReviewedPayloadPreview = toPrettyJson(
    reviewJob?.reviewed_payload ?? {},
  );

  const reviewLanguage = (reviewJob?.language ?? "ar") as AIContentLanguage;

  const summaryTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeLocale,
  );
  const summaryContent = readLocalizedStringFromPaths(
    reviewPayload,
    [["content"], ["content_translations"]],
    activeLocale,
  );
  const quizTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeLocale,
  );
  const quizDescription = readLocalizedStringFromPaths(
    reviewPayload,
    [["description"], ["description_translations"]],
    activeLocale,
  );
  const quizQuestionsCount = readArrayFromPaths(reviewPayload, [
    ["questions"],
  ]).length;
  const assignmentTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeLocale,
  );
  const assignmentDescription = readLocalizedStringFromPaths(
    reviewPayload,
    [["description"], ["description_translations"]],
    activeLocale,
  );
  const assignmentMaxPoints = readNumberFromPaths(reviewPayload, [
    ["max_points"],
  ]);
  const assignmentPassingScore = readNumberFromPaths(reviewPayload, [
    ["passing_score"],
  ]);
  const assignmentSubmissionTypes = readArrayFromPaths(reviewPayload, [
    ["submission_types"],
  ])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .join(", ");
  const flashcardsTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeLocale,
  );
  const flashcardsCount = readArrayFromPaths(reviewPayload, [["cards"]]).length;
  const interactiveTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeLocale,
  );
  const interactiveInstructions = readLocalizedStringFromPaths(
    reviewPayload,
    [["instructions"]],
    activeLocale,
  );
  const interactiveStepsCount = readArrayFromPaths(reviewPayload, [
    ["steps"],
  ]).length;

  const openReviewDialog = (jobId: number) => {
    setReviewJobId(jobId);
  };

  const resetReviewState = () => {
    setReviewJobId(null);
    setReviewPayloadJobId(null);
    setReviewPayload({});
    setReviewJson("{}");
    setReviewJsonError(null);
    setIsReviewDirty(false);
    setJobActionError(null);
    setLastReviewSavedAt(null);
  };

  return {
    reviewJobId,
    reviewJob,
    reviewStatus,
    reviewStatusBadge,
    reviewStatusLabel,
    isReviewJobLoading,
    isReviewJobFetching,
    isReviewJobError,
    canSaveReview,
    canApprove,
    canPublish,
    canDiscardReviewJob,
    isAnyJobActionPending,
    isSavingReview,
    isApprovingJob,
    isPublishingJob,
    isDiscardingJob,
    targetLabelMap,
    sourceLabelMap,
    reviewJson,
    reviewJsonError,
    jobActionError,
    isReviewDirty,
    lastReviewSavedAt,
    reviewGeneratedPayloadPreview,
    reviewReviewedPayloadPreview,
    reviewLanguage,
    activeLocale,
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
    setActiveLocale,
    updatePayloadStringField,
    updatePayloadNumberField,
    updatePayloadNumberArrayField,
    onReviewJsonChange,
    onSaveReview,
    onApproveReviewJob,
    onPublishReviewJob,
    onDiscardReviewJob,
    refreshReviewContext,
    openReviewDialog,
    resetReviewState,
  };
}
