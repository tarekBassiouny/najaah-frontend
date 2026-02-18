"use client";

import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { AdminRouteGuard, AuthProvider } from "@/features/auth";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import {
  getSidebarSections,
  getCenterScopedSections,
} from "@/components/Layouts/sidebar/data";
import { useTenant } from "@/app/tenant-provider";
import { PageLoading } from "@/components/ui/page-loading";
import { setTenantState } from "@/lib/tenant-store";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { getAdminScope } from "@/lib/user-scope";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname();
  const { centerSlug } = useTenant();
  const { data: user } = useAdminMe();
  const userScope = getAdminScope(user);
  const previousPathRef = useRef(pathname);

  // Determine if user should see platform admin sidebar
  // System admins (center_id = null) see full platform sidebar
  // Center admins see center-scoped sidebar
  const isPlatformAdmin =
    userScope.isSystemAdmin || (!centerSlug && !userScope.isCenterAdmin);

  // Get sidebar configuration based on user scope
  const sidebarConfig = useMemo(() => {
    const sections = getSidebarSections(isPlatformAdmin);

    // For center admins, always scope sidebar to their center
    if (userScope.isCenterAdmin && userScope.centerId) {
      return getCenterScopedSections(sections, userScope.centerId);
    }

    return sections;
  }, [isPlatformAdmin, userScope.isCenterAdmin, userScope.centerId]);

  useEffect(() => {
    if (!isPlatformAdmin) {
      previousPathRef.current = pathname;
      return;
    }

    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;

    // Always clear the temporary center picker selection when navigating pages.
    setTenantState({ centerId: null, centerName: null });
  }, [isPlatformAdmin, pathname]);

  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="relative flex h-screen overflow-hidden">
          <Sidebar sections={sidebarConfig} />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-2 dark:bg-[#020d1a]">
            <Header />

            <main className="isolate flex-1 overflow-y-auto overflow-x-hidden">
              <div className="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                <AdminRouteGuard fallback={<PageLoading />}>
                  {children}
                </AdminRouteGuard>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
