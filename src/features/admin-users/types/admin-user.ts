export type AdminUserRole = {
  id?: number | string;
  name?: string | null;
  slug?: string | null;
  permissions?: string[] | null;
  [key: string]: unknown;
};

export type AdminUserRoleWithPermissions = {
  slug: string;
  permissions: string[];
};

export type AdminUserCenter = {
  id?: number | string | null;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type AdminUser = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
  center_id?: number | string | null;
  center?: AdminUserCenter | null;
  country_code?: string | null;
  status?: number | string | null;
  status_key?: string | null;
  status_label?: string | null;
  roles?: Array<string | AdminUserRole> | null;
  roles_with_permissions?: AdminUserRoleWithPermissions[] | null;
  last_active_at?: string | null;
  last_active?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};

export type BulkAssignCentersPayload = {
  assignments: Array<{
    user_id: string | number;
    center_id: string | number;
  }>;
};

export type BulkAssignCentersResult = {
  counts?: {
    total?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
  };
  updated?: AdminUser[];
  skipped?: Array<{
    user_id: string | number;
    reason?: string;
  }>;
  failed?: Array<{
    user_id: string | number;
    center_id?: string | number;
    reason?: string;
  }>;
};

export type BulkAssignRolesPayload = {
  user_ids: (string | number)[];
  role_ids: (string | number)[];
};

export type BulkAssignRolesResult = {
  counts?: {
    total?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
  };
  updated?: AdminUser[];
  skipped?: Array<{
    user_id: string | number;
    reason?: string;
  }>;
  failed?: Array<{
    user_id: string | number;
    reason?: string;
  }>;
};

export type UpdateAdminUserStatusPayload = {
  status: string | number;
};

export type BulkUpdateAdminUserStatusPayload = {
  status: string | number;
  user_ids: (string | number)[];
};

export type BulkUpdateAdminUserStatusResult = {
  counts?: {
    total?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
  };
  updated?: AdminUser[];
  skipped?: Array<{
    user_id: string | number;
    reason?: string;
  }>;
  failed?: Array<{
    user_id: string | number;
    reason?: string;
  }>;
};
