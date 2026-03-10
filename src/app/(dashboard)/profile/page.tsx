"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordDialog } from "@/features/auth/components/ChangePasswordDialog";
import { EditAdminProfileDialog } from "@/features/auth/components/EditAdminProfileDialog";
import { useAdminMe } from "@/features/auth/hooks/use-admin-me";
import { formatDateTime } from "@/lib/format-date-time";
import { useTranslation } from "@/features/localization";
import type { AdminUser, AdminUserRole } from "@/types/auth";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "outline";

type ProfileFieldProps = {
  label: string;
  value: string;
  mono?: boolean;
};

function ProfileField({ label, value, mono = false }: ProfileFieldProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem,1fr] sm:items-start sm:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span
        className={mono ? "break-all font-mono text-sm" : "break-words text-sm"}
      >
        {value}
      </span>
    </div>
  );
}

function toReadableText(raw: string): string {
  return raw
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

function toDateLabel(value: unknown, emptyLabel: string): string {
  const text = toText(value);
  return text ? formatDateTime(text) : emptyLabel;
}

function toRoleLabel(
  role: string | AdminUserRole,
  fallbackRoleLabel: string,
): string {
  if (typeof role === "string") {
    return toReadableText(role);
  }

  const label = toText(role.name) ?? toText(role.slug) ?? toText(role.role);
  return label ? toReadableText(label) : fallbackRoleLabel;
}

function resolveRoles(user: AdminUser, fallbackRoleLabel: string): string[] {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles.map((role) => toRoleLabel(role, fallbackRoleLabel));
  }

  if (
    Array.isArray(user.roles_with_permissions) &&
    user.roles_with_permissions.length > 0
  ) {
    return user.roles_with_permissions.map((role) =>
      toRoleLabel(role, fallbackRoleLabel),
    );
  }

  if (toText(user.role)) {
    return [toReadableText(String(user.role))];
  }

  return [];
}

function useResolveStatus() {
  const { t } = useTranslation();

  return (user: AdminUser): { label: string; variant: BadgeVariant } => {
    const key =
      toText(user.status_key)?.toLowerCase() ?? toText(user.status) ?? "";
    const normalized = String(key).trim().toLowerCase();

    const statusMap: Record<string, { label: string; variant: BadgeVariant }> =
      {
        "0": {
          label: t("pages.profile.statusLabels.inactive"),
          variant: "warning",
        },
        "1": {
          label: t("pages.profile.statusLabels.active"),
          variant: "success",
        },
        "2": {
          label: t("pages.profile.statusLabels.banned"),
          variant: "error",
        },
        inactive: {
          label: t("pages.profile.statusLabels.inactive"),
          variant: "warning",
        },
        active: {
          label: t("pages.profile.statusLabels.active"),
          variant: "success",
        },
        banned: {
          label: t("pages.profile.statusLabels.banned"),
          variant: "error",
        },
      };

    const fallback =
      toText(user.status_label) ??
      (normalized
        ? toReadableText(normalized)
        : t("pages.profile.statusLabels.unknown"));

    return statusMap[normalized] ?? { label: fallback, variant: "secondary" };
  };
}

function useResolveScopeLabel() {
  const { t } = useTranslation();

  return (user: AdminUser): string => {
    const raw = toText(user.scope_type);
    if (!raw) return t("common.labels.none");

    const normalized = raw.toLowerCase();
    if (normalized === "system" || normalized === "platform") {
      return t("pages.profile.scopeTypes.system");
    }

    if (normalized === "center") {
      return t("pages.profile.scopeTypes.center");
    }

    return toReadableText(raw);
  };
}

function resolveCenterLabel(
  user: AdminUser,
  centerWithIdLabel: string,
  centerIdFallbackLabel: string,
  emptyLabel: string,
): string {
  const centerName = toText(user.center?.name);
  const centerId = toText(user.center_id);

  if (centerName && centerId) {
    return `${centerName} ${centerWithIdLabel.replace("{id}", centerId)}`;
  }
  if (centerName) return centerName;
  if (centerId) return centerIdFallbackLabel.replace("{id}", centerId);

  return emptyLabel;
}

function useResolveFlagLabel() {
  const { t } = useTranslation();

  return (value: unknown): string => {
    if (typeof value === "boolean")
      return value
        ? t("pages.profile.flagLabels.yes")
        : t("pages.profile.flagLabels.no");

    const raw = toText(value)?.toLowerCase();
    if (!raw) return t("pages.profile.flagLabels.no");

    if (raw === "1" || raw === "true") return t("pages.profile.flagLabels.yes");
    return t("pages.profile.flagLabels.no");
  };
}

