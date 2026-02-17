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

function toDateLabel(value: unknown): string {
  const text = toText(value);
  return text ? formatDateTime(text) : "—";
}

function toRoleLabel(role: string | AdminUserRole): string {
  if (typeof role === "string") {
    return toReadableText(role);
  }

  const label = toText(role.name) ?? toText(role.slug) ?? toText(role.role);
  return label ? toReadableText(label) : "Role";
}

function resolveRoles(user: AdminUser): string[] {
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles.map((role) => toRoleLabel(role));
  }

  if (
    Array.isArray(user.roles_with_permissions) &&
    user.roles_with_permissions.length > 0
  ) {
    return user.roles_with_permissions.map((role) => toRoleLabel(role));
  }

  if (toText(user.role)) {
    return [toReadableText(String(user.role))];
  }

  return [];
}

function resolveStatus(user: AdminUser): {
  label: string;
  variant: BadgeVariant;
} {
  const key =
    toText(user.status_key)?.toLowerCase() ?? toText(user.status) ?? "";
  const normalized = String(key).trim().toLowerCase();

  const statusMap: Record<string, { label: string; variant: BadgeVariant }> = {
    "0": { label: "Inactive", variant: "warning" },
    "1": { label: "Active", variant: "success" },
    "2": { label: "Banned", variant: "error" },
    inactive: { label: "Inactive", variant: "warning" },
    active: { label: "Active", variant: "success" },
    banned: { label: "Banned", variant: "error" },
  };

  const fallback =
    toText(user.status_label) ??
    (normalized ? toReadableText(normalized) : "Unknown");

  return statusMap[normalized] ?? { label: fallback, variant: "secondary" };
}

function resolveScopeLabel(user: AdminUser): string {
  const raw = toText(user.scope_type);
  if (!raw) return "—";

  const normalized = raw.toLowerCase();
  if (normalized === "system" || normalized === "platform") {
    return "System";
  }

  if (normalized === "center") {
    return "Center";
  }

  return toReadableText(raw);
}

function resolveCenterLabel(user: AdminUser): string {
  const centerName = toText(user.center?.name);
  const centerId = toText(user.center_id);

  if (centerName && centerId) return `${centerName} (ID: ${centerId})`;
  if (centerName) return centerName;
  if (centerId) return `Center #${centerId}`;

  return "—";
}

function resolveFlagLabel(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";

  const raw = toText(value)?.toLowerCase();
  if (!raw) return "No";

  if (raw === "1" || raw === "true") return "Yes";
  return "No";
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Account details loaded from /api/v1/admin/auth/me."
        />
        <ProfileLoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Profile"
          description="Account details loaded from /api/v1/admin/auth/me."
        />

        <Card>
          <CardHeader>
            <CardTitle>Could not load profile</CardTitle>
            <CardDescription>
              The profile request failed. Try again to fetch your latest account
              data.
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
              {isFetching ? "Retrying..." : "Retry"}
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
          title="My Profile"
          description="Account details loaded from /api/v1/admin/auth/me."
        />

        <Card>
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>
              No profile data is currently available for this session.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const status = resolveStatus(user);
  const roles = resolveRoles(user);
  const permissionCount = Array.isArray(user.permissions)
    ? user.permissions.length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage account details for the currently logged-in admin."
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
              Edit Info
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccessMessage(null);
                setChangePasswordOpen(true);
              }}
            >
              Change Password
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        }
      />

      {successMessage ? (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{toText(user.name) ?? "Admin"}</CardTitle>
          <CardDescription>
            {toText(user.email) ?? "No email available"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {resolveFlagLabel(user.is_system_super_admin) === "Yes" ? (
            <Badge variant="default">System Super Admin</Badge>
          ) : null}
          {resolveFlagLabel(user.is_center_super_admin) === "Yes" ? (
            <Badge variant="info">Center Super Admin</Badge>
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
            <CardTitle>Identity</CardTitle>
            <CardDescription>Basic account attributes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileField label="Admin ID" value={String(user.id)} mono />
            <ProfileField label="Name" value={toText(user.name) ?? "—"} />
            <ProfileField label="Email" value={toText(user.email) ?? "—"} />
            <ProfileField label="Phone" value={toText(user.phone) ?? "—"} />
            <ProfileField
              label="Username"
              value={toText(user.username) ?? "—"}
            />
            <ProfileField
              label="Country Code"
              value={toText(user.country_code) ?? "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access & Scope</CardTitle>
            <CardDescription>
              Permissions, scope and assignment context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileField label="Status" value={status.label} />
            <ProfileField label="Scope Type" value={resolveScopeLabel(user)} />
            <ProfileField
              label="Scope Center ID"
              value={toText(user.scope_center_id) ?? "—"}
            />
            <ProfileField label="Center" value={resolveCenterLabel(user)} />
            <ProfileField
              label="Permission Count"
              value={String(permissionCount)}
            />
            <ProfileField
              label="System Super Admin"
              value={resolveFlagLabel(user.is_system_super_admin)}
            />
            <ProfileField
              label="Center Super Admin"
              value={resolveFlagLabel(user.is_center_super_admin)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            Authentication and audit timestamps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileField
            label="Last Active"
            value={
              toDateLabel(user.last_active_at) !== "—"
                ? toDateLabel(user.last_active_at)
                : toDateLabel(user.last_active)
            }
            mono
          />
          <ProfileField
            label="Created At"
            value={toDateLabel(user.created_at)}
            mono
          />
          <ProfileField
            label="Updated At"
            value={toDateLabel(user.updated_at)}
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
