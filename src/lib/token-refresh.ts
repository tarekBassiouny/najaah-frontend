import { tokenStorage } from "./token-storage";
import { http } from "./http";

type RefreshResponse = {
  token: string;
};

// Refresh 2 minutes before expiry
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Decode JWT payload without verification (client-side only)
 */
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

/**
 * Get token expiry time in milliseconds
 */
function getTokenExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000; // Convert to milliseconds
}

/**
 * Calculate time until token should be refreshed
 */
function getTimeUntilRefresh(token: string): number | null {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return null;

  const now = Date.now();
  const timeUntilExpiry = expiryMs - now;
  const timeUntilRefresh = timeUntilExpiry - REFRESH_BUFFER_MS;

  return timeUntilRefresh;
}

/**
 * Perform token refresh
 */
async function doRefresh(): Promise<string> {
  const response = await http.post<RefreshResponse>("/api/v1/admin/auth/refresh");

  if (!response.data?.token) {
    throw new Error("Invalid refresh response");
  }

  return response.data.token;
}

/**
 * Queue-based refresh to handle concurrent requests
 */
export async function refreshToken(): Promise<string> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefresh()
    .then((newToken) => {
      tokenStorage.setTokens({ accessToken: newToken });
      scheduleTokenRefresh(); // Schedule next refresh
      return newToken;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

/**
 * Schedule proactive token refresh
 */
export function scheduleTokenRefresh(): void {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const token = tokenStorage.getAccessToken();
  if (!token) return;

  const timeUntilRefresh = getTimeUntilRefresh(token);
  if (timeUntilRefresh === null) return;

  // If token should already be refreshed, do it now
  if (timeUntilRefresh <= 0) {
    refreshToken().catch(() => {
      // Refresh failed, will be handled by 401 interceptor
    });
    return;
  }

  // Schedule refresh
  refreshTimer = setTimeout(() => {
    refreshToken().catch(() => {
      // Refresh failed, will be handled by 401 interceptor
    });
  }, timeUntilRefresh);
}

/**
 * Cancel scheduled token refresh
 */
export function cancelTokenRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Get token info for debugging
 */
export function getTokenInfo(): {
  hasToken: boolean;
  expiresAt: Date | null;
  expiresIn: number | null;
  isExpired: boolean;
} {
  const token = tokenStorage.getAccessToken();
  if (!token) {
    return { hasToken: false, expiresAt: null, expiresIn: null, isExpired: true };
  }

  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) {
    return { hasToken: true, expiresAt: null, expiresIn: null, isExpired: false };
  }

  const now = Date.now();
  const expiresIn = Math.max(0, expiryMs - now);

  return {
    hasToken: true,
    expiresAt: new Date(expiryMs),
    expiresIn,
    isExpired: expiresIn <= 0,
  };
}
