export type AdminUser = {
  id: string | number;
  name: string;
  email: string;
  role?: string;
  avatar?: string | null;
  [key: string]: unknown;
};

export type AdminLoginPayload = {
  email: string;
  password: string;
  remember?: boolean;
};

export type AdminAuthResponse = {
  user?: AdminUser;
  data?: AdminUser;
  message?: string;
  token?: string;
};

export type ApiErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};
