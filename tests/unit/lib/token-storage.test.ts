import { describe, expect, it, beforeEach } from "vitest";
import { tokenStorage } from "@/lib/token-storage";

describe("tokenStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("stores token in localStorage when remember me is enabled", () => {
    tokenStorage.setRememberMe(true);
    tokenStorage.setTokens({ accessToken: "local-token" });

    expect(window.localStorage.getItem("access_token")).toBe("local-token");
    expect(window.sessionStorage.getItem("access_token")).toBeNull();
    expect(tokenStorage.getAccessToken()).toBe("local-token");
  });

  it("stores token in sessionStorage when remember me is disabled", () => {
    tokenStorage.setRememberMe(false);
    tokenStorage.setTokens({ accessToken: "session-token" });

    expect(window.sessionStorage.getItem("access_token")).toBe("session-token");
    expect(window.localStorage.getItem("access_token")).toBeNull();
    expect(tokenStorage.getAccessToken()).toBe("session-token");
  });

  it("falls back to token from the other storage for migration scenarios", () => {
    window.sessionStorage.setItem("access_token", "legacy-token");

    expect(tokenStorage.getAccessToken()).toBe("legacy-token");
  });

  it("clears token from both storages and remember flag", () => {
    window.localStorage.setItem("access_token", "a");
    window.sessionStorage.setItem("access_token", "b");
    window.localStorage.setItem("remember_me", "true");

    tokenStorage.clear();

    expect(window.localStorage.getItem("access_token")).toBeNull();
    expect(window.sessionStorage.getItem("access_token")).toBeNull();
    expect(window.localStorage.getItem("remember_me")).toBeNull();
  });

  it("reads remember me preference correctly", () => {
    tokenStorage.setRememberMe(true);
    expect(tokenStorage.getRememberMe()).toBe(true);

    tokenStorage.setRememberMe(false);
    expect(tokenStorage.getRememberMe()).toBe(false);
  });
});
