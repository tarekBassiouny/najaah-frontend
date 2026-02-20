import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listPermissions,
  type PermissionsApiScopeContext,
  type ListPermissionsParams,
  type ListPermissionsResponse,
} from "../services/permissions.service";

type UsePermissionsOptions = Omit<
  UseQueryOptions<ListPermissionsResponse>,
  "queryKey" | "queryFn"
>;

export function usePermissions(
  params: ListPermissionsParams = {},
  context?: PermissionsApiScopeContext,
  options?: UsePermissionsOptions,
) {
  return useQuery({
    queryKey: ["permissions", params, context?.centerId ?? null],
    queryFn: () => listPermissions(params, context),
    placeholderData: (previous) => previous,
    ...options,
  });
}
