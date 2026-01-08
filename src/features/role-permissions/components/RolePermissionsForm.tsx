"use client";

import { useEffect, useMemo, useState } from "react";
import { useRolePermissions } from "@/features/role-permissions/hooks/use-role-permissions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type RolePermissionsFormProps = {
  roleId: string;
};

const PERMISSION_GROUPS = [
  {
    key: "admin",
    label: "Admin",
    subtitle: "Core administrative capabilities and account governance.",
    prefixes: ["admin."],
  },
  {
    key: "roles_permissions",
    label: "Roles & Permissions",
    subtitle: "Access control for roles, users, and permission data.",
    prefixes: ["role.", "permission."],
  },
  {
    key: "centers",
    label: "Centers",
    subtitle: "Center management and operational configuration.",
    prefixes: ["center."],
  },
  {
    key: "courses",
    label: "Courses",
    subtitle: "Course and section structure management.",
    prefixes: ["course.", "section."],
  },
  {
    key: "videos",
    label: "Videos",
    subtitle: "Video catalog administration and processing.",
    prefixes: ["video."],
  },
  {
    key: "pdfs",
    label: "PDFs",
    subtitle: "PDF library access and organization.",
    prefixes: ["pdf."],
  },
  {
    key: "instructors",
    label: "Instructors",
    subtitle: "Instructor access and profile management.",
    prefixes: ["instructor."],
  },
  {
    key: "enrollments",
    label: "Enrollments / Students",
    subtitle: "Enrollment and student lifecycle permissions.",
    prefixes: ["enrollment."],
  },
  {
    key: "requests_controls",
    label: "Requests & Controls",
    subtitle: "Device change and extra view request handling.",
    prefixes: ["device_change.", "extra_view."],
  },
  {
    key: "audit_system",
    label: "Audit & System",
    subtitle: "Audit trails and global system settings.",
    prefixes: ["audit.", "settings."],
  },
  {
    key: "other",
    label: "Other",
    subtitle: "Uncategorized permissions without a matching domain.",
    prefixes: [],
  },
];

function normalizeIds(ids: Array<number | string>) {
  return [...new Set(ids.map((id) => String(id)))].sort();
}

export function RolePermissionsForm({ roleId }: RolePermissionsFormProps) {
  const { roleQuery, updateMutation } = useRolePermissions(roleId);
  const { data, isLoading, isError, error } = roleQuery;

  const permissions = useMemo(() => data?.permissions ?? [], [data]);
  const rolePermissions = useMemo(() => data?.rolePermissions ?? [], [data]);
  const roleName = data?.role?.name ?? "Role";

  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([]);

  useEffect(() => {
    if (!data) return;
    const assignedNames = new Set(
      rolePermissions
        .map((permission) => permission.name)
        .filter((name): name is string => Boolean(name)),
    );
    const initial = permissions
      .filter((permission) => {
        if (!permission.name) return false;
        return assignedNames.has(permission.name);
      })
      .map((permission) => permission.id);
    setSelectedIds(initial);
  }, [data, permissions, rolePermissions]);

  const selectedSet = useMemo(
    () => new Set(selectedIds.map((id) => String(id))),
    [selectedIds],
  );

  const groupedPermissions = useMemo(() => {
    const groups = PERMISSION_GROUPS.map((group) => ({
      ...group,
      items: [] as typeof permissions,
    }));

    const otherGroup = groups.find((group) => group.key === "other");

    permissions.forEach((permission) => {
      const name = permission.name ?? "";
      const match =
        groups.find((group) =>
          group.prefixes.some((prefix) => name.startsWith(prefix)),
        ) ?? otherGroup;

      if (match) {
        match.items.push(permission);
      }
    });

    return groups.map((group) => ({
      ...group,
      items: group.items.sort((a, b) => {
        const nameA = a.name ?? "";
        const nameB = b.name ?? "";
        return nameA.localeCompare(nameB);
      }),
    }));
  }, [permissions]);

  const isDirty = useMemo(() => {
    const current = normalizeIds(selectedIds);
    const initial = normalizeIds(
      permissions
        .filter((permission) => {
          if (!permission.name) return false;
          return rolePermissions.some(
            (assigned) => assigned.name === permission.name,
          );
        })
        .map((permission) => permission.id),
    );
    if (current.length !== initial.length) return true;
    return current.some((id, index) => id !== initial[index]);
  }, [permissions, rolePermissions, selectedIds]);

  const handleToggle = (permissionId: number | string) => {
    setSelectedIds((prev) => {
      const normalized = String(permissionId);
      if (prev.some((id) => String(id) === normalized)) {
        return prev.filter((id) => String(id) !== normalized);
      }
      return [...prev, permissionId];
    });
  };

  const handleSave = () => {
    updateMutation.mutate(selectedIds);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Role Permissions
        </h1>
        <p className="text-sm text-dark-5 dark:text-dark-4">
          Manage permissions for {roleName}.
        </p>
      </div>

      {isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {(error as Error)?.message || "Failed to load role permissions."}
        </div>
      ) : null}

      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-full" />
            ))}
          </div>
        ) : permissions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-dark-5 dark:border-gray-700 dark:text-dark-4">
            No permissions available.
          </div>
        ) : (
          groupedPermissions.map((group) => (
            <section
              key={group.key}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-dark dark:text-white">
                  {group.label}
                </h3>
                <p className="text-sm text-dark-5 dark:text-dark-4">
                  {group.subtitle}
                </p>
              </div>

              {group.items.length === 0 ? (
                <div className="text-sm text-dark-5 dark:text-dark-4">
                  No permissions in this group.
                </div>
              ) : (
                <div className="space-y-2">
                  {group.items.map((permission) => {
                    const id = permission.id;
                    const checked = selectedSet.has(String(id));
                    const checkboxId = `perm-${String(id)}`;
                    const description =
                      permission.description ?? "No description provided";

                    return (
                      <label
                        key={checkboxId}
                        htmlFor={checkboxId}
                        className="flex items-center justify-between gap-4 rounded-md border border-transparent px-3 py-2 text-sm text-dark hover:border-gray-200 dark:text-white dark:hover:border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            id={checkboxId}
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={checked}
                            onChange={() => handleToggle(id)}
                          />
                          <div>
                            <div className="font-mono text-xs text-dark dark:text-white">
                              {permission.name ?? "—"}
                            </div>
                            <div className="text-xs text-dark-5 dark:text-dark-4">
                              {permission.slug ?? "—"}
                            </div>
                          </div>
                        </div>
                        <span
                          tabIndex={0}
                          title={description}
                          aria-label={description}
                          className="text-xs text-dark-5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-dark-4"
                        >
                          ?
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </section>
          ))
        )}
      </div>

      <div className="flex items-center justify-end">
        <Button
          onClick={handleSave}
          disabled={!isDirty || updateMutation.isPending || isLoading}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
