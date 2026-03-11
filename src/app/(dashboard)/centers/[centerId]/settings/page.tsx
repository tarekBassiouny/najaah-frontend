"use client";

import { use } from "react";
import Link from "next/link";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCenter } from "@/features/centers/hooks/use-centers";
import { useTranslation } from "@/features/localization";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import {
  CenterProfileForm,
  CenterBrandingForm,
  CenterPolicyForm,
  CenterEducationProfileForm,
  CenterStatusCard,
  CenterOnboardingCard,
} from "@/features/centers/components/forms";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getOnboardingBadgeVariant(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") return "success" as const;
  if (normalized === "FAILED") return "error" as const;
  if (normalized === "IN_PROGRESS") return "warning" as const;
  return "secondary" as const;
}

function resolveStatusLabel(status: unknown, label?: string | null): string {
  if (label) return label;
  if (Number(status) === 0) return "Inactive";
  return "Active";
}

function resolveStatusVariant(
  status: unknown,
  label?: string | null,
): "success" | "secondary" {
  if (Number(status) === 0) return "secondary";
  if (
    String(label ?? "")
      .trim()
      .toLowerCase() === "inactive"
  ) {
    return "secondary";
  }
  return "success";
}

export default function CenterSettingsPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);
  const {
    data: center,
    isLoading,
    isError,
    error,
    refetch: refetchCenter,
  } = useCenter(centerId);

  const statusLabel = resolveStatusLabel(center?.status, center?.status_label);
  const statusVariant = resolveStatusVariant(
    center?.status,
    center?.status_label,
  );
  const onboardingStatus = String(center?.onboarding_status ?? "DRAFT");

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
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerSettings.loadFailed")}
          </p>
          <Link href="/centers" className="mt-4 inline-block">
            <Button variant="outline">
              {t("pages.centerSettings.backToCenters")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const centerData = center!;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.centerSettings.title", {
          name: centerData.name ?? `Center ${centerData.id}`,
        })}
        description={t("pages.centerSettings.description")}
        actions={
          <Link href={`/centers/${centerData.id}`}>
            <Button variant="outline">{t("pages.centerSettings.back")}</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <Badge variant={getOnboardingBadgeVariant(onboardingStatus)}>
            {toTitleCase(onboardingStatus.replace(/_/g, " "))}
          </Badge>
          <Badge variant="outline">
            {toTitleCase(String(centerData.type ?? "unbranded"))}
          </Badge>
          <Badge variant="outline">
            {t("pages.centerSettings.tier")}:{" "}
            {toTitleCase(String(centerData.tier ?? "standard"))}
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.centerSettings.idLabel")}: {centerData.id}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            /{centerData.slug ?? "-"}
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CenterProfileForm
            center={centerData}
            mode="edit"
            isPlatformAdmin={true}
          />

          <CenterBrandingForm
            center={centerData}
            isPlatformAdmin={true}
            mode="edit"
            refetchCenter={refetchCenter}
          />

          <CenterPolicyForm centerId={centerData.id} />

          <CenterEducationProfileForm centerId={centerData.id} />
        </div>

        <div className="space-y-6">
          <CenterStatusCard center={centerData} />
          <CenterOnboardingCard center={centerData} />
        </div>
      </div>
    </div>
  );
}
