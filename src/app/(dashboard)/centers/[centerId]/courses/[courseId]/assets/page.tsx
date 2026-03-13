"use client";

import { use, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AIJobDetailsCard } from "@/features/ai/components";
import { useModal } from "@/components/ui/modal-store";
import {
  useAIJob,
  useAIJobs,
  useApproveAIJob,
  useCreateAIBatch,
  useDiscardAIJob,
  usePublishAIJob,
  useReviewAIJob,
} from "@/features/ai/hooks/use-ai";
import { mapAIErrorCodeToMessage } from "@/features/ai/lib/error-mapper";
import {
  AI_JOB_STATUS,
  aiJobStatusBadge,
  shouldPollAIJob,
} from "@/features/ai/lib/job-status";
import {
  type EditablePayload,
  getEditablePayload,
  getFirstExistingPath,
  readArrayFromPaths,
  readNumberFromPaths,
  readStringFromPaths,
  toPrettyJson,
  writePath,
} from "@/features/ai/lib/review-payload";
import type {
  AIContentSourceType,
  AIContentTargetType,
  CreateAIBatchAssetRequest,
  CreateAIBatchRequest,
} from "@/features/ai/types/ai";
import { useAssetCatalog } from "@/features/course-assets/hooks/use-asset-catalog";
import type {
  AssetSlotState,
  AssetSlotType,
  CourseAssetSource,
} from "@/features/course-assets/types/asset-catalog";
import { groupSourcesBySection } from "@/features/course-builder/utils/group-sources-by-section";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { can } from "@/lib/capabilities";

type PageProps = {
  params: Promise<{ centerId: string; courseId: string }>;
};

type SelectedSource = {
  type: "video" | "pdf";
  id: number;
  title: string | null;
  sectionTitle: string | null;
  presetAssetType?: AssetSlotType;
  presetTargetId?: number | null;
};

type GenerateFormState = {
  summary: boolean;
  quiz: boolean;
  flashcards: boolean;
  assignment: boolean;
  summaryLength: "short" | "medium" | "long";
  summaryIncludeKeyPoints: boolean;
  quizQuestionCount: string;
  quizDifficulty: "easy" | "medium" | "hard";
  quizStyleSingleChoice: boolean;
  quizStyleMultipleChoice: boolean;
  quizStyleTrueFalse: boolean;
  flashcardsCount: string;
  flashcardsFocusDefinitions: boolean;
  flashcardsFocusConcepts: boolean;
  flashcardsFocusFormulas: boolean;
  assignmentStyle: "practice" | "essay" | "project";
  assignmentAllowFile: boolean;
  assignmentAllowText: boolean;
  assignmentAllowLink: boolean;
  assignmentMaxPoints: string;
};

const SLOT_ORDER: AssetSlotType[] = [
  "summary",
  "quiz",
  "flashcards",
  "assignment",
];

const STATUS_BADGE_VARIANTS = {
  neutral: "outline",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "error",
} as const;

function isCourseAssetSlotType(value: string): value is AssetSlotType {
  return (
    value === "summary" ||
    value === "quiz" ||
    value === "flashcards" ||
    value === "assignment"
  );
}

function defaultGenerateFormState(): GenerateFormState {
  return {
    summary: true,
    quiz: true,
    flashcards: true,
    assignment: false,
    summaryLength: "medium",
    summaryIncludeKeyPoints: true,
    quizQuestionCount: "10",
    quizDifficulty: "medium",
    quizStyleSingleChoice: true,
    quizStyleMultipleChoice: false,
    quizStyleTrueFalse: true,
    flashcardsCount: "15",
    flashcardsFocusDefinitions: true,
    flashcardsFocusConcepts: true,
    flashcardsFocusFormulas: false,
    assignmentStyle: "practice",
    assignmentAllowFile: true,
    assignmentAllowText: true,
    assignmentAllowLink: false,
    assignmentMaxPoints: "100",
  };
}

function slotStateBadgeVariant(
  state: AssetSlotState,
): "outline" | "secondary" | "info" | "warning" | "success" | "error" {
  switch (state) {
    case "draft":
      return "secondary";
    case "generating":
      return "info";
    case "review_required":
      return "warning";
    case "approved":
      return "info";
    case "published":
      return "success";
    case "failed":
      return "error";
    case "missing":
    default:
      return "outline";
  }
}

function buildManualEntryHref(params: {
  centerId: string;
  courseId: string;
  targetType: "quiz" | "assignment";
  sourceType: "video" | "pdf";
  sourceId: string | number;
  sourceTitle: string | null;
  returnTo?: string;
}) {
  const query = new URLSearchParams();
  query.set("attachable_type", params.sourceType);
  query.set("attachable_id", String(params.sourceId));
  query.set("open_create", "1");
  if (params.returnTo?.trim()) {
    query.set("return_to", params.returnTo.trim());
  }
  if (params.sourceTitle?.trim()) {
    query.set("source_label", params.sourceTitle.trim());
  }

  const basePath =
    params.targetType === "quiz"
      ? `/centers/${params.centerId}/courses/${params.courseId}/quizzes`
      : `/centers/${params.centerId}/courses/${params.courseId}/assignments`;

  return `${basePath}?${query.toString()}`;
}

