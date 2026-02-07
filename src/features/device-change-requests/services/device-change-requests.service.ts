import { http } from "@/lib/http";
import type { DeviceChangeRequest } from "@/features/device-change-requests/types/device-change-request";
import type { PaginatedResponse } from "@/types/pagination";

export type ListDeviceChangeRequestsParams = {
  page?: number;
  per_page?: number;
  status?: string;
  center_id?: number | string;
  user_id?: number | string;
  date_from?: string;
  date_to?: string;
};

type RawDeviceChangeRequestsResponse = {
  data?: DeviceChangeRequest[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listDeviceChangeRequests(
  params: ListDeviceChangeRequestsParams,
): Promise<PaginatedResponse<DeviceChangeRequest>> {
  const { data } = await http.get<RawDeviceChangeRequestsResponse>(
    "/api/v1/admin/device-change-requests",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        status: params.status || undefined,
        center_id: params.center_id ?? undefined,
        user_id: params.user_id ?? undefined,
        date_from: params.date_from || undefined,
        date_to: params.date_to || undefined,
      },
    },
  );

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

export type ApproveDeviceChangeRequestPayload = {
  new_device_id?: string;
  new_model?: string;
  new_os_version?: string;
};

export async function approveDeviceChangeRequest(
  requestId: string | number,
  payload?: ApproveDeviceChangeRequestPayload,
): Promise<DeviceChangeRequest> {
  const { data } = await http.post(
    `/api/v1/admin/device-change-requests/${requestId}/approve`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}

export type RejectDeviceChangeRequestPayload = {
  decision_reason: string;
};

export async function rejectDeviceChangeRequest(
  requestId: string | number,
  payload: RejectDeviceChangeRequestPayload,
): Promise<DeviceChangeRequest> {
  const { data } = await http.post(
    `/api/v1/admin/device-change-requests/${requestId}/reject`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}

export type PreApproveDeviceChangeRequestPayload = {
  decision_reason?: string;
};

export async function preApproveDeviceChangeRequest(
  requestId: string | number,
  payload?: PreApproveDeviceChangeRequestPayload,
): Promise<DeviceChangeRequest> {
  const { data } = await http.post(
    `/api/v1/admin/device-change-requests/${requestId}/pre-approve`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}

export type CreateDeviceChangeRequestPayload = {
  reason: string;
  device_uuid?: string;
  device_name?: string;
  device_os?: string;
  device_type?: string;
  [key: string]: unknown;
};

export async function createDeviceChangeRequestForStudent(
  studentId: string | number,
  payload: CreateDeviceChangeRequestPayload,
): Promise<DeviceChangeRequest> {
  const { data } = await http.post(
    `/api/v1/admin/students/${studentId}/device-change-requests`,
    payload,
  );
  return data?.data ?? (data as unknown as DeviceChangeRequest);
}
