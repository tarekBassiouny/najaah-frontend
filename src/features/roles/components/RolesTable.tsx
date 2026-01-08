"use client";

import { useMemo, useState } from "react";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { Button } from "@/components/ui/button";
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
import { formatDateTime } from "@/lib/format-date-time";

const DEFAULT_PER_PAGE = 10;

export function RolesTable() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);

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
  const nextDisabled = page * perPage >= total;
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Roles
          </h1>
          <p className="text-sm text-dark-5 dark:text-dark-4">
            Admin role list.
          </p>
        </div>
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
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Created At
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingState
              ? Array.from({ length: 5 }).map((_, index) => (
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
                    <TableCell className="px-3 py-2">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              : showEmptyState
                ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center gap-2 py-10 text-center">
                        <Icons.Table className="h-8 w-8 text-dark-4" />
                        <p className="text-sm font-medium text-dark dark:text-white">
                          No roles found
                        </p>
                        <p className="text-sm text-dark-5 dark:text-dark-4">
                          There are no roles matching the current criteria.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )
                : items.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="px-3 py-2 text-sm font-medium text-dark dark:text-white">
                      {role.id}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate px-3 py-2 text-sm">
                      {role.name ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate px-3 py-2 text-sm">
                      {role.slug ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate px-3 py-2 text-sm">
                      {role.description ?? "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {formatDateTime(role.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-dark-5 dark:text-dark-4">
          Page {meta?.page ?? page} of {maxPage}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1 || isFetching}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
            disabled={nextDisabled || isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
