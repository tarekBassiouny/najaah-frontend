"use client";

import { use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { EducationPanel } from "@/features/education/components/EducationPanel";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { getAdminScope } from "@/lib/user-scope";
import { isAdminApiNotFoundError } from "@/lib/admin-response";

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

export default function CenterEducationPage({ params }: PageProps) {
  const { centerId } = use(params);
  const router = useRouter();
  const { data: center, isLoading, isError, error } = useCenter(centerId);
  const { data: currentAdmin } = useAdminMe();
  const adminScope = getAdminScope(currentAdmin);
  const isUnbrandedCenter = isUnbrandedCenterType(center?.type);

  useEffect(() => {
    if (!isLoading && isUnbrandedCenter) {
      router.replace("/education");
    }
  }, [isLoading, isUnbrandedCenter, router]);

  const breadcrumbs = useMemo(() => {
    const crumbs = [];

    if (adminScope.isSystemAdmin) {
      crumbs.push({ label: "Centers", href: "/centers" });
    }

    crumbs.push({
      label: center?.name ?? `Center ${centerId}`,
      href: `/centers/${centerId}`,
    });
    crumbs.push({ label: "Education" });
    return crumbs;
  }, [adminScope.isSystemAdmin, center?.name, centerId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (isUnbrandedCenter) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to system education management for this unbranded
            center.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isMissingCenter = !isLoading && !isError && !center;
  if (isMissingCenter || isAdminApiNotFoundError(error)) {
    return (
      <AppNotFoundState
        scopeLabel="Center"
        title="Center not found"
        description="The center you requested does not exist or is no longer available."
        primaryAction={{ href: "/centers", label: "Go to Centers" }}
      />
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load center education page. Please try again.
          </p>
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">Back to Center</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Education"
        description="Manage grades, schools, and colleges for this center."
        breadcrumbs={breadcrumbs}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">Back to Center</Button>
          </Link>
        }
      />

      <EducationPanel centerId={centerId} />
    </div>
  );
}
