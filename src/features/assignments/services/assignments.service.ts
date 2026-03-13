import { http } from "@/lib/http";
import { normalizeAdminActionResult } from "@/lib/admin-response";
import type {
  Assignment,
  CourseAssignmentsResponse,
  CreateCourseAssignmentPayload,
  ListCourseAssignmentsParams,
} from "@/features/assignments/types/assignment";

type RawResponse<T = unknown> = {
  data?: T;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCourseAssignmentsPath(
  centerId: string | number,
  courseId: string | number,
) {
  return `/api/v1/admin/centers/${centerId}/courses/${courseId}/assignments`;
}

function buildAssignmentItemPath(
  centerId: string | number,
  assignmentId: string | number,
) {
  return `/api/v1/admin/centers/${centerId}/assignments/${assignmentId}`;
}

function normalizeCourseAssignmentsResponse(
  payload: unknown,
  fallback: ListCourseAssignmentsParams,
): CourseAssignmentsResponse {
  const record = asRecord(payload);
  const dataNode = Object.prototype.hasOwnProperty.call(record, "data")
    ? record.data
    : payload;

  const normalizedDataNode = asRecord(dataNode);
  const items = asArray<Assignment>(
    Array.isArray(dataNode) ? dataNode : (normalizedDataNode.data ?? dataNode),
  );

  const meta = asRecord(record.meta ?? normalizedDataNode.meta);
  const page =
    toNumber(
      meta.page ?? meta.current_page ?? normalizedDataNode.page,
      fallback.page,
    ) || fallback.page;
  const perPage =
    toNumber(meta.per_page ?? normalizedDataNode.per_page, fallback.per_page) ||
    fallback.per_page;
  const total = toNumber(meta.total ?? normalizedDataNode.total, items.length);
  const lastPage =
    toNumber(
      meta.last_page ??
        normalizedDataNode.last_page ??
        Math.max(1, Math.ceil(total / Math.max(perPage, 1))),
      1,
    ) || 1;

  return {
    items,
    page,
    perPage,
    total,
    lastPage,
  };
}

export async function listCourseAssignments(
  params: ListCourseAssignmentsParams,
): Promise<CourseAssignmentsResponse> {
  const { data } = await http.get<RawResponse>(
    buildCourseAssignmentsPath(params.centerId, params.courseId),
    {
      params: {
        page: params.page,
        per_page: params.per_page,
      },
    },
  );

  return normalizeCourseAssignmentsResponse(data, params);
}

export async function createCourseAssignment(
  centerId: string | number,
  courseId: string | number,
  payload: CreateCourseAssignmentPayload,
): Promise<Assignment> {
  const { data } = await http.post<RawResponse<Assignment>>(
    buildCourseAssignmentsPath(centerId, courseId),
    payload,
  );

  const record = asRecord(data);
  return (record.data ?? data) as Assignment;
}

export async function deleteCenterAssignment(
  centerId: string | number,
  assignmentId: string | number,
) {
  const { data } = await http.delete(
    buildAssignmentItemPath(centerId, assignmentId),
  );
  return normalizeAdminActionResult(data);
}
