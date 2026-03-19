"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useRolePermissions } from "@/features/role-permissions/hooks/use-role-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminApiNotFoundError } from "@/lib/admin-response";
import { cn } from "@/lib/utils";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

type RolePermissionsFormProps = {
  roleId: string;
  scopeCenterId?: string | number | null;
  readOnly?: boolean;
  onApplied?: (_summary: { added: number; removed: number }) => void;
};

const PERMISSION_GROUPS = [
  {
    key: "admin",
    labelKey: "pages.roles.permissions.groups.admin",
    prefixes: ["admin."],
  },
  {
    key: "roles_permissions",
    labelKey: "pages.roles.permissions.groups.rolesPermissions",
    prefixes: ["role.", "permission."],
  },
  {
    key: "centers",
    labelKey: "pages.roles.permissions.groups.centers",
    prefixes: ["center."],
  },
  {
    key: "courses",
    labelKey: "pages.roles.permissions.groups.courses",
    prefixes: ["course.", "section."],
  },
  {
    key: "videos",
    labelKey: "pages.roles.permissions.groups.videos",
    prefixes: ["video."],
  },
  {
    key: "pdfs",
    labelKey: "pages.roles.permissions.groups.pdfs",
    prefixes: ["pdf."],
  },
  {
    key: "instructors",
    labelKey: "pages.roles.permissions.groups.instructors",
    prefixes: ["instructor."],
  },
  {
    key: "enrollments",
    labelKey: "pages.roles.permissions.groups.enrollments",
    prefixes: ["enrollment."],
  },
  {
    key: "requests_controls",
    labelKey: "pages.roles.permissions.groups.requestsControls",
    prefixes: ["device_change.", "extra_view."],
  },
  {
    key: "audit_system",
    labelKey: "pages.roles.permissions.groups.auditSystem",
    prefixes: ["audit.", "settings."],
  },
  {
    key: "other",
    labelKey: "pages.roles.permissions.groups.other",
    prefixes: [],
  },
] as const;

type BackendErrorData = {
  message?: string;
  errors?: Record<string, string[] | string>;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[] | string>;
  };
};

type PermissionItem = {
  id: string | number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
};

function normalizeIds(ids: Array<number | string>) {
  return [...new Set(ids.map((id) => String(id)))].sort();
}

function normalizeMatcher(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

function collectPermissionMatchers(permission: unknown): string[] {
  if (typeof permission === "string" || typeof permission === "number") {
    const matcher = normalizeMatcher(permission);
    return matcher ? [matcher] : [];
  }

  if (!permission || typeof permission !== "object") {
    return [];
  }

  const source = permission as {
    id?: unknown;
    name?: unknown;
    slug?: unknown;
  };

  return [source.id, source.name, source.slug]
    .map((value) => normalizeMatcher(value))
    .filter((value): value is string => Boolean(value));
}

function areSortedIdsEqual(first: string[], second: string[]): boolean {
  if (first.length !== second.length) return false;
  return first.every((value, index) => value === second[index]);
}

function getValidationMessage(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value.find(
      (item) => typeof item === "string" && item.trim(),
    ) as string | undefined;
    return first ?? null;
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return null;
}

function getErrorCodeMessage(
  code: string | undefined,
  t: TranslateFunction,
): string | null {
  if (!code) return null;

  const messages: Record<string, string> = {
    PERMISSION_DENIED: t("pages.roles.permissions.errors.permissionDenied"),
    SYSTEM_SCOPE_REQUIRED: t(
      "pages.roles.permissions.errors.systemScopeRequired",
    ),
    SYSTEM_API_KEY_REQUIRED: t(
      "pages.roles.permissions.errors.systemApiKeyRequired",
    ),
    API_KEY_CENTER_MISMATCH: t(
      "pages.roles.permissions.errors.apiKeyCenterMismatch",
    ),
    CENTER_MISMATCH: t("pages.roles.permissions.errors.centerMismatch"),
    NOT_FOUND: t("pages.roles.permissions.errors.notFound"),
    VALIDATION_ERROR: t("pages.roles.permissions.errors.validation"),
  };

  return messages[code] ?? null;
}

function extractErrorMessage(error: unknown, t: TranslateFunction): string {
  if (isAxiosError<BackendErrorData>(error)) {
    const data = error.response?.data;

    // Check for known error codes first
    const errorCode = data?.error?.code;
    const codeMessage = getErrorCodeMessage(errorCode, t);
    if (codeMessage) {
      return codeMessage;
    }

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return t("pages.roles.permissions.errors.updateFailed");
}

function getPermissionName(
  permission: PermissionItem,
  t: TranslateFunction,
): string {
  if (permission.name && permission.name.trim()) {
    return permission.name.trim();
  }

  if (permission.slug && permission.slug.trim()) {
    return permission.slug.trim();
  }

  return t("pages.roles.permissions.fallbacks.permissionById", {
    id: permission.id,
  });
}

function getPermissionGroupLabel(
  permissionName: string | null | undefined,
  t: TranslateFunction,
): string {
  const value = String(permissionName ?? "")
    .trim()
    .toLowerCase();

  if (!value) return t("pages.roles.permissions.groups.other");

  const group = PERMISSION_GROUPS.find((item) =>
    item.prefixes.some((prefix) => value.startsWith(prefix)),
  );

  return group ? t(group.labelKey) : t("pages.roles.permissions.groups.other");
}

function getRoleInitials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);

  if (parts.length === 0) {
    return "RL";
  }

  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getDescriptionPreview(value?: string | null): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > 120 ? `${text.slice(0, 120).trimEnd()}...` : text;
}

