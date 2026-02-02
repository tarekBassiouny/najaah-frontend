import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
  type CreateRolePayload,
  type ListRolesParams,
  type UpdateRolePayload,
} from "../services/roles.service";
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

type UseRoleOptions = Omit<UseQueryOptions<Role | null>, "queryKey" | "queryFn">;

export function useRole(
  roleId: string | number | undefined,
  options?: UseRoleOptions,
) {
  return useQuery({
    queryKey: ["role", roleId],
    queryFn: () => getRole(roleId!),
    enabled: !!roleId,
    ...options,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: string | number;
      payload: UpdateRolePayload;
    }) => updateRole(roleId, payload),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", roleId] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string | number) => deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
