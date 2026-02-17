import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
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
  options?: UseAdminUsersOptions,
) {
  return useQuery({
    queryKey: ["admin-users", params],
    queryFn: () => listAdminUsers(params),
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
  options?: UseAdminUserOptions,
) {
  return useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId!),
    enabled: !!userId,
    ...options,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string | number;
      payload: UpdateAdminUserPayload;
    }) => updateAdminUser(userId, payload),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string | number) => deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useSyncAdminUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      roleIds,
    }: {
      userId: string | number;
      roleIds: Array<string | number>;
    }) => syncAdminUserRoles(userId, { role_ids: roleIds }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useBulkAssignAdminRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkAssignRolesPayload) =>
      bulkAssignAdminRoles(payload),
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

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string | number;
      payload: UpdateAdminUserStatusPayload;
    }) => updateAdminUserStatus(userId, payload),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    },
  });
}

export function useBulkUpdateAdminUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateAdminUserStatusPayload) =>
      bulkUpdateAdminUserStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}
