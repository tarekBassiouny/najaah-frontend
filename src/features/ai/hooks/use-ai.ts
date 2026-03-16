import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  approveJob,
  createBatch,
  createJob,
  discardJob,
  getCenterOptions,
  getCenterProviders,
  getJob,
  getSystemProviders,
  listJobs,
  publishJob,
  reviewJob,
  updateCenterProvider,
  updateSystemProvider,
} from "@/features/ai/services/ai.service";
import type {
  AICenterOptions,
  AICenterProvider,
  AIContentJob,
  CreateAIBatchRequest,
  AIJobsListQuery,
  AIJobsListResponse,
  AIProviderKey,
  AISystemProvider,
  ApiSuccess,
  CreateJobPayload,
  PublishResult,
  UpdateAICenterProviderPayload,
  UpdateAISystemProviderPayload,
} from "@/features/ai/types/ai";

const AI_QUERY_ROOT = ["ai"] as const;

export const aiQueryKeys = {
  all: AI_QUERY_ROOT,
  systemProviders: ["ai", "system", "providers"] as const,
  centerProviders: (centerId: string | number) =>
    ["ai", "center", centerId, "providers"] as const,
  centerOptions: (centerId: string | number, enabledOnly: boolean) =>
    ["ai", "center", centerId, "options", enabledOnly] as const,
  jobs: (centerId: string | number, query: AIJobsListQuery) =>
    ["ai", "center", centerId, "jobs", query] as const,
  jobsRoot: (centerId: string | number) =>
    ["ai", "center", centerId, "jobs"] as const,
  job: (centerId: string | number, jobId: string | number) =>
    ["ai", "center", centerId, "job", jobId] as const,
};

type UseAISystemProvidersOptions = Omit<
  UseQueryOptions<ApiSuccess<AISystemProvider[]>>,
  "queryKey" | "queryFn"
>;

export function useAISystemProviders(options?: UseAISystemProvidersOptions) {
  return useQuery({
    queryKey: aiQueryKeys.systemProviders,
    queryFn: getSystemProviders,
    ...options,
  });
}

export function useUpdateAISystemProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      provider,
      payload,
    }: {
      provider: AIProviderKey;
      payload: UpdateAISystemProviderPayload;
    }) => updateSystemProvider(provider, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiQueryKeys.systemProviders });
      queryClient.invalidateQueries({ queryKey: ["ai", "center"] });
    },
  });
}

type UseAICenterProvidersOptions = Omit<
  UseQueryOptions<ApiSuccess<AICenterProvider[]>>,
  "queryKey" | "queryFn"
>;

export function useAICenterProviders(
  centerId: string | number | undefined,
  options?: UseAICenterProvidersOptions,
) {
  return useQuery({
    queryKey: aiQueryKeys.centerProviders(centerId as string | number),
    queryFn: () => getCenterProviders(centerId!),
    enabled: !!centerId,
    ...options,
  });
}

export function useUpdateAICenterProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      provider,
      payload,
    }: {
      centerId: string | number;
      provider: AIProviderKey;
      payload: UpdateAICenterProviderPayload;
    }) => updateCenterProvider(centerId, provider, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.centerProviders(centerId),
      });
      queryClient.invalidateQueries({
        queryKey: ["ai", "center", centerId, "options"],
      });
    },
  });
}

type UseAICenterOptionsOptions = Omit<
  UseQueryOptions<ApiSuccess<AICenterOptions>>,
  "queryKey" | "queryFn"
>;

export function useAICenterOptions(
  centerId: string | number | undefined,
  enabledOnly = true,
  options?: UseAICenterOptionsOptions,
) {
  return useQuery({
    queryKey: aiQueryKeys.centerOptions(
      centerId as string | number,
      enabledOnly,
    ),
    queryFn: () => getCenterOptions(centerId!, enabledOnly),
    enabled: !!centerId,
    ...options,
  });
}

type UseAIJobsOptions = Omit<
  UseQueryOptions<AIJobsListResponse>,
  "queryKey" | "queryFn"
>;

export function useAIJobs(
  centerId: string | number | undefined,
  query: AIJobsListQuery = {},
  options?: UseAIJobsOptions,
) {
  return useQuery({
    queryKey: aiQueryKeys.jobs(centerId as string | number, query),
    queryFn: () => listJobs(centerId!, query),
    enabled: !!centerId,
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseAIJobOptions = Omit<
  UseQueryOptions<ApiSuccess<AIContentJob>>,
  "queryKey" | "queryFn"
>;

export function useAIJob(
  centerId: string | number | undefined,
  jobId: string | number | undefined,
  options?: UseAIJobOptions,
) {
  return useQuery({
    queryKey: aiQueryKeys.job(
      centerId as string | number,
      jobId as string | number,
    ),
    queryFn: () => getJob(centerId!, jobId!),
    enabled: !!centerId && !!jobId,
    ...options,
  });
}

export function useCreateAIJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateJobPayload;
    }) => createJob(centerId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.jobsRoot(centerId),
      });
    },
  });
}

export function useCreateAIBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      payload,
    }: {
      centerId: string | number;
      payload: CreateAIBatchRequest;
    }) => createBatch(centerId, payload),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.jobsRoot(variables.centerId),
      });

      result.data.jobs.forEach((job) => {
        queryClient.invalidateQueries({
          queryKey: aiQueryKeys.job(variables.centerId, job.id),
        });
      });
    },
  });
}

export function useReviewAIJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      jobId,
      reviewedPayload,
    }: {
      centerId: string | number;
      jobId: string | number;
      reviewedPayload: Record<string, unknown>;
    }) => reviewJob(centerId, jobId, reviewedPayload),
    onSuccess: (_, { centerId, jobId }) => {
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.job(centerId, jobId),
      });
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.jobsRoot(centerId),
      });
    },
  });
}

export function useApproveAIJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      jobId,
    }: {
      centerId: string | number;
      jobId: string | number;
    }) => approveJob(centerId, jobId),
    onSuccess: (_, { centerId, jobId }) => {
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.job(centerId, jobId),
      });
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.jobsRoot(centerId),
      });
    },
  });
}

export function usePublishAIJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      jobId,
    }: {
      centerId: string | number;
      jobId: string | number;
    }) => publishJob(centerId, jobId),
    onSuccess: (
      result: ApiSuccess<{ job: AIContentJob; publication: PublishResult }>,
      { centerId, jobId },
    ) => {
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.job(centerId, jobId),
      });
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.jobsRoot(centerId),
      });

      const publishedJobId = result.data?.job?.id;
      if (publishedJobId) {
        queryClient.invalidateQueries({
          queryKey: aiQueryKeys.job(centerId, publishedJobId),
        });
      }
    },
  });
}

export function useDiscardAIJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      jobId,
    }: {
      centerId: string | number;
      jobId: string | number;
    }) => discardJob(centerId, jobId),
    onSuccess: (_, { centerId, jobId }) => {
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.job(centerId, jobId),
      });
      queryClient.invalidateQueries({
        queryKey: aiQueryKeys.jobsRoot(centerId),
      });
    },
  });
}
