import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { AdminRouteGuard } from "@/features/auth/components/AdminRouteGuard";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: Props) {
  return (
    <AdminRouteGuard>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
            <Header />

            <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminRouteGuard>
  );
}
