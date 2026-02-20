"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useRolePermissions } from "@/features/role-permissions/hooks/use-role-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { cn } from "@/lib/utils";

type RolePermissionsFormProps = {
  roleId: string;
  scopeCenterId?: string | number | null;
  readOnly?: boolean;
  onApplied?: (_summary: { added: number; removed: number }) => void;
};

const PERMISSION_GROUPS = [
  {
    key: "admin",
    label: "Admin",
    prefixes: ["admin."],
  },
  {
    key: "roles_permissions",
    label: "Roles & Permissions",
    prefixes: ["role.", "permission."],
  },
  {
    key: "centers",
    label: "Centers",
    prefixes: ["center."],
  },
  {
    key: "courses",
    label: "Courses",
    prefixes: ["course.", "section."],
  },
  {
    key: "videos",
    label: "Videos",
    prefixes: ["video."],
  },
  {
    key: "pdfs",
    label: "PDFs",
    prefixes: ["pdf."],
  },
  {
    key: "instructors",
    label: "Instructors",
    prefixes: ["instructor."],
  },
  {
    key: "enrollments",
    label: "Enrollments / Students",
    prefixes: ["enrollment."],
  },
  {
    key: "requests_controls",
    label: "Requests & Controls",
    prefixes: ["device_change.", "extra_view."],
  },
  {
    key: "audit_system",
    label: "Audit & System",
    prefixes: ["audit.", "settings."],
  },
  {
    key: "other",
    label: "Other",
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

function extractErrorMessage(error: unknown): string {
  if (isAxiosError<BackendErrorData>(error)) {
    const data = error.response?.data;

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return "Unable to update role permissions. Please try again.";
}

function getPermissionName(permission: PermissionItem): string {
  if (permission.name && permission.name.trim()) {
    return permission.name.trim();
  }

  if (permission.slug && permission.slug.trim()) {
    return permission.slug.trim();
  }

  return `Permission ${permission.id}`;
}

function getPermissionGroupLabel(permissionName?: string | null): string {
  const value = String(permissionName ?? "")
    .trim()
    .toLowerCase();

  if (!value) return "Other";

  const group = PERMISSION_GROUPS.find((item) =>
    item.prefixes.some((prefix) => value.startsWith(prefix)),
  );

  return group?.label ?? "Other";
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
  const { roleQuery, updateMutation } = useRolePermissions(roleId, {
    centerId: scopeCenterId ?? null,
  });
  const { data, isLoading, isError, error } = roleQuery;

  const permissions = useMemo(() => data?.permissions ?? [], [data]);
  const rolePermissions = useMemo(() => data?.rolePermissions ?? [], [data]);
  const roleName = data?.role?.name ?? "Role";

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
        return permission ? getPermissionName(permission) : `Permission ${id}`;
      });

    const removed = Array.from(initialSet)
      .filter((id) => !selectedSet.has(id))
      .map((id) => {
        const permission = permissionById.get(id);
        return permission ? getPermissionName(permission) : `Permission ${id}`;
      });

    return {
      added,
      removed,
    };
  }, [initialSet, permissions, selectedSet]);

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
        return permission ? getPermissionName(permission) : `Permission ${id}`;
      });

    const removed = Array.from(initialSet)
      .filter((id) => !pendingSet.has(id))
      .map((id) => {
        const permission = permissionById.get(id);
        return permission ? getPermissionName(permission) : `Permission ${id}`;
      });

    return {
      added,
      removed,
    };
  }, [initialSet, pendingSet, permissions]);

  const isDirty = useMemo(() => {
    const current = normalizeIds(selectedIds);
    const initial = normalizeIds(initialSelectedIds);

    if (current.length !== initial.length) return true;
    return current.some((id, index) => id !== initial[index]);
  }, [initialSelectedIds, selectedIds]);

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
        "One or more selected permissions are no longer available. Refresh and try again.",
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

        const message = extractErrorMessage(error);
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
              Sync Permissions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {readOnly
                ? `Viewing permissions for ${roleName}.`
                : `Update permissions for ${roleName} using a searchable permission list.`}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 pb-1 text-xs text-gray-400">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {selectedSet.size} selected
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {permissions.length} total
              </span>
            </div>
          </div>
        </div>
      </div>

      {readOnly ? (
        <Alert>
          <AlertTitle>Read only</AlertTitle>
          <AlertDescription>
            You can view assigned permissions, but updates require system-scoped
            access.
          </AlertDescription>
        </Alert>
      ) : null}

      {permissionIdsError ? (
        <Alert variant="destructive">
          <AlertTitle>Permission validation failed</AlertTitle>
          <AlertDescription>{permissionIdsError}</AlertDescription>
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not update permissions</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {(error as Error)?.message || "Failed to load role permissions."}
        </div>
      ) : null}

      {!readOnly ? (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="permissions-search">Search permissions</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleSelectAll}
                disabled={permissions.length === 0 || isLoading}
              >
                Select all
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleClear}
                disabled={selectedSet.size === 0 || isLoading}
              >
                Clear
              </Button>
            </div>
          </div>
          <Input
            id="permissions-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by permission, slug, or description..."
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use search to filter permissions quickly. Review changes before
            saving.
          </p>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <Label htmlFor="permissions-search-readonly">
            Search permissions
          </Label>
          <Input
            id="permissions-search-readonly"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by permission, slug, or description..."
            disabled={isLoading}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        {selectedPermissions.length > 0 ? (
          selectedPermissions.map((permission) => (
            <Badge key={`selected-${permission.id}`} variant="secondary">
              {getPermissionName(permission)}
            </Badge>
          ))
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No permissions selected.
          </p>
        )}
      </div>

      {!readOnly &&
      (permissionChanges.added.length > 0 ||
        permissionChanges.removed.length > 0) ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Permission changes:</span>
            <span className="text-green-700 dark:text-green-300">
              +{permissionChanges.added.length} added
            </span>
            <span className="text-red-700 dark:text-red-300">
              -{permissionChanges.removed.length} removed
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
                + more
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
              ? "No permissions match your search."
              : "No permissions available."}
          </p>
        ) : (
          filteredPermissions.map((permission) => {
            const permissionId = String(permission.id);
            const isSelected = selectedSet.has(permissionId);
            const permissionName = getPermissionName(permission);
            const slug = String(permission.slug ?? "").trim();
            const groupLabel = getPermissionGroupLabel(permission.name ?? slug);
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
                      {slug || "-"} · {groupLabel}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    aria-label={`Select ${permissionName}`}
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
            Continue
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
            <DialogTitle>Confirm Permission Changes</DialogTitle>
            <DialogDescription>
              Review permission updates for {roleName} before applying.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/60">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {roleName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pendingPermissionIds.length} permissions selected
            </p>
          </div>

          {confirmError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not sync permissions</AlertTitle>
              <AlertDescription>{confirmError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-green-700 dark:text-green-300">
                Permissions to add
              </p>
              <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-200">
                {pendingPermissionChanges.added.length > 0 ? (
                  pendingPermissionChanges.added.map((permission) => (
                    <li key={`confirm-add-${permission}`}>+ {permission}</li>
                  ))
                ) : (
                  <li>None</li>
                )}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-red-700 dark:text-red-300">
                Permissions to remove
              </p>
              <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-200">
                {pendingPermissionChanges.removed.length > 0 ? (
                  pendingPermissionChanges.removed.map((permission) => (
                    <li key={`confirm-remove-${permission}`}>- {permission}</li>
                  ))
                ) : (
                  <li>None</li>
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
            I understand this will change role access permissions.
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSave}
              disabled={!confirmChecked || updateMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {updateMutation.isPending ? "Confirming..." : "Confirm & Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
