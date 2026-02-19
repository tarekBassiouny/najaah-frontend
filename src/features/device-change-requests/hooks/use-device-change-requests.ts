import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  approveDeviceChangeRequest,
  bulkApproveDeviceChangeRequests,
  bulkPreApproveDeviceChangeRequests,
  bulkRejectDeviceChangeRequests,
  createDeviceChangeRequestForStudent,
  listDeviceChangeRequests,
  preApproveDeviceChangeRequest,
  rejectDeviceChangeRequest,
} from "../services/device-change-requests.service";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  ApproveDeviceChangeRequestPayload,
  BulkApproveDeviceChangeRequestsPayload,
  BulkPreApproveDeviceChangeRequestsPayload,
  BulkRejectDeviceChangeRequestsPayload,
  CreateDeviceChangeRequestPayload,
  DeviceChangeBulkActionResult,
  DeviceChangeRequest,
  ListDeviceChangeRequestsParams,
  PreApproveDeviceChangeRequestPayload,
  RejectDeviceChangeRequestPayload,
} from "@/features/device-change-requests/types/device-change-request";

type UseDeviceChangeRequestsOptions = Omit<
  UseQueryOptions<PaginatedResponse<DeviceChangeRequest>>,
  "queryKey" | "queryFn"
>;

export function useDeviceChangeRequests(
  params: ListDeviceChangeRequestsParams & {
    centerScopeId?: string | number | null;
  },
  options?: UseDeviceChangeRequestsOptions,
) {
  const { centerScopeId, ...queryParams } = params;
  return useQuery({
    queryKey: ["device-change-requests", params],
    queryFn: () => listDeviceChangeRequests(queryParams, centerScopeId),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useApproveDeviceChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      centerId,
    }: {
      requestId: string | number;
      payload?: ApproveDeviceChangeRequestPayload;
      centerId?: string | number | null;
    }) => approveDeviceChangeRequest(requestId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function useRejectDeviceChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      centerId,
    }: {
      requestId: string | number;
      payload: RejectDeviceChangeRequestPayload;
      centerId?: string | number | null;
    }) => rejectDeviceChangeRequest(requestId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function usePreApproveDeviceChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
      centerId,
    }: {
      requestId: string | number;
      payload?: PreApproveDeviceChangeRequestPayload;
      centerId?: string | number | null;
    }) => preApproveDeviceChangeRequest(requestId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function useCreateDeviceChangeRequestForStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      payload,
      centerId,
    }: {
      studentId: string | number;
      payload: CreateDeviceChangeRequestPayload;
      centerId?: string | number | null;
    }) => createDeviceChangeRequestForStudent(studentId, payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function useBulkApproveDeviceChangeRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkApproveDeviceChangeRequestsPayload;
      centerId?: string | number | null;
    }): Promise<DeviceChangeBulkActionResult> =>
      bulkApproveDeviceChangeRequests(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function useBulkRejectDeviceChangeRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkRejectDeviceChangeRequestsPayload;
      centerId?: string | number | null;
    }): Promise<DeviceChangeBulkActionResult> =>
      bulkRejectDeviceChangeRequests(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function useBulkPreApproveDeviceChangeRequests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      centerId,
    }: {
      payload: BulkPreApproveDeviceChangeRequestsPayload;
      centerId?: string | number | null;
    }): Promise<DeviceChangeBulkActionResult> =>
      bulkPreApproveDeviceChangeRequests(payload, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}
