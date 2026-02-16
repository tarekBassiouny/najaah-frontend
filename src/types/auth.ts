export type AdminUserRole = {
  id?: string | number;
  name?: string;
  slug?: string;
  role?: string;
  permissions?: string[];
  [key: string]: unknown;
};

export type AdminUser = {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  roles?: Array<string | AdminUserRole>;
  roles_with_permissions?: AdminUserRole[] | null;
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

export type AdminPasswordResetPayload = {
  token: string;
  email: string;
  password: string;
};

export type AdminAuthResponse = {
  success: boolean;
  data?: {
    user: AdminUser;
    token: string;
  };
  message?: string;
};

export type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};
