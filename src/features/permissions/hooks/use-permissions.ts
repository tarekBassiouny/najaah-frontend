import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listPermissions } from "../services/permissions.service";
import type { ListPermissionsResponse } from "../services/permissions.service";

type UsePermissionsOptions = Omit<
  UseQueryOptions<ListPermissionsResponse>,
  "queryKey" | "queryFn"
>;

export function usePermissions(options?: UsePermissionsOptions) {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: listPermissions,
    ...options,
  });
}
