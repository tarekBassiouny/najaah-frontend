"use client";

import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { tokenStorage } from "@/lib/token-storage";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { PageLoading } from "@/components/ui/page-loading";
import { useTenant } from "@/app/tenant-provider";
import { can } from "@/lib/capabilities";
import { getRouteCapabilities } from "@/components/Layouts/sidebar/data";
import { usePathname } from "next/navigation";
import {
  getAdminScope,
  isSystemOnlyRoute,
  isCenterScopedRoute,
  extractCenterIdFromPath,
  getCenterAdminHomeUrl,
} from "@/lib/user-scope";

type AdminRouteGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AdminRouteGuard({ children, fallback }: AdminRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = Boolean(tokenStorage.getAccessToken());
  const { isResolved, centerSlug } = useTenant();
  const { data, isLoading, isError } = useAdminMe();

  const isPlatformAdmin = isResolved && !centerSlug;
  const requiredCapabilities = isResolved
    ? getRouteCapabilities(pathname, isPlatformAdmin)
    : undefined;
  const isAuthRejected =
    isResolved && hasToken && !isLoading && (isError || data === null);

  useEffect(() => {
    if (!isResolved) {
      return;
    }

    if (!hasToken) {
      router.replace("/login");
      // Fallback for cases where Next.js router doesn't trigger navigation
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.replace("/login");
      }
    }
  }, [hasToken, isResolved, router]);

  useEffect(() => {
    if (!isResolved) {
      return;
    }

    if (hasToken && (isError || data === null)) {
      tokenStorage.clear();
      router.replace("/login");
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.replace("/login");
      }
    }
  }, [data, hasToken, isError, isResolved, router]);

  const userScope = useMemo(() => getAdminScope(data), [data]);

  // Enforce center admin scope restrictions
  useEffect(() => {
    if (!isResolved || isLoading || isAuthRejected || !data) {
      return;
    }

    // Only apply restrictions to center admins
    if (!userScope.isCenterAdmin || !userScope.centerId) {
      return;
    }

    const centerHomeUrl = getCenterAdminHomeUrl(userScope.centerId);

    // Block center admin from system-only routes
    if (isSystemOnlyRoute(pathname)) {
      router.replace(centerHomeUrl);
      return;
    }

    // Block center admin from accessing other center's pages
    if (isCenterScopedRoute(pathname)) {
      const pathCenterId = extractCenterIdFromPath(pathname);
      if (pathCenterId && pathCenterId !== userScope.centerId) {
        router.replace(centerHomeUrl);
        return;
      }
    }
  }, [
    data,
    isAuthRejected,
    isLoading,
    isResolved,
    pathname,
    router,
    userScope.centerId,
    userScope.isCenterAdmin,
  ]);

  useEffect(() => {
    if (
      !isResolved ||
      isLoading ||
      isAuthRejected ||
      requiredCapabilities === undefined
    ) {
      return;
    }

    // Determine the fallback route based on user scope
    const fallbackRoute =
      userScope.isCenterAdmin && userScope.centerId
        ? getCenterAdminHomeUrl(userScope.centerId)
        : "/dashboard";

    if (requiredCapabilities === null) {
      router.replace(fallbackRoute);
      return;
    }

    const hasAccess =
      requiredCapabilities.length === 0 ||
      requiredCapabilities.every((capability) => can(capability));

    if (!hasAccess) {
      router.replace(fallbackRoute);
    }
  }, [
    isAuthRejected,
    isLoading,
    isResolved,
    requiredCapabilities,
    router,
    userScope.centerId,
    userScope.isCenterAdmin,
  ]);

  if (!isResolved || !hasToken || isLoading || isAuthRejected) {
    return <>{fallback ?? <PageLoading />}</>;
  }

  return <>{children}</>;
}
