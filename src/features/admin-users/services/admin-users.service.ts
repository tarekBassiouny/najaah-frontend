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

export type AdminUsersApiScopeContext = {
  centerId?: string | number | null;
};

function normalizeCenterId(value?: string | number | null): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function buildAdminUsersBasePath(centerId?: string | number | null) {
  const normalized = normalizeCenterId(centerId);
  if (normalized == null) return "/api/v1/admin/users";
  return `/api/v1/admin/centers/${normalized}/users`;
}

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
  context?: AdminUsersApiScopeContext,
): Promise<PaginatedResponse<AdminUser>> {
  const scopeCenterId = normalizeCenterId(
    context?.centerId ?? params.center_id ?? null,
  );
  const basePath = buildAdminUsersBasePath(scopeCenterId);
  const includeCenterFilter = scopeCenterId == null;

  const { data } = await http.get<RawAdminUsersResponse>(basePath, {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
      center_id: includeCenterFilter
        ? (params.center_id ?? undefined)
        : undefined,
      status: params.status ?? undefined,
      role_id: params.role_id ?? undefined,
    },
  });

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
  context?: AdminUsersApiScopeContext,
): Promise<AdminUser | null> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.get<RawAdminUserResponse>(
    `${basePath}/${userId}`,
  );
  return data?.data ?? null;
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
  context?: AdminUsersApiScopeContext,
): Promise<AdminUser> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.post<RawAdminUserResponse>(basePath, payload);
  return data?.data ?? (data as unknown as AdminUser);
}

export async function updateAdminUser(
  userId: string | number,
  payload: UpdateAdminUserPayload,
  context?: AdminUsersApiScopeContext,
): Promise<AdminUser> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.put<RawAdminUserResponse>(
    `${basePath}/${userId}`,
    payload,
  );
  return data?.data ?? (data as unknown as AdminUser);
}

export async function deleteAdminUser(
  userId: string | number,
  context?: AdminUsersApiScopeContext,
): Promise<void> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  await http.delete(`${basePath}/${userId}`);
}

type RawAdminUserRolesResponse = {
  data?: AdminUserRole[];
};

export async function getAdminUserRoles(
  userId: string | number,
  context?: AdminUsersApiScopeContext,
): Promise<AdminUserRole[]> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.get<RawAdminUserRolesResponse>(
    `${basePath}/${userId}/roles`,
  );
  return data?.data ?? [];
}

export async function syncAdminUserRoles(
  userId: string | number,
  payload: SyncAdminUserRolesPayload,
  context?: AdminUsersApiScopeContext,
): Promise<AdminUserRole[]> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.put<RawAdminUserRolesResponse>(
    `${basePath}/${userId}/roles`,
    payload,
  );
  return data?.data ?? [];
}

export async function bulkAssignAdminRoles(
  payload: BulkAssignRolesPayload,
  context?: AdminUsersApiScopeContext,
): Promise<BulkAssignRolesResult> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.post(`${basePath}/roles/bulk`, payload);
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
  context?: AdminUsersApiScopeContext,
): Promise<AdminUser> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.put<RawAdminUserResponse>(
    `${basePath}/${userId}/status`,
    payload,
  );
  return data?.data ?? (data as unknown as AdminUser);
}

export async function bulkUpdateAdminUserStatus(
  payload: BulkUpdateAdminUserStatusPayload,
  context?: AdminUsersApiScopeContext,
): Promise<BulkUpdateAdminUserStatusResult> {
  const basePath = buildAdminUsersBasePath(context?.centerId);
  const { data } = await http.post(`${basePath}/bulk-status`, payload);
  return (data?.data ?? data) as BulkUpdateAdminUserStatusResult;
}
