"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
} from "@/features/roles/hooks/use-roles";
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
import { formatDateTime } from "@/lib/format-date-time";

const DEFAULT_PER_PAGE = 10;

export function RolesTable() {
  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
    }),
    [page, perPage],
  );

  const { data, isLoading, isError, isFetching } = useRoles(params);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const isBusy = isCreating || isDeleting;

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) return;

    createRole(
      {
        name: formData.name.trim(),
        slug: formData.slug.trim() || undefined,
        description: formData.description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFormData({ name: "", slug: "", description: "" });
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
            className="grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto]"
          >
            <div className="space-y-1">
              <Label htmlFor="role-name">Name *</Label>
              <Input
                id="role-name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g., Content Admin"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-slug">Slug</Label>
              <Input
                id="role-slug"
                value={formData.slug}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, slug: event.target.value }))
                }
                placeholder="content_admin"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={formData.description}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Short description"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isCreating || !formData.name.trim()}
              >
                {isCreating ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {total} {total === 1 ? "role" : "roles"}
            </div>
          </div>

          {isError ? (
            <div className="p-6">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load roles. Please try again.
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
                    <TableHead className="font-medium">Slug</TableHead>
                    <TableHead className="font-medium">Description</TableHead>
                    <TableHead className="font-medium">Created At</TableHead>
                    <TableHead className="text-right font-medium">
                      Actions
                    </TableHead>
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
                            <Skeleton className="h-4 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-48" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-28" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="ml-auto h-8 w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : showEmptyState ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48">
                        <EmptyState
                          title="No roles yet"
                          description="Create your first role using the form above"
                          className="border-0 bg-transparent"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((role) => (
                      <TableRow key={role.id} className="group">
                        <TableCell className="font-medium text-gray-900 dark:text-white">
                          {role.id}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {role.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {role.slug ?? "—"}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {role.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {formatDateTime(role.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <Link href={`/roles/${role.id}/permissions`}>
                              <Button variant="ghost" size="sm">
                                Permissions
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Delete this role?")) {
                                  deleteRole(role.id);
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
    </div>
  );
}
