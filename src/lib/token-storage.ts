const ACCESS_TOKEN_KEY = "access_token";
const REMEMBER_ME_KEY = "remember_me";

type Tokens = {
  accessToken: string;
};

type TokenBroadcastMessage =
  | { type: "token"; token: string }
  | { type: "logout" };

type TokenStorageOptions = {
  broadcast?: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * Get the storage type based on remember me preference
 * - localStorage: persists across browser sessions (remember me = true)
 * - sessionStorage: cleared when browser closes (remember me = false)
 */
function getStorage(): Storage | null {
  if (!isBrowser()) return null;

  // Check if remember me was set (stored in localStorage to persist the preference)
  const rememberMe = window.localStorage.getItem(REMEMBER_ME_KEY) === "true";
  return rememberMe ? window.localStorage : window.sessionStorage;
}

function broadcast(message: TokenBroadcastMessage) {
  if (!isBrowser() || typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("auth");
  channel.postMessage(message);
  channel.close();
}

export const tokenStorage = {
  /**
   * Set the remember me preference before storing tokens
   * Must be called before setTokens during login
   */
  setRememberMe(remember: boolean) {
    if (!isBrowser()) return;
    window.localStorage.setItem(REMEMBER_ME_KEY, String(remember));
  },

  /**
   * Get remember me preference
   */
  getRememberMe(): boolean {
    if (!isBrowser()) return false;
    return window.localStorage.getItem(REMEMBER_ME_KEY) === "true";
  },

  getAccessToken(): string | null {
    if (!isBrowser()) return null;

    // Check the appropriate storage based on remember me preference
    const storage = getStorage();
    if (storage) {
      const token = storage.getItem(ACCESS_TOKEN_KEY);
      if (token) return token;
    }

    // Fallback: check both storages for migration scenarios
    return (
      window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
      window.sessionStorage.getItem(ACCESS_TOKEN_KEY)
    );
  },

  setTokens(tokens: Tokens, options?: TokenStorageOptions) {
    if (!isBrowser()) return;

    const storage = getStorage();
    if (storage) {
      storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    }

    if (options?.broadcast !== false) {
      broadcast({ type: "token", token: tokens.accessToken });
    }
  },

  clear(options?: TokenStorageOptions) {
    if (!isBrowser()) return;

    // Clear from both storages to ensure complete cleanup
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REMEMBER_ME_KEY);

    if (options?.broadcast !== false) {
      broadcast({ type: "logout" });
    }
  },
};
