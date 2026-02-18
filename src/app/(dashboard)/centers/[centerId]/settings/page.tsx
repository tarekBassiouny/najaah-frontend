"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCenter,
  useRetryCenterOnboarding,
  useUpdateCenter,
  useUpdateCenterStatus,
  useUploadCenterLogo,
} from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

type TierValue = "standard" | "premium" | "vip";
type StatusValue = "active" | "inactive";

function resolveTier(value: unknown): TierValue {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "premium") return "premium";
  if (raw === "vip") return "vip";
  return "standard";
}

function resolveStatus(value: unknown, label?: string | null): StatusValue {
  if (Number(value) === 0) return "inactive";
  if (
    String(label ?? "")
      .trim()
      .toLowerCase() === "inactive"
  ) {
    return "inactive";
  }
  return "active";
}

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

export default function CenterSettingsPage({ params }: PageProps) {
  const { centerId } = use(params);
  const { data: center, isLoading, isError } = useCenter(centerId);

  const updateCenterMutation = useUpdateCenter();
  const updateStatusMutation = useUpdateCenterStatus();
  const retryMutation = useRetryCenterOnboarding();
  const uploadLogoMutation = useUploadCenterLogo();

  const [name, setName] = useState("");
  const [tier, setTier] = useState<TierValue>("standard");
  const [isFeatured, setIsFeatured] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("");
  const [status, setStatus] = useState<StatusValue>("active");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const isBranded = useMemo(
    () =>
      String(center?.type ?? "")
        .trim()
        .toLowerCase() === "branded",
    [center?.type],
  );
  const statusLabel =
    center?.status_label ?? (status === "active" ? "Active" : "Inactive");
  const onboardingStatus = String(center?.onboarding_status ?? "DRAFT");

  useEffect(() => {
    if (!center) return;

    setName(center.name ?? "");
    setTier(resolveTier(center.tier));
    setIsFeatured(Boolean(center.is_featured));
    setPrimaryColor(
      typeof center.primary_color === "string" ? center.primary_color : "",
    );
    setStatus(resolveStatus(center.status, center.status_label));
  }, [center]);

  const handleSave = () => {
    if (!center) return;

    if (!name.trim()) {
      setSaveError("Center name is required.");
      return;
    }

    if (isBranded && !primaryColor.trim()) {
      setSaveError("Primary color is required for branded centers.");
      return;
    }

    setSaveError(null);
    const existingBrandingMetadata =
      center.branding_metadata &&
      typeof center.branding_metadata === "object" &&
      !Array.isArray(center.branding_metadata)
        ? center.branding_metadata
        : {};

    updateCenterMutation.mutate(
      {
        id: center.id,
        payload: {
          name: name.trim(),
          tier,
          is_featured: isFeatured,
          branding_metadata: isBranded
            ? {
                ...existingBrandingMetadata,
                primary_color: primaryColor.trim(),
              }
            : undefined,
        },
      },
      {
        onError: (error) => {
          setSaveError(
            getCenterApiErrorMessage(
              error,
              "Unable to update center settings. Please try again.",
            ),
          );
        },
      },
    );
  };

  const handleStatusUpdate = () => {
    if (!center) return;

    setStatusError(null);
    updateStatusMutation.mutate(
      {
        id: center.id,
        payload: { status: status === "active" ? 1 : 0 },
      },
      {
        onError: (error) => {
          setStatusError(
            getCenterApiErrorMessage(
              error,
              "Unable to update center status. Please try again.",
            ),
          );
        },
      },
    );
  };

  const handleRetryOnboarding = () => {
    if (!center) return;

    setRetryError(null);
    retryMutation.mutate(center.id, {
      onError: (error) => {
        setRetryError(
          getCenterApiErrorMessage(
            error,
            "Unable to retry onboarding. Please try again.",
          ),
        );
      },
    });
  };

  const handleUploadLogo = () => {
    if (!center || !logoFile) return;

    setLogoError(null);
    uploadLogoMutation.mutate(
      {
        id: center.id,
        payload: {
          file: logoFile,
          filename: logoFile.name,
        },
      },
      {
        onSuccess: () => {
          setLogoFile(null);
        },
        onError: (error) => {
          setLogoError(
            getCenterApiErrorMessage(
              error,
              "Unable to upload center logo. Please try again.",
            ),
          );
        },
      },
    );
  };

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
          <Badge variant={status === "active" ? "success" : "secondary"}>
            {statusLabel}
          </Badge>
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
          <Card>
            <CardHeader>
              <CardTitle>Center Profile</CardTitle>
              <CardDescription>
                Update center metadata used in listings and branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {saveError ? (
                <Alert variant="destructive">
                  <AlertTitle>Unable to save</AlertTitle>
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="center-name">Center Name</Label>
                <Input
                  id="center-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Center name"
                  className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={center.slug ?? ""}
                    disabled
                    className="h-10 bg-gray-50 dark:bg-gray-900/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={String(center.type ?? "")}
                    disabled
                    className="h-10 bg-gray-50 dark:bg-gray-900/60"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tier</Label>
                  <Select
                    value={tier}
                    onValueChange={(value) => setTier(value as TierValue)}
                  >
                    <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Featured</Label>
                  <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(event) => setIsFeatured(event.target.checked)}
                    />
                    Show in featured centers
                  </label>
                </div>
              </div>

              {isBranded ? (
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <Input
                    id="primary-color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    placeholder="#4F46E5"
                    className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                  />
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={updateCenterMutation.isPending}
                >
                  {updateCenterMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding Logo</CardTitle>
              <CardDescription>
                Upload or replace the center logo (max 5MB).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {logoError ? (
                <Alert variant="destructive">
                  <AlertTitle>Upload failed</AlertTitle>
                  <AlertDescription>{logoError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="center-logo">Logo</Label>
                <Input
                  id="center-logo"
                  type="file"
                  accept="image/*"
                  className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setLogoFile(file);
                  }}
                />
                {logoFile ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Selected: {logoFile.name}
                  </p>
                ) : null}
                {center.logo_url ? (
                  <a
                    href={center.logo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Preview current logo
                  </a>
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUploadLogo}
                  disabled={!logoFile || uploadLogoMutation.isPending}
                >
                  {uploadLogoMutation.isPending
                    ? "Uploading..."
                    : "Upload Logo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Activate or deactivate this center.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusError ? (
                <Alert variant="destructive">
                  <AlertTitle>Status update failed</AlertTitle>
                  <AlertDescription>{statusError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Current:
                </span>
                <Badge variant={status === "active" ? "success" : "secondary"}>
                  {statusLabel}
                </Badge>
              </div>

              <Select
                value={status}
                onValueChange={(value) => setStatus(value as StatusValue)}
              >
                <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="w-full"
                onClick={handleStatusUpdate}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : "Update Status"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Onboarding</CardTitle>
              <CardDescription>
                Retry onboarding operations if setup got stuck or failed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {retryError ? (
                <Alert variant="destructive">
                  <AlertTitle>Retry failed</AlertTitle>
                  <AlertDescription>{retryError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Current:
                </span>
                <Badge variant={getOnboardingBadgeVariant(onboardingStatus)}>
                  {toTitleCase(onboardingStatus.replace(/_/g, " "))}
                </Badge>
              </div>

              <Button
                className="w-full"
                variant="outline"
                onClick={handleRetryOnboarding}
                disabled={retryMutation.isPending}
              >
                {retryMutation.isPending ? "Retrying..." : "Retry Onboarding"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
