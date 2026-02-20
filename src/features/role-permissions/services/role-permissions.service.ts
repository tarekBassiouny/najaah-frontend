import { http } from "@/lib/http";
import type {
  RolePermission,
  RoleWithPermissions,
} from "@/features/role-permissions/types/role-permission";
import type { RolesApiScopeContext } from "@/features/roles/services/roles.service";

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

function buildPermissionsBasePath(centerId?: string | number | null) {
  const normalized = normalizeScopeCenterId(centerId);
  if (normalized == null) return "/api/v1/admin/permissions";
  return `/api/v1/admin/centers/${normalized}/permissions`;
}

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
  context?: RolesApiScopeContext,
): Promise<RolePermissionsResponse> {
  const permissionsBasePath = buildPermissionsBasePath(context?.centerId);
  const permissionsResponse = await http.get<RawPermissionsResponse>(
    permissionsBasePath,
    {
      params: {
        page: 1,
        per_page: 500,
      },
    },
  );

  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.get<RawRoleResponse>(`${basePath}/${roleId}`);

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
  context?: RolesApiScopeContext,
) {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.put(`${basePath}/${roleId}/permissions`, {
    permission_ids: permissionIds,
  });

  return data;
}

export async function bulkAssignRolePermissions(
  payload: BulkAssignRolePermissionsPayload,
  context?: RolesApiScopeContext,
): Promise<BulkAssignRolePermissionsResponse> {
  const basePath = buildRolesBasePath(context?.centerId);
  const { data } = await http.post<{
    data?: BulkAssignRolePermissionsResponse;
  }>(`${basePath}/permissions/bulk`, payload);

  return (
    data?.data ?? {
      roles: payload.role_ids,
      permission_ids: payload.permission_ids,
    }
  );
}
