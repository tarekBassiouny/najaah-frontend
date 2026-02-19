"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCenter } from "@/features/centers/hooks/use-centers";
import {
  CenterProfileForm,
  CenterBrandingForm,
  CenterPolicyForm,
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
  const { centerId } = use(params);
  const {
    data: center,
    isLoading,
    isError,
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

  if (isError || !center) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Center not found or unavailable.
          </p>
          <Link href="/centers" className="mt-4 inline-block">
            <Button variant="outline">Back to Centers</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${center.name ?? `Center ${center.id}`} Settings`}
        description="Manage center details, status, and onboarding operations"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          {
            label: center.name ?? `Center ${center.id}`,
            href: `/centers/${center.id}`,
          },
          { label: "Settings" },
        ]}
        actions={
          <Link href={`/centers/${center.id}`}>
            <Button variant="outline">Back</Button>
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
            {toTitleCase(String(center.type ?? "unbranded"))}
          </Badge>
          <Badge variant="outline">
            Tier: {toTitleCase(String(center.tier ?? "standard"))}
          </Badge>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ID: {center.id}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            /{center.slug ?? "-"}
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CenterProfileForm
            center={center}
            mode="edit"
            isPlatformAdmin={true}
          />

          <CenterBrandingForm
            center={center}
            isPlatformAdmin={true}
            mode="edit"
            refetchCenter={refetchCenter}
          />

          <CenterPolicyForm centerId={center.id} />
        </div>

        <div className="space-y-6">
          <CenterStatusCard center={center} />
          <CenterOnboardingCard center={center} />
        </div>
      </div>
    </div>
  );
}
