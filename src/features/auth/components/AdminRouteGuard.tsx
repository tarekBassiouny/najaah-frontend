"use client";

import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { tokenStorage } from "@/lib/token-storage";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoading } from "@/components/ui/page-loading";
import { useTenant } from "@/app/tenant-provider";
import { can, type Capability } from "@/lib/capabilities";
import { usePathname } from "next/navigation";

type AdminRouteGuardProps = {
  children: React.ReactNode;
};

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = Boolean(tokenStorage.getAccessToken());
  const { isResolved } = useTenant();
  const { data, isLoading, isError } = useAdminMe();

  const requiredCapabilities = getRequiredCapabilities(pathname);

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
    if (!isResolved || isLoading) {
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
    return <PageLoading />;
  }

  return <>{children}</>;
}

const ROUTE_CAPABILITIES: Record<string, Capability[]> = {
  "/dashboard": [],
  "/centers": ["manage_centers"],
  "/centers/*": ["manage_centers"],
  "/courses": ["manage_courses"],
  "/courses/*": ["manage_courses"],
  "/videos": ["manage_videos"],
  "/videos/*": ["manage_videos"],
  "/pdfs": ["manage_pdfs"],
  "/pdfs/*": ["manage_pdfs"],
  "/students": ["manage_students"],
  "/students/*": ["manage_students"],
  "/instructors": ["manage_instructors"],
  "/admin-users": ["manage_admin_users"],
  "/roles": ["manage_roles"],
  "/roles/*/permissions": ["assign_role_permissions"],
  "/permissions": ["view_permissions"],
  "/device-change-requests": ["manage_device_change_requests"],
  "/extra-view-requests": ["manage_extra_view_requests"],
  "/audit-logs": ["view_audit_logs"],
  "/settings": ["view_dashboard"],
  "/settings/*": ["view_dashboard"],
  "/playback": ["view_dashboard"],
  "/playback/*": ["view_dashboard"],
};

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function matchRoute(
  pathname: string,
  pattern: string,
): Capability[] | null {
  if (!pattern.includes("*")) {
    return pathname === pattern ? ROUTE_CAPABILITIES[pattern] : null;
  }

  const [prefix, suffix] = pattern.split("*");
  if (!pathname.startsWith(prefix)) return null;
  if (suffix && !pathname.endsWith(suffix)) return null;
  if (pathname.length < prefix.length + suffix.length) return null;
  return ROUTE_CAPABILITIES[pattern];
}

function getRequiredCapabilities(pathname: string): Capability[] | null {
  const normalized = normalizePath(pathname);

  const entries = Object.keys(ROUTE_CAPABILITIES).sort(
    (a, b) => b.length - a.length,
  );

  for (const pattern of entries) {
    const match = matchRoute(normalized, pattern);
    if (match) {
      return match;
    }
  }

  return null;
}
