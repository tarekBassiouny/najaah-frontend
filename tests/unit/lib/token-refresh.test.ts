import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  refreshToken,
  scheduleTokenRefresh,
  cancelTokenRefresh,
  getTokenInfo,
} from "@/lib/token-refresh";
import { http } from "@/lib/http";
import { tokenStorage } from "@/lib/token-storage";

vi.mock("@/lib/http", () => ({
  http: {
    post: vi.fn(),
  },
}));

vi.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    getAccessToken: vi.fn(() => null),
    setTokens: vi.fn(),
  },
}));

const mockedHttp = http as unknown as {
  post: ReturnType<typeof vi.fn>;
};

const mockedTokenStorage = tokenStorage as unknown as {
  getAccessToken: ReturnType<typeof vi.fn>;
  setTokens: ReturnType<typeof vi.fn>;
};

/**
 * Create a mock JWT token with a specific expiry time
 */
function createMockJwt(expiresInSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "1",
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    }),
  );
  const signature = btoa("mock-signature");
  return `${header}.${payload}.${signature}`;
}

/**
 * Create an expired mock JWT token
 */
function createExpiredJwt(): string {
  return createMockJwt(-60); // Expired 60 seconds ago
}

/**
 * Create a JWT that will expire soon (within refresh buffer)
 */
function createSoonToExpireJwt(): string {
  return createMockJwt(60); // Expires in 60 seconds (within 2 min buffer)
}

/**
 * Create a JWT with plenty of time remaining
 */
function createValidJwt(): string {
  return createMockJwt(30 * 60); // Expires in 30 minutes
}

