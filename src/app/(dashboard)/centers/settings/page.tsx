"use client";

import { PageHeader } from "@/components/ui/page-header";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/app/tenant-provider";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import {
  CenterProfileForm,
  CenterBrandingForm,
  CenterPolicyForm,
} from "@/features/centers/components/forms";

export default function CentersSettingsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;

  const {
    data: center,
    isLoading,
    isError,
    error,
    refetch: refetchCenter,
  } = useCenter(centerId ?? undefined);

  if (!centerId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Center context is required to manage settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const isMissingCenter = !isLoading && !isError && !center;

  if (isMissingCenter || isAdminApiNotFoundError(error)) {
    return (
      <AppNotFoundState
        scopeLabel="Center Settings"
        title="Center not found"
        description="The center linked to this workspace is unavailable or no longer exists."
        primaryAction={{ href: "/dashboard", label: "Go to Dashboard" }}
      />
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Failed to load center settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Settings"
        description="Manage your center's branding and operational preferences"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CenterProfileForm
            center={center}
            mode="edit"
            isPlatformAdmin={false}
          />

          <CenterPolicyForm centerId={centerId} />
        </div>

        <div className="space-y-6">
          <CenterBrandingForm
            center={center}
            isPlatformAdmin={false}
            mode="edit"
            refetchCenter={refetchCenter}
          />
        </div>
      </div>
    </div>
  );
}
