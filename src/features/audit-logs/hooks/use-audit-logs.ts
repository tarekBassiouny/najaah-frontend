import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listAuditLogs, type ListAuditLogsParams } from "../services/audit-logs.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { AuditLog } from "@/features/audit-logs/types/audit-log";

type UseAuditLogsOptions = Omit<
  UseQueryOptions<PaginatedResponse<AuditLog>>,
  "queryKey" | "queryFn"
>;

export function useAuditLogs(
  params: ListAuditLogsParams,
  options?: UseAuditLogsOptions,
) {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => listAuditLogs(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
