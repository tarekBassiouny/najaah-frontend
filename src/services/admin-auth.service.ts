import { setAuthPermissions } from "@/lib/auth-state";
import { http } from "@/lib/http";
import { tokenStorage } from "@/lib/token-storage";
import { scheduleTokenRefresh, cancelTokenRefresh } from "@/lib/token-refresh";
import {
  type AdminAuthResponse,
  type AdminAuthTokens,
  type AdminLoginPayload,
  type AdminPasswordResetPayload,
  type AdminUser,
  type ApiErrorResponse,
} from "@/types/auth";
import { isAxiosError } from "axios";

const isAdminUser = (value: unknown): value is AdminUser =>
  Boolean(
    value &&
    typeof value === "object" &&
    "id" in value &&
    "email" in value &&
    "name" in value,
  );

function extractUser(payload: AdminAuthResponse | AdminUser): AdminUser {
  if (isAdminUser(payload)) return payload;
  if (payload.data?.user && isAdminUser(payload.data.user))
    return payload.data.user;
  if (payload.data && isAdminUser(payload.data)) return payload.data;
  if (
    payload.data &&
    typeof payload.data === "object" &&
    "user" in payload.data &&
    isAdminUser((payload.data as { user: unknown }).user)
  ) {
    return (payload.data as { user: AdminUser }).user;
  }
  throw new Error("Invalid authentication response: missing user data");
}

type RolePayload = {
  permissions?: string[];
};

type RolesWithPermissionsPayload = {
  permissions?: string[];
};

function normalizePermissions(
  user: AdminUser & {
    roles?: RolePayload[] | string[];
    roles_with_permissions?: RolesWithPermissionsPayload[] | null;
  },
) {
  const rolePermissions = Array.isArray(user.roles)
    ? user.roles.flatMap((role) => {
        if (role && typeof role === "object" && "permissions" in role) {
          return (role as RolePayload).permissions ?? [];
        }
        return [];
      })
    : [];

  const rolesWithPermissions = Array.isArray(user.roles_with_permissions)
    ? user.roles_with_permissions.flatMap((role) => role.permissions ?? [])
    : [];

  const directPermissions = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  const permissions = [
    ...rolePermissions,
    ...rolesWithPermissions,
    ...directPermissions,
  ].filter(
    (permission): permission is string => typeof permission === "string",
  );

  return Array.from(new Set(permissions));
}

function normalizeAdminUser(
  user: AdminUser & {
    roles?: RolePayload[] | string[];
    roles_with_permissions?: RolesWithPermissionsPayload[] | null;
  },
) {
  const {
    roles: _roles,
    roles_with_permissions: _rolesWithPermissions,
    ...rest
  } = user;
  return {
    ...rest,
    permissions: normalizePermissions(user),
  };
}

function extractTokens(payload: AdminAuthResponse): AdminAuthTokens {
  if (!payload?.data?.token) {
    throw new Error("Invalid authentication response: missing token");
  }

  return {
    access_token: payload.data.token,
  };
}

export async function loginAdmin(payload: AdminLoginPayload) {
  const { data } = await http.post<AdminAuthResponse>(
    "/api/v1/admin/auth/login",
    payload,
    { skipAuth: true },
  );
  const tokens = extractTokens(data);

  // Set remember me preference before storing token
  // This determines if token goes to localStorage (persistent) or sessionStorage (session only)
  tokenStorage.setRememberMe(payload.remember ?? false);

  tokenStorage.setTokens({
    accessToken: tokens.access_token,
  });

  // Schedule proactive token refresh (2 min before expiry)
  scheduleTokenRefresh();

  let user: AdminUser | null = null;
  try {
    user = normalizeAdminUser(extractUser(data));
  } catch {
    user = null;
  }
  return { tokens, user };
}

export async function fetchAdminProfile(): Promise<AdminUser | null> {
  try {
    const { data } = await http.get<AdminAuthResponse>("/api/v1/admin/auth/me");
    // /auth/me returns: { data: { user: { roles: [{ permissions: string[] }] } } }
    const user = normalizeAdminUser(extractUser(data));
    setAuthPermissions(user.permissions ?? []);

    // Schedule proactive refresh for page reload scenarios
    scheduleTokenRefresh();

    return user;
  } catch (error) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      if (error.response?.status === 401) {
        cancelTokenRefresh();
        setAuthPermissions(null);
        return null;
      }
    }
    throw error;
  }
}

export async function refreshAdminSession() {
  const response = await http.post("/api/v1/admin/auth/refresh");

  const token =
    (
      response?.data as
        | { data?: { token?: string }; token?: string }
        | undefined
    )?.data?.token ??
    (
      response?.data as
        | { data?: { token?: string }; token?: string }
        | undefined
    )?.token;

  if (!token) {
    throw new Error("Invalid refresh response: missing token");
  }

  return {
    access_token: token,
  };
}

export async function logoutAdmin() {
  try {
    await http.post("/api/v1/admin/auth/logout");
  } finally {
    cancelTokenRefresh();
    tokenStorage.clear();
    setAuthPermissions(null);
  }
}

export async function resetAdminPassword(payload: AdminPasswordResetPayload) {
  const { data } = await http.post<ApiErrorResponse>(
    "/api/v1/admin/auth/password/reset",
    payload,
    { skipAuth: true },
  );
  return data;
}
