"use client";

import { useEffect, useMemo, useState } from "react";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RolePermissionsForm } from "@/features/role-permissions/components/RolePermissionsForm";
import { DeleteRoleDialog } from "@/features/roles/components/DeleteRoleDialog";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date-time";

const DEFAULT_PER_PAGE = 10;

export function RolesTable() {
  const [deletingRole, setDeletingRole] = useState<{
    id: string | number;
    name?: string | null;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [permissionsRoleId, setPermissionsRoleId] = useState<
    string | number | null
  >(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [page, perPage, query],
  );

  const { data, isLoading, isError, isFetching } = useRoles(params);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const isBusy = Boolean(deletingRole);
  const hasActiveFilters = search.trim().length > 0;
  const activeFilterCount = search.trim().length > 0 ? 1 : 0;

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6">
      <ListingCard>
        <ListingFilters
          activeCount={activeFilterCount}
          isFetching={isFetching}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          onClear={() => {
            setSearch("");
            setQuery("");
            setPage(1);
          }}
          summary={
            <>
              {total} {total === 1 ? "role" : "roles"}
            </>
          }
          gridClassName="grid-cols-1 md:grid-cols-3"
        >
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
              placeholder="Search by role name"
              className="pl-10 pr-9 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
                if (query) setQuery("");
              }}
              className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
                search.trim().length > 0
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              aria-label="Clear search"
              tabIndex={search.trim().length > 0 ? 0 : -1}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </ListingFilters>

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
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Slug</TableHead>
                  <TableHead className="font-medium">Description</TableHead>
                  <TableHead className="font-medium">Created At</TableHead>
                  <TableHead className="w-10 text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingState ? (
                  <>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index} className="animate-pulse">
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
                    <TableCell colSpan={5} className="h-48">
                      <EmptyState
                        title={query ? "No roles found" : "No roles yet"}
                        description="Create your first role with the Add Role button."
                        className="border-0 bg-transparent"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((role, index) => {
                    const shouldOpenUp = index >= Math.max(0, items.length - 2);

                    return (
                      <TableRow
                        key={role.id}
                        className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                      >
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
                          <div className="flex items-center justify-end">
                            <Dropdown
                              isOpen={openMenuId === role.id}
                              setIsOpen={(value) =>
                                setOpenMenuId(value ? role.id : null)
                              }
                            >
                              <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                                ⋮
                              </DropdownTrigger>
                              <DropdownContent
                                align="end"
                                className={cn(
                                  "w-44 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                  shouldOpenUp && "bottom-full mb-2 mt-0",
                                )}
                              >
                                <button
                                  className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setPermissionsRoleId(role.id);
                                  }}
                                >
                                  Permissions
                                </button>
                                <button
                                  className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setDeletingRole({
                                      id: role.id,
                                      name: role.name ?? null,
                                    });
                                  }}
                                  disabled={isBusy}
                                >
                                  Delete
                                </button>
                              </DropdownContent>
                            </Dropdown>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {!isError && maxPage > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <PaginationControls
              page={page}
              lastPage={maxPage}
              isFetching={isFetching}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={(value) => {
                setPerPage(value);
                setPage(1);
              }}
              size="sm"
            />
          </div>
        )}
      </ListingCard>

      <Dialog
        open={permissionsRoleId != null}
        onOpenChange={(open) => {
          if (!open) setPermissionsRoleId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Role Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for this role.
            </DialogDescription>
          </DialogHeader>
          {permissionsRoleId != null ? (
            <div className="max-h-[70vh] overflow-y-auto">
              <RolePermissionsForm roleId={String(permissionsRoleId)} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteRoleDialog
        open={Boolean(deletingRole)}
        onOpenChange={(open) => {
          if (!open) setDeletingRole(null);
        }}
        role={
          deletingRole
            ? { id: deletingRole.id, name: deletingRole.name ?? null }
            : null
        }
        onSuccess={() => setDeletingRole(null)}
      />
    </div>
  );
}
