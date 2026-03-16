import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { PaginatedResponse } from "@/types/pagination";
import {
  closeVideoCodeBatch,
  createVideoCodeBatch,
  expandVideoCodeBatch,
  getVideoCodeBatch,
  getVideoCodeBatchStatistics,
  listVideoCodeBatchRedemptions,
  listVideoCodeBatches,
  sendVideoCodeBatchWhatsappCsv,
} from "@/features/video-code-batches/services/video-code-batches.service";
import type {
  CloseVideoCodeBatchPayload,
  CreateVideoCodeBatchPayload,
  ExpandVideoCodeBatchPayload,
  ListVideoCodeBatchRedemptionsParams,
  ListVideoCodeBatchesParams,
  SendVideoCodeBatchWhatsappCsvPayload,
  VideoCodeBatch,
  VideoCodeBatchExportRecord,
  VideoCodeBatchStatistics,
  VideoCodeRedemption,
} from "@/features/video-code-batches/types/video-code-batch";

type UseVideoCodeBatchesOptions = Omit<
  UseQueryOptions<PaginatedResponse<VideoCodeBatch>>,
  "queryKey" | "queryFn"
>;

type UseVideoCodeBatchOptions = Omit<
  UseQueryOptions<VideoCodeBatch>,
  "queryKey" | "queryFn"
>;

type UseVideoCodeBatchStatisticsOptions = Omit<
  UseQueryOptions<VideoCodeBatchStatistics>,
  "queryKey" | "queryFn"
>;

type UseVideoCodeBatchRedemptionsOptions = Omit<
  UseQueryOptions<PaginatedResponse<VideoCodeRedemption>>,
  "queryKey" | "queryFn"
>;

export function useVideoCodeBatches(
  centerId: string | number | undefined,
  params: ListVideoCodeBatchesParams,
  options?: UseVideoCodeBatchesOptions,
) {
  return useQuery({
    queryKey: ["video-code-batches", centerId ?? null, params],
    queryFn: () => listVideoCodeBatches(params, centerId!),
    enabled: Boolean(centerId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useVideoCodeBatch(
  centerId: string | number | undefined,
  batchId: string | number | undefined,
  options?: UseVideoCodeBatchOptions,
) {
  return useQuery({
    queryKey: ["video-code-batch", centerId ?? null, batchId ?? null],
    queryFn: () => getVideoCodeBatch(centerId!, batchId!),
    enabled: Boolean(centerId) && Boolean(batchId),
    ...options,
  });
}

export function useVideoCodeBatchStatistics(
  centerId: string | number | undefined,
  batchId: string | number | undefined,
  options?: UseVideoCodeBatchStatisticsOptions,
) {
  return useQuery({
    queryKey: [
      "video-code-batch-statistics",
      centerId ?? null,
      batchId ?? null,
    ],
    queryFn: () => getVideoCodeBatchStatistics(centerId!, batchId!),
    enabled: Boolean(centerId) && Boolean(batchId),
    ...options,
  });
}

export function useVideoCodeBatchRedemptions(
  centerId: string | number | undefined,
  batchId: string | number | undefined,
  params: ListVideoCodeBatchRedemptionsParams,
  options?: UseVideoCodeBatchRedemptionsOptions,
) {
  return useQuery({
    queryKey: [
      "video-code-batch-redemptions",
      centerId ?? null,
      batchId ?? null,
      params,
    ],
    queryFn: () => listVideoCodeBatchRedemptions(centerId!, batchId!, params),
    enabled: Boolean(centerId) && Boolean(batchId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useCreateVideoCodeBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      courseId,
      videoId,
      payload,
    }: {
      centerId: string | number;
      courseId: string | number;
      videoId: string | number;
      payload: CreateVideoCodeBatchPayload;
    }) => createVideoCodeBatch(centerId, courseId, videoId, payload),
    onSuccess: (_, { centerId }) => {
      queryClient.invalidateQueries({
        queryKey: ["video-code-batches", centerId],
      });
    },
  });
}

export function useExpandVideoCodeBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      batchId,
      payload,
    }: {
      centerId: string | number;
      batchId: string | number;
      payload: ExpandVideoCodeBatchPayload;
    }) => expandVideoCodeBatch(centerId, batchId, payload),
    onSuccess: (_, { centerId, batchId }) => {
      queryClient.invalidateQueries({
        queryKey: ["video-code-batches", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch", centerId, batchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch-statistics", centerId, batchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch-redemptions", centerId, batchId],
      });
    },
  });
}

export function useCloseVideoCodeBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      batchId,
      payload,
    }: {
      centerId: string | number;
      batchId: string | number;
      payload: CloseVideoCodeBatchPayload;
    }) => closeVideoCodeBatch(centerId, batchId, payload),
    onSuccess: (_, { centerId, batchId }) => {
      queryClient.invalidateQueries({
        queryKey: ["video-code-batches", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch", centerId, batchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch-statistics", centerId, batchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch-redemptions", centerId, batchId],
      });
    },
  });
}

export function useSendVideoCodeBatchWhatsappCsv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      centerId,
      batchId,
      payload,
    }: {
      centerId: string | number;
      batchId: string | number;
      payload: SendVideoCodeBatchWhatsappCsvPayload;
    }): Promise<VideoCodeBatchExportRecord> =>
      sendVideoCodeBatchWhatsappCsv(centerId, batchId, payload),
    onSuccess: (_, { centerId, batchId }) => {
      queryClient.invalidateQueries({
        queryKey: ["video-code-batches", centerId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch", centerId, batchId],
      });
      queryClient.invalidateQueries({
        queryKey: ["video-code-batch-statistics", centerId, batchId],
      });
    },
  });
}
