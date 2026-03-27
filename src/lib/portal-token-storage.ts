const PORTAL_ACCESS_TOKEN_KEY = "portal_access_token";
const PORTAL_REFRESH_TOKEN_KEY = "portal_refresh_token";
const PORTAL_REMEMBER_ME_KEY = "portal_remember_me";
const PORTAL_ACTIVE_ROLE_KEY = "portal_active_role";

type PortalRole = "student" | "parent";

type PortalTokens = {
  accessToken: string;
  refreshToken?: string;
};

type TokenBroadcastMessage =
  | { type: "portal_token"; token: string }
  | { type: "portal_logout" };

type TokenStorageOptions = {
  broadcast?: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function getStorage(): Storage | null {
  if (!isBrowser()) return null;
  const rememberMe =
    window.localStorage.getItem(PORTAL_REMEMBER_ME_KEY) === "true";
  return rememberMe ? window.localStorage : window.sessionStorage;
}

function broadcast(message: TokenBroadcastMessage) {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("portal_auth");
  channel.postMessage(message);
  channel.close();
}

export const portalTokenStorage = {
  setActiveRole(role: PortalRole) {
    if (!isBrowser()) return;
    window.localStorage.setItem(PORTAL_ACTIVE_ROLE_KEY, role);
  },

  getActiveRole(): PortalRole {
    if (!isBrowser()) return "student";
    const value = window.localStorage.getItem(PORTAL_ACTIVE_ROLE_KEY);
    return value === "parent" ? "parent" : "student";
  },

  setRememberMe(remember: boolean) {
    if (!isBrowser()) return;
    window.localStorage.setItem(PORTAL_REMEMBER_ME_KEY, String(remember));
  },

  getRememberMe(): boolean {
    if (!isBrowser()) return false;
    return window.localStorage.getItem(PORTAL_REMEMBER_ME_KEY) === "true";
  },

  getAccessToken(): string | null {
    if (!isBrowser()) return null;

    const storage = getStorage();
    if (storage) {
      const token = storage.getItem(PORTAL_ACCESS_TOKEN_KEY);
      if (token) return token;
    }

    // Fallback: check both storages
    return (
      window.localStorage.getItem(PORTAL_ACCESS_TOKEN_KEY) ||
      window.sessionStorage.getItem(PORTAL_ACCESS_TOKEN_KEY)
    );
  },

  getRefreshToken(): string | null {
    if (!isBrowser()) return null;

    const storage = getStorage();
    if (storage) {
      const token = storage.getItem(PORTAL_REFRESH_TOKEN_KEY);
      if (token) return token;
    }

    return (
      window.localStorage.getItem(PORTAL_REFRESH_TOKEN_KEY) ||
      window.sessionStorage.getItem(PORTAL_REFRESH_TOKEN_KEY)
    );
  },

  setTokens(tokens: PortalTokens, options?: TokenStorageOptions) {
    if (!isBrowser()) return;

    const storage = getStorage();
    if (storage) {
      storage.setItem(PORTAL_ACCESS_TOKEN_KEY, tokens.accessToken);
      if (tokens.refreshToken) {
        storage.setItem(PORTAL_REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    }

    if (options?.broadcast !== false) {
      broadcast({ type: "portal_token", token: tokens.accessToken });
    }
  },

  clear(options?: TokenStorageOptions) {
    if (!isBrowser()) return;

    // Clear from both storages
    window.localStorage.removeItem(PORTAL_ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(PORTAL_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(PORTAL_REFRESH_TOKEN_KEY);
    window.sessionStorage.removeItem(PORTAL_REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(PORTAL_REMEMBER_ME_KEY);
    window.localStorage.removeItem(PORTAL_ACTIVE_ROLE_KEY);

    if (options?.broadcast !== false) {
      broadcast({ type: "portal_logout" });
    }
  },
};
