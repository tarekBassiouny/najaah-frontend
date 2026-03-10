"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { LandingPageEditor } from "@/features/centers/components/landing-page-editor";
import { useCenter } from "@/features/centers/hooks/use-centers";
import {
  getAdminApiErrorMessage,
  isAdminApiNotFoundError,
} from "@/lib/admin-response";
import { getAdminScope } from "@/lib/user-scope";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

function isUnbrandedCenterType(type: unknown) {
  if (type == null) return false;

  if (typeof type === "number") {
    return type === 0;
  }

  if (typeof type === "string") {
    const normalized = type.trim().toLowerCase();
    return normalized === "0" || normalized === "unbranded";
  }

  return false;
}

export default function LandingPageRoute({ params }: PageProps) {
  const { centerId } = use(params);
  const { data: center, isLoading, isError, error } = useCenter(centerId);
  const { data: currentAdmin } = useAdminMe();
  const adminScope = getAdminScope(currentAdmin);
  const isUnbrandedCenter = isUnbrandedCenterType(center?.type);

  const breadcrumbs = useMemo(() => {
    const crumbs = [];

    if (adminScope.isSystemAdmin) {
      crumbs.push({ label: "Centers", href: "/centers" });
    }

    crumbs.push({
      label: center?.name ?? `Center ${centerId}`,
      href: `/centers/${centerId}`,
    });
    crumbs.push({ label: "Landing Page" });

    return crumbs;
  }, [adminScope.isSystemAdmin, center?.name, centerId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isMissingCenter = !isLoading && !isError && !center;
  if (isMissingCenter || isAdminApiNotFoundError(error)) {
    return (
      <AppNotFoundState
        scopeLabel="Center"
        title="Center not found"
        description="The landing page you are trying to open belongs to a center that no longer exists."
        primaryAction={{ href: "/centers", label: "Go to Centers" }}
      />
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            {getAdminApiErrorMessage(
              error,
              "Failed to load this center. Please try again.",
            )}
          </p>
          <Link href="/centers">
            <Button variant="outline">Go to Centers</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isUnbrandedCenter) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <span>Center landing page</span>
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
              >
                Beta
              </Badge>
            </span>
          }
          description="Manage the public landing experience for branded centers."
          breadcrumbs={breadcrumbs}
          actions={
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="space-y-2 py-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Landing pages are only configurable for branded centers. Unbranded
              centers fall back to the shared system landing experience.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Convert this center to branded before opening the landing-page
              editor.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <span>Center landing page</span>
            <Badge
              variant="outline"
              className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
            >
              Beta
            </Badge>
          </span>
        }
        description="Manage the public landing experience for this branded center."
        breadcrumbs={breadcrumbs}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">Back to Center</Button>
          </Link>
        }
      />
      <LandingPageEditor centerId={centerId} />
    </div>
  );
}
