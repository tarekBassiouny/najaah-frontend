"use client";

import { usePermissions } from "@/features/permissions/hooks/use-permissions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as Icons from "@/components/Layouts/sidebar/icons";

export function PermissionsTable() {
  const { data, isLoading, isError, isFetching } = usePermissions();
  const items = data?.items ?? [];
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Permissions
        </h1>
        <p className="text-sm text-dark-5 dark:text-dark-4">
          Admin permission list.
        </p>
      </div>

      {isError ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-dark-5 dark:border-gray-700 dark:bg-gray-800 dark:text-dark-4">
          Failed to load data. Please try again later.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                ID
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Name
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Slug
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Description
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingState ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                </TableRow>
              ))
            ) : showEmptyState ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Icons.Table className="h-8 w-8 text-dark-4" />
                    <p className="text-sm font-medium text-dark dark:text-white">
                      No permissions found
                    </p>
                    <p className="text-sm text-dark-5 dark:text-dark-4">
                      There are no permissions matching the current criteria.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell className="px-3 py-2 text-sm font-medium text-dark dark:text-white">
                    {permission.id}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate px-3 py-2 text-sm">
                    {permission.name ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate px-3 py-2 text-sm">
                    {permission.slug ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate px-3 py-2 text-sm">
                    {permission.description ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
