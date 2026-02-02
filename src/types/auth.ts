export type AdminUser = {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  roles?: string[];
  roles_with_permissions?: Array<{
    permissions?: string[];
    [key: string]: unknown;
  }> | null;
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
