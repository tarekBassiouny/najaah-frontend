import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listExtraViewRequests,
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
