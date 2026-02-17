import type { AdminUser } from "@/types/auth";

type ScopeUser = Pick<
  AdminUser,
  "scope_type" | "scope_center_id" | "center_id" | "is_system_super_admin"
>;

function normalizeScopeType(value: unknown): string {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
}

function hasValue(value: unknown): boolean {
  if (value == null) return false;
  return String(value).trim().length > 0;
}

export function isSystemScopeUser(
  user: ScopeUser | null | undefined,
  fallbackIsSystemScope = false,
): boolean {
  if (!user) {
    return fallbackIsSystemScope;
  }

  if (user.is_system_super_admin === true) {
    return true;
  }

  const scopeType = normalizeScopeType(user.scope_type);

  if (scopeType.includes("system")) {
    return true;
  }

  if (scopeType.includes("center")) {
    return false;
  }

  if (hasValue(user.scope_center_id)) {
    return false;
  }

  if (hasValue(user.center_id)) {
    return false;
  }

  return true;
}
