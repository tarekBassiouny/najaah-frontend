import { http } from "@/lib/http";
import type { AuditLog } from "@/features/audit-logs/types/audit-log";
import type { PaginatedResponse } from "@/types/pagination";

export type ListAuditLogsParams = {
  page?: number;
  per_page?: number;
  action?: string;
  actor_id?: number | string;
  center_id?: number | string;
  date_from?: string;
  date_to?: string;
};

type RawAuditLogsResponse = {
  data?: AuditLog[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

export async function listAuditLogs(
  params: ListAuditLogsParams,
): Promise<PaginatedResponse<AuditLog>> {
  const { data } = await http.get<RawAuditLogsResponse>(
    "/api/v1/admin/audit-logs",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        action: params.action || undefined,
        actor_id: params.actor_id ?? undefined,
        center_id: params.center_id ?? undefined,
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
