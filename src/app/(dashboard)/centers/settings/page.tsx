"use client";

import { PageHeader } from "@/components/ui/page-header";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/app/tenant-provider";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useTranslation } from "@/features/localization";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import {
  CenterProfileForm,
  CenterBrandingForm,
  CenterPolicyForm,
  CenterEducationProfileForm,
} from "@/features/centers/components/forms";

export default function CentersSettingsPage() {
  const { t } = useTranslation();
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
            {t("pages.centerSettings.centerContextRequired")}
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
        scopeLabel={t("pages.centerSettings.titleFallback")}
        title={t("pages.centerSettings.notFoundTitle")}
        description={t("pages.centerSettings.workspaceNotFoundDesc")}
        primaryAction={{
          href: "/dashboard",
          label: t("pages.centerSettings.goToDashboard"),
        }}
      />
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerSettings.loadFailed")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerSettings.titleFallback")}
        description={t("pages.centerSettings.workspaceDescription")}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CenterProfileForm
            center={center}
            mode="edit"
            isPlatformAdmin={false}
          />

          <CenterPolicyForm centerId={centerId} />

          <CenterEducationProfileForm centerId={centerId} />
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
