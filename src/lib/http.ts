import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl, getApiLocale } from "./runtime-config";
import { tokenStorage } from "./token-storage";
import { getTenantApiKey } from "./tenant-store";
import { refreshToken, cancelTokenRefresh } from "./token-refresh";

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuth?: boolean;
};

function redirectToLogin() {
  if (typeof window !== "undefined") {
    cancelTokenRefresh();
    window.location.href = "/login";
  }
}

export const http = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const nextConfig = config as AuthRequestConfig;
  const accessToken = tokenStorage.getAccessToken();

  nextConfig.headers = nextConfig.headers ?? {};
  nextConfig.headers["X-Api-Key"] = getTenantApiKey();
  nextConfig.headers["X-Locale"] = getApiLocale();

  if (!nextConfig.skipAuth && accessToken) {
    nextConfig.headers.Authorization = `Bearer ${accessToken}`;
  }

  return nextConfig;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const response = error.response;
    const originalConfig = error.config as AuthRequestConfig | undefined;

    if (!response || !originalConfig) {
      return Promise.reject(error);
    }

    // Only handle 401 errors
    if (response.status !== 401) {
      return Promise.reject(error);
    }

    // Don't retry if already retried or auth is skipped
    if (originalConfig._retry || originalConfig.skipAuth) {
      return Promise.reject(error);
    }

    // If refresh endpoint itself fails, redirect to login
    if (originalConfig.url?.includes("/api/v1/admin/auth/refresh")) {
      tokenStorage.clear();
      redirectToLogin();
      return Promise.reject(error);
    }

    // Mark as retrying to prevent infinite loops
    originalConfig._retry = true;

    try {
      // Use the queue-based refresh (handles concurrent requests)
      const newToken = await refreshToken();

      originalConfig.headers = originalConfig.headers ?? {};
      originalConfig.headers.Authorization = `Bearer ${newToken}`;
      return http(originalConfig);
    } catch (refreshError) {
      tokenStorage.clear();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);
