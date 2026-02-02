"use client";

import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { AdminRouteGuard, AuthProvider } from "@/features/auth";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { getSidebarSections } from "@/components/Layouts/sidebar/data";
import { useTenant } from "@/app/tenant-provider";
import { PageLoading } from "@/components/ui/page-loading";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  const { centerSlug } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const sidebarConfig = getSidebarSections(isPlatformAdmin);

  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="relative flex min-h-screen">
          <Sidebar sections={sidebarConfig} />

          <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
            <Header />

            <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
              <AdminRouteGuard fallback={<PageLoading />}>
                {children}
              </AdminRouteGuard>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthProvider>
  );
}
