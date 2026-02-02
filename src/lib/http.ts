import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { apiBaseUrl, getApiLocale } from "./runtime-config";
import { tokenStorage } from "./token-storage";
import { getTenantApiKey } from "./tenant-store";

type AuthRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuth?: boolean;
};

type RefreshResponse = {
  token: string;
};

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export const http = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
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

    if (
      response.status !== 401 ||
      originalConfig._retry ||
      originalConfig.skipAuth
    ) {
      return Promise.reject(error);
    }

    if (originalConfig.url?.includes("/api/v1/admin/auth/refresh")) {
      tokenStorage.clear();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    try {
      const res = await http.post<RefreshResponse>(
        "/api/v1/admin/auth/refresh",
      );

      const newToken = res.data.token;
      tokenStorage.setTokens({ accessToken: newToken });

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
