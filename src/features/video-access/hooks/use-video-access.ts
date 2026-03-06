import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  approveVideoAccessRequest,
  bulkApproveVideoAccessRequests,
  bulkGenerateVideoAccessCodes,
  bulkRejectVideoAccessRequests,
  bulkSendVideoAccessCodesWhatsapp,
  generateVideoAccessCode,
  getBulkWhatsappJob,
  listVideoAccessCodes,
  listVideoAccessRequests,
  rejectVideoAccessRequest,
  sendVideoAccessCodeWhatsapp,
} from "@/features/video-access/services/video-access.service";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  ApproveVideoAccessRequestPayload,
  ApproveVideoAccessRequestResult,
  BulkApproveVideoAccessRequestsPayload,
  BulkGenerateVideoAccessCodesPayload,
  BulkGenerateVideoAccessCodesResult,
  BulkRejectVideoAccessRequestsPayload,
  BulkSendVideoAccessCodesWhatsappPayload,
  BulkWhatsappJob,
  GenerateVideoAccessCodePayload,
  GeneratedVideoAccessCode,
  ListVideoAccessCodesParams,
  ListVideoAccessRequestsParams,
  RejectVideoAccessRequestPayload,
  SendVideoAccessCodeWhatsappPayload,
  VideoAccessBulkActionResult,
  VideoAccessCode,
  VideoAccessRequest,
} from "@/features/video-access/types/video-access";

type UseVideoAccessRequestsOptions = Omit<
  UseQueryOptions<PaginatedResponse<VideoAccessRequest>>,
  "queryKey" | "queryFn"
>;

type UseVideoAccessCodesOptions = Omit<
  UseQueryOptions<PaginatedResponse<VideoAccessCode>>,
  "queryKey" | "queryFn"
>;

type UseBulkWhatsappJobOptions = Omit<
  UseQueryOptions<BulkWhatsappJob>,
  "queryKey" | "queryFn"
>;

export function useVideoAccessRequests(
  params: ListVideoAccessRequestsParams & {
    centerScopeId?: string | number | null;
  },
  options?: UseVideoAccessRequestsOptions,
) {
  const { centerScopeId, ...queryParams } = params;

  return useQuery({
    queryKey: ["video-access-requests", params],
    queryFn: () => listVideoAccessRequests(queryParams, centerScopeId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useVideoAccessCodes(
  params: ListVideoAccessCodesParams & {
    centerScopeId?: string | number | null;
  },
  options?: UseVideoAccessCodesOptions,
) {
  const { centerScopeId, ...queryParams } = params;

  return useQuery({
    queryKey: ["video-access-codes", params],
    queryFn: () => listVideoAccessCodes(queryParams, centerScopeId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useApproveVideoAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      centerId,
    }: {
      requestId: string | number;
      payload: ApproveVideoAccessRequestPayload;
      centerId?: string | number | null;
    }): Promise<ApproveVideoAccessRequestResult> =>
      approveVideoAccessRequest(requestId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["video-access-codes"] });
    },
  });
}

export function useRejectVideoAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      centerId,
    }: {
      requestId: string | number;
      payload: RejectVideoAccessRequestPayload;
      centerId?: string | number | null;
    }) => rejectVideoAccessRequest(requestId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-requests"] });
    },
  });
}

export function useBulkApproveVideoAccessRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkApproveVideoAccessRequestsPayload;
      centerId?: string | number | null;
    }): Promise<VideoAccessBulkActionResult> =>
      bulkApproveVideoAccessRequests(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["video-access-codes"] });
    },
  });
}

export function useBulkRejectVideoAccessRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkRejectVideoAccessRequestsPayload;
      centerId?: string | number | null;
    }): Promise<VideoAccessBulkActionResult> =>
      bulkRejectVideoAccessRequests(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-requests"] });
    },
  });
}

export function useBulkGenerateVideoAccessCodes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkGenerateVideoAccessCodesPayload;
      centerId?: string | number | null;
    }): Promise<BulkGenerateVideoAccessCodesResult> =>
      bulkGenerateVideoAccessCodes(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-codes"] });
      queryClient.invalidateQueries({ queryKey: ["video-access-requests"] });
    },
  });
}

export function useGenerateVideoAccessCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      payload,
      centerId,
    }: {
      studentId: string | number;
      payload: GenerateVideoAccessCodePayload;
      centerId?: string | number | null;
    }): Promise<GeneratedVideoAccessCode> =>
      generateVideoAccessCode(studentId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-codes"] });
      queryClient.invalidateQueries({ queryKey: ["video-access-requests"] });
    },
  });
}

export function useSendVideoAccessCodeWhatsapp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      codeId,
      payload,
      centerId,
    }: {
      codeId: string | number;
      payload: SendVideoAccessCodeWhatsappPayload;
      centerId?: string | number | null;
    }) => sendVideoAccessCodeWhatsapp(codeId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-codes"] });
    },
  });
}

export function useBulkSendVideoAccessCodesWhatsapp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkSendVideoAccessCodesWhatsappPayload;
      centerId?: string | number | null;
    }) => bulkSendVideoAccessCodesWhatsapp(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-access-codes"] });
    },
  });
}

export function useBulkWhatsappJob(
  params: {
    centerId?: string | number | null;
    jobId?: string | number | null;
  },
  options?: UseBulkWhatsappJobOptions,
) {
  const centerId = params.centerId;
  const jobId = params.jobId;

  return useQuery({
    queryKey: [
      "video-access-bulk-whatsapp-job",
      centerId ?? null,
      jobId ?? null,
    ],
    queryFn: () => getBulkWhatsappJob(jobId!, centerId),
    enabled: Boolean(centerId) && Boolean(jobId),
    ...options,
  });
}
