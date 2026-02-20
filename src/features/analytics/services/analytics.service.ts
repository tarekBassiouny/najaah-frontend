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

export type AnalyticsApiScopeContext = {
  centerId?: string | number | null;
};

function normalizeAnalyticsCenterId(
  value?: string | number | null,
): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function buildAnalyticsBasePath(centerId?: string | number | null) {
  const normalized = normalizeAnalyticsCenterId(centerId);
  if (normalized == null) return "/api/v1/admin/analytics";
  return `/api/v1/admin/centers/${normalized}/analytics`;
}

function withFilters(filters?: AnalyticsFilters, includeCenterId = true) {
  return {
    center_id: includeCenterId ? (filters?.center_id ?? undefined) : undefined,
    from: filters?.from || undefined,
    to: filters?.to || undefined,
  };
}

export async function getAnalyticsOverview(
  filters?: AnalyticsFilters,
  context?: AnalyticsApiScopeContext,
): Promise<AnalyticsOverview> {
  const basePath = buildAnalyticsBasePath(context?.centerId);
  const includeCenterId = normalizeAnalyticsCenterId(context?.centerId) == null;
  const { data } = await http.get<RawAnalyticsResponse<AnalyticsOverview>>(
    `${basePath}/overview`,
    { params: withFilters(filters, includeCenterId) },
  );
  return data?.data ?? (data as unknown as AnalyticsOverview);
}

export async function getAnalyticsCoursesMedia(
  filters?: AnalyticsFilters,
  context?: AnalyticsApiScopeContext,
): Promise<AnalyticsCoursesMedia> {
  const basePath = buildAnalyticsBasePath(context?.centerId);
  const includeCenterId = normalizeAnalyticsCenterId(context?.centerId) == null;
  const { data } = await http.get<RawAnalyticsResponse<AnalyticsCoursesMedia>>(
    `${basePath}/courses-media`,
    { params: withFilters(filters, includeCenterId) },
  );
  return data?.data ?? (data as unknown as AnalyticsCoursesMedia);
}

export async function getAnalyticsLearnersEnrollments(
  filters?: AnalyticsFilters,
  context?: AnalyticsApiScopeContext,
): Promise<AnalyticsLearnersEnrollments> {
  const basePath = buildAnalyticsBasePath(context?.centerId);
  const includeCenterId = normalizeAnalyticsCenterId(context?.centerId) == null;
  const { data } = await http.get<
    RawAnalyticsResponse<AnalyticsLearnersEnrollments>
  >(`${basePath}/learners-enrollments`, {
    params: withFilters(filters, includeCenterId),
  });
  return data?.data ?? (data as unknown as AnalyticsLearnersEnrollments);
}

export async function getAnalyticsDevicesRequests(
  filters?: AnalyticsFilters,
  context?: AnalyticsApiScopeContext,
): Promise<AnalyticsDevicesRequests> {
  const basePath = buildAnalyticsBasePath(context?.centerId);
  const includeCenterId = normalizeAnalyticsCenterId(context?.centerId) == null;
  const { data } = await http.get<
    RawAnalyticsResponse<AnalyticsDevicesRequests>
  >(`${basePath}/devices-requests`, {
    params: withFilters(filters, includeCenterId),
  });
  return data?.data ?? (data as unknown as AnalyticsDevicesRequests);
}
