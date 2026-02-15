"use client";

import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { AdminRouteGuard, AuthProvider } from "@/features/auth";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { getSidebarSections } from "@/components/Layouts/sidebar/data";
import { useTenant } from "@/app/tenant-provider";
import { PageLoading } from "@/components/ui/page-loading";
import { setTenantState } from "@/lib/tenant-store";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname();
  const { centerSlug } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const sidebarConfig = getSidebarSections(isPlatformAdmin);
  const previousPathRef = useRef(pathname);

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