export function RolePermissionsForm({
  roleId,
  scopeCenterId,
  readOnly = false,
  onApplied,
}: RolePermissionsFormProps) {
  const { t } = useTranslation();
  const emptyValue = t("pages.roles.fallbacks.noValue");

  const { roleQuery, updateMutation } = useRolePermissions(roleId, {
    centerId: scopeCenterId ?? null,
  });
  const { data, isLoading, isError, error } = roleQuery;

  const permissions = useMemo(() => data?.permissions ?? [], [data]);
  const rolePermissions = useMemo(() => data?.rolePermissions ?? [], [data]);
  const roleName = data?.role?.name ?? t("pages.roles.fallbacks.role");

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);
  const [initialSelectedIds, setInitialSelectedIds] = useState<string[]>([]);
  const [permissionIdsError, setPermissionIdsError] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [pendingPermissionIds, setPendingPermissionIds] = useState<string[]>(
    [],
  );

  useEffect(() => {
    if (!data) return;

    const assignedMatchers = new Set<string>();
    (rolePermissions as unknown[]).forEach((permission) => {
      collectPermissionMatchers(permission).forEach((matcher) => {
        assignedMatchers.add(matcher);
      });
    });

    const initial = permissions.filter((permission) =>
      collectPermissionMatchers(permission).some((matcher) =>
        assignedMatchers.has(matcher),
      ),
    );
    const initialIds = normalizeIds(initial.map((permission) => permission.id));

    setSelectedIds((previous) => {
      const previousIds = normalizeIds(previous);
      return areSortedIdsEqual(previousIds, initialIds)
        ? previous
        : initial.map((permission) => permission.id);
    });
    setInitialSelectedIds((previous) =>
      areSortedIdsEqual(previous, initialIds) ? previous : initialIds,
    );
    setPendingPermissionIds((previous) =>
      areSortedIdsEqual(previous, initialIds) ? previous : initialIds,
    );
    setSearch((previous) => (previous ? "" : previous));
    setPermissionIdsError((previous) => (previous ? null : previous));
    setFormError((previous) => (previous ? null : previous));
    setConfirmError((previous) => (previous ? null : previous));
    setConfirmChecked(false);
    setConfirmOpen(false);
  }, [data, permissions, rolePermissions]);

  const selectedSet = useMemo(
    () => new Set(selectedIds.map((id) => String(id))),
    [selectedIds],
  );

  const initialSet = useMemo(
    () => new Set(initialSelectedIds),
    [initialSelectedIds],
  );

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return permissions;

    return permissions.filter((permission) => {
      const name = String(permission.name ?? "").toLowerCase();
      const slug = String(permission.slug ?? "").toLowerCase();
      const description = String(permission.description ?? "").toLowerCase();

      return (
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query)
      );
    });
  }, [permissions, search]);

  const selectedPermissions = useMemo(
    () =>
      permissions.filter((permission) =>
        selectedSet.has(String(permission.id)),
      ),
    [permissions, selectedSet],
  );

  const permissionChanges = useMemo(() => {
    const permissionById = new Map(
      permissions.map((permission) => [String(permission.id), permission]),
    );

    const added = Array.from(selectedSet)
      .filter((id) => !initialSet.has(id))
      .map((id) => {
        const permission = permissionById.get(id);
        return permission
          ? getPermissionName(permission, t)
          : t("pages.roles.permissions.fallbacks.permissionById", { id });
      });

    const removed = Array.from(initialSet)
      .filter((id) => !selectedSet.has(id))
      .map((id) => {
        const permission = permissionById.get(id);
        return permission
          ? getPermissionName(permission, t)
          : t("pages.roles.permissions.fallbacks.permissionById", { id });
      });

    return {
      added,
      removed,
    };
  }, [initialSet, permissions, selectedSet, t]);

  const pendingSet = useMemo(
    () => new Set(pendingPermissionIds),
    [pendingPermissionIds],
  );

  const pendingPermissionChanges = useMemo(() => {
    const permissionById = new Map(
      permissions.map((permission) => [String(permission.id), permission]),
    );

    const added = Array.from(pendingSet)
      .filter((id) => !initialSet.has(id))
      .map((id) => {
        const permission = permissionById.get(id);
        return permission
          ? getPermissionName(permission, t)
          : t("pages.roles.permissions.fallbacks.permissionById", { id });
      });

    const removed = Array.from(initialSet)
      .filter((id) => !pendingSet.has(id))
      .map((id) => {
        const permission = permissionById.get(id);
        return permission
          ? getPermissionName(permission, t)
          : t("pages.roles.permissions.fallbacks.permissionById", { id });
      });

    return {
      added,
      removed,
    };
  }, [initialSet, pendingSet, permissions, t]);

  const isDirty = useMemo(() => {
    const current = normalizeIds(selectedIds);
    const initial = normalizeIds(initialSelectedIds);

    if (current.length !== initial.length) return true;
    return current.some((id, index) => id !== initial[index]);
  }, [initialSelectedIds, selectedIds]);

  const isMissingRole = !isLoading && !isError && !data;
  if (isMissingRole || isAdminApiNotFoundError(error)) {
    return (
      <AppNotFoundState
        scopeLabel={t("pages.roles.permissions.notFound.scopeLabel")}
        title={t("pages.roles.permissions.notFound.title")}
        description={t("pages.roles.permissions.notFound.description")}
        primaryAction={{
          href: scopeCenterId ? `/centers/${scopeCenterId}/roles` : "/roles",
          label: scopeCenterId
            ? t("pages.roles.permissions.notFound.goToRoles")
            : t("pages.roles.permissions.notFound.goToPlatformRoles"),
        }}
      />
    );
  }

  const togglePermission = (permissionId: number | string) => {
    if (readOnly) return;

    setSelectedIds((prev) => {
      const normalized = String(permissionId);
      if (prev.some((id) => String(id) === normalized)) {
        return prev.filter((id) => String(id) !== normalized);
      }
      return [...prev, permissionId];
    });
  };

  const handleSelectAll = () => {
    if (readOnly) return;
    setSelectedIds(permissions.map((permission) => permission.id));
  };

  const handleClear = () => {
    if (readOnly) return;
    setSelectedIds([]);
  };

  const handleContinue = () => {
    if (readOnly) return;

    setPermissionIdsError(null);
    setFormError(null);
    setConfirmError(null);

    const availablePermissionIds = new Set(
      permissions.map((permission) => String(permission.id)),
    );
    const normalizedSelection = normalizeIds(selectedIds);
    const invalidPermissionIds = normalizedSelection.filter(
      (permissionId) => !availablePermissionIds.has(permissionId),
    );

    if (invalidPermissionIds.length > 0) {
      setPermissionIdsError(
        t("pages.roles.permissions.errors.invalidSelection"),
      );
      return;
    }

    setPendingPermissionIds(normalizedSelection);
    setConfirmChecked(false);
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    if (readOnly || !confirmChecked) return;

    setPermissionIdsError(null);
    setFormError(null);
    setConfirmError(null);

    updateMutation.mutate(pendingPermissionIds, {
      onSuccess: () => {
        setConfirmOpen(false);
        setConfirmChecked(false);
        setConfirmError(null);
        onApplied?.({
          added: pendingPermissionChanges.added.length,
          removed: pendingPermissionChanges.removed.length,
        });
      },
      onError: (error) => {
        if (isAxiosError<BackendErrorData>(error)) {
          const details = error.response?.data?.error?.details;
          const permissionError = getValidationMessage(details?.permission_ids);

          if (permissionError) {
            setPermissionIdsError(permissionError);
            setConfirmError(permissionError);
            return;
          }
        }

        const message = extractErrorMessage(error, t);
        setFormError(message);
        setConfirmError(message);
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
            {getRoleInitials(roleName)}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              {t("pages.roles.permissions.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {readOnly
                ? t("pages.roles.permissions.descriptionReadOnly", {
                    name: roleName,
                  })
                : t("pages.roles.permissions.descriptionWrite", {
                    name: roleName,
                  })}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 pb-1 text-xs text-gray-400">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.roles.permissions.summary.selected", {
                  count: selectedSet.size,
                })}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.roles.permissions.summary.total", {
                  count: permissions.length,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {readOnly ? (
        <Alert>
          <AlertTitle>{t("pages.roles.permissions.readOnly.title")}</AlertTitle>
          <AlertDescription>
            {t("pages.roles.permissions.readOnly.description")}
          </AlertDescription>
        </Alert>
      ) : null}

      {permissionIdsError ? (
        <Alert variant="destructive">
          <AlertTitle>
            {t("pages.roles.permissions.errors.validationTitle")}
          </AlertTitle>
          <AlertDescription>{permissionIdsError}</AlertDescription>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>
            {t("pages.roles.permissions.errors.updateFailedTitle")}
          </AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {(error as Error)?.message ||
            t("pages.roles.permissions.errors.loadFailed")}
        </div>
      ) : null}

      {!readOnly ? (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="permissions-search">
              {t("pages.roles.permissions.search.label")}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleSelectAll}
                disabled={permissions.length === 0 || isLoading}
              >
                {t("pages.roles.permissions.actions.selectAll")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleClear}
                disabled={selectedSet.size === 0 || isLoading}
              >
                {t("pages.roles.permissions.actions.clear")}
              </Button>
            </div>
          </div>
          <Input
            id="permissions-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("pages.roles.permissions.search.placeholder")}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.roles.permissions.search.hint")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <Label htmlFor="permissions-search-readonly">
            {t("pages.roles.permissions.search.label")}
          </Label>
          <Input
            id="permissions-search-readonly"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("pages.roles.permissions.search.placeholder")}
            disabled={isLoading}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        {selectedPermissions.length > 0 ? (
          selectedPermissions.map((permission) => (
            <Badge key={`selected-${permission.id}`} variant="secondary">
              {getPermissionName(permission, t)}
            </Badge>
          ))
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.roles.permissions.empty.selected")}
          </p>
        )}
      </div>

      {!readOnly &&
      (permissionChanges.added.length > 0 ||
        permissionChanges.removed.length > 0) ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {t("pages.roles.permissions.changes.title")}
            </span>
            <span className="text-green-700 dark:text-green-300">
              {t("pages.roles.permissions.changes.added", {
                count: permissionChanges.added.length,
              })}
            </span>
            <span className="text-red-700 dark:text-red-300">
              {t("pages.roles.permissions.changes.removed", {
                count: permissionChanges.removed.length,
              })}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {permissionChanges.added.slice(0, 6).map((permission) => (
              <Badge
                key={`added-${permission}`}
                variant="success"
                className="text-[11px]"
              >
                {permission}
              </Badge>
            ))}
            {permissionChanges.removed.slice(0, 6).map((permission) => (
              <Badge
                key={`removed-${permission}`}
                variant="error"
                className="text-[11px]"
              >
                {permission}
              </Badge>
            ))}
            {permissionChanges.added.length + permissionChanges.removed.length >
            12 ? (
              <Badge variant="outline" className="text-[11px]">
                {t("pages.roles.permissions.changes.more")}
              </Badge>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white/80 p-2 dark:border-gray-700 dark:bg-gray-900/40">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredPermissions.length === 0 ? (
          <p className="p-2 text-sm text-gray-500 dark:text-gray-400">
            {search.trim()
              ? t("pages.roles.permissions.empty.noResults")
              : t("pages.roles.permissions.empty.noPermissions")}
          </p>
        ) : (
          filteredPermissions.map((permission) => {
            const permissionId = String(permission.id);
            const isSelected = selectedSet.has(permissionId);
            const permissionName = getPermissionName(permission, t);
            const slug = String(permission.slug ?? "").trim();
            const groupLabel = getPermissionGroupLabel(
              permission.name ?? slug,
              t,
            );
            const descriptionPreview = getDescriptionPreview(
              permission.description,
            );

            return (
              <button
                key={permissionId}
                type="button"
                onClick={() => togglePermission(permission.id)}
                disabled={readOnly}
                className={cn(
                  "w-full rounded-md border p-3 text-left transition",
                  readOnly && "cursor-default",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {permissionName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {slug || emptyValue} · {groupLabel}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    aria-label={t(
                      "pages.roles.permissions.actions.selectPermission",
                      {
                        name: permissionName,
                      },
                    )}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>

                {descriptionPreview ? (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {descriptionPreview}
                  </p>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {!readOnly ? (
        <div className="flex items-center justify-end">
          <Button
            onClick={handleContinue}
            disabled={!isDirty || updateMutation.isPending || isLoading}
          >
            {t("pages.roles.permissions.actions.continue")}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (updateMutation.isPending && !open) return;
          setConfirmOpen(open);
          if (!open) {
            setConfirmChecked(false);
            setConfirmError(null);
          }
        }}
      >
        <DialogContent
          className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6"
          onEscapeKeyDown={(event) => {
            if (updateMutation.isPending) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (updateMutation.isPending) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader className="space-y-2">
            <DialogTitle>
              {t("pages.roles.permissions.confirm.title")}
            </DialogTitle>
            <DialogDescription>
              {t("pages.roles.permissions.confirm.description", {
                name: roleName,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {roleName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.roles.permissions.confirm.selectedCount", {
                count: pendingPermissionIds.length,
              })}
            </p>
          </div>

          {confirmError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.roles.permissions.confirm.errorTitle")}
              </AlertTitle>
              <AlertDescription>{confirmError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">
                {t("pages.roles.permissions.confirm.addTitle")}
              </p>
              <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-200">
                {pendingPermissionChanges.added.length > 0 ? (
                  pendingPermissionChanges.added.map((permission) => (
                    <li key={`confirm-add-${permission}`}>+ {permission}</li>
                  ))
                ) : (
                  <li>{t("pages.roles.permissions.confirm.none")}</li>
                )}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-red-700 dark:text-red-300">
                {t("pages.roles.permissions.confirm.removeTitle")}
              </p>
              <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-200">
                {pendingPermissionChanges.removed.length > 0 ? (
                  pendingPermissionChanges.removed.map((permission) => (
                    <li key={`confirm-remove-${permission}`}>- {permission}</li>
                  ))
                ) : (
                  <li>{t("pages.roles.permissions.confirm.none")}</li>
                )}
              </ul>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={confirmChecked}
              onChange={(event) => setConfirmChecked(event.target.checked)}
              disabled={updateMutation.isPending}
            />
            {t("pages.roles.permissions.confirm.acknowledgement")}
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={updateMutation.isPending}
            >
              {t("common.actions.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSave}
              disabled={!confirmChecked || updateMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {updateMutation.isPending
                ? t("pages.roles.permissions.confirm.confirming")
                : t("pages.roles.permissions.confirm.apply")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
