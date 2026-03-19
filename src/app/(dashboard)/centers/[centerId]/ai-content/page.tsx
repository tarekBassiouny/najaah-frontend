"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useModal } from "@/components/ui/modal-store";
import {
  AICreateJobCard,
  AIJobDetailsCard,
  AIJobsCard,
  AIProviderStatusCard,
  type AIJobsFilterState,
} from "@/features/ai/components";
import {
  useAIJob,
  useAIJobs,
  useAICenterOptions,
  useApproveAIJob,
  useCreateAIJob,
  useDiscardAIJob,
  usePublishAIJob,
  useReviewAIJob,
} from "@/features/ai/hooks/use-ai";
import { usePdf } from "@/features/pdfs/hooks/use-pdfs";
import { useVideoTranscript } from "@/features/videos/hooks/use-videos";
import {
  generationDefaults,
  validateCreateJob,
} from "@/features/ai/lib/create-job-schema";
import { mapAIErrorCodeToMessage } from "@/features/ai/lib/error-mapper";
import {
  AI_JOB_STATUS,
  aiJobStatusBadge,
  isRetryingAIJob,
  shouldPollAIJob,
} from "@/features/ai/lib/job-status";
import { startAIJobPolling } from "@/features/ai/lib/polling";
import { resolveAIPublishRoute } from "@/features/ai/lib/publish-route";
import {
  type ReviewLocale,
  type EditablePayload,
  getEditablePayload,
  getFirstExistingPath,
  readArrayFromPaths,
  readLocalizedStringFromPaths,
  readNumberFromPaths,
  toPrettyJson,
  writePath,
  writeLocalizedStringPath,
} from "@/features/ai/lib/review-payload";
import type {
  AICenterProvider,
  AIContentLanguage,
  AIContentSourceType,
  AIContentTargetType,
  AIProviderKey,
  CreateJobPayload,
} from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { can } from "@/lib/capabilities";
import {
  resolvePdfExtractionReadiness,
  resolveVideoTranscriptReadiness,
} from "@/lib/ai-source-readiness";

const TARGET_TYPES: AIContentTargetType[] = [
  "summary",
  "quiz",
  "assignment",
  "flashcards",
  "interactive_activity",
];

const SOURCE_TYPES: AIContentSourceType[] = [
  "video",
  "pdf",
  "section",
  "course",
];

const STATUS_FILTER_VALUES = [
  AI_JOB_STATUS.pending,
  AI_JOB_STATUS.processing,
  AI_JOB_STATUS.completed,
  AI_JOB_STATUS.failed,
  AI_JOB_STATUS.approved,
  AI_JOB_STATUS.published,
  AI_JOB_STATUS.discarded,
] as const;

function parsePositiveInt(value: string | null | undefined): number | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function toTargetType(value: string | null): AIContentTargetType | null {
  if (!value) return null;
  if (TARGET_TYPES.includes(value as AIContentTargetType)) {
    return value as AIContentTargetType;
  }

  return null;
}

function getProviderModels(provider: AICenterProvider | null): string[] {
  if (!provider) return [];

  const source =
    Array.isArray(provider.allowed_models) && provider.allowed_models.length > 0
      ? provider.allowed_models
      : provider.models;

  const seen = new Set<string>();
  const models: string[] = [];

  source.forEach((model) => {
    const normalized = model.trim();
    if (!normalized) return;

    const lower = normalized.toLowerCase();
    if (seen.has(lower)) return;

    seen.add(lower);
    models.push(normalized);
  });

  return models;
}

function translateValidationError(
  message: string,
  t: (_key: string) => string,
): string {
  switch (message) {
    case "Course is required.":
      return t("pages.centerAIContent.workspace.validation.courseRequired");
    case "Source is required.":
      return t("pages.centerAIContent.workspace.validation.sourceRequired");
    case "AI provider is required.":
      return t("pages.centerAIContent.workspace.validation.providerRequired");
    case "AI model is required.":
      return t("pages.centerAIContent.workspace.validation.modelRequired");
    case "Language is required.":
      return t("pages.centerAIContent.workspace.validation.languageRequired");
    case "Question count must be between 1 and 50.":
      return t("pages.centerAIContent.workspace.validation.quizRange");
    case "Cards count must be between 1 and 100.":
      return t("pages.centerAIContent.workspace.validation.flashcardsRange");
    case "Steps count must be between 1 and 20.":
      return t("pages.centerAIContent.workspace.validation.stepsRange");
    case "Passing score cannot exceed max points.":
      return t("pages.centerAIContent.workspace.validation.assignmentScore");
    default:
      return message;
  }
}

