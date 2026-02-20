import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  AdminUsersApiScopeContext,
  bulkAssignAdminCenters,
  bulkAssignAdminRoles,
  bulkUpdateAdminUserStatus,
  createAdminUser,
  deleteAdminUser,
  getAdminUser,
  listAdminUsers,
  syncAdminUserRoles,
  updateAdminUser,
  updateAdminUserStatus,
  type CreateAdminUserPayload,
  type ListAdminUsersParams,
  type UpdateAdminUserPayload,
} from "../services/admin-users.service";
import type { PaginatedResponse } from "@/types/pagination";
import type {
  AdminUser,
  BulkAssignCentersPayload,
  BulkAssignRolesPayload,
  BulkUpdateAdminUserStatusPayload,
  UpdateAdminUserStatusPayload,
} from "@/features/admin-users/types/admin-user";

type UseAdminUsersOptions = Omit<
  UseQueryOptions<PaginatedResponse<AdminUser>>,
  "queryKey" | "queryFn"
>;

export function useAdminUsers(
  params: ListAdminUsersParams,
  context?: AdminUsersApiScopeContext,
  options?: UseAdminUsersOptions,
) {
  return useQuery({
    queryKey: ["admin-users", params, context?.centerId ?? null],
    queryFn: () => listAdminUsers(params, context),
    placeholderData: (previous) => previous,
    ...options,
  });
}

type UseAdminUserOptions = Omit<
  UseQueryOptions<AdminUser | null>,
  "queryKey" | "queryFn"
>;

export function useAdminUser(
  userId: string | number | undefined,
  context?: AdminUsersApiScopeContext,
  options?: UseAdminUserOptions,
) {
  return useQuery({
    queryKey: ["admin-user", userId, context?.centerId ?? null],
    queryFn: () => getAdminUser(userId!, context),
    enabled: !!userId,
    ...options,
  });
}

export function useCreateAdminUser(context?: AdminUsersApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) =>
      createAdminUser(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateAdminUser(context?: AdminUsersApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string | number;
      payload: UpdateAdminUserPayload;
    }) => updateAdminUser(userId, payload, context),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
}

export function useDeleteAdminUser(context?: AdminUsersApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string | number) => deleteAdminUser(userId, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useSyncAdminUserRoles(context?: AdminUsersApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      roleIds,
    }: {
      userId: string | number;
      roleIds: Array<string | number>;
    }) => syncAdminUserRoles(userId, { role_ids: roleIds }, context),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useBulkAssignAdminRoles(context?: AdminUsersApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignRolesPayload) =>
      bulkAssignAdminRoles(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useBulkAssignAdminCenters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignCentersPayload) =>
      bulkAssignAdminCenters(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateAdminUserStatus(context?: AdminUsersApiScopeContext) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string | number;
      payload: UpdateAdminUserStatusPayload;
    }) => updateAdminUserStatus(userId, payload, context),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
}

export function useBulkUpdateAdminUserStatus(
  context?: AdminUsersApiScopeContext,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateAdminUserStatusPayload) =>
      bulkUpdateAdminUserStatus(payload, context),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
