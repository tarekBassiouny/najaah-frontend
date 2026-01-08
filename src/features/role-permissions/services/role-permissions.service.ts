import { http } from "@/lib/http";
import type {
  RolePermission,
  RoleWithPermissions,
} from "@/features/role-permissions/types/role-permission";

type RawRoleResponse = {
  data?: RoleWithPermissions;
};

type RawPermissionsResponse = {
  data?: RolePermission[];
};

export type RolePermissionsResponse = {
  role: RoleWithPermissions | null;
  permissions: RolePermission[];
  rolePermissions: RolePermission[];
};

export async function getRolePermissions(
  roleId: string | number,
): Promise<RolePermissionsResponse> {
  const permissionsResponse = await http.get<RawPermissionsResponse>(
    "/api/v1/admin/permissions",
  );

  const { data } = await http.get<RawRoleResponse>(
    `/api/v1/admin/roles/${roleId}`,
  );

  const role = data?.data ?? null;
  const permissions = permissionsResponse.data?.data ?? [];
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
