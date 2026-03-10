"use client";

import { use } from "react";
import Link from "next/link";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { LandingPageEditor } from "@/features/centers/components/landing-page-editor";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorMessage,
  isAdminApiNotFoundError,
} from "@/lib/admin-response";

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
  const { t } = useTranslation();
  const { centerId } = use(params);
  const { data: center, isLoading, isError, error } = useCenter(centerId);
  const isUnbrandedCenter = isUnbrandedCenterType(center?.type);

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
        scopeLabel={t("common.labels.center")}
        title={t("pages.centerSettings.notFoundTitle")}
        description={t("pages.centerLandingPage.notFoundDesc")}
        primaryAction={{
          href: "/centers",
          label: t("pages.centerSettings.goToCenters"),
        }}
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
              t("pages.centerLandingPage.loadFailed"),
            )}
          </p>
          <Link href="/centers">
            <Button variant="outline">
              {t("pages.centerSettings.goToCenters")}
            </Button>
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
              <span>{t("pages.centerLandingPage.title")}</span>
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
              >
                {t("badges.beta")}
              </Badge>
            </span>
          }
          description={t("pages.centerLandingPage.descriptionUnbranded")}
          actions={
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t("pages.centerCourses.backToCenter")}
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="space-y-2 py-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("pages.centerLandingPage.unbrandedNotice")}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("pages.centerLandingPage.unbrandedHint")}
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
            <span>{t("pages.centerLandingPage.title")}</span>
            <Badge
              variant="outline"
              className="px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide"
            >
              {t("badges.beta")}
            </Badge>
          </span>
        }
        description={t("pages.centerLandingPage.description")}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">
              {t("pages.centerCourses.backToCenter")}
            </Button>
          </Link>
        }
      />
      <LandingPageEditor centerId={centerId} />
    </div>
  );
}
