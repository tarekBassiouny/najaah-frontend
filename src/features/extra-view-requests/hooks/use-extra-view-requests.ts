import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  approveExtraViewRequest,
  listExtraViewRequests,
  rejectExtraViewRequest,
  type ApproveExtraViewRequestPayload,
  type ListExtraViewRequestsParams,
  type RejectExtraViewRequestPayload,
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
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string | number;
      payload: ApproveExtraViewRequestPayload;
    }) => approveExtraViewRequest(requestId, payload),
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
    }: {
      requestId: string | number;
      payload: RejectExtraViewRequestPayload;
    }) => rejectExtraViewRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra-view-requests"] });
    },
  });
}
