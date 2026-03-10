"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { EducationPanel } from "@/features/education/components/EducationPanel";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useTranslation } from "@/features/localization";
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
  const { t } = useTranslation();
  const { centerId } = use(params);
  const router = useRouter();
  const { data: center, isLoading, isError, error } = useCenter(centerId);
  const isUnbrandedCenter = isUnbrandedCenterType(center?.type);

  useEffect(() => {
    if (!isLoading && isUnbrandedCenter) {
      router.replace("/education");
    }
  }, [isLoading, isUnbrandedCenter, router]);

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
            {t("pages.centerEducation.redirectingUnbranded")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isMissingCenter = !isLoading && !isError && !center;
  if (isMissingCenter || isAdminApiNotFoundError(error)) {
    return (
      <AppNotFoundState
        scopeLabel={t("common.labels.center")}
        title={t("pages.centerSettings.notFoundTitle")}
        description={t("pages.centerSettings.notFoundDesc")}
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
            {t("pages.centerEducation.loadFailed")}
          </p>
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">
              {t("pages.centerCourses.backToCenter")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.education.title")}
        description={t("pages.centerEducation.description")}
        actions={
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">
              {t("pages.centerCourses.backToCenter")}
            </Button>
          </Link>
        }
      />

      <EducationPanel centerId={centerId} />
    </div>
  );
}
