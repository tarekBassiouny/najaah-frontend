import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listDeviceChangeRequests,
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
