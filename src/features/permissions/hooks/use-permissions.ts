import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listPermissions,
  type ListPermissionsParams,
  type ListPermissionsResponse,
} from "../services/permissions.service";

type UsePermissionsOptions = Omit<
  UseQueryOptions<ListPermissionsResponse>,
  "queryKey" | "queryFn"
>;

export function usePermissions(
  params: ListPermissionsParams = {},
  options?: UsePermissionsOptions,
) {
  return useQuery({
    queryKey: ["permissions", params],
    queryFn: () => listPermissions(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
