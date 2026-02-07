import { http } from "@/lib/http";
import type { ExtraViewRequest } from "@/features/extra-view-requests/types/extra-view-request";
import type { PaginatedResponse } from "@/types/pagination";

export type ListExtraViewRequestsParams = {
  page?: number;
  per_page?: number;
  status?: string;
  center_id?: number | string;
  user_id?: number | string;
  date_from?: string;
  date_to?: string;
};

type RawExtraViewRequestsResponse = {
  data?: ExtraViewRequest[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listExtraViewRequests(
  params: ListExtraViewRequestsParams,
): Promise<PaginatedResponse<ExtraViewRequest>> {
  const { data } = await http.get<RawExtraViewRequestsResponse>(
    "/api/v1/admin/extra-view-requests",
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

export type ApproveExtraViewRequestPayload = {
  granted_views: number;
  decision_reason?: string;
};

export async function approveExtraViewRequest(
  requestId: string | number,
  payload: ApproveExtraViewRequestPayload,
): Promise<ExtraViewRequest> {
  const { data } = await http.post(
    `/api/v1/admin/extra-view-requests/${requestId}/approve`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewRequest);
}

export type RejectExtraViewRequestPayload = {
  decision_reason: string;
};

export async function rejectExtraViewRequest(
  requestId: string | number,
  payload: RejectExtraViewRequestPayload,
): Promise<ExtraViewRequest> {
  const { data } = await http.post(
    `/api/v1/admin/extra-view-requests/${requestId}/reject`,
    payload,
  );
  return data?.data ?? (data as unknown as ExtraViewRequest);
}
