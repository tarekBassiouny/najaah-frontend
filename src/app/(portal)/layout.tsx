"use client";

import { type ReactNode } from "react";
import { PortalAuthProvider, PortalRouteGuard } from "@/features/portal-auth";
import { PageLoading } from "@/components/ui/page-loading";

type Props = {
  children: ReactNode;
};

export default function PortalLayout({ children }: Props) {
  return (
    <PortalAuthProvider>
      <div className="relative min-h-screen bg-gray-2 dark:bg-[#020d1a]">
        <main className="min-h-screen">
          <PortalRouteGuard fallback={<PageLoading />}>
            {children}
          </PortalRouteGuard>
        </main>
      </div>
    </PortalAuthProvider>
  );
}
