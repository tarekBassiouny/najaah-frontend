import { http } from "@/lib/http";
import type {
  ApproveExtraViewRequestPayload,
  BulkDirectGrantExtraViewPayload,
  BulkApproveExtraViewRequestsPayload,
  BulkRejectExtraViewRequestsPayload,
  ExtraViewBulkActionResult,
  ExtraViewDirectGrantResult,
  ExtraViewRequest,
  DirectGrantExtraViewPayload,
  ListExtraViewRequestsParams,
  RejectExtraViewRequestPayload,
} from "@/features/extra-view-requests/types/extra-view-request";
import type { PaginatedResponse } from "@/types/pagination";

type RawExtraViewRequestsResponse = {
  data?: ExtraViewRequest[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
};

type RawExtraViewRequestResponse = {
  data?: ExtraViewRequest;
};

type RawBulkActionResponse = {
  success?: boolean;
  message?: string;
  data?: ExtraViewBulkActionResult;
};

type RawDirectGrantResponse = {
  success?: boolean;
  message?: string;
  data?: ExtraViewRequest;
};

type RawBulkDirectGrantResponse = {
  success?: boolean;
  message?: string;
  data?: ExtraViewDirectGrantResult;
};

function buildExtraViewRequestsBasePath(centerId?: string | number | null) {
  if (centerId == null || centerId === "") {
    return "/api/v1/admin/extra-view-requests";
  }
  return `/api/v1/admin/centers/${centerId}/extra-view-requests`;
}

function buildExtraViewGrantsBasePath(centerId?: string | number | null) {
  if (centerId == null || centerId === "") {
    return "/api/v1/admin/extra-view-grants";
  }
  return `/api/v1/admin/centers/${centerId}/extra-view-grants`;
}

function buildStudentsBasePath(centerId?: string | number | null) {
  if (centerId == null || centerId === "") {
    return "/api/v1/admin/students";
  }
  return `/api/v1/admin/centers/${centerId}/students`;
}

export async function listExtraViewRequests(
  params: ListExtraViewRequestsParams,
  centerId?: string | number | null,
): Promise<PaginatedResponse<ExtraViewRequest>> {
  const effectiveCenterId = centerId ?? params.center_id;
  const basePath = buildExtraViewRequestsBasePath(effectiveCenterId);
  const includeCenterFilter = effectiveCenterId == null;

  const { data } = await http.get<RawExtraViewRequestsResponse>(basePath, {
    params: {
      page: params.page,
      per_page: params.per_page,
      status: params.status || undefined,
      center_id: includeCenterFilter
        ? (params.center_id ?? undefined)
        : undefined,
      search: params.search || undefined,
      user_id: params.user_id ?? undefined,
      course_id: params.course_id ?? undefined,
      course_title: params.course_title || undefined,
      video_id: params.video_id ?? undefined,
      video_title: params.video_title || undefined,
      decided_by: params.decided_by ?? undefined,
      requested_at_from:
        params.requested_at_from || params.date_from || undefined,
      requested_at_to: params.requested_at_to || params.date_to || undefined,
      date_from: params.date_from || params.requested_at_from || undefined,
      date_to: params.date_to || params.requested_at_to || undefined,
    },
  });

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

export async function approveExtraViewRequest(
  requestId: string | number,
  payload: ApproveExtraViewRequestPayload,
  centerId?: string | number | null,
): Promise<ExtraViewRequest> {
  const basePath = buildExtraViewRequestsBasePath(centerId);
  const { data } = await http.post<RawExtraViewRequestResponse>(
    `${basePath}/${requestId}/approve`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewRequest);
}

export async function rejectExtraViewRequest(
  requestId: string | number,
  payload: RejectExtraViewRequestPayload,
  centerId?: string | number | null,
): Promise<ExtraViewRequest> {
  const basePath = buildExtraViewRequestsBasePath(centerId);
  const { data } = await http.post<RawExtraViewRequestResponse>(
    `${basePath}/${requestId}/reject`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewRequest);
}

export async function bulkApproveExtraViewRequests(
  payload: BulkApproveExtraViewRequestsPayload,
  centerId?: string | number | null,
): Promise<ExtraViewBulkActionResult> {
  const basePath = buildExtraViewRequestsBasePath(centerId);
  const { data } = await http.post<RawBulkActionResponse>(
    `${basePath}/bulk-approve`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewBulkActionResult);
}

export async function bulkRejectExtraViewRequests(
  payload: BulkRejectExtraViewRequestsPayload,
  centerId?: string | number | null,
): Promise<ExtraViewBulkActionResult> {
  const basePath = buildExtraViewRequestsBasePath(centerId);
  const { data } = await http.post<RawBulkActionResponse>(
    `${basePath}/bulk-reject`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewBulkActionResult);
}

export async function grantExtraViewsToStudent(
  studentId: string | number,
  payload: DirectGrantExtraViewPayload,
  centerId?: string | number | null,
): Promise<ExtraViewRequest> {
  const studentsBasePath = buildStudentsBasePath(centerId);
  const { data } = await http.post<RawDirectGrantResponse>(
    `${studentsBasePath}/${studentId}/extra-view-grants`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewRequest);
}

export async function bulkGrantExtraViews(
  payload: BulkDirectGrantExtraViewPayload,
  centerId?: string | number | null,
): Promise<ExtraViewDirectGrantResult> {
  const grantsBasePath = buildExtraViewGrantsBasePath(centerId);
  const { data } = await http.post<RawBulkDirectGrantResponse>(
    `${grantsBasePath}/bulk`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewDirectGrantResult);
}
