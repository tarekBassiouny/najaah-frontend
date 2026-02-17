import { http } from "@/lib/http";
import type {
  RolePermission,
  RoleWithPermissions,
} from "@/features/role-permissions/types/role-permission";

type RawRoleResponse = {
  data?: RoleWithPermissions;
};

type RawPermissionsPayload =
  | RolePermission[]
  | {
      data?: RolePermission[];
    };

type RawPermissionsResponse = {
  data?: RawPermissionsPayload;
};

export type RolePermissionsResponse = {
  role: RoleWithPermissions | null;
  permissions: RolePermission[];
  rolePermissions: RolePermission[];
};

export type BulkAssignRolePermissionsPayload = {
  role_ids: Array<string | number>;
  permission_ids: Array<string | number>;
};

export type BulkAssignRolePermissionsResponse = {
  roles: Array<string | number>;
  permission_ids: Array<string | number>;
};

function normalizePermissions(payload: RawPermissionsResponse | undefined) {
  const raw = payload?.data;

  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && typeof raw === "object" && Array.isArray(raw.data)) {
    return raw.data;
  }

  return [];
}

export async function getRolePermissions(
  roleId: string | number,
): Promise<RolePermissionsResponse> {
  const permissionsResponse = await http.get<RawPermissionsResponse>(
    "/api/v1/admin/permissions",
    {
      params: {
        page: 1,
        per_page: 500,
      },
    },
  );

  const { data } = await http.get<RawRoleResponse>(
    `/api/v1/admin/roles/${roleId}`,
  );

  const role = data?.data ?? null;
  const permissions = normalizePermissions(permissionsResponse.data);
  const rolePermissions = role?.permissions ?? [];

  return {
    role,
    permissions,
    rolePermissions,
  };
}

export async function updateRolePermissions(
  roleId: string | number,
  permissionIds: Array<number | string>,
) {
  const { data } = await http.put(`/api/v1/admin/roles/${roleId}/permissions`, {
    permission_ids: permissionIds,
  });

  return data;
}

export async function bulkAssignRolePermissions(
  payload: BulkAssignRolePermissionsPayload,
): Promise<BulkAssignRolePermissionsResponse> {
  const { data } = await http.post<{
    data?: BulkAssignRolePermissionsResponse;
  }>("/api/v1/admin/roles/permissions/bulk", payload);

  return (
    data?.data ?? {
      roles: payload.role_ids,
      permission_ids: payload.permission_ids,
    }
  );
}
