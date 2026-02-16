import { http } from "@/lib/http";
import type {
  DashboardActivity,
  DashboardData,
  DashboardQueryParams,
  DashboardStats,
} from "@/features/dashboard/types/dashboard";

type RawDashboardResponse = {
  data?: unknown;
  [key: string]: unknown;
};

function toNumber(value: unknown, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function toStringOrNull(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value == null) return null;

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeActor(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;

  const node = raw as Record<string, unknown>;
  return {
    id:
      typeof node.id === "number" || typeof node.id === "string"
        ? node.id
        : null,
    name: toStringOrNull(node.name),
  };
}

function normalizeRecentActivity(raw: unknown): DashboardActivity[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const node = item as Record<string, unknown>;
      const rawId = node.id;
      const id =
        typeof rawId === "number" || typeof rawId === "string"
          ? rawId
          : `activity-${index}`;

      return {
        id,
        action: toStringOrNull(node.action) ?? "unknown",
        description: toStringOrNull(node.description) ?? "No description",
        actor: normalizeActor(node.actor),
        days_ago: node.days_ago == null ? null : toNumber(node.days_ago, 0),
        created_at: toStringOrNull(node.created_at),
      };
    })
    .filter((item): item is DashboardActivity => Boolean(item));
}

function normalizeStats(raw: unknown): DashboardStats {
  const node =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const activeEnrollments =
    node.active_enrollments && typeof node.active_enrollments === "object"
      ? (node.active_enrollments as Record<string, unknown>)
      : {};
  const pendingApprovals =
    node.pending_approvals && typeof node.pending_approvals === "object"
      ? (node.pending_approvals as Record<string, unknown>)
      : {};

  return {
    total_courses: toNumber(node.total_courses, 0),
    total_students: toNumber(node.total_students, 0),
    active_enrollments: {
      count: toNumber(activeEnrollments.count, 0),
      change_percent: toNumber(activeEnrollments.change_percent, 0),
      trend: toStringOrNull(activeEnrollments.trend),
    },
    pending_approvals: {
      total: toNumber(pendingApprovals.total, 0),
      enrollment_requests: toNumber(pendingApprovals.enrollment_requests, 0),
      device_change_requests: toNumber(
        pendingApprovals.device_change_requests,
        0,
      ),
      extra_view_requests: toNumber(pendingApprovals.extra_view_requests, 0),
    },
  };
}

function normalizeDashboardResponse(raw: unknown): DashboardData {
  const container =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const payload =
    container.data && typeof container.data === "object"
      ? (container.data as Record<string, unknown>)
      : container;

  return {
    stats: normalizeStats(payload.stats),
    recent_activity: normalizeRecentActivity(payload.recent_activity),
  };
}

function hasCenterId(centerId: DashboardQueryParams["center_id"]) {
  return (
    centerId !== null &&
    centerId !== undefined &&
    String(centerId).trim().length > 0
  );
}

export async function getDashboard(
  params: DashboardQueryParams,
): Promise<DashboardData> {
  const centerId = params.center_id;
  const hasScopedCenter = hasCenterId(centerId);

  if (!params.is_platform_admin && !hasScopedCenter) {
    throw new Error("Center dashboard requires a valid center id.");
  }

  const endpoint =
    !params.is_platform_admin && hasScopedCenter
      ? `/api/v1/admin/centers/${centerId}/dashboard`
      : "/api/v1/admin/dashboard";

  const queryParams = hasScopedCenter
    ? {
        center_id: centerId,
      }
    : undefined;

  const { data } = await http.get<RawDashboardResponse>(endpoint, {
    params: queryParams,
  });

  return normalizeDashboardResponse(data);
}