export default function CenterAIContentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const routeParams = useParams<{ centerId: string }>();
  const searchParams = useSearchParams();
  const { showToast } = useModal();
  const centerId = String(routeParams?.centerId ?? "");

  const queryCourseId = searchParams.get("course_id") ?? "";
  const queryTargetType = toTargetType(searchParams.get("target_type"));
  const queryJobId = parsePositiveInt(searchParams.get("job_id"));
  const queryPublishedTargetType = toTargetType(
    searchParams.get("published_target"),
  );
  const queryPublishedTargetId = parsePositiveInt(
    searchParams.get("target_id"),
  );
  const queryBatchKey = searchParams.get("batch_key") ?? "";
  const queryReturnToRaw = searchParams.get("return_to") ?? "";
  const canGenerateAI = can("generate_ai_content");
  const canReviewPublishAI = can("review_publish_ai_content");
  const queryReturnTo = useMemo(() => {
    const normalized = queryReturnToRaw.trim();
    if (!normalized) return "";
    return normalized.startsWith(`/centers/${centerId}/`) ? normalized : "";
  }, [centerId, queryReturnToRaw]);

  const [showAdvancedCreate, setShowAdvancedCreate] = useState(false);
  const [courseIdInput, setCourseIdInput] = useState(queryCourseId);
  const [sourceType, setSourceType] = useState<AIContentSourceType>("course");
  const [sourceIdInput, setSourceIdInput] = useState(queryCourseId);
  const [targetType, setTargetType] = useState<AIContentTargetType>(
    queryTargetType ?? queryPublishedTargetType ?? "summary",
  );
  const [language, setLanguage] = useState<AIContentLanguage>("ar");
  const [targetIdInput, setTargetIdInput] = useState("");
  const [providerKey, setProviderKey] = useState("");
  const [modelKey, setModelKey] = useState("");
  const [generationConfigByTarget, setGenerationConfigByTarget] = useState<
    Record<AIContentTargetType, Record<string, unknown>>
  >(() => ({
    quiz: { ...generationDefaults.quiz },
    assignment: { ...generationDefaults.assignment },
    summary: { ...generationDefaults.summary },
    flashcards: { ...generationDefaults.flashcards },
    interactive_activity: { ...generationDefaults.interactive_activity },
  }));

  const [filters, setFilters] = useState<AIJobsFilterState>({
    courseId: queryCourseId,
    batchKey: queryBatchKey,
    targetType: queryTargetType ?? queryPublishedTargetType ?? "all",
    status: "all",
    page: 1,
    perPage: 10,
  });

  const [selectedJobId, setSelectedJobId] = useState<number | null>(queryJobId);

  const [createValidationErrors, setCreateValidationErrors] = useState<
    string[]
  >([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [jobActionError, setJobActionError] = useState<string | null>(null);

  const [reviewPayload, setReviewPayload] = useState<EditablePayload>({});
  const [reviewJson, setReviewJson] = useState("{}");
  const [reviewJsonError, setReviewJsonError] = useState<string | null>(null);
  const [isReviewDirty, setIsReviewDirty] = useState(false);
  const [lastReviewSavedAt, setLastReviewSavedAt] = useState<string | null>(
    null,
  );
  const [reviewJobId, setReviewJobId] = useState<number | null>(null);
  const [activeReviewLocale, setActiveReviewLocale] =
    useState<ReviewLocale>("ar");
  const parsedSourceId = parsePositiveInt(sourceIdInput);

  useEffect(() => {
    if (!queryCourseId) return;

    setCourseIdInput(queryCourseId);
    setSourceIdInput((current) => current || queryCourseId);
  }, [queryCourseId]);

  useEffect(() => {
    if (!queryTargetType) return;
    setTargetType(queryTargetType);
    setFilters((current) => ({
      ...current,
      targetType: queryTargetType,
      page: 1,
    }));
  }, [queryTargetType]);

  useEffect(() => {
    if (!queryJobId) return;
    setSelectedJobId(queryJobId);
  }, [queryJobId]);

  useEffect(() => {
    if (!queryBatchKey) return;
    setFilters((current) => ({
      ...current,
      batchKey: queryBatchKey,
      page: 1,
    }));
  }, [queryBatchKey]);

  const {
    data: optionsResponse,
    isLoading: isOptionsLoading,
    isError: isOptionsError,
    refetch: refetchOptions,
  } = useAICenterOptions(centerId, true, {
    staleTime: 60_000,
  });

  const providers = useMemo(() => {
    return (optionsResponse?.data?.providers ?? []).filter(
      (provider) => provider.enabled && provider.configured,
    );
  }, [optionsResponse?.data?.providers]);

  const defaultProviderKey = useMemo(() => {
    const preferred = optionsResponse?.data?.default_provider;
    if (
      preferred &&
      providers.some((provider) => String(provider.key) === String(preferred))
    ) {
      return String(preferred);
    }

    return providers[0] ? String(providers[0].key) : "";
  }, [optionsResponse?.data?.default_provider, providers]);

  useEffect(() => {
    if (!providers.length) {
      setProviderKey("");
      setModelKey("");
      return;
    }

    setProviderKey((current) => {
      if (providers.some((provider) => String(provider.key) === current)) {
        return current;
      }

      return defaultProviderKey;
    });
  }, [defaultProviderKey, providers]);

  const selectedProvider = useMemo(() => {
    return (
      providers.find((provider) => String(provider.key) === providerKey) ?? null
    );
  }, [providerKey, providers]);

  const availableModels = useMemo(() => {
    return getProviderModels(selectedProvider);
  }, [selectedProvider]);

  const {
    data: selectedVideoTranscript,
    isFetching: isVideoTranscriptFetching,
    isFetched: isVideoTranscriptFetched,
  } = useVideoTranscript(
    centerId,
    sourceType === "video" && parsedSourceId ? parsedSourceId : undefined,
    {
      enabled:
        showAdvancedCreate && sourceType === "video" && parsedSourceId != null,
      retry: false,
      staleTime: 30_000,
    },
  );

  const { data: selectedPdfSource, isFetching: isPdfSourceFetching } = usePdf(
    centerId,
    sourceType === "pdf" && parsedSourceId ? parsedSourceId : undefined,
    {
      enabled:
        showAdvancedCreate && sourceType === "pdf" && parsedSourceId != null,
      retry: false,
      staleTime: 30_000,
    },
  );

  useEffect(() => {
    if (!availableModels.length) {
      setModelKey("");
      return;
    }

    setModelKey((current) => {
      if (availableModels.includes(current)) {
        return current;
      }

      if (
        selectedProvider?.default_model &&
        availableModels.includes(selectedProvider.default_model)
      ) {
        return selectedProvider.default_model;
      }

      return availableModels[0];
    });
  }, [availableModels, selectedProvider?.default_model]);

  const jobsQuery = useMemo(
    () => ({
      course_id: filters.courseId.trim() || undefined,
      batch_key: filters.batchKey.trim() || undefined,
      target_type:
        filters.targetType === "all" ? undefined : filters.targetType,
      status: filters.status === "all" ? undefined : Number(filters.status),
      page: filters.page,
      per_page: filters.perPage,
    }),
    [
      filters.batchKey,
      filters.courseId,
      filters.page,
      filters.perPage,
      filters.status,
      filters.targetType,
    ],
  );

  const {
    data: jobsResponse,
    isLoading: isJobsLoading,
    isFetching: isJobsFetching,
    isError: isJobsError,
    refetch: refetchJobs,
  } = useAIJobs(centerId, jobsQuery, {
    staleTime: 15_000,
  });

  const jobs = useMemo(() => jobsResponse?.data ?? [], [jobsResponse?.data]);
  const jobsMeta = useMemo(
    () =>
      jobsResponse?.meta ?? {
        page: filters.page,
        per_page: filters.perPage,
        total: jobs.length,
        last_page: 1,
      },
    [filters.page, filters.perPage, jobs.length, jobsResponse?.meta],
  );

  useEffect(() => {
    if (selectedJobId != null) return;
    if (jobs.length === 0) return;

    setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);

  const {
    data: selectedJobResponse,
    isLoading: isSelectedJobLoading,
    isFetching: isSelectedJobFetching,
    isError: isSelectedJobError,
    refetch: refetchSelectedJob,
  } = useAIJob(centerId, selectedJobId ?? undefined, {
    staleTime: 5_000,
  });

  const selectedJob = selectedJobResponse?.data ?? null;

  useEffect(() => {
    if (!selectedJob) {
      setReviewPayload({});
      setReviewJson("{}");
      setReviewJsonError(null);
      setIsReviewDirty(false);
      setLastReviewSavedAt(null);
      setReviewJobId(null);
      return;
    }

    if (isReviewDirty && reviewJobId === selectedJob.id) {
      return;
    }

    const nextPayload = getEditablePayload(selectedJob);
    setReviewPayload(nextPayload);
    setReviewJson(toPrettyJson(nextPayload));
    setReviewJsonError(null);
    setIsReviewDirty(false);
    setLastReviewSavedAt(null);
    setReviewJobId(selectedJob.id);
    setJobActionError(null);
    setActiveReviewLocale(selectedJob.language === "en" ? "en" : "ar");
  }, [isReviewDirty, reviewJobId, selectedJob]);

  useEffect(() => {
    if (!selectedJob || !shouldPollAIJob(Number(selectedJob.status))) {
      return;
    }

    return startAIJobPolling({
      getStatus: () => Number(selectedJob.status),
      poll: async () => {
        await Promise.all([refetchSelectedJob(), refetchJobs()]);
      },
      intervalMs: 4_000,
    });
  }, [refetchJobs, refetchSelectedJob, selectedJob]);

  const hasActiveJobs = useMemo(
    () => jobs.some((job) => shouldPollAIJob(Number(job.status))),
    [jobs],
  );

  useEffect(() => {
    if (selectedJobId || !hasActiveJobs) {
      return;
    }

    return startAIJobPolling({
      getStatus: () => AI_JOB_STATUS.processing,
      poll: async () => {
        await refetchJobs();
      },
      intervalMs: 5_000,
    });
  }, [hasActiveJobs, refetchJobs, selectedJobId]);

  const { mutateAsync: createJob, isPending: isCreatingJob } = useCreateAIJob();
  const { mutateAsync: saveReview, isPending: isSavingReview } =
    useReviewAIJob();
  const { mutateAsync: approveJob, isPending: isApprovingJob } =
    useApproveAIJob();
  const { mutateAsync: publishJob, isPending: isPublishingJob } =
    usePublishAIJob();
  const { mutateAsync: discardJob, isPending: isDiscardingJob } =
    useDiscardAIJob();

  const isAnyJobActionPending =
    isSavingReview || isApprovingJob || isPublishingJob || isDiscardingJob;

  const currentStatus = Number(selectedJob?.status ?? -1);
  const canSaveReview =
    canReviewPublishAI &&
    (currentStatus === AI_JOB_STATUS.completed ||
      currentStatus === AI_JOB_STATUS.approved);
  const canApprove =
    canReviewPublishAI && currentStatus === AI_JOB_STATUS.completed;
  const canPublish =
    canReviewPublishAI && currentStatus === AI_JOB_STATUS.approved;
  const canDiscard =
    canGenerateAI &&
    currentStatus !== AI_JOB_STATUS.published &&
    currentStatus !== AI_JOB_STATUS.discarded &&
    selectedJob != null;

  const targetLabelMap: Record<AIContentTargetType, string> = {
    summary: t("pages.centerCourseDetail.panels.summary"),
    quiz: t("pages.centerCourseDetail.panels.quiz"),
    assignment: t("pages.centerCourseDetail.panels.assignment"),
    flashcards: t("pages.centerCourseDetail.panels.flashcards"),
    interactive_activity: t(
      "pages.centerCourseDetail.panels.interactiveActivity",
    ),
  };

  const sourceLabelMap: Record<AIContentSourceType, string> = {
    video: t("pages.centerAIContent.workspace.sourceTypes.video"),
    pdf: t("pages.centerAIContent.workspace.sourceTypes.pdf"),
    section: t("pages.centerAIContent.workspace.sourceTypes.section"),
    course: t("pages.centerAIContent.workspace.sourceTypes.course"),
  };

  const sourceReadinessNotice = useMemo(() => {
    if (!showAdvancedCreate || parsedSourceId == null) {
      return {
        title: null,
        description: null,
        isLoading: false,
        isBlocked: false,
      };
    }

    if (sourceType === "video") {
      const transcriptState = isVideoTranscriptFetched
        ? (selectedVideoTranscript ?? { has_transcript: false })
        : null;
      const readiness = resolveVideoTranscriptReadiness(transcriptState);
      const isBlocked = !readiness.isReady;
      return {
        title: isBlocked
          ? readiness.key === "missing"
            ? t("pages.centerAIContent.workspace.readiness.transcriptTitle")
            : t("pages.centerAIContent.workspace.readiness.unknownTitle")
          : null,
        description: isBlocked
          ? readiness.key === "missing"
            ? t(
                "pages.centerAIContent.workspace.readiness.transcriptDescription",
              )
            : t("pages.centerAIContent.workspace.readiness.unknownDescription")
          : null,
        isLoading: !isVideoTranscriptFetched && isVideoTranscriptFetching,
        isBlocked:
          !isVideoTranscriptFetched && isVideoTranscriptFetching
            ? false
            : isBlocked,
      };
    }

    if (sourceType === "pdf") {
      const readiness = resolvePdfExtractionReadiness(selectedPdfSource);
      const isBlocked = !readiness.isReady;
      const descriptionKey =
        readiness.key === "processing"
          ? "processingDescription"
          : readiness.key === "failed" || readiness.key === "skipped"
            ? "failedDescription"
            : readiness.key === "pending"
              ? "pendingDescription"
              : "unknownDescription";

      return {
        title: isBlocked
          ? readiness.key === "unknown"
            ? t("pages.centerAIContent.workspace.readiness.unknownTitle")
            : t("pages.centerAIContent.workspace.readiness.extractionTitle")
          : null,
        description: isBlocked
          ? t(`pages.centerAIContent.workspace.readiness.${descriptionKey}`)
          : null,
        isLoading: !selectedPdfSource && isPdfSourceFetching,
        isBlocked:
          !selectedPdfSource && isPdfSourceFetching ? false : isBlocked,
      };
    }

    return {
      title: null,
      description: null,
      isLoading: false,
      isBlocked: false,
    };
  }, [
    isPdfSourceFetching,
    isVideoTranscriptFetched,
    isVideoTranscriptFetching,
    parsedSourceId,
    selectedPdfSource,
    selectedVideoTranscript,
    showAdvancedCreate,
    sourceType,
    t,
  ]);

  const applyPayloadUpdate = (nextPayload: EditablePayload) => {
    setReviewPayload(nextPayload);
    setReviewJson(toPrettyJson(nextPayload));
    setReviewJsonError(null);
    setIsReviewDirty(true);
    setLastReviewSavedAt(null);
  };

  const updatePayloadStringField = (paths: string[][], value: string) => {
    const nextPayload = writeLocalizedStringPath(
      reviewPayload,
      paths,
      (selectedJob?.language ?? "ar") as AIContentLanguage,
      activeReviewLocale,
      value,
    );
    applyPayloadUpdate(nextPayload);
  };

  const updatePayloadNumberField = (paths: string[][], value: string) => {
    const path = getFirstExistingPath(reviewPayload, paths);
    if (path.length === 0) return;

    const trimmed = value.trim();
    const nextValue = trimmed === "" ? null : Number(trimmed);
    const payloadValue = Number.isFinite(nextValue) ? nextValue : null;
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

  const toMappedErrorMessage = (error: unknown, fallback: string) => {
    const code = getAdminApiErrorCode(error);
    const backendMessage = getAdminApiErrorMessage(error, fallback);
    return mapAIErrorCodeToMessage(code, backendMessage);
  };

  const updateGenerationConfig = (
    target: AIContentTargetType,
    updates: Record<string, unknown>,
  ) => {
    setGenerationConfigByTarget((current) => ({
      ...current,
      [target]: {
        ...current[target],
        ...updates,
      },
    }));
  };

  const onSubmitCreateJob = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCreateValidationErrors([]);
    setCreateError(null);

    const payloadCourseId = parsePositiveInt(courseIdInput);
    const payloadSourceId = parsePositiveInt(sourceIdInput);
    const payloadTargetId = targetIdInput.trim()
      ? parsePositiveInt(targetIdInput)
      : null;

    const payload: CreateJobPayload = {
      course_id: payloadCourseId ?? 0,
      source_type: sourceType,
      source_id: payloadSourceId ?? 0,
      target_type: targetType,
      target_id: payloadTargetId,
      language,
      ai_provider: providerKey as AIProviderKey,
      ai_model: modelKey,
      generation_config: generationConfigByTarget[targetType],
    };

    const validationErrors = validateCreateJob(payload).map((message) =>
      translateValidationError(message, t),
    );

    if (targetIdInput.trim() && !payloadTargetId) {
      validationErrors.push(
        t("pages.centerAIContent.workspace.validation.targetIdInvalid"),
      );
    }

    if (validationErrors.length > 0) {
      setCreateValidationErrors(validationErrors);
      return;
    }

    if (sourceReadinessNotice.isBlocked && sourceReadinessNotice.description) {
      setCreateError(sourceReadinessNotice.description);
      return;
    }

    try {
      const result = await createJob({
        centerId,
        payload,
      });

      const createdJob = result.data;
      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.jobCreated"),
        ),
        "success",
      );

      if (createdJob?.id) {
        setSelectedJobId(createdJob.id);
      }

      setFilters((current) => ({
        ...current,
        page: 1,
        courseId: String(createdJob?.course_id ?? payload.course_id),
        targetType: createdJob?.target_type ?? current.targetType,
      }));

      setTargetIdInput("");
      setJobActionError(null);

      await refetchJobs();
    } catch (error) {
      setCreateError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.createFailed"),
        ),
      );
    }
  };

  const onSaveReview = async () => {
    if (!selectedJobId) return;

    if (reviewJsonError) {
      setJobActionError(reviewJsonError);
      return;
    }

    try {
      const result = await saveReview({
        centerId,
        jobId: selectedJobId,
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
      setLastReviewSavedAt(new Date().toISOString());
      setJobActionError(null);
      await Promise.all([refetchSelectedJob(), refetchJobs()]);
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.reviewFailed"),
        ),
      );
    }
  };

  const onApprove = async () => {
    if (!selectedJobId) return;

    try {
      const result = await approveJob({
        centerId,
        jobId: selectedJobId,
      });

      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.jobApproved"),
        ),
        "success",
      );
      setJobActionError(null);
      await Promise.all([refetchSelectedJob(), refetchJobs()]);
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.approveFailed"),
        ),
      );
    }
  };

  const onPublish = async () => {
    if (!selectedJobId) return;

    try {
      const result = await publishJob({
        centerId,
        jobId: selectedJobId,
      });

      showToast(
        getAdminResponseMessage(
          result,
          t("pages.centerAIContent.workspace.toasts.jobPublished"),
        ),
        "success",
      );
      setJobActionError(null);

      const publication = result.data?.publication;
      const publishedJob = result.data?.job;

      if (publication?.target_id && publication.target_type) {
        const route = resolveAIPublishRoute({
          centerId,
          courseId:
            publishedJob?.course_id ??
            selectedJob?.course_id ??
            parsePositiveInt(courseIdInput) ??
            0,
          targetType: publication.target_type,
          targetId: publication.target_id,
        });

        router.push(route);
        return;
      }

      await Promise.all([refetchSelectedJob(), refetchJobs()]);
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.publishFailed"),
        ),
      );
    }
  };

  const onDiscard = async (jobId: number) => {
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

      if (selectedJobId === jobId) {
        setSelectedJobId(null);
      }

      await Promise.all([refetchSelectedJob(), refetchJobs()]);
      setJobActionError(null);
    } catch (error) {
      setJobActionError(
        toMappedErrorMessage(
          error,
          t("pages.centerAIContent.workspace.errors.discardFailed"),
        ),
      );
    }
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

  const selectedTargetLabel = targetLabelMap[targetType] ?? targetType;
  const publishedTargetLabel = queryPublishedTargetType
    ? targetLabelMap[queryPublishedTargetType]
    : "";
  const dismissPublishedNoticeHref = useMemo(() => {
    const next = new URLSearchParams();

    if (queryCourseId) {
      next.set("course_id", queryCourseId);
    }

    if (queryTargetType) {
      next.set("target_type", queryTargetType);
    }

    if (queryJobId) {
      next.set("job_id", String(queryJobId));
    }
    if (queryReturnTo) {
      next.set("return_to", queryReturnTo);
    }

    const query = next.toString();
    return query
      ? `/centers/${centerId}/ai-content?${query}`
      : `/centers/${centerId}/ai-content`;
  }, [centerId, queryCourseId, queryJobId, queryReturnTo, queryTargetType]);
  const assetsWorkspaceRoute =
    queryReturnTo ||
    (courseIdInput.trim()
      ? `/centers/${centerId}/courses/${courseIdInput.trim()}/assets`
      : null);
  const generatedPayloadPreview = toPrettyJson(
    selectedJob?.generated_payload ?? {},
  );
  const reviewedPayloadPreview = toPrettyJson(
    selectedJob?.reviewed_payload ?? {},
  );
  const reviewLanguage = (selectedJob?.language ?? "ar") as AIContentLanguage;

  const summaryTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeReviewLocale,
  );
  const summaryContent = readLocalizedStringFromPaths(
    reviewPayload,
    [["content"], ["content_translations"]],
    activeReviewLocale,
  );
  const quizTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeReviewLocale,
  );
  const quizDescription = readLocalizedStringFromPaths(
    reviewPayload,
    [["description"], ["description_translations"]],
    activeReviewLocale,
  );
  const quizQuestionsCount = readArrayFromPaths(reviewPayload, [
    ["questions"],
  ]).length;
  const assignmentTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeReviewLocale,
  );
  const assignmentDescription = readLocalizedStringFromPaths(
    reviewPayload,
    [["description"], ["description_translations"]],
    activeReviewLocale,
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
    activeReviewLocale,
  );
  const flashcardsCount = readArrayFromPaths(reviewPayload, [["cards"]]).length;
  const interactiveTitle = readLocalizedStringFromPaths(
    reviewPayload,
    [["title"], ["title_translations"]],
    activeReviewLocale,
  );
  const interactiveInstructions = readLocalizedStringFromPaths(
    reviewPayload,
    [["instructions"]],
    activeReviewLocale,
  );
  const interactiveStepsCount = readArrayFromPaths(reviewPayload, [
    ["steps"],
  ]).length;

  const selectedJobIsRetrying = isRetryingAIJob(selectedJob);
  const activeStatusBadge = aiJobStatusBadge(
    currentStatus,
    selectedJobIsRetrying,
  );
  const selectedStatusLabel = selectedJobIsRetrying
    ? t("pages.centerAIContent.workspace.statusLabels.retrying")
    : selectedJob?.status_label ||
      t(
        `pages.centerAIContent.workspace.statusLabels.${String(activeStatusBadge.label).toLowerCase()}`,
      );

  const sourceDefaultId = parsePositiveInt(courseIdInput);

  useEffect(() => {
    if (sourceType !== "course") return;
    if (!sourceDefaultId) return;

    setSourceIdInput((current) => current || String(sourceDefaultId));
  }, [sourceDefaultId, sourceType]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerAIContent.title", {
          target: selectedTargetLabel,
        })}
        description={t("pages.centerAIContent.workspace.subtitle")}
        actions={
          <>
            {queryReturnTo ? (
              <Link href={queryReturnTo}>
                <Button variant="outline">
                  {t("pages.centerAIContent.workspace.focus.openAssets")}
                </Button>
              </Link>
            ) : courseIdInput.trim() ? (
              <Link
                href={`/centers/${centerId}/courses/${courseIdInput.trim()}`}
              >
                <Button variant="outline">
                  {t("pages.centerAIContent.backToCourse")}
                </Button>
              </Link>
            ) : null}

            {assetsWorkspaceRoute &&
            (!queryReturnTo || assetsWorkspaceRoute !== queryReturnTo) ? (
              <Link href={assetsWorkspaceRoute}>
                <Button variant="outline">
                  {t("pages.centerAIContent.workspace.focus.openAssets")}
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      <Alert>
        <AlertTitle>
          {t("pages.centerAIContent.workspace.focus.title")}
        </AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{t("pages.centerAIContent.workspace.focus.description")}</span>
          {assetsWorkspaceRoute ? (
            <Link href={assetsWorkspaceRoute}>
              <Button size="sm" variant="outline">
                {t("pages.centerAIContent.workspace.focus.openAssets")}
              </Button>
            </Link>
          ) : null}
        </AlertDescription>
      </Alert>

      {queryPublishedTargetType && queryPublishedTargetId ? (
        <Alert>
          <AlertTitle>
            {t("pages.centerAIContent.workspace.published.successTitle")}
          </AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {t(
                "pages.centerAIContent.workspace.published.successDescription",
                {
                  target: publishedTargetLabel,
                  id: queryPublishedTargetId,
                },
              )}
            </span>
            <Link href={dismissPublishedNoticeHref}>
              <Button variant="outline" size="sm">
                {t("pages.centerAIContent.workspace.published.dismiss")}
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
        <AICreateJobCard
          t={t}
          showAdvancedCreate={showAdvancedCreate}
          onToggleAdvanced={() => setShowAdvancedCreate((current) => !current)}
          isOptionsError={isOptionsError}
          onRetryOptions={() => void refetchOptions()}
          isOptionsLoading={isOptionsLoading}
          providersCount={providers.length}
          sourceReadinessTitle={sourceReadinessNotice.title}
          sourceReadinessDescription={sourceReadinessNotice.description}
          isSourceReadinessLoading={sourceReadinessNotice.isLoading}
          onSubmitCreateJob={onSubmitCreateJob}
          createValidationErrors={createValidationErrors}
          createError={createError}
          isCreatingJob={isCreatingJob}
          canGenerateAI={canGenerateAI}
          courseIdInput={courseIdInput}
          onCourseIdChange={setCourseIdInput}
          language={language}
          onLanguageChange={setLanguage}
          targetType={targetType}
          onTargetTypeChange={setTargetType}
          targetTypes={TARGET_TYPES}
          targetLabelMap={targetLabelMap}
          sourceType={sourceType}
          onSourceTypeChange={setSourceType}
          sourceTypes={SOURCE_TYPES}
          sourceLabelMap={sourceLabelMap}
          sourceIdInput={sourceIdInput}
          onSourceIdChange={setSourceIdInput}
          targetIdInput={targetIdInput}
          onTargetIdChange={setTargetIdInput}
          providerKey={providerKey}
          onProviderChange={setProviderKey}
          modelKey={modelKey}
          onModelChange={setModelKey}
          providers={providers.map((provider) => ({
            key: String(provider.key),
            label: provider.label,
          }))}
          availableModels={availableModels}
          generationConfigByTarget={generationConfigByTarget}
          onUpdateGenerationConfig={updateGenerationConfig}
          onReset={() => {
            setSourceType("course");
            setLanguage("ar");
            setTargetType(queryTargetType ?? "summary");
            setSourceIdInput(courseIdInput);
            setTargetIdInput("");
            setGenerationConfigByTarget({
              quiz: { ...generationDefaults.quiz },
              assignment: { ...generationDefaults.assignment },
              summary: { ...generationDefaults.summary },
              flashcards: { ...generationDefaults.flashcards },
              interactive_activity: {
                ...generationDefaults.interactive_activity,
              },
            });
            setCreateValidationErrors([]);
            setCreateError(null);
          }}
        />

        <AIProviderStatusCard
          t={t}
          isOptionsLoading={isOptionsLoading}
          selectedProvider={selectedProvider}
          availableModels={availableModels}
          modelKey={modelKey}
        />
      </div>

      <AIJobsCard
        t={t}
        filters={filters}
        setFilters={setFilters}
        targetTypes={TARGET_TYPES}
        targetLabelMap={targetLabelMap}
        sourceLabelMap={sourceLabelMap}
        statusFilterValues={STATUS_FILTER_VALUES}
        jobs={jobs}
        jobsMeta={jobsMeta}
        selectedJobId={selectedJobId}
        isJobsLoading={isJobsLoading}
        isJobsFetching={isJobsFetching}
        isJobsError={isJobsError}
        canGenerateAI={canGenerateAI}
        isDiscardingJob={isDiscardingJob}
        onSelectJob={setSelectedJobId}
        onDiscardJob={onDiscard}
        onRefetchJobs={() => void refetchJobs()}
      />

      <AIJobDetailsCard
        t={t}
        selectedJobId={selectedJobId}
        selectedJob={selectedJob}
        selectedStatusTone={activeStatusBadge.tone}
        selectedStatusLabel={selectedStatusLabel}
        isSelectedJobLoading={isSelectedJobLoading}
        isSelectedJobError={isSelectedJobError}
        generatedPayloadPreview={generatedPayloadPreview}
        reviewedPayloadPreview={reviewedPayloadPreview}
        generatedPayload={
          (selectedJob?.generated_payload ?? {}) as EditablePayload
        }
        reviewPayload={reviewPayload}
        reviewLanguage={reviewLanguage}
        activeReviewLocale={activeReviewLocale}
        targetLabelMap={targetLabelMap}
        sourceLabelMap={sourceLabelMap}
        canReviewPublishAI={canReviewPublishAI}
        canSaveReview={canSaveReview}
        canApprove={canApprove}
        canPublish={canPublish}
        canDiscard={canDiscard}
        isAnyJobActionPending={isAnyJobActionPending}
        isSavingReview={isSavingReview}
        isApprovingJob={isApprovingJob}
        isPublishingJob={isPublishingJob}
        isDiscardingJob={isDiscardingJob}
        isSelectedJobFetching={isSelectedJobFetching}
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
        currentStatus={currentStatus}
        onActiveReviewLocaleChange={setActiveReviewLocale}
        onUpdatePayloadStringField={updatePayloadStringField}
        onUpdatePayloadNumberField={updatePayloadNumberField}
        onUpdatePayloadNumberArrayField={updatePayloadNumberArrayField}
        onReviewJsonChange={onReviewJsonChange}
        onSaveReview={onSaveReview}
        onApprove={onApprove}
        onPublish={onPublish}
        onDiscard={onDiscard}
        onRefresh={() => {
          void Promise.all([refetchSelectedJob(), refetchJobs()]);
        }}
      />
    </div>
  );
}
