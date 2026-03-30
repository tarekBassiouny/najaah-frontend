"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { usePortalAuth } from "../context/portal-auth-context";

/** Routes accessible without authentication (guest browsing) */
const GUEST_ROUTE_PREFIXES = [
  "/portal/student/login",
  "/portal/parent/login",
  "/portal/parent/register",
  "/portal/student/search",
  "/portal/student/centers",
] as const;

function isGuestRoute(pathname: string): boolean {
  return GUEST_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getRequiredRole(pathname: string): "student" | "parent" | null {
  if (pathname.startsWith("/portal/parent")) return "parent";
  if (pathname.startsWith("/portal/student")) return "student";
  return null;
}

type PortalRouteGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function PortalRouteGuard({
  children,
  fallback,
}: PortalRouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = usePortalAuth();

  const isGuest = isGuestRoute(pathname);
  const requiredRole = getRequiredRole(pathname);

  useEffect(() => {
    if (isLoading || isGuest) return;

    // Not authenticated — redirect to appropriate login
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      if (requiredRole === "parent") {
        router.replace(`/portal/parent/login?returnUrl=${returnUrl}`);
      } else {
        router.replace(`/portal/student/login?returnUrl=${returnUrl}`);
      }
      return;
    }

    // Authenticated but wrong role — redirect to correct login
    if (requiredRole === "parent" && !user?.is_parent) {
      router.replace("/portal/parent/login");
      return;
    }

    if (requiredRole === "student" && !user?.is_student) {
      router.replace("/portal/student/login");
    }
  }, [
    isAuthenticated,
    isLoading,
    isGuest,
    pathname,
    router,
    requiredRole,
    user,
  ]);

  // Guest routes always render
  if (isGuest) return <>{children}</>;

  // Protected routes: wait for auth check
  if (isLoading) return <>{fallback}</>;

  if (!isAuthenticated) return <>{fallback}</>;

  // Role mismatch — show fallback while redirecting
  if (requiredRole === "parent" && !user?.is_parent) return <>{fallback}</>;
  if (requiredRole === "student" && !user?.is_student) return <>{fallback}</>;

  return <>{children}</>;
}
