import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  approveDeviceChangeRequest,
  createDeviceChangeRequestForStudent,
  listDeviceChangeRequests,
  preApproveDeviceChangeRequest,
  rejectDeviceChangeRequest,
  type CreateDeviceChangeRequestPayload,
  type ListDeviceChangeRequestsParams,
} from "../services/device-change-requests.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { DeviceChangeRequest } from "@/features/device-change-requests/types/device-change-request";

type UseDeviceChangeRequestsOptions = Omit<
  UseQueryOptions<PaginatedResponse<DeviceChangeRequest>>,
  "queryKey" | "queryFn"
>;

export function useDeviceChangeRequests(
  params: ListDeviceChangeRequestsParams,
  options?: UseDeviceChangeRequestsOptions,
) {
  return useQuery({
    queryKey: ["device-change-requests", params],
    queryFn: () => listDeviceChangeRequests(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useApproveDeviceChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string | number) => approveDeviceChangeRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function useRejectDeviceChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string | number) => rejectDeviceChangeRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}

export function usePreApproveDeviceChangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string | number) => preApproveDeviceChangeRequest(requestId),
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
    }: {
      studentId: string | number;
      payload: CreateDeviceChangeRequestPayload;
    }) => createDeviceChangeRequestForStudent(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["device-change-requests"] });
    },
  });
}
