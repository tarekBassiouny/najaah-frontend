"use client";

import { useMemo, useState } from "react";
import {
  useAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useSyncAdminUserRoles,
} from "@/features/admin-users/hooks/use-admin-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_PER_PAGE = 10;

type AdminUserStatus = "active" | "inactive" | "pending" | string;

const statusConfig: Record<string, { variant: "success" | "warning" | "secondary" | "error" | "default"; label: string }> = {
  active: { variant: "success", label: "Active" },
  enabled: { variant: "success", label: "Enabled" },
  approved: { variant: "success", label: "Approved" },
  pending: { variant: "warning", label: "Pending" },
  processing: { variant: "warning", label: "Processing" },
  inactive: { variant: "default", label: "Inactive" },
  disabled: { variant: "default", label: "Disabled" },
  failed: { variant: "error", label: "Failed" },
  rejected: { variant: "error", label: "Rejected" },
  error: { variant: "error", label: "Error" },
};

function getStatusConfig(status: AdminUserStatus) {
  const normalized = status.toLowerCase();
  return statusConfig[normalized] || { variant: "default" as const, label: status.charAt(0).toUpperCase() + status.slice(1) };
}

export function AdminUsersTable() {
  const { mutate: createAdminUser, isPending: isCreating } = useCreateAdminUser();
  const { mutate: deleteAdminUser, isPending: isDeleting } = useDeleteAdminUser();
  const { mutate: syncRoles, isPending: isSyncing } = useSyncAdminUserRoles();
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    centerId: "",
  });
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogUserId, setRoleDialogUserId] = useState<string | number | null>(null);
  const [roleIdsInput, setRoleIdsInput] = useState("");
  const [roleDialogError, setRoleDialogError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
    }),
    [page, perPage],
  );

  const { data, isLoading, isError, isFetching } =
    useAdminUsers(params);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const isBusy = isCreating || isDeleting || isSyncing;

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    createAdminUser(
      {
        name: formData.name.trim(),
        email: formData.email.trim(),
        center_id: formData.centerId.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFormData({ name: "", email: "", centerId: "" });
        },
      },
    );
  };

  const openRoleDialog = (userId: string | number) => {
    setRoleDialogOpen(true);
    setRoleDialogUserId(userId);
    setRoleIdsInput("");
    setRoleDialogError(null);
  };

  const closeRoleDialog = () => {
    if (isBusy) return;
    setRoleDialogOpen(false);
    setRoleDialogUserId(null);
    setRoleDialogError(null);
  };

  const handleRoleSync = () => {
    if (!roleDialogUserId) return;
    const roleIds = roleIdsInput
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (roleIds.length === 0) {
      setRoleDialogError("Provide at least one role ID.");
      return;
    }

    setRoleDialogError(null);
    syncRoles(
      { userId: roleDialogUserId, roleIds },
      {
        onSuccess: () => {
          closeRoleDialog();
        },
        onError: (error) => {
          setRoleDialogError(
            (error as Error)?.message || "Failed to sync roles.",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={handleCreate}
            className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <div className="space-y-1">
              <Label htmlFor="admin-name">Name *</Label>
              <Input
                id="admin-name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g., Jane Admin"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="admin-center">Center ID</Label>
              <Input
                id="admin-center"
                value={formData.centerId}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, centerId: event.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={isCreating || !formData.name || !formData.email}>
                {isCreating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {total} {total === 1 ? "admin user" : "admin users"}
            </div>
          </div>

          {isError ? (
            <div className="p-6">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load admin users. Please try again.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="font-medium">ID</TableHead>
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Center</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingState ? (
                    <>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-48" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-24 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : showEmptyState ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48">
                        <EmptyState
                          title="No admin users yet"
                          description="Create your first admin user using the form above"
                          className="border-0 bg-transparent"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((user) => (
                      <TableRow key={user.id} className="group">
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {user.id}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {user.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {user.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          {user.status ? (
                            <Badge variant={getStatusConfig(user.status).variant}>
                              {getStatusConfig(user.status).label}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {user.center_id ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleDialog(user.id)}
                              disabled={isBusy}
                            >
                              Sync Roles
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Delete this admin user?")) {
                                  deleteAdminUser(user.id);
                                }
                              }}
                              disabled={isBusy}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {!isError && maxPage > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {maxPage}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || isFetching}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
                  disabled={page >= maxPage || isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={roleDialogOpen} onOpenChange={(open) => (!open ? closeRoleDialog() : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Roles</DialogTitle>
            <DialogDescription>Enter role IDs separated by commas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="role-ids">Role IDs</Label>
            <Input
              id="role-ids"
              value={roleIdsInput}
              onChange={(event) => setRoleIdsInput(event.target.value)}
              placeholder="e.g., 1,2,3"
            />
            {roleDialogError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {roleDialogError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRoleDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleRoleSync} disabled={isBusy}>
              {isSyncing ? "Syncing..." : "Sync Roles"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
