import { http } from "@/lib/http";
import type {
  AnalyticsCoursesMedia,
  AnalyticsDevicesRequests,
  AnalyticsFilters,
  AnalyticsLearnersEnrollments,
  AnalyticsOverview,
} from "@/features/analytics/types/analytics";

type RawAnalyticsResponse<T> = {
  data?: T;
  [key: string]: unknown;
};

function withFilters(filters?: AnalyticsFilters) {
  return {
    center_id: filters?.center_id ?? undefined,
    from: filters?.from || undefined,
    to: filters?.to || undefined,
  };
}

export async function getAnalyticsOverview(
  filters?: AnalyticsFilters,
): Promise<AnalyticsOverview> {
  const { data } = await http.get<RawAnalyticsResponse<AnalyticsOverview>>(
    "/api/v1/admin/analytics/overview",
    { params: withFilters(filters) },
  );
  return data?.data ?? (data as unknown as AnalyticsOverview);
}

export async function getAnalyticsCoursesMedia(
  filters?: AnalyticsFilters,
): Promise<AnalyticsCoursesMedia> {
  const { data } = await http.get<RawAnalyticsResponse<AnalyticsCoursesMedia>>(
    "/api/v1/admin/analytics/courses-media",
    { params: withFilters(filters) },
  );
  return data?.data ?? (data as unknown as AnalyticsCoursesMedia);
}

export async function getAnalyticsLearnersEnrollments(
  filters?: AnalyticsFilters,
): Promise<AnalyticsLearnersEnrollments> {
  const { data } = await http.get<
    RawAnalyticsResponse<AnalyticsLearnersEnrollments>
  >("/api/v1/admin/analytics/learners-enrollments", {
    params: withFilters(filters),
  });
  return data?.data ?? (data as unknown as AnalyticsLearnersEnrollments);
}

export async function getAnalyticsDevicesRequests(
  filters?: AnalyticsFilters,
): Promise<AnalyticsDevicesRequests> {
  const { data } = await http.get<
    RawAnalyticsResponse<AnalyticsDevicesRequests>
  >("/api/v1/admin/analytics/devices-requests", {
    params: withFilters(filters),
  });
  return data?.data ?? (data as unknown as AnalyticsDevicesRequests);
}