export default function CourseAssetsPage({ params }: PageProps) {
  const { centerId, courseId } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useModal();

  const canManageCourses = can("manage_courses");
  const canGenerateAI = can("generate_ai_content");
  const canReviewPublishAI = can("review_publish_ai_content");
  const canManageQuizzes = can("manage_quizzes");
  const canManageAssignments = can("manage_assignments");
  const canManageLearningAssets = can("manage_learning_assets");
  const assetsWorkspacePath = `/centers/${centerId}/courses/${courseId}/assets`;

  const {
    data: catalog,
    isLoading: isCatalogLoading,
    isFetching: isCatalogFetching,
    isError: isCatalogError,
    refetch: refetchCatalog,
  } = useAssetCatalog(centerId, courseId);

  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(
    null,
  );
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [manualSource, setManualSource] = useState<SelectedSource | null>(null);
  const [generateForm, setGenerateForm] = useState<GenerateFormState>(
    defaultGenerateFormState,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [activeBatchKey, setActiveBatchKey] = useState<string | null>(null);
  const [isBatchDrawerOpen, setIsBatchDrawerOpen] = useState(false);

  const { mutateAsync: createBatch, isPending: isCreatingBatch } =
    useCreateAIBatch();

  const {
    data: batchJobsResponse,
    isFetching: isBatchFetching,
    refetch: refetchBatchJobs,
  } = useAIJobs(
    centerId,
    {
      course_id: Number(courseId),
      batch_key: activeBatchKey ?? undefined,
      per_page: 100,
    },
    {
      enabled: Boolean(activeBatchKey && isBatchDrawerOpen),
      refetchInterval: (query) => {
        const jobs = query.state.data?.data ?? [];
        const hasRunningJobs = jobs.some((job) =>
          shouldPollAIJob(Number(job.status)),
        );
        return hasRunningJobs ? 4_000 : false;
      },
    },
  );

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
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

  const {
    data: reviewJobResponse,
    isLoading: isReviewJobLoading,
    isFetching: isReviewJobFetching,
    isError: isReviewJobError,
    refetch: refetchReviewJob,
  } = useAIJob(centerId, reviewJobId ?? undefined, {
    enabled: isReviewDialogOpen && reviewJobId != null,
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

  const groupedSections = useMemo(
    () => groupSourcesBySection(catalog?.sources ?? []),
    [catalog?.sources],
  );

  const batchJobs = useMemo(
    () => batchJobsResponse?.data ?? [],
    [batchJobsResponse?.data],
  );
  const batchSummary = useMemo(() => {
    const summary = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      approved: 0,
      published: 0,
      discarded: 0,
    };

    batchJobs.forEach((job) => {
      switch (Number(job.status)) {
        case AI_JOB_STATUS.pending:
          summary.pending += 1;
          break;
        case AI_JOB_STATUS.processing:
          summary.processing += 1;
          break;
        case AI_JOB_STATUS.completed:
          summary.completed += 1;
          break;
        case AI_JOB_STATUS.failed:
          summary.failed += 1;
          break;
        case AI_JOB_STATUS.approved:
          summary.approved += 1;
          break;
        case AI_JOB_STATUS.published:
          summary.published += 1;
          break;
        case AI_JOB_STATUS.discarded:
          summary.discarded += 1;
          break;
        default:
          break;
      }
    });

    return summary;
  }, [batchJobs]);

  const hasRunningBatchJobs = useMemo(
    () => batchJobs.some((job) => shouldPollAIJob(Number(job.status))),
    [batchJobs],
  );

  const catalogStats = useMemo(() => {
    const summary = {
      sources: catalog?.sources?.length ?? 0,
      generating: 0,
      reviewRequired: 0,
      published: 0,
      failed: 0,
    };

    (catalog?.sources ?? []).forEach((source) => {
      source.assets.forEach((slot) => {
        if (slot.slot_state === "generating") summary.generating += 1;
        if (slot.slot_state === "review_required") summary.reviewRequired += 1;
        if (slot.slot_state === "published") summary.published += 1;
        if (slot.slot_state === "failed") summary.failed += 1;
      });
    });

    return summary;
  }, [catalog?.sources]);

  const selectedAssetsCount = useMemo(
    () =>
      Number(generateForm.summary) +
      Number(generateForm.quiz) +
      Number(generateForm.flashcards) +
      Number(generateForm.assignment),
    [
      generateForm.assignment,
      generateForm.flashcards,
      generateForm.quiz,
      generateForm.summary,
    ],
  );

  const reviewJob = reviewJobResponse?.data ?? null;
  const reviewStatus = Number(reviewJob?.status ?? -1);
  const reviewStatusBadge = aiJobStatusBadge(reviewStatus);
  const reviewStatusLabel = reviewJob?.status_label || reviewStatusBadge.label;
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
    if (!isReviewDialogOpen) {
      return;
    }

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

    if (isReviewDirty && reviewPayloadJobId === reviewJob.id) {
      return;
    }

    const nextPayload = getEditablePayload(reviewJob);
    setReviewPayload(nextPayload);
    setReviewJson(toPrettyJson(nextPayload));
    setReviewJsonError(null);
    setIsReviewDirty(false);
    setJobActionError(null);
    setLastReviewSavedAt(null);
    setReviewPayloadJobId(reviewJob.id);
  }, [isReviewDialogOpen, isReviewDirty, reviewJob, reviewPayloadJobId]);

  const openReviewDialog = (jobId: number, batchKey?: string | null) => {
    if (batchKey?.trim()) {
      setActiveBatchKey(batchKey.trim());
    }
    setReviewJobId(jobId);
    setIsBatchDrawerOpen(false);
    setIsReviewDialogOpen(true);
  };

  const applyPayloadUpdate = (nextPayload: EditablePayload) => {
    setReviewPayload(nextPayload);
    setReviewJson(toPrettyJson(nextPayload));
    setReviewJsonError(null);
    setIsReviewDirty(true);
    setJobActionError(null);
    setLastReviewSavedAt(null);
  };

  const updatePayloadStringField = (paths: string[][], value: string) => {
    const path = getFirstExistingPath(reviewPayload, paths);
    if (path.length === 0) return;

    const nextPayload = writePath(reviewPayload, path, value);
    applyPayloadUpdate(nextPayload);
  };

  const updatePayloadNumberField = (paths: string[][], value: string) => {
    const path = getFirstExistingPath(reviewPayload, paths);
    if (path.length === 0) return;

    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    const payloadValue = Number.isFinite(parsed) ? parsed : null;
    const nextPayload = writePath(reviewPayload, path, payloadValue);
    applyPayloadUpdate(nextPayload);
  };

  const updatePayloadNumberArrayField = (paths: string[][], value: string) => {
    const path = getFirstExistingPath(reviewPayload, paths);
    if (path.length === 0) return;

    const parsed = value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));

    const nextPayload = writePath(reviewPayload, path, parsed);
    applyPayloadUpdate(nextPayload);
  };

  const onReviewJsonChange = (nextJson: string) => {
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
  };

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

    if (!options?.skipBatchRefetch && activeBatchKey) {
      refreshes.push(refetchBatchJobs());
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
      const result = await approveJob({
        centerId,
        jobId: reviewJobId,
      });

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
      const result = await publishJob({
        centerId,
        jobId: reviewJobId,
      });

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
      const result = await discardJob({
        centerId,
        jobId,
      });

      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.jobDiscarded"),
        ),
        "success",
      );

      setJobActionError(null);
      if (reviewJobId === jobId) {
        setIsReviewDialogOpen(false);
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
  };

  const reviewGeneratedPayloadPreview = toPrettyJson(
    reviewJob?.generated_payload ?? {},
  );
  const reviewReviewedPayloadPreview = toPrettyJson(
    reviewJob?.reviewed_payload ?? {},
  );

  const summaryTitle = readStringFromPaths(reviewPayload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const summaryContent = readStringFromPaths(reviewPayload, [
    ["content"],
    ["content_translations", "en"],
  ]);
  const quizTitle = readStringFromPaths(reviewPayload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const quizDescription = readStringFromPaths(reviewPayload, [
    ["description"],
    ["description_translations", "en"],
  ]);
  const quizQuestionsCount = readArrayFromPaths(reviewPayload, [
    ["questions"],
  ]).length;
  const assignmentTitle = readStringFromPaths(reviewPayload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const assignmentDescription = readStringFromPaths(reviewPayload, [
    ["description"],
    ["description_translations", "en"],
  ]);
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
  const flashcardsTitle = readStringFromPaths(reviewPayload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const flashcardsCount = readArrayFromPaths(reviewPayload, [["cards"]]).length;
  const interactiveTitle = readStringFromPaths(reviewPayload, [
    ["title"],
    ["title_translations", "en"],
  ]);
  const interactiveInstructions = readStringFromPaths(reviewPayload, [
    ["instructions"],
  ]);
  const interactiveStepsCount = readArrayFromPaths(reviewPayload, [
    ["steps"],
  ]).length;

  const openGenerateModal = (
    source: CourseAssetSource,
    presetAssetType?: AssetSlotType,
    presetTargetId?: number | null,
  ) => {
    const nextState = defaultGenerateFormState();
    if (presetAssetType) {
      nextState.summary = presetAssetType === "summary";
      nextState.quiz = presetAssetType === "quiz";
      nextState.flashcards = presetAssetType === "flashcards";
      nextState.assignment = presetAssetType === "assignment";
    }

    setGenerateForm(nextState);
    setGenerateError(null);
    setSelectedSource({
      type: source.type,
      id: Number(source.id),
      title: source.title,
      sectionTitle: source.section?.title ?? null,
      presetAssetType,
      presetTargetId: presetTargetId ?? null,
    });
    setIsGenerateModalOpen(true);
  };

  const toAssetBatchPayload = (): CreateAIBatchAssetRequest[] => {
    if (!selectedSource) return [];

    const assets: CreateAIBatchAssetRequest[] = [];

    if (generateForm.summary) {
      assets.push({
        target_type: "summary",
        target_id:
          selectedSource.presetAssetType === "summary"
            ? selectedSource.presetTargetId
            : null,
        generation_config: {
          length: generateForm.summaryLength,
          include_key_points: generateForm.summaryIncludeKeyPoints,
        },
      });
    }

    if (generateForm.quiz) {
      const questionStyles: Array<
        "single_choice" | "multiple_choice" | "true_false"
      > = [];
      if (generateForm.quizStyleSingleChoice)
        questionStyles.push("single_choice");
      if (generateForm.quizStyleMultipleChoice) {
        questionStyles.push("multiple_choice");
      }
      if (generateForm.quizStyleTrueFalse) questionStyles.push("true_false");

      assets.push({
        target_type: "quiz",
        target_id:
          selectedSource.presetAssetType === "quiz"
            ? selectedSource.presetTargetId
            : null,
        generation_config: {
          question_count: Number(generateForm.quizQuestionCount || 10),
          difficulty: generateForm.quizDifficulty,
          question_styles: questionStyles,
        },
      });
    }

    if (generateForm.flashcards) {
      const focus: Array<"definitions" | "concepts" | "formulas"> = [];
      if (generateForm.flashcardsFocusDefinitions) focus.push("definitions");
      if (generateForm.flashcardsFocusConcepts) focus.push("concepts");
      if (generateForm.flashcardsFocusFormulas) focus.push("formulas");

      assets.push({
        target_type: "flashcards",
        target_id:
          selectedSource.presetAssetType === "flashcards"
            ? selectedSource.presetTargetId
            : null,
        generation_config: {
          card_count: Number(generateForm.flashcardsCount || 15),
          focus,
        },
      });
    }

    if (generateForm.assignment) {
      const submissionTypes: number[] = [];
      if (generateForm.assignmentAllowFile) submissionTypes.push(0);
      if (generateForm.assignmentAllowText) submissionTypes.push(1);
      if (generateForm.assignmentAllowLink) submissionTypes.push(2);

      assets.push({
        target_type: "assignment",
        target_id:
          selectedSource.presetAssetType === "assignment"
            ? selectedSource.presetTargetId
            : null,
        generation_config: {
          assignment_style: generateForm.assignmentStyle,
          submission_types: submissionTypes,
          max_points: Number(generateForm.assignmentMaxPoints || 100),
        },
      });
    }

    return assets;
  };

  const handleGenerateSubmit = async () => {
    if (!selectedSource) return;

    setGenerateError(null);

    if (selectedAssetsCount === 0) {
      setGenerateError(t("pages.courseAssets.errors.selectAsset"));
      return;
    }

    const aiAssets = toAssetBatchPayload();

    if (aiAssets.length === 0) {
      setGenerateError(t("pages.courseAssets.errors.selectAsset"));
      return;
    }

    const payload: CreateAIBatchRequest = {
      course_id: Number(courseId),
      source_type: selectedSource.type,
      source_id: selectedSource.id,
      assets: aiAssets,
    };

    try {
      const response = await createBatch({ centerId, payload });
      setActiveBatchKey(response.data.batch_key);
      setIsBatchDrawerOpen(true);
      setIsGenerateModalOpen(false);
      showToast(t("pages.courseAssets.toasts.batchCreated"), "success");
    } catch {
      setGenerateError(t("pages.courseAssets.errors.batchCreateFailed"));
    }
  };

  const openManualDialog = (source: CourseAssetSource) => {
    setManualSource({
      type: source.type,
      id: Number(source.id),
      title: source.title,
      sectionTitle: source.section?.title ?? null,
    });
    setIsManualDialogOpen(true);
  };

  const handleManualCreate = (targetType: "quiz" | "assignment") => {
    if (!manualSource) return;

    setIsManualDialogOpen(false);
    router.push(
      buildManualEntryHref({
        centerId,
        courseId,
        targetType,
        sourceType: manualSource.type,
        sourceId: manualSource.id,
        sourceTitle: manualSource.title,
        returnTo: assetsWorkspacePath,
      }),
    );
  };

  const renderSlotActions = (
    source: CourseAssetSource,
    slotType: AssetSlotType,
    slotState: AssetSlotState,
    canonical: { id: number; kind: string } | null,
    latestJobBatchKey: string | null,
    latestJobId: number | null,
  ) => {
    const actions: ReactNode[] = [];

    const addGenerate = (mode: "generate" | "regenerate" = "generate") => {
      if (!canGenerateAI) return;
      actions.push(
        <Button
          key="generate"
          size="sm"
          variant="outline"
          onClick={() =>
            openGenerateModal(source, slotType, canonical?.id ?? null)
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
          onClick={() => openReviewDialog(latestJobId, latestJobBatchKey)}
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
              onClick={() => {
                setActiveBatchKey(latestJobBatchKey);
                setIsBatchDrawerOpen(true);
              }}
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
  };

  if (!canManageCourses) {
    return (
      <Alert>
        <AlertTitle>{t("pages.courseAssets.permission.title")}</AlertTitle>
        <AlertDescription>
          {t("pages.courseAssets.permission.description")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.courseAssets.title")}
        description={t("pages.courseAssets.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/centers/${centerId}/courses/${courseId}`}>
              <Button variant="outline">
                {t("pages.courseAssets.actions.backToCourse")}
              </Button>
            </Link>
          </div>
        }
      />

      {!isCatalogLoading ? (
        <Card>
          <CardContent className="py-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.summary.sources")}
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {catalogStats.sources}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.summary.generating")}
                </p>
                <p className="text-base font-semibold text-blue-600 dark:text-blue-400">
                  {catalogStats.generating}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.summary.reviewRequired")}
                </p>
                <p className="text-base font-semibold text-amber-600 dark:text-amber-400">
                  {catalogStats.reviewRequired}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.summary.published")}
                </p>
                <p className="text-base font-semibold text-green-600 dark:text-green-400">
                  {catalogStats.published}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.summary.failed")}
                </p>
                <p className="text-base font-semibold text-red-600 dark:text-red-400">
                  {catalogStats.failed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isCatalogError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
          <AlertDescription>
            {t("pages.courseAssets.errors.loadFailed")}
          </AlertDescription>
        </Alert>
      ) : null}

      {isCatalogLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full" />
          ))}
        </div>
      ) : groupedSections.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 py-10 text-center">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {t("pages.courseAssets.emptyTitle")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pages.courseAssets.empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        groupedSections.map((group) => (
          <Card key={`section-${group.section.id ?? "none"}`}>
            <CardHeader>
              <CardTitle>
                {group.section.title ||
                  t("pages.courseAssets.labels.unsectioned")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.sources.map((source) => {
                const slotsByType = new Map(
                  source.assets.map((slot) => [slot.asset_type, slot] as const),
                );

                return (
                  <div
                    key={`${source.type}-${source.id}`}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {source.title || `#${source.id}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {source.type === "video"
                            ? t("pages.courseAssets.labels.video")
                            : t("pages.courseAssets.labels.pdf")}{" "}
                          • #{source.id}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {canGenerateAI ? (
                          <Button
                            size="sm"
                            onClick={() => openGenerateModal(source)}
                          >
                            {t("pages.courseAssets.actions.generateWithAI")}
                          </Button>
                        ) : null}
                        {canManageQuizzes || canManageAssignments ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openManualDialog(source)}
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
                          slot_state: "missing",
                          canonical: null,
                          latest_job: null,
                        };
                        const actions = renderSlotActions(
                          source,
                          slotType,
                          slot.slot_state,
                          slot.canonical
                            ? {
                                id: Number(slot.canonical.id),
                                kind: String(slot.canonical.kind),
                              }
                            : null,
                          slot.latest_job?.batch_key ?? null,
                          slot.latest_job?.id != null
                            ? Number(slot.latest_job.id)
                            : null,
                        );

                        return (
                          <div
                            key={`${source.type}-${source.id}-${slotType}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {t(`pages.courseAssets.slotTypes.${slotType}`)}
                              </span>
                              <Badge
                                variant={slotStateBadgeVariant(slot.slot_state)}
                              >
                                {t(
                                  `pages.courseAssets.slotStates.${slot.slot_state}`,
                                )}
                              </Badge>
                              {slot.canonical?.title ? (
                                <span className="truncate text-xs text-gray-500 dark:text-gray-400">
                                  {slot.canonical.title}
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
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("pages.courseAssets.generateModal.title")}
            </DialogTitle>
            <DialogDescription>
              {selectedSource
                ? t("pages.courseAssets.generateModal.descriptionWithSource", {
                    type:
                      selectedSource.type === "video"
                        ? t("pages.courseAssets.labels.video")
                        : t("pages.courseAssets.labels.pdf"),
                    title: selectedSource.title || `#${selectedSource.id}`,
                  })
                : t("pages.courseAssets.generateModal.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSource ? (
              <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("pages.courseAssets.generateModal.source")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedSource.type === "video"
                    ? t("pages.courseAssets.labels.video")
                    : t("pages.courseAssets.labels.pdf")}
                  : {selectedSource.title || `#${selectedSource.id}`}
                </p>
                {selectedSource.sectionTitle ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.courseAssets.generateModal.section")}:{" "}
                    {selectedSource.sectionTitle}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>{t("pages.courseAssets.generateModal.assets")}</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("pages.courseAssets.generateModal.assetsHint")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SLOT_ORDER.map((slotType) => (
                  <label
                    key={slotType}
                    className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(generateForm[slotType])}
                      onChange={(event) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          [slotType]: event.target.checked,
                        }))
                      }
                    />
                    <span>{t(`pages.courseAssets.slotTypes.${slotType}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {generateForm.summary ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("pages.courseAssets.slotTypes.summary")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>
                      {t("pages.courseAssets.generateModal.summary.length")}
                    </Label>
                    <Select
                      value={generateForm.summaryLength}
                      onValueChange={(value) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          summaryLength: value as "short" | "medium" | "long",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">
                          {t(
                            "pages.courseAssets.generateModal.summary.lengthOptions.short",
                          )}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t(
                            "pages.courseAssets.generateModal.summary.lengthOptions.medium",
                          )}
                        </SelectItem>
                        <SelectItem value="long">
                          {t(
                            "pages.courseAssets.generateModal.summary.lengthOptions.long",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                    <input
                      type="checkbox"
                      checked={generateForm.summaryIncludeKeyPoints}
                      onChange={(event) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          summaryIncludeKeyPoints: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      {t(
                        "pages.courseAssets.generateModal.summary.includeKeyPoints",
                      )}
                    </span>
                  </label>
                </div>
              </div>
            ) : null}

            {generateForm.quiz ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("pages.courseAssets.slotTypes.quiz")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>
                      {t("pages.courseAssets.generateModal.quiz.questionCount")}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={generateForm.quizQuestionCount}
                      onChange={(event) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          quizQuestionCount: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      {t("pages.courseAssets.generateModal.quiz.difficulty")}
                    </Label>
                    <Select
                      value={generateForm.quizDifficulty}
                      onValueChange={(value) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          quizDifficulty: value as "easy" | "medium" | "hard",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">
                          {t(
                            "pages.courseAssets.generateModal.quiz.difficultyOptions.easy",
                          )}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t(
                            "pages.courseAssets.generateModal.quiz.difficultyOptions.medium",
                          )}
                        </SelectItem>
                        <SelectItem value="hard">
                          {t(
                            "pages.courseAssets.generateModal.quiz.difficultyOptions.hard",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {t("pages.courseAssets.generateModal.quiz.questionStyles")}
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={generateForm.quizStyleSingleChoice}
                        onChange={(event) =>
                          setGenerateForm((prev) => ({
                            ...prev,
                            quizStyleSingleChoice: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        {t(
                          "pages.courseAssets.generateModal.quiz.styleOptions.singleChoice",
                        )}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={generateForm.quizStyleMultipleChoice}
                        onChange={(event) =>
                          setGenerateForm((prev) => ({
                            ...prev,
                            quizStyleMultipleChoice: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        {t(
                          "pages.courseAssets.generateModal.quiz.styleOptions.multipleChoice",
                        )}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={generateForm.quizStyleTrueFalse}
                        onChange={(event) =>
                          setGenerateForm((prev) => ({
                            ...prev,
                            quizStyleTrueFalse: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        {t(
                          "pages.courseAssets.generateModal.quiz.styleOptions.trueFalse",
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {generateForm.flashcards ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("pages.courseAssets.slotTypes.flashcards")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>
                      {t(
                        "pages.courseAssets.generateModal.flashcards.cardCount",
                      )}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={generateForm.flashcardsCount}
                      onChange={(event) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          flashcardsCount: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      {t("pages.courseAssets.generateModal.flashcards.focus")}
                    </Label>
                    <div className="grid gap-2">
                      <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={generateForm.flashcardsFocusDefinitions}
                          onChange={(event) =>
                            setGenerateForm((prev) => ({
                              ...prev,
                              flashcardsFocusDefinitions: event.target.checked,
                            }))
                          }
                        />
                        <span>
                          {t(
                            "pages.courseAssets.generateModal.flashcards.focusOptions.definitions",
                          )}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={generateForm.flashcardsFocusConcepts}
                          onChange={(event) =>
                            setGenerateForm((prev) => ({
                              ...prev,
                              flashcardsFocusConcepts: event.target.checked,
                            }))
                          }
                        />
                        <span>
                          {t(
                            "pages.courseAssets.generateModal.flashcards.focusOptions.concepts",
                          )}
                        </span>
                      </label>
                      <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                        <input
                          type="checkbox"
                          checked={generateForm.flashcardsFocusFormulas}
                          onChange={(event) =>
                            setGenerateForm((prev) => ({
                              ...prev,
                              flashcardsFocusFormulas: event.target.checked,
                            }))
                          }
                        />
                        <span>
                          {t(
                            "pages.courseAssets.generateModal.flashcards.focusOptions.formulas",
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {generateForm.assignment ? (
              <div className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("pages.courseAssets.slotTypes.assignment")}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>
                      {t("pages.courseAssets.generateModal.assignment.style")}
                    </Label>
                    <Select
                      value={generateForm.assignmentStyle}
                      onValueChange={(value) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          assignmentStyle: value as
                            | "practice"
                            | "essay"
                            | "project",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practice">
                          {t(
                            "pages.courseAssets.generateModal.assignment.styleOptions.practice",
                          )}
                        </SelectItem>
                        <SelectItem value="essay">
                          {t(
                            "pages.courseAssets.generateModal.assignment.styleOptions.essay",
                          )}
                        </SelectItem>
                        <SelectItem value="project">
                          {t(
                            "pages.courseAssets.generateModal.assignment.styleOptions.project",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      {t(
                        "pages.courseAssets.generateModal.assignment.maxPoints",
                      )}
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={generateForm.assignmentMaxPoints}
                      onChange={(event) =>
                        setGenerateForm((prev) => ({
                          ...prev,
                          assignmentMaxPoints: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    {t(
                      "pages.courseAssets.generateModal.assignment.submissionTypes",
                    )}
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={generateForm.assignmentAllowFile}
                        onChange={(event) =>
                          setGenerateForm((prev) => ({
                            ...prev,
                            assignmentAllowFile: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        {t(
                          "pages.courseAssets.generateModal.assignment.submissionTypeOptions.file",
                        )}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={generateForm.assignmentAllowText}
                        onChange={(event) =>
                          setGenerateForm((prev) => ({
                            ...prev,
                            assignmentAllowText: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        {t(
                          "pages.courseAssets.generateModal.assignment.submissionTypeOptions.text",
                        )}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                      <input
                        type="checkbox"
                        checked={generateForm.assignmentAllowLink}
                        onChange={(event) =>
                          setGenerateForm((prev) => ({
                            ...prev,
                            assignmentAllowLink: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        {t(
                          "pages.courseAssets.generateModal.assignment.submissionTypeOptions.link",
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {generateError ? (
              <Alert variant="destructive">
                <AlertDescription>{generateError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGenerateModalOpen(false)}
              disabled={isCreatingBatch}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              onClick={handleGenerateSubmit}
              disabled={isCreatingBatch || selectedAssetsCount === 0}
            >
              {isCreatingBatch
                ? t("pages.courseAssets.actions.generating")
                : t("pages.courseAssets.actions.generateSelected")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isManualDialogOpen}
        onOpenChange={(open) => {
          setIsManualDialogOpen(open);
          if (!open) {
            setManualSource(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("pages.courseAssets.manualModal.title")}
            </DialogTitle>
            <DialogDescription>
              {manualSource
                ? t("pages.courseAssets.manualModal.descriptionWithSource", {
                    type:
                      manualSource.type === "video"
                        ? t("pages.courseAssets.labels.video")
                        : t("pages.courseAssets.labels.pdf"),
                    title: manualSource.title || `#${manualSource.id}`,
                  })
                : t("pages.courseAssets.manualModal.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary/50 dark:hover:bg-primary/10"
              onClick={() => handleManualCreate("quiz")}
              disabled={!canManageQuizzes}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("pages.courseAssets.actions.createQuiz")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("pages.courseAssets.manualModal.quizDescription")}
              </p>
            </button>

            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary/50 dark:hover:bg-primary/10"
              onClick={() => handleManualCreate("assignment")}
              disabled={!canManageAssignments}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("pages.courseAssets.actions.createAssignment")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("pages.courseAssets.manualModal.assignmentDescription")}
              </p>
            </button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsManualDialogOpen(false)}
            >
              {t("common.actions.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchDrawerOpen} onOpenChange={setIsBatchDrawerOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("pages.courseAssets.batch.title")}</DialogTitle>
            <DialogDescription>
              {activeBatchKey
                ? t("pages.courseAssets.batch.descriptionWithKey", {
                    key: activeBatchKey,
                  })
                : t("pages.courseAssets.batch.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-2 text-xs text-gray-600 dark:text-gray-300 sm:grid-cols-3">
              <p>
                {t("pages.courseAssets.batch.summary.processing", {
                  count: batchSummary.processing,
                })}
              </p>
              <p>
                {t("pages.courseAssets.batch.summary.completed", {
                  count: batchSummary.completed,
                })}
              </p>
              <p>
                {t("pages.courseAssets.batch.summary.failed", {
                  count: batchSummary.failed,
                })}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {hasRunningBatchJobs
                ? t("pages.courseAssets.batch.autoRefresh.running")
                : t("pages.courseAssets.batch.autoRefresh.stopped")}
            </p>

            {batchJobs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("pages.courseAssets.batch.empty")}
              </p>
            ) : (
              batchJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  {(() => {
                    const statusMeta = aiJobStatusBadge(Number(job.status));
                    const targetLabel = isCourseAssetSlotType(job.target_type)
                      ? t(`pages.courseAssets.slotTypes.${job.target_type}`)
                      : job.target_type;

                    return (
                      <>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {targetLabel}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={STATUS_BADGE_VARIANTS[statusMeta.tone]}
                            >
                              {job.status_label || statusMeta.label}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              #{job.id}
                            </span>
                          </div>
                          {job.error_message ? (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {job.error_message}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {canReviewPublishAI &&
                          (Number(job.status) === AI_JOB_STATUS.completed ||
                            Number(job.status) === AI_JOB_STATUS.approved) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openReviewDialog(
                                  Number(job.id),
                                  activeBatchKey ?? job.batch_key ?? null,
                                )
                              }
                            >
                              {t("pages.courseAssets.actions.review")}
                            </Button>
                          ) : null}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBatchDrawerOpen(false)}
              disabled={isBatchFetching}
            >
              {t("common.actions.close")}
            </Button>
            <Button
              variant="outline"
              onClick={() => void refetchBatchJobs()}
              disabled={!activeBatchKey || isBatchFetching}
            >
              {isBatchFetching
                ? t("common.actions.loading")
                : t("common.actions.refresh")}
            </Button>
            <Button
              onClick={async () => {
                await refetchCatalog();
                showToast(t("pages.courseAssets.toasts.refreshed"), "success");
              }}
              disabled={isCatalogFetching}
            >
              {t("pages.courseAssets.actions.refreshCatalog")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isReviewDialogOpen}
        onOpenChange={(open) => {
          setIsReviewDialogOpen(open);
          if (open) return;

          setReviewJobId(null);
          setReviewPayloadJobId(null);
          setReviewPayload({});
          setReviewJson("{}");
          setReviewJsonError(null);
          setIsReviewDirty(false);
          setJobActionError(null);
          setLastReviewSavedAt(null);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("pages.courseAssets.actions.review")}
              {reviewJobId ? ` #${reviewJobId}` : ""}
            </DialogTitle>
            <DialogDescription>
              {t("pages.centerAIContent.workspace.details.description")}
            </DialogDescription>
          </DialogHeader>

          <AIJobDetailsCard
            t={t}
            selectedJobId={reviewJobId}
            selectedJob={reviewJob}
            selectedStatusTone={reviewStatusBadge.tone}
            selectedStatusLabel={reviewStatusLabel}
            isSelectedJobLoading={isReviewJobLoading}
            isSelectedJobError={isReviewJobError}
            generatedPayloadPreview={reviewGeneratedPayloadPreview}
            reviewedPayloadPreview={reviewReviewedPayloadPreview}
            targetLabelMap={targetLabelMap}
            sourceLabelMap={sourceLabelMap}
            canReviewPublishAI={canReviewPublishAI}
            canSaveReview={canSaveReview}
            canApprove={canApprove}
            canPublish={canPublish}
            canDiscard={canDiscardReviewJob}
            isAnyJobActionPending={isAnyJobActionPending}
            isSavingReview={isSavingReview}
            isApprovingJob={isApprovingJob}
            isPublishingJob={isPublishingJob}
            isDiscardingJob={isDiscardingJob}
            isSelectedJobFetching={isReviewJobFetching}
            reviewJson={reviewJson}
            reviewJsonError={reviewJsonError}
            jobActionError={jobActionError}
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
            isReviewDirty={isReviewDirty}
            lastReviewSavedAt={lastReviewSavedAt}
            currentStatus={reviewStatus}
            onUpdatePayloadStringField={updatePayloadStringField}
            onUpdatePayloadNumberField={updatePayloadNumberField}
            onUpdatePayloadNumberArrayField={updatePayloadNumberArrayField}
            onReviewJsonChange={onReviewJsonChange}
            onSaveReview={() => void onSaveReview()}
            onApprove={() => void onApproveReviewJob()}
            onPublish={() => void onPublishReviewJob()}
            onDiscard={(jobId) => void onDiscardReviewJob(jobId)}
            onRefresh={() => {
              void refreshReviewContext();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
