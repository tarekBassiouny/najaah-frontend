import { http } from "@/lib/http";
import type {
  ApproveDeviceChangeRequestPayload,
  BulkApproveDeviceChangeRequestsPayload,
  BulkPreApproveDeviceChangeRequestsPayload,
  BulkRejectDeviceChangeRequestsPayload,
  CreateDeviceChangeRequestPayload,
  DeviceChangeBulkActionResult,
  DeviceChangeRequest,
  ListDeviceChangeRequestsParams,
  PreApproveDeviceChangeRequestPayload,
  RejectDeviceChangeRequestPayload,
} from "@/features/device-change-requests/types/device-change-request";
import type { PaginatedResponse } from "@/types/pagination";

type RawDeviceChangeRequestsResponse = {
  data?: DeviceChangeRequest[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
};

type RawDeviceChangeRequestResponse = {
  data?: DeviceChangeRequest;
};

type RawBulkActionResponse = {
  success?: boolean;
  message?: string;
  data?: DeviceChangeBulkActionResult;
};

function buildDeviceChangeRequestsBasePath(centerId?: string | number | null) {
  if (centerId == null || centerId === "") {
    return "/api/v1/admin/device-change-requests";
  }
  return `/api/v1/admin/centers/${centerId}/device-change-requests`;
}

function buildStudentDeviceChangeRequestsPath(
  studentId: string | number,
  centerId?: string | number | null,
) {
  if (centerId == null || centerId === "") {
    return `/api/v1/admin/students/${studentId}/device-change-requests`;
  }
  return `/api/v1/admin/centers/${centerId}/students/${studentId}/device-change-requests`;
}

export async function listDeviceChangeRequests(
  params: ListDeviceChangeRequestsParams,
  centerId?: string | number | null,
): Promise<PaginatedResponse<DeviceChangeRequest>> {
  const effectiveCenterId = centerId ?? params.center_id;
  const basePath = buildDeviceChangeRequestsBasePath(effectiveCenterId);
  const includeCenterFilter = effectiveCenterId == null;

  const { data } = await http.get<RawDeviceChangeRequestsResponse>(basePath, {
    params: {
      page: params.page,
      per_page: params.per_page,
      status: params.status || undefined,
      center_id: includeCenterFilter
        ? (params.center_id ?? undefined)
        : undefined,
      search: params.search || undefined,
      user_id: params.user_id ?? undefined,
      request_source: params.request_source ?? undefined,
      decided_by: params.decided_by ?? undefined,
      current_device_id: params.current_device_id ?? undefined,
      new_device_id: params.new_device_id ?? undefined,
      date_from: params.date_from || undefined,
      date_to: params.date_to || undefined,
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

export async function approveDeviceChangeRequest(
  requestId: string | number,
  payload?: ApproveDeviceChangeRequestPayload,
  centerId?: string | number | null,
): Promise<DeviceChangeRequest> {
  const basePath = buildDeviceChangeRequestsBasePath(centerId);
  const { data } = await http.post<RawDeviceChangeRequestResponse>(
    `${basePath}/${requestId}/approve`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}

export async function rejectDeviceChangeRequest(
  requestId: string | number,
  payload: RejectDeviceChangeRequestPayload,
  centerId?: string | number | null,
): Promise<DeviceChangeRequest> {
  const basePath = buildDeviceChangeRequestsBasePath(centerId);
  const { data } = await http.post<RawDeviceChangeRequestResponse>(
    `${basePath}/${requestId}/reject`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}

export async function preApproveDeviceChangeRequest(
  requestId: string | number,
  payload?: PreApproveDeviceChangeRequestPayload,
  centerId?: string | number | null,
): Promise<DeviceChangeRequest> {
  const basePath = buildDeviceChangeRequestsBasePath(centerId);
  const { data } = await http.post<RawDeviceChangeRequestResponse>(
    `${basePath}/${requestId}/pre-approve`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}

export async function createDeviceChangeRequestForStudent(
  studentId: string | number,
  payload: CreateDeviceChangeRequestPayload,
  centerId?: string | number | null,
): Promise<DeviceChangeRequest> {
  const { data } = await http.post<RawDeviceChangeRequestResponse>(
    buildStudentDeviceChangeRequestsPath(studentId, centerId),
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}

export async function bulkApproveDeviceChangeRequests(
  payload: BulkApproveDeviceChangeRequestsPayload,
  centerId?: string | number | null,
): Promise<DeviceChangeBulkActionResult> {
  const basePath = buildDeviceChangeRequestsBasePath(centerId);
  const { data } = await http.post<RawBulkActionResponse>(
    `${basePath}/bulk-approve`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeBulkActionResult);
}

export async function bulkRejectDeviceChangeRequests(
  payload: BulkRejectDeviceChangeRequestsPayload,
  centerId?: string | number | null,
): Promise<DeviceChangeBulkActionResult> {
  const basePath = buildDeviceChangeRequestsBasePath(centerId);
  const { data } = await http.post<RawBulkActionResponse>(
    `${basePath}/bulk-reject`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeBulkActionResult);
}

export async function bulkPreApproveDeviceChangeRequests(
  payload: BulkPreApproveDeviceChangeRequestsPayload,
  centerId?: string | number | null,
): Promise<DeviceChangeBulkActionResult> {
  const basePath = buildDeviceChangeRequestsBasePath(centerId);
  const { data } = await http.post<RawBulkActionResponse>(
    `${basePath}/bulk-pre-approve`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeBulkActionResult);
}
