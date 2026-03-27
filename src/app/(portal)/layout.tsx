"use client";

import { type ReactNode } from "react";
import { PortalAuthProvider, PortalRouteGuard } from "@/features/portal-auth";
import { PortalHeader } from "@/features/portal-auth/components/PortalHeader";
import { PageLoading } from "@/components/ui/page-loading";

type Props = {
  children: ReactNode;
};

export default function PortalLayout({ children }: Props) {
  return (
    <PortalAuthProvider>
      <div className="relative flex min-h-screen flex-col bg-gray-2 dark:bg-[#020d1a]">
        <PortalHeader />
        <main className="flex-1">
          <PortalRouteGuard fallback={<PageLoading />}>
            {children}
          </PortalRouteGuard>
        </main>
      </div>
    </PortalAuthProvider>
  );
}
