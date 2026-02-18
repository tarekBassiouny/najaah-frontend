import { describe, expect, it } from "vitest";
import {
  getAdminScope,
  isSystemOnlyRoute,
  isCenterScopedRoute,
  extractCenterIdFromPath,
  getCenterAdminHomeUrl,
  SYSTEM_ONLY_ROUTES,
  SYSTEM_ONLY_PREFIXES,
} from "@/lib/user-scope";
import { type AdminUser } from "@/types/auth";

describe("getAdminScope", () => {
  it("returns system admin for user with null center_id", () => {
    const user: AdminUser = {
      id: 1,
      name: "System Admin",
      email: "admin@example.com",
      center_id: null,
    };

    const scope = getAdminScope(user);

    expect(scope.isSystemAdmin).toBe(true);
    expect(scope.isCenterAdmin).toBe(false);
    expect(scope.centerId).toBeNull();
  });

  it("returns system admin for user with undefined center_id", () => {
    const user: AdminUser = {
      id: 1,
      name: "System Admin",
      email: "admin@example.com",
    };

    const scope = getAdminScope(user);

    expect(scope.isSystemAdmin).toBe(true);
    expect(scope.isCenterAdmin).toBe(false);
    expect(scope.centerId).toBeNull();
  });

  it("returns center admin for user with numeric center_id", () => {
    const user: AdminUser = {
      id: 2,
      name: "Center Admin",
      email: "center@example.com",
      center_id: 123,
    };

    const scope = getAdminScope(user);

    expect(scope.isSystemAdmin).toBe(false);
    expect(scope.isCenterAdmin).toBe(true);
    expect(scope.centerId).toBe("123");
  });

  it("returns center admin for user with string center_id", () => {
    const user: AdminUser = {
      id: 2,
      name: "Center Admin",
      email: "center@example.com",
      center_id: "456",
    };

    const scope = getAdminScope(user);

    expect(scope.isSystemAdmin).toBe(false);
    expect(scope.isCenterAdmin).toBe(true);
    expect(scope.centerId).toBe("456");
  });

  it("returns neither admin type for null user", () => {
    const scope = getAdminScope(null);

    expect(scope.isSystemAdmin).toBe(false);
    expect(scope.isCenterAdmin).toBe(false);
    expect(scope.centerId).toBeNull();
  });

  it("returns neither admin type for undefined user", () => {
    const scope = getAdminScope(undefined);

    expect(scope.isSystemAdmin).toBe(false);
    expect(scope.isCenterAdmin).toBe(false);
    expect(scope.centerId).toBeNull();
  });
});

describe("isSystemOnlyRoute", () => {
  it("returns true for /dashboard", () => {
    expect(isSystemOnlyRoute("/dashboard")).toBe(true);
  });

  it("returns true for /centers (list)", () => {
    expect(isSystemOnlyRoute("/centers")).toBe(true);
  });

  it("returns true for /centers/create", () => {
    expect(isSystemOnlyRoute("/centers/create")).toBe(true);
  });

  it("returns true for /roles", () => {
    expect(isSystemOnlyRoute("/roles")).toBe(true);
  });

  it("returns true for /audit-logs", () => {
    expect(isSystemOnlyRoute("/audit-logs")).toBe(true);
  });

  it("returns true for /agents", () => {
    expect(isSystemOnlyRoute("/agents")).toBe(true);
  });

  it("returns true for routes with system-only prefixes", () => {
    expect(isSystemOnlyRoute("/agents/123")).toBe(true);
    expect(isSystemOnlyRoute("/agents/execute")).toBe(true);
    expect(isSystemOnlyRoute("/roles/1/edit")).toBe(true);
    expect(isSystemOnlyRoute("/audit-logs/details")).toBe(true);
  });

  it("returns false for center-scoped routes", () => {
    expect(isSystemOnlyRoute("/centers/123")).toBe(false);
    expect(isSystemOnlyRoute("/centers/123/courses")).toBe(false);
    expect(isSystemOnlyRoute("/centers/123/students")).toBe(false);
  });

  it("returns false for profile route", () => {
    expect(isSystemOnlyRoute("/profile")).toBe(false);
  });

  it("handles trailing slashes", () => {
    expect(isSystemOnlyRoute("/dashboard/")).toBe(true);
    expect(isSystemOnlyRoute("/centers/")).toBe(true);
  });
});

