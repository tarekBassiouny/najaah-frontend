import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listAuditLogs,
  type ListAuditLogsParams,
  type AuditLogsScope,
} from "../services/audit-logs.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { AuditLog } from "@/features/audit-logs/types/audit-log";

type UseAuditLogsOptions = Omit<
  UseQueryOptions<PaginatedResponse<AuditLog>>,
  "queryKey" | "queryFn"
>;

export function useAuditLogs(
  params: ListAuditLogsParams,
  scope: AuditLogsScope = {},
  options?: UseAuditLogsOptions,
) {
  return useQuery({
    queryKey: ["audit-logs", scope.centerId ?? "system", params],
    queryFn: () => listAuditLogs(params, scope),
    placeholderData: (previous) => previous,
    ...options,
  });
}
