export type AdminUserRole = {
  id?: string | number;
  name?: string;
  slug?: string;
  role?: string;
  permissions?: string[];
  [key: string]: unknown;
};

export type AdminUserCenter = {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  [key: string]: unknown;
};

export type AdminUser = {
  id: string | number;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role?: string;
  roles?: Array<string | AdminUserRole>;
  roles_with_permissions?: AdminUserRole[] | null;
  center_id?: string | number | null;
  center?: AdminUserCenter | null;
  country_code?: string | null;
  status?: string | number | null;
  status_key?: string | null;
  status_label?: string | null;
  scope_type?: string | number | null;
  scope_center_id?: string | number | null;
  is_system_super_admin?: boolean | null;
  is_center_super_admin?: boolean | null;
  last_active_at?: string | null;
  last_active?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  avatar?: string | null;
  permissions?: string[];
  [key: string]: unknown;
};

export type AdminAuthTokens = {
  access_token: string;
};

export type AdminLoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export type AdminPasswordForgotPayload = {
  email: string;
};

export type AdminPasswordResetPayload = {
  token: string;
  email: string;
  password: string;
};

export type AdminProfileUpdatePayload = {
  name?: string;
  phone?: string | null;
  country_code?: string | null;
};

export type AdminChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export type AdminAuthResponse = {
  success: boolean;
  data?: {
    user?: AdminUser;
    token?: string;
  };
  message?: string;
};

export type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[] | string>;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[] | string>;
  };
};
