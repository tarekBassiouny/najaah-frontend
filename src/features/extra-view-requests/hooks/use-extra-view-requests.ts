import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  approveExtraViewRequest,
  listExtraViewRequests,
  rejectExtraViewRequest,
  type ListExtraViewRequestsParams,
} from "../services/extra-view-requests.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { ExtraViewRequest } from "@/features/extra-view-requests/types/extra-view-request";

type UseExtraViewRequestsOptions = Omit<
  UseQueryOptions<PaginatedResponse<ExtraViewRequest>>,
  "queryKey" | "queryFn"
>;

export function useExtraViewRequests(
  params: ListExtraViewRequestsParams,
  options?: UseExtraViewRequestsOptions,
) {
  return useQuery({
    queryKey: ["extra-view-requests", params],
    queryFn: () => listExtraViewRequests(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useApproveExtraViewRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string | number) => approveExtraViewRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
    },
  });
}

export function useRejectExtraViewRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string | number) => rejectExtraViewRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
    },
  });
}
