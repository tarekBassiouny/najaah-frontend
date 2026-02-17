"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/features/permissions/hooks/use-permissions";
import { useBulkAssignRolePermissions } from "@/features/role-permissions/hooks/use-role-permissions";
import type { Role } from "@/features/roles/types/role";

const SEARCH_DEBOUNCE_MS = 300;

const PERMISSION_PAGE_SIZE = 200;

type BulkManageRolePermissionsDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  roles: Role[];
  onSuccess?: (_message: string) => void;
};

type BackendErrorData = {
  message?: string;
  errors?: Record<string, string[] | string>;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[] | string>;
  };
};

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

function getRoleLabel(role: Role): string {
  return role.name ?? role.slug ?? `Role ${role.id}`;
}

function getErrorMessage(error: unknown): string {
  if (isAxiosError<BackendErrorData>(error)) {
    const data = error.response?.data;

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return "Unable to assign permissions. Please try again.";
}

export function BulkManageRolePermissionsDialog({
  open,
  onOpenChange,
  roles,
  onSuccess,
}: BulkManageRolePermissionsDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set());
  const [roleIdsError, setRoleIdsError] = useState<string | null>(null);
  const [permissionIdsError, setPermissionIdsError] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const permissionsQuery = usePermissions(
    {
      page: 1,
      per_page: PERMISSION_PAGE_SIZE,
      search: debouncedSearch || undefined,
    },
    {
      enabled: open,
      staleTime: 60_000,
    },
  );
  const bulkMutation = useBulkAssignRolePermissions();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setSelectedPermissionIds(new Set());
      setRoleIdsError(null);
      setPermissionIdsError(null);
      setFormError(null);
    }
  }, [open]);
  const permissions = useMemo(
    () => permissionsQuery.data?.items ?? [],
    [permissionsQuery.data?.items],
  );
  const roleIds = useMemo(() => roles.map((role) => role.id), [roles]);
  const availablePermissionIds = useMemo(
    () => new Set(permissions.map((permission) => String(permission.id))),
    [permissions],
  );

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setRoleIdsError(null);
    setPermissionIdsError(null);
    setFormError(null);

    const normalizedRoleIds = roleIds
      .map((id) => String(id).trim())
      .filter((id) => id.length > 0);

    if (normalizedRoleIds.length === 0) {
      setRoleIdsError("Select at least one role.");
      return;
    }

    if (new Set(normalizedRoleIds).size !== normalizedRoleIds.length) {
      setRoleIdsError("Selected roles must be unique.");
      return;
    }

    const normalizedPermissionIds = Array.from(selectedPermissionIds).map(
      (id) => String(id).trim(),
    );
    const invalidPermissionIds = normalizedPermissionIds.filter(
      (permissionId) =>
        permissionId.length === 0 || !availablePermissionIds.has(permissionId),
    );

    if (invalidPermissionIds.length > 0) {
      setPermissionIdsError(
        "One or more selected permissions are invalid. Refresh permissions and try again.",
      );
      return;
    }

    try {
      const result = await bulkMutation.mutateAsync({
        role_ids: normalizedRoleIds,
        permission_ids: normalizedPermissionIds,
      });

      const appliedCount = result.permission_ids.length;
      onSuccess?.(
        `Permissions synced for ${result.roles.length} role${result.roles.length === 1 ? "" : "s"}${
          appliedCount === 0
            ? " (cleared permissions)."
            : ` with ${appliedCount} permission${appliedCount === 1 ? "" : "s"}.`
        }`,
      );
      onOpenChange(false);
    } catch (error) {
      if (isAxiosError<BackendErrorData>(error)) {
        const details = error.response?.data?.error?.details;

        const roleMessage = getValidationMessage(details?.role_ids);
        const permissionMessage = getValidationMessage(details?.permission_ids);

        if (roleMessage) {
          setRoleIdsError(roleMessage);
        }

        if (permissionMessage) {
          setPermissionIdsError(permissionMessage);
        }

        if (roleMessage || permissionMessage) {
          return;
        }
      }

      setFormError(getErrorMessage(error));
    }
  };

  const isSubmitting = bulkMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>Bulk Manage Permissions</DialogTitle>
          <DialogDescription>
            Assign the same permission set to {roles.length} selected role
            {roles.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not update permissions</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4">
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
            <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Selected roles ({roles.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={String(role.id)}
                  className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700"
                >
                  {getRoleLabel(role)}
                </span>
              ))}
            </div>
            {roleIdsError ? (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {roleIdsError}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search permissions..."
              className="pl-10"
              disabled={isSubmitting}
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
            {permissionsQuery.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : permissions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {debouncedSearch
                  ? "No permissions found"
                  : "No permissions available"}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {permissions.map((permission) => {
                  const permissionId = String(permission.id);
                  const isSelected = selectedPermissionIds.has(permissionId);

                  return (
                    <label
                      key={permissionId}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                        isSelected && "bg-primary/5 dark:bg-primary/10",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePermission(permissionId)}
                        disabled={isSubmitting}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {permission.name ?? `Permission ${permission.id}`}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {permission.description ?? "No description"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPermissionIds.size} permission
              {selectedPermissionIds.size === 1 ? "" : "s"} selected
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedPermissionIds(new Set())}
              disabled={isSubmitting || selectedPermissionIds.size === 0}
            >
              Clear Selection
            </Button>
          </div>
          {permissionIdsError ? (
            <p className="text-xs text-red-600 dark:text-red-400">
              {permissionIdsError}
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Applying..." : "Apply Permissions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