function ProfileLoadingState() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: user, isLoading, isError, isFetching, refetch } = useAdminMe();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { t } = useTranslation();
  const resolveStatus = useResolveStatus();
  const resolveScopeLabel = useResolveScopeLabel();
  const resolveFlagLabel = useResolveFlagLabel();
  const emptyLabel = t("common.labels.none");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("pages.profile.title")}
          description={t("pages.profile.descriptionLoading")}
        />
        <ProfileLoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("pages.profile.title")}
          description={t("pages.profile.descriptionLoading")}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.profile.couldNotLoad")}</CardTitle>
            <CardDescription>
              {t("pages.profile.couldNotLoadDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              {isFetching
                ? t("pages.profile.retrying")
                : t("pages.profile.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("pages.profile.title")}
          description={t("pages.profile.descriptionLoading")}
        />

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.profile.unavailable")}</CardTitle>
            <CardDescription>
              {t("pages.profile.unavailableDesc")}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const status = resolveStatus(user);
  const roles = resolveRoles(user, t("pages.profile.fallbacks.role"));
  const permissionCount = Array.isArray(user.permissions)
    ? user.permissions.length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.profile.title")}
        description={t("pages.profile.description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessMessage(null);
                setEditProfileOpen(true);
              }}
            >
              {t("pages.profile.editInfo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessMessage(null);
                setChangePasswordOpen(true);
              }}
            >
              {t("pages.profile.changePassword")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              {isFetching
                ? t("pages.profile.refreshing")
                : t("pages.profile.refresh")}
            </Button>
          </div>
        }
      />

      {successMessage ? (
        <Alert>
          <AlertTitle>{t("pages.profile.success")}</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{toText(user.name) ?? t("common.labels.admin")}</CardTitle>
          <CardDescription>{toText(user.email) ?? emptyLabel}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {resolveFlagLabel(user.is_system_super_admin) ===
          t("pages.profile.flagLabels.yes") ? (
            <Badge variant="default">
              {t("pages.profile.badges.systemSuperAdmin")}
            </Badge>
          ) : null}
          {resolveFlagLabel(user.is_center_super_admin) ===
          t("pages.profile.flagLabels.yes") ? (
            <Badge variant="info">
              {t("pages.profile.badges.centerSuperAdmin")}
            </Badge>
          ) : null}
          {roles.length > 0
            ? roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))
            : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("pages.profile.cards.identity")}</CardTitle>
            <CardDescription>
              {t("pages.profile.cards.identityDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileField
              label={t("pages.profile.fields.adminId")}
              value={String(user.id)}
              mono
            />
            <ProfileField
              label={t("pages.profile.fields.name")}
              value={toText(user.name) ?? emptyLabel}
            />
            <ProfileField
              label={t("pages.profile.fields.email")}
              value={toText(user.email) ?? emptyLabel}
            />
            <ProfileField
              label={t("pages.profile.fields.phone")}
              value={toText(user.phone) ?? emptyLabel}
            />
            <ProfileField
              label={t("pages.profile.fields.username")}
              value={toText(user.username) ?? emptyLabel}
            />
            <ProfileField
              label={t("pages.profile.fields.countryCode")}
              value={toText(user.country_code) ?? emptyLabel}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("pages.profile.cards.accessScope")}</CardTitle>
            <CardDescription>
              {t("pages.profile.cards.accessScopeDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileField
              label={t("pages.profile.fields.status")}
              value={status.label}
            />
            <ProfileField
              label={t("pages.profile.fields.scopeType")}
              value={resolveScopeLabel(user)}
            />
            <ProfileField
              label={t("pages.profile.fields.scopeCenterId")}
              value={toText(user.scope_center_id) ?? emptyLabel}
            />
            <ProfileField
              label={t("pages.profile.fields.center")}
              value={resolveCenterLabel(
                user,
                t("pages.profile.fallbacks.centerWithId"),
                t("pages.profile.fallbacks.centerIdOnly"),
                emptyLabel,
              )}
            />
            <ProfileField
              label={t("pages.profile.fields.permissionCount")}
              value={String(permissionCount)}
            />
            <ProfileField
              label={t("pages.profile.fields.systemSuperAdmin")}
              value={resolveFlagLabel(user.is_system_super_admin)}
            />
            <ProfileField
              label={t("pages.profile.fields.centerSuperAdmin")}
              value={resolveFlagLabel(user.is_center_super_admin)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("pages.profile.cards.activity")}</CardTitle>
          <CardDescription>
            {t("pages.profile.cards.activityDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileField
            label={t("pages.profile.fields.lastActive")}
            value={
              toDateLabel(user.last_active_at, emptyLabel) !== emptyLabel
                ? toDateLabel(user.last_active_at, emptyLabel)
                : toDateLabel(user.last_active, emptyLabel)
            }
            mono
          />
          <ProfileField
            label={t("pages.profile.fields.createdAt")}
            value={toDateLabel(user.created_at, emptyLabel)}
            mono
          />
          <ProfileField
            label={t("pages.profile.fields.updatedAt")}
            value={toDateLabel(user.updated_at, emptyLabel)}
            mono
          />
        </CardContent>
      </Card>

      <EditAdminProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        user={user}
        onSuccess={(message) => setSuccessMessage(message)}
      />

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
        onSuccess={(message) => setSuccessMessage(message)}
      />
    </div>
  );
}
