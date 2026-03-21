"use client";

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
  CenterStatusCard,
  CenterOnboardingCard,
} from "@/features/centers/components/forms";
import { CenterSettingsEditor } from "@/features/settings/components";

type SystemAdminCenterSettingsPageProps = {
  centerId: string;
};

function getOnboardingBadgeVariant(status: string) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") return "success" as const;
  if (normalized === "FAILED") return "error" as const;
  if (normalized === "IN_PROGRESS") return "warning" as const;
  return "secondary" as const;
}

function resolveStatusLabel(
  status: unknown,
  label: string | null | undefined,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): string {
  if (label) return label;
  if (Number(status) === 0) {
    return t("pages.centerSettings.badges.status.inactive");
  }

  return t("pages.centerSettings.badges.status.active");
}

function getOnboardingStatusLabel(
  status: string,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") {
    return t("pages.centerSettings.badges.onboarding.active");
  }
  if (normalized === "FAILED") {
    return t("pages.centerSettings.badges.onboarding.failed");
  }
  if (normalized === "IN_PROGRESS") {
    return t("pages.centerSettings.badges.onboarding.inProgress");
  }
  if (normalized === "DRAFT") {
    return t("pages.centerSettings.badges.onboarding.draft");
  }

  return t("pages.centerSettings.badges.onboarding.unknown");
}

function getCenterTypeLabel(
  value: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  return String(value ?? "")
    .trim()
    .toLowerCase() === "branded"
    ? t("pages.centerSettings.forms.profile.options.type.branded")
    : t("pages.centerSettings.forms.profile.options.type.unbranded");
}

function getCenterTierLabel(
  value: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "premium") {
    return t("pages.centerSettings.forms.profile.options.tier.premium");
  }
  if (normalized === "vip") {
    return t("pages.centerSettings.forms.profile.options.tier.vip");
  }

  return t("pages.centerSettings.forms.profile.options.tier.standard");
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

export function SystemAdminCenterSettingsPage({
  centerId,
}: SystemAdminCenterSettingsPageProps) {
  const { t } = useTranslation();
  const { data: center, isLoading, isError, error } = useCenter(centerId);

  const statusLabel = resolveStatusLabel(
    center?.status,
    center?.status_label,
    t,
  );
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
          name:
            centerData.name ??
            t("pages.centerSettings.centerNameFallback", { id: centerData.id }),
        })}
        description={t("pages.centerSettings.description")}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/centers">
              <Button variant="outline">
                {t("pages.centerSettings.backToCenters")}
              </Button>
            </Link>
            <Link href={`/centers/${centerData.id}`}>
              <Button variant="outline">
                {t("pages.centerSettings.back")}
              </Button>
            </Link>
            <Link href={`/centers/${centerData.id}/settings`}>
              <Button variant="ghost">
                {t("pages.centerSettings.managementPage.openWorkspaceView")}
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Badge variant={statusVariant}>{statusLabel}</Badge>
          <Badge variant={getOnboardingBadgeVariant(onboardingStatus)}>
            {getOnboardingStatusLabel(onboardingStatus, t)}
          </Badge>
          <Badge variant="outline">
            {getCenterTypeLabel(centerData.type, t)}
          </Badge>
          <Badge variant="outline">
            {t("pages.centerSettings.tier")}:{" "}
            {getCenterTierLabel(centerData.tier, t)}
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
          <CenterSettingsEditor centerId={centerData.id} mode="manage" />
        </div>

        <div className="space-y-6">
          <CenterStatusCard center={centerData} />
          <CenterOnboardingCard center={centerData} />
        </div>
      </div>
    </div>
  );
}
