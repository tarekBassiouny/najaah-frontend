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
