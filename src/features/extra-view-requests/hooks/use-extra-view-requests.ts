import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  approveExtraViewRequest,
  bulkGrantExtraViews,
  bulkApproveExtraViewRequests,
  bulkRejectExtraViewRequests,
  grantExtraViewsToStudent,
  listExtraViewRequests,
  rejectExtraViewRequest,
} from "../services/extra-view-requests.service";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  ApproveExtraViewRequestPayload,
  BulkDirectGrantExtraViewPayload,
  BulkApproveExtraViewRequestsPayload,
  BulkRejectExtraViewRequestsPayload,
  ExtraViewBulkActionResult,
  ExtraViewDirectGrantResult,
  ExtraViewRequest,
  DirectGrantExtraViewPayload,
  ListExtraViewRequestsParams,
  RejectExtraViewRequestPayload,
} from "@/features/extra-view-requests/types/extra-view-request";

type UseExtraViewRequestsOptions = Omit<
  UseQueryOptions<PaginatedResponse<ExtraViewRequest>>,
  "queryKey" | "queryFn"
>;

export function useExtraViewRequests(
  params: ListExtraViewRequestsParams & {
    centerScopeId?: string | number | null;
  },
  options?: UseExtraViewRequestsOptions,
) {
  const { centerScopeId, ...queryParams } = params;
  return useQuery({
    queryKey: ["extra-view-requests", params],
    queryFn: () => listExtraViewRequests(queryParams, centerScopeId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useApproveExtraViewRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      centerId,
    }: {
      requestId: string | number;
      payload: ApproveExtraViewRequestPayload;
      centerId?: string | number | null;
    }) => approveExtraViewRequest(requestId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
    },
  });
}

export function useRejectExtraViewRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      centerId,
    }: {
      requestId: string | number;
      payload: RejectExtraViewRequestPayload;
      centerId?: string | number | null;
    }) => rejectExtraViewRequest(requestId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
    },
  });
}

export function useBulkApproveExtraViewRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkApproveExtraViewRequestsPayload;
      centerId?: string | number | null;
    }): Promise<ExtraViewBulkActionResult> =>
      bulkApproveExtraViewRequests(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
    },
  });
}

export function useBulkRejectExtraViewRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkRejectExtraViewRequestsPayload;
      centerId?: string | number | null;
    }): Promise<ExtraViewBulkActionResult> =>
      bulkRejectExtraViewRequests(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
    },
  });
}

export function useGrantExtraViewsToStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      payload,
      centerId,
    }: {
      studentId: string | number;
      payload: DirectGrantExtraViewPayload;
      centerId?: string | number | null;
    }) => grantExtraViewsToStudent(studentId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useBulkGrantExtraViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkDirectGrantExtraViewPayload;
      centerId?: string | number | null;
    }): Promise<ExtraViewDirectGrantResult> =>
      bulkGrantExtraViews(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}
