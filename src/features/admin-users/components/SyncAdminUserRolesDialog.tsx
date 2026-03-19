"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRoles } from "@/features/roles/hooks/use-roles";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
import type { Role } from "@/features/roles/types/role";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

function getInitials(value: string) {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "AU";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type SyncAdminUserRolesDialogProps = {
  user?: AdminUser | null;
  initialRoleIds?: string[];
  scopeCenterId?: string | number | null;
  onContinue?: (_value: {
    selectedRoleIds: string[];
    addedRoles: string[];
    removedRoles: string[];
  }) => void;
  onClose: () => void;
};

function getRoleLabel(role: Role, t: TranslateFunction) {
  return (
    role.name ??
    role.slug ??
    t("pages.admins.fallbacks.roleById", { id: role.id })
  );
}

export function SyncAdminUserRolesDialog({
  user,
  initialRoleIds,
  scopeCenterId,
  onContinue,
  onClose,
}: SyncAdminUserRolesDialogProps) {
  const { t } = useTranslation();
  const emptyValue = t("pages.admins.fallbacks.noValue");

  const [search, setSearch] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [initialSelectedRoleIds, setInitialSelectedRoleIds] = useState<
    string[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: rolesData, isLoading: isRolesLoading } = useRoles(
    { page: 1, per_page: 20 },
    { centerId: scopeCenterId ?? null },
    { staleTime: 60_000 },
  );
  const roleOptions = useMemo(() => rolesData?.items ?? [], [rolesData]);

  const userRoleSlugs = useMemo(() => {
    const slugsFromRoles = Array.isArray(user?.roles)
      ? user.roles
          .map((role) => {
            if (typeof role === "string") return role;
            if (role?.slug) return String(role.slug);
            if (role?.name) return String(role.name);
            return null;
          })
          .filter((value): value is string => Boolean(value))
      : [];

    const slugsFromRolesWithPermissions = Array.isArray(
      user?.roles_with_permissions,
    )
      ? user.roles_with_permissions
          .map((role) => role.slug)
          .filter((value): value is string => Boolean(value))
      : [];

    return new Set(
      [...slugsFromRoles, ...slugsFromRolesWithPermissions].map((value) =>
        value.trim().toLowerCase(),
      ),
    );
  }, [user?.roles, user?.roles_with_permissions]);

  useEffect(() => {
    if (roleOptions.length === 0) return;
    if (Array.isArray(initialRoleIds)) {
      setSelectedRoleIds(initialRoleIds);
      setInitialSelectedRoleIds(initialRoleIds);
      return;
    }
    const initialIds = roleOptions
      .filter((role) => {
        const slug = role.slug ? String(role.slug).trim().toLowerCase() : "";
        const name = role.name ? String(role.name).trim().toLowerCase() : "";
        return userRoleSlugs.has(slug) || userRoleSlugs.has(name);
      })
      .map((role) => String(role.id));
    setSelectedRoleIds(initialIds);
    setInitialSelectedRoleIds(initialIds);
  }, [initialRoleIds, roleOptions, userRoleSlugs]);

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roleOptions;
    return roleOptions.filter((role) => {
      const name = String(role.name ?? "").toLowerCase();
      const slug = String(role.slug ?? "").toLowerCase();
      const description = String(role.description ?? "").toLowerCase();
      return (
        name.includes(query) ||
        slug.includes(query) ||
        description.includes(query) ||
        getRolePermissions(role).some((permission) =>
          permission.toLowerCase().includes(query),
        )
      );
    });
  }, [roleOptions, search]);

  const selectedRoles = useMemo(
    () =>
      roleOptions.filter((role) => selectedRoleIds.includes(String(role.id))),
    [roleOptions, selectedRoleIds],
  );

  const initialRoles = useMemo(
    () =>
      roleOptions.filter((role) =>
        initialSelectedRoleIds.includes(String(role.id)),
      ),
    [initialSelectedRoleIds, roleOptions],
  );

  const selectedPermissions = useMemo(() => {
    const permissions = selectedRoles.flatMap((role) =>
      getRolePermissions(role),
    );
    return new Set(permissions);
  }, [selectedRoles]);

  const initialPermissions = useMemo(() => {
    const permissions = initialRoles.flatMap((role) =>
      getRolePermissions(role),
    );
    return new Set(permissions);
  }, [initialRoles]);

  const permissionChanges = useMemo(() => {
    const added = Array.from(selectedPermissions).filter(
      (permission) => !initialPermissions.has(permission),
    );
    const removed = Array.from(initialPermissions).filter(
      (permission) => !selectedPermissions.has(permission),
    );

    return {
      added,
      removed,
    };
  }, [initialPermissions, selectedPermissions]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleContinue = () => {
    if (selectedRoleIds.length === 0) {
      setErrorMessage(t("pages.admins.dialogs.syncRoles.errors.selectRole"));
      return;
    }

    const addedRoles = selectedRoleIds
      .filter((roleId) => !initialSelectedRoleIds.includes(roleId))
      .map((roleId) => {
        const role = roleOptions.find((item) => String(item.id) === roleId);
        return role?.name ?? role?.slug ?? roleId;
      });
    const removedRoles = initialSelectedRoleIds
      .filter((roleId) => !selectedRoleIds.includes(roleId))
      .map((roleId) => {
        const role = roleOptions.find((item) => String(item.id) === roleId);
        return role?.name ?? role?.slug ?? roleId;
      });

    setErrorMessage(null);
    onContinue?.({
      selectedRoleIds,
      addedRoles,
      removedRoles,
    });
  };

  const handleClose = () => {
    setErrorMessage(null);
    setSelectedRoleIds([]);
    setSearch("");
    onClose();
  };

  return (
    <>
      <DialogHeader className="space-y-3">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold uppercase text-primary">
            {getInitials(user?.name ?? t("pages.admins.fallbacks.adminUser"))}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              {t("pages.admins.dialogs.syncRoles.title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("pages.admins.dialogs.syncRoles.description", {
                name:
                  user?.name ??
                  t("pages.admins.fallbacks.userById", {
                    id: user?.id ?? "",
                  }),
              })}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 pb-3 text-xs text-gray-400">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.admins.dialogs.syncRoles.summary.roles", {
                  count: selectedRoleIds.length,
                })}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                {t("pages.admins.dialogs.syncRoles.summary.permissions", {
                  count: selectedPermissions.size,
                })}
              </span>
            </div>
          </div>
        </div>
      </DialogHeader>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>
            {t("pages.admins.dialogs.syncRoles.errors.errorTitle")}
          </AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="roles-search">
              {t("pages.admins.dialogs.syncRoles.search.label")}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setSelectedRoleIds(roleOptions.map((role) => String(role.id)))
                }
                disabled={roleOptions.length === 0}
              >
                {t("pages.admins.dialogs.syncRoles.actions.selectAll")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setSelectedRoleIds([])}
                disabled={selectedRoleIds.length === 0}
              >
                {t("pages.admins.dialogs.syncRoles.actions.clear")}
              </Button>
            </div>
          </div>
          <Input
            id="roles-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("pages.admins.dialogs.syncRoles.search.placeholder")}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("pages.admins.dialogs.syncRoles.search.hint")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          {selectedRoles.length > 0 ? (
            selectedRoles.map((role) => (
              <Badge key={`selected-${role.id}`} variant="secondary">
                {getRoleLabel(role, t)}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("pages.admins.dialogs.syncRoles.empty.selected")}
            </p>
          )}
        </div>

        {(permissionChanges.added.length > 0 ||
          permissionChanges.removed.length > 0) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">
                {t("pages.admins.dialogs.syncRoles.changes.title")}
              </span>
              <span className="text-green-700 dark:text-green-300">
                {t("pages.admins.dialogs.syncRoles.changes.added", {
                  count: permissionChanges.added.length,
                })}
              </span>
              <span className="text-red-700 dark:text-red-300">
                {t("pages.admins.dialogs.syncRoles.changes.removed", {
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
              {permissionChanges.added.length +
                permissionChanges.removed.length >
              12 ? (
                <Badge variant="outline" className="text-[11px]">
                  {t("pages.admins.dialogs.syncRoles.changes.more")}
                </Badge>
              ) : null}
            </div>
          </div>
        )}

        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white/80 p-2 dark:border-gray-700 dark:bg-gray-900/40">
          {isRolesLoading ? (
            <p className="p-2 text-sm text-gray-500 dark:text-gray-400">
              {t("pages.admins.dialogs.syncRoles.empty.loading")}
            </p>
          ) : filteredRoles.length === 0 ? (
            <p className="p-2 text-sm text-gray-500 dark:text-gray-400">
              {search.trim()
                ? t("pages.admins.dialogs.syncRoles.empty.noResults")
                : t("pages.admins.dialogs.syncRoles.empty.noRoles")}
            </p>
          ) : (
            filteredRoles.map((role) => {
              const roleId = String(role.id);
              const isSelected = selectedRoleIds.includes(roleId);
              const permissions = getRolePermissions(role);
              const visiblePermissions = permissions.slice(0, 4);
              const hiddenPermissionsCount = Math.max(
                0,
                permissions.length - visiblePermissions.length,
              );

              return (
                <button
                  key={roleId}
                  type="button"
                  onClick={() => toggleRole(roleId)}
                  className={`w-full rounded-md border p-3 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getRoleLabel(role, t)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("pages.admins.dialogs.syncRoles.roleMeta", {
                          slug: role.slug ?? emptyValue,
                          count: permissions.length,
                        })}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      aria-label={t(
                        "pages.admins.dialogs.syncRoles.actions.selectRole",
                        {
                          name: getRoleLabel(role, t),
                        },
                      )}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>

                  {permissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {visiblePermissions.map((permission) => (
                        <Badge
                          key={`${roleId}-${permission}`}
                          variant="outline"
                        >
                          {permission}
                        </Badge>
                      ))}
                      {hiddenPermissionsCount > 0 && (
                        <Badge variant="outline" title={permissions.join(", ")}>
                          {t("pages.admins.dialogs.syncRoles.roleMore", {
                            count: hiddenPermissionsCount,
                          })}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={handleClose}>
          {t("common.actions.cancel")}
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedRoleIds.length === 0}
        >
          {t("pages.admins.dialogs.syncRoles.actions.continue")}
        </Button>
      </DialogFooter>
    </>
  );
}

function getRolePermissions(role: Role): string[] {
  if (!Array.isArray(role.permissions)) {
    return [];
  }

  return role.permissions
    .map((permission) => {
      if (typeof permission === "string") return permission;
      if (permission?.name) return String(permission.name);
      if (permission?.slug) return String(permission.slug);
      return null;
    })
    .filter((value): value is string => Boolean(value));
}
