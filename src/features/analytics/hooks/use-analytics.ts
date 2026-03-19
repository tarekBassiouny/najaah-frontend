import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type {
  AnalyticsCoursesMedia,
  AnalyticsDevicesRequests,
  AnalyticsFilters,
  AnalyticsLearnersEnrollments,
  AnalyticsOverview,
} from "@/features/analytics/types/analytics";
import {
  AnalyticsApiScopeContext,
  getAnalyticsCoursesMedia,
  getAnalyticsDevicesRequests,
  getAnalyticsLearnersEnrollments,
  getAnalyticsOverview,
} from "@/features/analytics/services/analytics.service";
import { useLocale } from "@/features/localization";

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
  context?: AnalyticsApiScopeContext,
  options?: UseOverviewOptions,
) {
  const { locale } = useLocale();

  return useQuery({
    queryKey: [
      "analytics",
      "overview",
      filters,
      context?.centerId ?? null,
      locale,
    ],
    queryFn: () => getAnalyticsOverview(filters, context),
    ...options,
  });
}

export function useAnalyticsCoursesMedia(
  filters?: AnalyticsFilters,
  context?: AnalyticsApiScopeContext,
  options?: UseCoursesMediaOptions,
) {
  const { locale } = useLocale();

  return useQuery({
    queryKey: [
      "analytics",
      "courses-media",
      filters,
      context?.centerId ?? null,
      locale,
    ],
    queryFn: () => getAnalyticsCoursesMedia(filters, context),
    ...options,
  });
}

export function useAnalyticsLearnersEnrollments(
  filters?: AnalyticsFilters,
  context?: AnalyticsApiScopeContext,
  options?: UseLearnersEnrollmentsOptions,
) {
  const { locale } = useLocale();

  return useQuery({
    queryKey: [
      "analytics",
      "learners-enrollments",
      filters,
      context?.centerId ?? null,
      locale,
    ],
    queryFn: () => getAnalyticsLearnersEnrollments(filters, context),
    ...options,
  });
}

export function useAnalyticsDevicesRequests(
  filters?: AnalyticsFilters,
  context?: AnalyticsApiScopeContext,
  options?: UseDevicesRequestsOptions,
) {
  const { locale } = useLocale();

  return useQuery({
    queryKey: [
      "analytics",
      "devices-requests",
      filters,
      context?.centerId ?? null,
      locale,
    ],
    queryFn: () => getAnalyticsDevicesRequests(filters, context),
    ...options,
  });
}
