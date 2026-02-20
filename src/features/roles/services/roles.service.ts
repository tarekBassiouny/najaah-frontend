import { http } from "@/lib/http";
import type { Role, RolePermission } from "@/features/roles/types/role";
import type { PaginatedResponse } from "@/types/pagination";

export type ListRolesParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

export type RolesApiScopeContext = {
  centerId?: string | number | null;
};

function normalizeScopeCenterId(value?: string | number | null): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function buildRolesBasePath(centerId?: string | number | null) {
  const normalized = normalizeScopeCenterId(centerId);
  if (normalized == null) return "/api/v1/admin/roles";
  return `/api/v1/admin/centers/${normalized}/roles`;
}

type RawRolesResponse = {
  data?: Role[];
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
};

type RawRoleResponse = {
  data?: Role;
};

export async function listRoles(
  params: ListRolesParams,
  context?: RolesApiScopeContext,
): Promise<PaginatedResponse<Role>> {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.get<RawRolesResponse>(basePath, {
    params: {
      page: params.page,
      per_page: params.per_page,
      search: params.search || undefined,
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

export type CreateRolePayload = {
  name_translations: Record<string, string>;
  slug?: string;
  description_translations?: Record<string, string>;
  permission_ids?: (string | number)[];
  [key: string]: unknown;
};

export type UpdateRolePayload = {
  name_translations?: Record<string, string>;
  slug?: string;
  description_translations?: Record<string, string>;
  [key: string]: unknown;
};

export type UpdateRolePermissionsPayload = {
  permission_ids: (string | number)[];
};

export async function getRole(
  roleId: string | number,
  context?: RolesApiScopeContext,
): Promise<Role | null> {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.get<RawRoleResponse>(`${basePath}/${roleId}`);
  return data?.data ?? null;
}

export async function createRole(
  payload: CreateRolePayload,
  context?: RolesApiScopeContext,
): Promise<Role> {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.post<RawRoleResponse>(basePath, payload);
  return data?.data ?? (data as unknown as Role);
}

export async function updateRole(
  roleId: string | number,
  payload: UpdateRolePayload,
  context?: RolesApiScopeContext,
): Promise<Role> {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.put<RawRoleResponse>(
    `${basePath}/${roleId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Role);
}

export async function deleteRole(
  roleId: string | number,
  context?: RolesApiScopeContext,
): Promise<void> {
  const basePath = buildRolesBasePath(context?.centerId);
  await http.delete(`${basePath}/${roleId}`);
}

type RawRolePermissionsResponse = {
  data?: RolePermission[];
};

export async function getRolePermissions(
  roleId: string | number,
  context?: RolesApiScopeContext,
): Promise<RolePermission[]> {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.get<RawRolePermissionsResponse>(
    `${basePath}/${roleId}/permissions`,
  );
  return data?.data ?? [];
}

export async function updateRolePermissions(
  roleId: string | number,
  payload: UpdateRolePermissionsPayload,
  context?: RolesApiScopeContext,
): Promise<RolePermission[]> {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.put<RawRolePermissionsResponse>(
    `${basePath}/${roleId}/permissions`,
    payload,
  );
  return data?.data ?? [];
}
