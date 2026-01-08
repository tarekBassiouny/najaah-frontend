import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listRoles, type ListRolesParams } from "../services/roles.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Role } from "@/features/roles/types/role";

type UseRolesOptions = Omit<
  UseQueryOptions<PaginatedResponse<Role>>,
  "queryKey" | "queryFn"
>;

export function useRoles(params: ListRolesParams, options?: UseRolesOptions) {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => listRoles(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}
