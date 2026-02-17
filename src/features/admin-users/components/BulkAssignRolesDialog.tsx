"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useRoles } from "@/features/roles/hooks/use-roles";
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
import { cn } from "@/lib/utils";
import { useBulkAssignAdminRoles } from "@/features/admin-users/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
import type { BulkAssignRolesResult } from "@/features/admin-users/types/admin-user";

const ROLES_PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 300;

type BulkAssignRolesDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  users: AdminUser[];
  onSuccess?: (_message: string) => void;
};

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }
  return "Unable to assign roles. Please try again.";
}

function roleName(role: {
  name?: string | null;
  slug?: string | null;
  id: string | number;
}) {
  return role.name ?? role.slug ?? `Role ${role.id}`;
}

function permissionCount(role: { permissions?: unknown }) {
  return Array.isArray(role.permissions) ? role.permissions.length : 0;
}

export function BulkAssignRolesDialog({
  open,
  onOpenChange,
  users,
  onSuccess,
}: BulkAssignRolesDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    new Set(),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkAssignRolesResult | null>(null);

  const bulkAssignMutation = useBulkAssignAdminRoles();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const resetMutationRef = useRef(bulkAssignMutation.reset);

  useEffect(() => {
    resetMutationRef.current = bulkAssignMutation.reset;
  }, [bulkAssignMutation.reset]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setSelectedRoleIds(new Set());
      setErrorMessage(null);
      setResult(null);
      resetMutationRef.current();
    }
  }, [open]);

  const rolesQuery = useRoles(
    {
      page: 1,
      per_page: ROLES_PAGE_SIZE,
      search: debouncedSearch || undefined,
    },
    {
      enabled: open,
      staleTime: 60_000,
    },
  );

  const roles = useMemo(
    () => rolesQuery.data?.items ?? [],
    [rolesQuery.data?.items],
  );

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handleAssign = async () => {
    setErrorMessage(null);
    setResult(null);

    if (selectedRoleIds.size === 0) {
      setErrorMessage("Select at least one role.");
      return;
    }

    if (users.length === 0) {
      setErrorMessage("No users selected.");
      return;
    }

    try {
      const response = await bulkAssignMutation.mutateAsync({
        user_ids: users.map((user) => user.id),
        role_ids: Array.from(selectedRoleIds),
      });

      setResult(response);

      const counts = response.counts;
      if (counts && (counts.failed ?? 0) === 0 && (counts.skipped ?? 0) === 0) {
        onSuccess?.("All users assigned to roles successfully.");
        onOpenChange(false);
        return;
      }

      onSuccess?.("Bulk role assignment processed.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const isSubmitting = bulkAssignMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Select roles to assign to {users.length} selected admin
            {users.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
              {errorMessage}
            </div>
          )}

          {result?.counts ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-900/40">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-center dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                    {result.counts.total ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center dark:border-emerald-900/40 dark:bg-emerald-900/20">
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Updated
                  </p>
                  <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-200">
                    {result.counts.updated ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center dark:border-amber-900/40 dark:bg-amber-900/20">
                  <p className="text-amber-700 dark:text-amber-300">Skipped</p>
                  <p className="mt-1 text-base font-semibold text-amber-800 dark:text-amber-200">
                    {result.counts.skipped ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center dark:border-red-900/40 dark:bg-red-900/20">
                  <p className="text-red-700 dark:text-red-300">Failed</p>
                  <p className="mt-1 text-base font-semibold text-red-800 dark:text-red-200">
                    {result.counts.failed ?? 0}
                  </p>
                </div>
              </div>

              {result.failed && result.failed.length > 0 && (
                <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                  <p className="font-medium">Failed:</p>
                  {result.failed.map((item, index) => (
                    <p key={`failed-${item.user_id}-${index}`}>
                      User #{item.user_id}: {item.reason ?? "Failed"}
                    </p>
                  ))}
                </div>
              )}

              {result.skipped && result.skipped.length > 0 && (
                <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-medium">Skipped:</p>
                  {result.skipped.map((item, index) => (
                    <p key={`skipped-${item.user_id}-${index}`}>
                      User #{item.user_id}: {item.reason ?? "Skipped"}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
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
                  placeholder="Search roles..."
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
                {rolesQuery.isLoading ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-10 w-full" />
                    ))}
                  </div>
                ) : roles.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {debouncedSearch ? "No roles found" : "No roles available"}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {roles.map((role) => {
                      const roleId = String(role.id);
                      const isSelected = selectedRoleIds.has(roleId);

                      return (
                        <label
                          key={role.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                            isSelected && "bg-primary/5 dark:bg-primary/10",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRole(roleId)}
                            disabled={isSubmitting}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {roleName(role)}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {(role.slug ?? "—") +
                                " • " +
                                permissionCount(role) +
                                " permissions"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedRoleIds.size > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRoleIds.size} role
                  {selectedRoleIds.size === 1 ? "" : "s"} selected
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleAssign}
              disabled={isSubmitting || selectedRoleIds.size === 0}
            >
              {isSubmitting ? "Assigning..." : "Assign Roles"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
