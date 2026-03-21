import { isSystemScopeUser } from "@/lib/admin-scope";
import { type AdminUser } from "@/types/auth";

export type AdminScope = {
  isSystemAdmin: boolean;
  isCenterAdmin: boolean;
  centerId: string | null;
};

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  return String(value).trim().length > 0;
}

function resolveCenterScopeId(
  user: AdminUser | null | undefined,
): string | null {
  if (!user) {
    return null;
  }

  const candidate =
    user.scope_center_id ?? user.center_id ?? user.center?.id ?? null;

  return hasValue(candidate) ? String(candidate) : null;
}

export function getAdminScope(user: AdminUser | null | undefined): AdminScope {
  if (!user) {
    return { isSystemAdmin: false, isCenterAdmin: false, centerId: null };
  }

  const centerId = resolveCenterScopeId(user);
  const isSystemAdmin = isSystemScopeUser(user, false);

  if (isSystemAdmin) {
    return { isSystemAdmin: true, isCenterAdmin: false, centerId: null };
  }

  return {
    isSystemAdmin: false,
    isCenterAdmin: centerId !== null,
    centerId,
  };
}

/**
 * Routes that only system admins can access.
 * Center admins should be redirected to their center's dashboard.
 */
export const SYSTEM_ONLY_ROUTES: ReadonlySet<string> = new Set([
  "/dashboard",
  "/centers",
  "/centers/list",
  "/centers/create",
  "/roles",
  "/audit-logs",
  "/audit",
  "/analytics",
  "/agents",
  "/surveys",
  "/students",
  "/settings",
  "/admin-users",
]);

/**
 * Prefixes that indicate system-only routes.
 */
export const SYSTEM_ONLY_PREFIXES: readonly string[] = [
  "/agents/",
  "/manage/",
  "/roles/",
  "/audit-logs/",
  "/audit/",
  "/settings/",
];

const NON_CENTER_ROUTE_SEGMENTS = new Set(["create", "list", "settings"]);

/**
 * Checks if a route is only accessible by system admins.
 */
export function isSystemOnlyRoute(pathname: string): boolean {
  const normalized = normalizePath(pathname);

  // Check exact matches
  if (SYSTEM_ONLY_ROUTES.has(normalized)) {
    return true;
  }

  // Check prefixes
  for (const prefix of SYSTEM_ONLY_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a route is scoped to a specific center (e.g., /centers/123/...).
 */
export function isCenterScopedRoute(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  const segments = normalized.split("/").filter(Boolean);

  // Pattern: /centers/:centerId or /centers/:centerId/*
  if (segments.length >= 2 && segments[0] === "centers") {
    const candidate = segments[1];
    if (candidate && !NON_CENTER_ROUTE_SEGMENTS.has(candidate)) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts the center ID from a center-scoped route.
 */
export function extractCenterIdFromPath(pathname: string): string | null {
  const normalized = normalizePath(pathname);
  const segments = normalized.split("/").filter(Boolean);

  if (segments.length >= 2 && segments[0] === "centers") {
    const candidate = segments[1];
    if (candidate && !NON_CENTER_ROUTE_SEGMENTS.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Gets the home URL for a center admin.
 */
export function getCenterAdminHomeUrl(centerId: string | number): string {
  return `/centers/${centerId}`;
}

/**
 * Normalizes a pathname by removing trailing slashes.
 */
function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}
