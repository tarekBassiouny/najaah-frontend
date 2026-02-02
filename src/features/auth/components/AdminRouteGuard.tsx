"use client";

import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { tokenStorage } from "@/lib/token-storage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoading } from "@/components/ui/page-loading";
import { useTenant } from "@/app/tenant-provider";
import { can } from "@/lib/capabilities";
import { getRouteCapabilities } from "@/components/Layouts/sidebar/data";
import { usePathname } from "next/navigation";

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

  useEffect(() => {
    if (!isResolved) {
      return;
    }

    if (!hasToken) {
      router.replace("/login");
    }
  }, [hasToken, isResolved, router]);

  useEffect(() => {
    if (!isResolved) {
      return;
    }

    if (hasToken && (isError || data === null)) {
      tokenStorage.clear();
      router.replace("/login");
    }
  }, [data, hasToken, isError, isResolved, router]);

  useEffect(() => {
    if (!isResolved || isLoading || requiredCapabilities === undefined) {
      return;
    }

    if (requiredCapabilities === null) {
      router.replace("/dashboard");
      return;
    }

    const hasAccess =
      requiredCapabilities.length === 0 ||
      requiredCapabilities.every((capability) => can(capability));

    if (!hasAccess) {
      router.replace("/dashboard");
    }
  }, [isLoading, isResolved, requiredCapabilities, router]);

  if (!isResolved || !hasToken || isLoading) {
    return <>{fallback ?? <PageLoading />}</>;
  }

  return <>{children}</>;
}
