import { portalTokenStorage } from "./portal-token-storage";
import { portalHttp } from "./portal-http";

type RefreshResponse = {
  success: boolean;
  token: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
};

const REFRESH_BUFFER_MS = 2 * 60 * 1000;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let visibilityListenerAttached = false;

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

function getTimeUntilRefresh(token: string): number | null {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return null;
  return expiryMs - Date.now() - REFRESH_BUFFER_MS;
}

async function doRefresh(): Promise<string> {
  const refreshToken = portalTokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const role = portalTokenStorage.getActiveRole();
  const endpoint = `/api/v1/web/auth/${role}/refresh`;

  const response = await portalHttp.post<RefreshResponse>(endpoint, {
    refresh_token: refreshToken,
  });

  const accessToken = response.data?.token?.access_token;
  if (!accessToken) {
    throw new Error("Invalid refresh response");
  }

  portalTokenStorage.setTokens({
    accessToken,
    refreshToken: response.data.token.refresh_token || refreshToken,
  });

  return accessToken;
}

export async function portalRefreshToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefresh()
    .then((newToken) => {
      schedulePortalTokenRefresh();
      return newToken;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

export function schedulePortalTokenRefresh(): void {
  setupVisibilityListener();

  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const token = portalTokenStorage.getAccessToken();
  if (!token) return;

  const timeUntilRefresh = getTimeUntilRefresh(token);
  if (timeUntilRefresh === null) return;

  if (timeUntilRefresh <= 0) {
    portalRefreshToken().catch(() => {});
    return;
  }

  refreshTimer = setTimeout(() => {
    portalRefreshToken().catch(() => {});
  }, timeUntilRefresh);
}

export function cancelPortalTokenRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function checkAndRefreshIfNeeded(): void {
  const token = portalTokenStorage.getAccessToken();
  if (!token) return;

  const timeUntilRefresh = getTimeUntilRefresh(token);
  if (timeUntilRefresh === null) return;

  if (timeUntilRefresh <= 0) {
    portalRefreshToken().catch(() => {});
  } else {
    schedulePortalTokenRefresh();
  }
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "visible") {
    checkAndRefreshIfNeeded();
  }
}

function setupVisibilityListener(): void {
  if (visibilityListenerAttached || typeof document === "undefined") return;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  visibilityListenerAttached = true;
}
