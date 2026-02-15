import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { getDashboard } from "@/features/dashboard/services/dashboard.service";
import type {
  DashboardData,
  DashboardQueryParams,
} from "@/features/dashboard/types/dashboard";

type UseDashboardOptions = Omit<
  UseQueryOptions<DashboardData>,
  "queryKey" | "queryFn"
>;

export function useDashboard(
  params: DashboardQueryParams,
  options?: UseDashboardOptions,
) {
  const hasCenterId =
    params.center_id !== null &&
    params.center_id !== undefined &&
    String(params.center_id).trim().length > 0;

  return useQuery({
    queryKey: [
      "dashboard",
      {
        scope: params.is_platform_admin ? "system" : "center",
        center_id: hasCenterId ? String(params.center_id) : null,
      },
    ],
    queryFn: () => getDashboard(params),
    enabled: params.is_platform_admin || hasCenterId,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    ...options,
  });
}
