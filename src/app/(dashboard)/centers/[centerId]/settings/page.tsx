"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/page-loading";
import { Skeleton } from "@/components/ui/skeleton";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { useTranslation } from "@/features/localization";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import { CenterSettingsEditor } from "@/features/settings/components";
import { getAdminScope } from "@/lib/user-scope";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterScopedSettingsPage({ params }: PageProps) {
  const { centerId } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useAdminMe();
  const userScope = getAdminScope(user);
  const isUserScopeReady = !isUserLoading && !isUserFetching;
  const { data: center, isLoading, isError, error } = useCenter(centerId);

  useEffect(() => {
    if (!isUserScopeReady) {
      return;
    }

    if (
      userScope.isCenterAdmin &&
      userScope.centerId &&
      userScope.centerId !== centerId
    ) {
      router.replace(`/centers/${userScope.centerId}/settings`);
    }
  }, [
    centerId,
    isUserScopeReady,
    router,
    userScope.centerId,
    userScope.isCenterAdmin,
    userScope.isSystemAdmin,
  ]);

  if (
    !isUserScopeReady ||
    (userScope.isCenterAdmin &&
      userScope.centerId &&
      userScope.centerId !== centerId)
  ) {
    return <PageLoading />;
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
        description="Manage your center settings from the grouped center settings payload."
        actions={
          userScope.isSystemAdmin ? (
            <div className="flex items-center gap-2">
              <Link href="/centers">
                <Button variant="outline">
                  {t("pages.centerSettings.backToCenters")}
                </Button>
              </Link>
              <Link href={`/manage/centers/${centerId}/settings`}>
                <Button variant="ghost">Open Management View</Button>
              </Link>
            </div>
          ) : undefined
        }
      />

      <CenterSettingsEditor centerId={centerId} mode="workspace" />
    </div>
  );
}
