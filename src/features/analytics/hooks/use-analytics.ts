import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type {
  AnalyticsCoursesMedia,
  AnalyticsDevicesRequests,
  AnalyticsFilters,
  AnalyticsLearnersEnrollments,
  AnalyticsOverview,
} from "@/features/analytics/types/analytics";
import {
  getAnalyticsCoursesMedia,
  getAnalyticsDevicesRequests,
  getAnalyticsLearnersEnrollments,
  getAnalyticsOverview,
} from "@/features/analytics/services/analytics.service";

type UseOverviewOptions = Omit<
  UseQueryOptions<AnalyticsOverview>,
  "queryKey" | "queryFn"
>;

type UseCoursesMediaOptions = Omit<
  UseQueryOptions<AnalyticsCoursesMedia>,
  "queryKey" | "queryFn"
>;

type UseLearnersEnrollmentsOptions = Omit<
  UseQueryOptions<AnalyticsLearnersEnrollments>,
  "queryKey" | "queryFn"
>;

type UseDevicesRequestsOptions = Omit<
  UseQueryOptions<AnalyticsDevicesRequests>,
  "queryKey" | "queryFn"
>;

export function useAnalyticsOverview(
  filters?: AnalyticsFilters,
  options?: UseOverviewOptions,
) {
  return useQuery({
    queryKey: ["analytics", "overview", filters],
    queryFn: () => getAnalyticsOverview(filters),
    ...options,
  });
}

export function useAnalyticsCoursesMedia(
  filters?: AnalyticsFilters,
  options?: UseCoursesMediaOptions,
) {
  return useQuery({
    queryKey: ["analytics", "courses-media", filters],
    queryFn: () => getAnalyticsCoursesMedia(filters),
    ...options,
  });
}

export function useAnalyticsLearnersEnrollments(
  filters?: AnalyticsFilters,
  options?: UseLearnersEnrollmentsOptions,
) {
  return useQuery({
    queryKey: ["analytics", "learners-enrollments", filters],
    queryFn: () => getAnalyticsLearnersEnrollments(filters),
    ...options,
  });
}

export function useAnalyticsDevicesRequests(
  filters?: AnalyticsFilters,
  options?: UseDevicesRequestsOptions,
) {
  return useQuery({
    queryKey: ["analytics", "devices-requests", filters],
    queryFn: () => getAnalyticsDevicesRequests(filters),
    ...options,
  });
}
