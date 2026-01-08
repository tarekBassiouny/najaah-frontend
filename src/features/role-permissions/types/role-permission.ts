export type RolePermission = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
};

export type RoleWithPermissions = {
  id: number | string;
  name?: string | null;
  permissions?: RolePermission[] | null;
};
