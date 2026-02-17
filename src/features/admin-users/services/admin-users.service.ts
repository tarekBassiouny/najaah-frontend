import { http } from "@/lib/http";
import type {
  AdminUser,
  AdminUserRole,
  BulkAssignCentersPayload,
  BulkAssignCentersResult,
  BulkAssignRolesPayload,
  BulkAssignRolesResult,
  BulkUpdateAdminUserStatusPayload,
  BulkUpdateAdminUserStatusResult,
  UpdateAdminUserStatusPayload,
} from "@/features/admin-users/types/admin-user";
import type { PaginatedResponse } from "@/types/pagination";

export type ListAdminUsersParams = {
  page?: number;
  per_page?: number;
  search?: string;
  center_id?: string | number;
  status?: string | number;
  role_id?: string | number;
};

type RawAdminUsersResponse = {
  data?: AdminUser[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawAdminUserResponse = {
  data?: AdminUser;
};

export async function listAdminUsers(
  params: ListAdminUsersParams,
): Promise<PaginatedResponse<AdminUser>> {
  const { data } = await http.get<RawAdminUsersResponse>(
    "/api/v1/admin/users",
    {
      params: {
        page: params.page,
        per_page: params.per_page,
        search: params.search || undefined,
        center_id: params.center_id ?? undefined,
        status: params.status ?? undefined,
        role_id: params.role_id ?? undefined,
      },
    },
  );

  return {
    items: data?.data ?? [],
    meta: {
      page: data?.meta?.page ?? params.page ?? 1,
      per_page: data?.meta?.per_page ?? params.per_page ?? 10,
      total: data?.meta?.total ?? 0,
    },
  };
}

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  phone?: string;
  center_id?: string | number | null;
  status?: number;
  [key: string]: unknown;
};

export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  phone?: string;
  center_id?: string | number | null;
  status?: string | number;
  [key: string]: unknown;
};

export type SyncAdminUserRolesPayload = {
  role_ids: (string | number)[];
};

export async function getAdminUser(
  userId: string | number,
): Promise<AdminUser | null> {
  const { data } = await http.get<RawAdminUserResponse>(
    `/api/v1/admin/users/${userId}`,
  );
  return data?.data ?? null;
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<AdminUser> {
  const { data } = await http.post<RawAdminUserResponse>(
    "/api/v1/admin/users",
    payload,
  );
  return data?.data ?? (data as unknown as AdminUser);
}

export async function updateAdminUser(
  userId: string | number,
  payload: UpdateAdminUserPayload,
): Promise<AdminUser> {
  const { data } = await http.put<RawAdminUserResponse>(
    `/api/v1/admin/users/${userId}`,
    payload,
  );
  return data?.data ?? (data as unknown as AdminUser);
}

export async function deleteAdminUser(userId: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/users/${userId}`);
}

type RawAdminUserRolesResponse = {
  data?: AdminUserRole[];
};

export async function getAdminUserRoles(
  userId: string | number,
): Promise<AdminUserRole[]> {
  const { data } = await http.get<RawAdminUserRolesResponse>(
    `/api/v1/admin/users/${userId}/roles`,
  );
  return data?.data ?? [];
}

export async function syncAdminUserRoles(
  userId: string | number,
  payload: SyncAdminUserRolesPayload,
): Promise<AdminUserRole[]> {
  const { data } = await http.put<RawAdminUserRolesResponse>(
    `/api/v1/admin/users/${userId}/roles`,
    payload,
  );
  return data?.data ?? [];
}

export async function bulkAssignAdminRoles(
  payload: BulkAssignRolesPayload,
): Promise<BulkAssignRolesResult> {
  const { data } = await http.post("/api/v1/admin/users/roles/bulk", payload);
  return (data?.data ?? data) as BulkAssignRolesResult;
}

export async function bulkAssignAdminCenters(
  payload: BulkAssignCentersPayload,
): Promise<BulkAssignCentersResult> {
  const { data } = await http.put(
    "/api/v1/admin/users/bulk-assign-centers",
    payload,
  );
  return (data?.data ?? data) as BulkAssignCentersResult;
}

export async function updateAdminUserStatus(
  userId: string | number,
  payload: UpdateAdminUserStatusPayload,
): Promise<AdminUser> {
  const { data } = await http.put<RawAdminUserResponse>(
    `/api/v1/admin/users/${userId}/status`,
    payload,
  );
  return data?.data ?? (data as unknown as AdminUser);
}

export async function bulkUpdateAdminUserStatus(
  payload: BulkUpdateAdminUserStatusPayload,
): Promise<BulkUpdateAdminUserStatusResult> {
  const { data } = await http.post("/api/v1/admin/users/bulk-status", payload);
  return (data?.data ?? data) as BulkUpdateAdminUserStatusResult;
}
