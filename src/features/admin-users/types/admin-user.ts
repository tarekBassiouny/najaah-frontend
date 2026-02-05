export type AdminUserRole = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type AdminUser = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  center_id?: number | string | null;
  roles?: AdminUserRole[] | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
};
