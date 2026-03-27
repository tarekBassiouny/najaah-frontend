import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl, defaultApiKey, getApiLocale } from "./runtime-config";
import { portalTokenStorage } from "./portal-token-storage";
import { getTenantApiKey, getTenantState } from "./tenant-store";
import {
  portalRefreshToken,
  cancelPortalTokenRefresh,
} from "./portal-token-refresh";

type PortalRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuth?: boolean;
};

function redirectToPortalLogin(reason?: "session_expired") {
  if (typeof window !== "undefined") {
    cancelPortalTokenRefresh();
    const role = portalTokenStorage.getActiveRole();
    const params = new URLSearchParams();
    if (reason) {
      params.set("reason", reason);
    }
    const query = params.toString();
    const loginPath =
      role === "parent" ? "/portal/parent/login" : "/portal/student/login";
    window.location.href = query ? `${loginPath}?${query}` : loginPath;
  }
}

/**
 * Resolve API key for portal requests:
 * - Branded (subdomain center): use center's API key from tenant store
 * - Unbranded (apex/no subdomain): use system default API key
 */
function getPortalApiKey(): string {
  const tenant = getTenantState();
  // If a center is resolved (branded), use its API key
  if (tenant.centerSlug && tenant.apiKey) {
    return tenant.apiKey;
  }
  // Unbranded: use the tenant API key (falls back to default)
  return getTenantApiKey() || defaultApiKey;
}

export const portalHttp = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

portalHttp.interceptors.request.use((config) => {
  const nextConfig = config as PortalRequestConfig;

  nextConfig.headers = nextConfig.headers ?? {};

  if (!nextConfig.headers["X-Api-Key"]) {
    nextConfig.headers["X-Api-Key"] = getPortalApiKey();
  }

  if (!nextConfig.headers["X-Locale"]) {
    nextConfig.headers["X-Locale"] = getApiLocale();
  }

  const accessToken = portalTokenStorage.getAccessToken();
  if (!nextConfig.skipAuth && accessToken) {
    nextConfig.headers.Authorization = `Bearer ${accessToken}`;
  }

  return nextConfig;
});

portalHttp.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const response = error.response;
    const originalConfig = error.config as PortalRequestConfig | undefined;

    if (!response || !originalConfig) {
      return Promise.reject(error);
    }

    if (response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalConfig._retry || originalConfig.skipAuth) {
      return Promise.reject(error);
    }

    if (
      originalConfig.url?.includes("/auth/student/refresh") ||
      originalConfig.url?.includes("/auth/parent/refresh")
    ) {
      portalTokenStorage.clear();
      redirectToPortalLogin("session_expired");
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    try {
      const newToken = await portalRefreshToken();
      originalConfig.headers = originalConfig.headers ?? {};
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
      return portalHttp(originalConfig);
    } catch (refreshError) {
      portalTokenStorage.clear();
      redirectToPortalLogin("session_expired");
      return Promise.reject(refreshError);
    }
  },
);
