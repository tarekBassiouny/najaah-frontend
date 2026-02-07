import { http } from "@/lib/http";
import type { Role, RolePermission } from "@/features/roles/types/role";
import type { PaginatedResponse } from "@/types/pagination";

export type ListRolesParams = {
  page?: number;
  per_page?: number;
  search?: string;
};

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
): Promise<PaginatedResponse<Role>> {
  const { data } = await http.get<RawRolesResponse>("/api/v1/admin/roles", {
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

export async function getRole(roleId: string | number): Promise<Role | null> {
  const { data } = await http.get<RawRoleResponse>(
    `/api/v1/admin/roles/${roleId}`,
  );
  return data?.data ?? null;
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const { data } = await http.post<RawRoleResponse>(
    "/api/v1/admin/roles",
    payload,
  );
  return data?.data ?? (data as unknown as Role);
}

export async function updateRole(
  roleId: string | number,
  payload: UpdateRolePayload,
): Promise<Role> {
  const { data } = await http.put<RawRoleResponse>(
    `/api/v1/admin/roles/${roleId}`,
    payload,
  );
  return data?.data ?? (data as unknown as Role);
}

export async function deleteRole(roleId: string | number): Promise<void> {
  await http.delete(`/api/v1/admin/roles/${roleId}`);
}

type RawRolePermissionsResponse = {
  data?: RolePermission[];
};

export async function getRolePermissions(
  roleId: string | number,
): Promise<RolePermission[]> {
  const { data } = await http.get<RawRolePermissionsResponse>(
    `/api/v1/admin/roles/${roleId}/permissions`,
  );
  return data?.data ?? [];
}

export async function updateRolePermissions(
  roleId: string | number,
  payload: UpdateRolePermissionsPayload,
): Promise<RolePermission[]> {
  const { data } = await http.put<RawRolePermissionsResponse>(
    `/api/v1/admin/roles/${roleId}/permissions`,
    payload,
  );
  return data?.data ?? [];
}