describe("isCenterScopedRoute", () => {
  it("returns true for /centers/:centerId", () => {
    expect(isCenterScopedRoute("/centers/123")).toBe(true);
    expect(isCenterScopedRoute("/centers/456")).toBe(true);
  });

  it("returns true for /centers/:centerId/* nested routes", () => {
    expect(isCenterScopedRoute("/centers/123/courses")).toBe(true);
    expect(isCenterScopedRoute("/centers/123/students")).toBe(true);
    expect(isCenterScopedRoute("/centers/123/videos/456")).toBe(true);
    expect(isCenterScopedRoute("/centers/123/settings")).toBe(true);
  });

  it("returns false for /centers (list)", () => {
    expect(isCenterScopedRoute("/centers")).toBe(false);
  });

  it("returns false for /centers/create", () => {
    expect(isCenterScopedRoute("/centers/create")).toBe(false);
  });

  it("returns false for /centers/list", () => {
    expect(isCenterScopedRoute("/centers/list")).toBe(false);
  });

  it("returns false for non-center routes", () => {
    expect(isCenterScopedRoute("/dashboard")).toBe(false);
    expect(isCenterScopedRoute("/profile")).toBe(false);
    expect(isCenterScopedRoute("/roles")).toBe(false);
  });

  it("handles trailing slashes", () => {
    expect(isCenterScopedRoute("/centers/123/")).toBe(true);
  });
});

describe("extractCenterIdFromPath", () => {
  it("extracts center ID from /centers/:centerId", () => {
    expect(extractCenterIdFromPath("/centers/123")).toBe("123");
    expect(extractCenterIdFromPath("/centers/456")).toBe("456");
  });

  it("extracts center ID from nested center routes", () => {
    expect(extractCenterIdFromPath("/centers/123/courses")).toBe("123");
    expect(extractCenterIdFromPath("/centers/789/students/list")).toBe("789");
  });

  it("returns null for /centers (list)", () => {
    expect(extractCenterIdFromPath("/centers")).toBeNull();
  });

  it("returns null for /centers/create", () => {
    expect(extractCenterIdFromPath("/centers/create")).toBeNull();
  });

  it("returns null for /centers/list", () => {
    expect(extractCenterIdFromPath("/centers/list")).toBeNull();
  });

  it("returns null for non-center routes", () => {
    expect(extractCenterIdFromPath("/dashboard")).toBeNull();
    expect(extractCenterIdFromPath("/profile")).toBeNull();
    expect(extractCenterIdFromPath("/roles/123")).toBeNull();
  });

  it("handles trailing slashes", () => {
    expect(extractCenterIdFromPath("/centers/123/")).toBe("123");
  });
});

describe("getCenterAdminHomeUrl", () => {
  it("returns correct URL for numeric center ID", () => {
    expect(getCenterAdminHomeUrl(123)).toBe("/centers/123");
  });

  it("returns correct URL for string center ID", () => {
    expect(getCenterAdminHomeUrl("456")).toBe("/centers/456");
  });
});

describe("exported constants", () => {
  it("exports SYSTEM_ONLY_ROUTES as a Set", () => {
    expect(SYSTEM_ONLY_ROUTES).toBeInstanceOf(Set);
    expect(SYSTEM_ONLY_ROUTES.has("/dashboard")).toBe(true);
    expect(SYSTEM_ONLY_ROUTES.has("/centers")).toBe(true);
    expect(SYSTEM_ONLY_ROUTES.has("/roles")).toBe(true);
  });

  it("exports SYSTEM_ONLY_PREFIXES as an array", () => {
    expect(Array.isArray(SYSTEM_ONLY_PREFIXES)).toBe(true);
    expect(SYSTEM_ONLY_PREFIXES).toContain("/agents/");
    expect(SYSTEM_ONLY_PREFIXES).toContain("/roles/");
  });
});
