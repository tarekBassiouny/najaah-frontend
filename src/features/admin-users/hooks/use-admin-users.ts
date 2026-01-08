import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  listAdminUsers,
  type ListAdminUsersParams,
} from "../services/admin-users.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { AdminUser } from "@/features/admin-users/types/admin-user";

type UseAdminUsersOptions = Omit<
  UseQueryOptions<PaginatedResponse<AdminUser>>,
  "queryKey" | "queryFn"
>;

export function useAdminUsers(
  params: ListAdminUsersParams,
  options?: UseAdminUsersOptions,
) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => listAdminUsers(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