describe("token-refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Cancel any pending refresh timers between tests
    cancelTokenRefresh();
  });

  afterEach(() => {
    cancelTokenRefresh();
  });

  describe("refreshToken", () => {
    it("calls refresh endpoint and stores new token", async () => {
      // Don't schedule next refresh to avoid recursive calls
      mockedTokenStorage.getAccessToken.mockReturnValue(null);
      mockedHttp.post.mockResolvedValueOnce({
        data: { token: "new-access-token" },
      });

      const result = await refreshToken();

      expect(mockedHttp.post).toHaveBeenCalledWith(
        "/api/v1/admin/auth/refresh",
      );
      expect(mockedTokenStorage.setTokens).toHaveBeenCalledWith({
        accessToken: "new-access-token",
      });
      expect(result).toBe("new-access-token");
    });

    it("throws error when refresh response is invalid", async () => {
      mockedHttp.post.mockResolvedValueOnce({
        data: {},
      });

      await expect(refreshToken()).rejects.toThrow("Invalid refresh response");
    });

    it("throws error when refresh request fails", async () => {
      mockedHttp.post.mockRejectedValueOnce(new Error("Network error"));

      await expect(refreshToken()).rejects.toThrow("Network error");
    });

    it("queues concurrent refresh requests (only one HTTP call)", async () => {
      mockedTokenStorage.getAccessToken.mockReturnValue(null);

      let resolveRefresh: (_value: { data: { token: string } }) => void;
      const refreshPromise = new Promise<{ data: { token: string } }>(
        (resolve) => {
          resolveRefresh = resolve;
        },
      );
      mockedHttp.post.mockReturnValueOnce(refreshPromise);

      // Start two concurrent refresh calls
      const promise1 = refreshToken();
      const promise2 = refreshToken();

      // Resolve the underlying request
      resolveRefresh!({ data: { token: "queued-token" } });

      // Both promises should resolve with the same token
      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe("queued-token");
      expect(result2).toBe("queued-token");

      // HTTP should only be called once (key queue behavior)
      expect(mockedHttp.post).toHaveBeenCalledTimes(1);
    });

    it("allows new refresh after previous completes", async () => {
      mockedTokenStorage.getAccessToken.mockReturnValue(null);
      mockedHttp.post
        .mockResolvedValueOnce({ data: { token: "first-token" } })
        .mockResolvedValueOnce({ data: { token: "second-token" } });

      // First refresh
      const result1 = await refreshToken();
      expect(result1).toBe("first-token");

      // Second refresh (should create new request since first completed)
      const result2 = await refreshToken();
      expect(result2).toBe("second-token");

      expect(mockedHttp.post).toHaveBeenCalledTimes(2);
    });

    it("resets state after refresh failure allowing retry", async () => {
      mockedTokenStorage.getAccessToken.mockReturnValue(null);
      mockedHttp.post
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce({ data: { token: "recovery-token" } });

      // First refresh fails
      await expect(refreshToken()).rejects.toThrow("First failure");

      // Second refresh should work (state was reset after failure)
      const result = await refreshToken();
      expect(result).toBe("recovery-token");
      expect(mockedHttp.post).toHaveBeenCalledTimes(2);
    });
  });

  describe("scheduleTokenRefresh", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("does nothing when no token exists", () => {
      mockedTokenStorage.getAccessToken.mockReturnValue(null);

      scheduleTokenRefresh();

      // Fast-forward time - nothing should happen
      vi.advanceTimersByTime(10 * 60 * 1000);
      expect(mockedHttp.post).not.toHaveBeenCalled();
    });

    it("does nothing for invalid token format", () => {
      mockedTokenStorage.getAccessToken.mockReturnValue("invalid-token");

      scheduleTokenRefresh();

      vi.advanceTimersByTime(10 * 60 * 1000);
      expect(mockedHttp.post).not.toHaveBeenCalled();
    });

    it("calls refreshToken for expired token", () => {
      vi.useRealTimers(); // Use real timers for this test

      mockedTokenStorage.getAccessToken.mockReturnValue(createExpiredJwt());
      mockedHttp.post.mockResolvedValueOnce({
        data: { token: "new-token" },
      });

      scheduleTokenRefresh();

      // The function calls refreshToken() immediately for expired tokens
      // which is an async operation that calls http.post
      expect(mockedHttp.post).toHaveBeenCalledWith(
        "/api/v1/admin/auth/refresh",
      );
    });

    it("calls refreshToken when within buffer window", () => {
      vi.useRealTimers();

      mockedTokenStorage.getAccessToken.mockReturnValue(createSoonToExpireJwt());
      mockedHttp.post.mockResolvedValueOnce({
        data: { token: "new-token" },
      });

      scheduleTokenRefresh();

      // Should trigger refresh immediately since within 2 min buffer
      expect(mockedHttp.post).toHaveBeenCalled();
    });

    it("schedules timer for valid token with time remaining", () => {
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");
      mockedTokenStorage.getAccessToken.mockReturnValue(createValidJwt());

      scheduleTokenRefresh();

      // Should not refresh immediately
      expect(mockedHttp.post).not.toHaveBeenCalled();

      // Should have scheduled a timer
      expect(setTimeoutSpy).toHaveBeenCalled();

      // Timer should be scheduled for roughly 28 minutes (30 min - 2 min buffer)
      const timerDelay = setTimeoutSpy.mock.calls[0][1] as number;
      expect(timerDelay).toBeGreaterThan(27 * 60 * 1000); // > 27 min
      expect(timerDelay).toBeLessThanOrEqual(28 * 60 * 1000); // <= 28 min

      setTimeoutSpy.mockRestore();
    });

    it("clears previous timer when rescheduled", () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      mockedTokenStorage.getAccessToken.mockReturnValue(createValidJwt());

      // Schedule first
      scheduleTokenRefresh();

      // Schedule again - should clear previous
      scheduleTokenRefresh();

      // clearTimeout should have been called (for the first timer)
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });
  });

  describe("cancelTokenRefresh", () => {
    it("cancels scheduled refresh timer", () => {
      vi.useFakeTimers();
      mockedTokenStorage.getAccessToken.mockReturnValue(createValidJwt());

      scheduleTokenRefresh();
      cancelTokenRefresh();

      // Fast forward past when refresh would have happened
      vi.advanceTimersByTime(30 * 60 * 1000);

      expect(mockedHttp.post).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("is safe to call when no timer exists", () => {
      expect(() => cancelTokenRefresh()).not.toThrow();
    });

    it("is safe to call multiple times", () => {
      mockedTokenStorage.getAccessToken.mockReturnValue(createValidJwt());

      scheduleTokenRefresh();
      cancelTokenRefresh();
      cancelTokenRefresh();
      cancelTokenRefresh();

      expect(() => cancelTokenRefresh()).not.toThrow();
    });
  });

  describe("getTokenInfo", () => {
    it("returns hasToken: false when no token", () => {
      mockedTokenStorage.getAccessToken.mockReturnValue(null);

      const info = getTokenInfo();

      expect(info).toEqual({
        hasToken: false,
        expiresAt: null,
        expiresIn: null,
        isExpired: true,
      });
    });

    it("returns correct info for valid token", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      // Token expires in 30 minutes
      const expirySeconds = Math.floor(now / 1000) + 30 * 60;
      const header = btoa(JSON.stringify({ alg: "HS256" }));
      const payload = btoa(JSON.stringify({ exp: expirySeconds }));
      const token = `${header}.${payload}.signature`;

      mockedTokenStorage.getAccessToken.mockReturnValue(token);

      const info = getTokenInfo();

      expect(info.hasToken).toBe(true);
      expect(info.isExpired).toBe(false);
      expect(info.expiresAt).toBeInstanceOf(Date);
      expect(info.expiresIn).toBeGreaterThan(0);
      expect(info.expiresIn).toBeLessThanOrEqual(30 * 60 * 1000);

      vi.useRealTimers();
    });

    it("returns isExpired: true for expired token", () => {
      mockedTokenStorage.getAccessToken.mockReturnValue(createExpiredJwt());

      const info = getTokenInfo();

      expect(info.hasToken).toBe(true);
      expect(info.isExpired).toBe(true);
      expect(info.expiresIn).toBe(0);
    });

    it("handles token without expiry claim", () => {
      const header = btoa(JSON.stringify({ alg: "HS256" }));
      const payload = btoa(JSON.stringify({ sub: "1" })); // No exp claim
      const token = `${header}.${payload}.signature`;

      mockedTokenStorage.getAccessToken.mockReturnValue(token);

      const info = getTokenInfo();

      expect(info).toEqual({
        hasToken: true,
        expiresAt: null,
        expiresIn: null,
        isExpired: false,
      });
    });

    it("handles malformed token gracefully", () => {
      mockedTokenStorage.getAccessToken.mockReturnValue("not-a-jwt");

      const info = getTokenInfo();

      expect(info).toEqual({
        hasToken: true,
        expiresAt: null,
        expiresIn: null,
        isExpired: false,
      });
    });

    it("handles token with invalid base64 payload", () => {
      mockedTokenStorage.getAccessToken.mockReturnValue("a.!!!invalid.c");

      const info = getTokenInfo();

      expect(info).toEqual({
        hasToken: true,
        expiresAt: null,
        expiresIn: null,
        isExpired: false,
      });
    });
  });

  describe("JWT decoding edge cases", () => {
    it("handles URL-safe base64 encoding", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const expirySeconds = Math.floor(now / 1000) + 60 * 60;
      const header = btoa(JSON.stringify({ alg: "HS256" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const payload = btoa(JSON.stringify({ exp: expirySeconds }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const token = `${header}.${payload}.signature`;

      mockedTokenStorage.getAccessToken.mockReturnValue(token);

      const info = getTokenInfo();

      expect(info.hasToken).toBe(true);
      expect(info.expiresAt).toBeInstanceOf(Date);

      vi.useRealTimers();
    });
  });
});
