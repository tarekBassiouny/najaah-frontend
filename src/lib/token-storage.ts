const ACCESS_TOKEN_KEY = "access_token";

type Tokens = {
  accessToken: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setTokens(tokens: Tokens) {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  },

  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
