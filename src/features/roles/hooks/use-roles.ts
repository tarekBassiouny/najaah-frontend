import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  createRole,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
  type CreateRolePayload,
  type ListRolesParams,
  type RolesApiScopeContext,
  type UpdateRolePayload,
} from "../services/roles.service";
import type { PaginatedResponse } from "@/types/pagination";
import type { Role } from "@/features/roles/types/role";

type UseRolesOptions = Omit<
  UseQueryOptions<PaginatedResponse<Role>>,
  "queryKey" | "queryFn"
>;

export function useRoles(
  params: ListRolesParams,
  context?: RolesApiScopeContext,
  options?: UseRolesOptions,
) {
  return useQuery({
    queryKey: ["roles", params, context?.centerId ?? null],
    queryFn: () => listRoles(params, context),
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseRoleOptions = Omit<
  UseQueryOptions<Role | null>,
  "queryKey" | "queryFn"
>;

export function useRole(
  roleId: string | number | undefined,
  context?: RolesApiScopeContext,
  options?: UseRoleOptions,
) {
  return useQuery({
    queryKey: ["role", roleId, context?.centerId ?? null],
    queryFn: () => getRole(roleId!, context),
    enabled: !!roleId,
    ...options,
  });
}

export function useCreateRole(context?: RolesApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole(context?: RolesApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      payload,
    }: {
      roleId: string | number;
      payload: UpdateRolePayload;
    }) => updateRole(roleId, payload, context),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", roleId] });
    },
  });
}

export function useDeleteRole(context?: RolesApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string | number) => deleteRole(roleId, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
