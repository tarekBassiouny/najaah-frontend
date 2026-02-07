"use client";

import { useMemo, useState } from "react";
import {
  useApproveDeviceChangeRequest,
  useDeviceChangeRequests,
  usePreApproveDeviceChangeRequest,
  useRejectDeviceChangeRequest,
} from "@/features/device-change-requests/hooks/use-device-change-requests";
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
const BADGE_BASE =
  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap";

function formatBadgeLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getBadgeClass(value: string) {
  const normalized = value.toLowerCase();
  if (["active", "enabled", "approved"].includes(normalized)) {
    return `${BADGE_BASE} bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200`;
  }
  if (["pending", "processing"].includes(normalized)) {
    return `${BADGE_BASE} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200`;
  }
  if (["inactive", "disabled"].includes(normalized)) {
    return `${BADGE_BASE} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200`;
  }
  if (["failed", "rejected", "error"].includes(normalized)) {
    return `${BADGE_BASE} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200`;
  }
  return `${BADGE_BASE} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`;
}

export function DeviceChangeRequestsTable() {
  const { mutate: approveRequest, isPending: isApproving } =
    useApproveDeviceChangeRequest();
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectDeviceChangeRequest();
  const { mutate: preApproveRequest, isPending: isPreApproving } =
    usePreApproveDeviceChangeRequest();
  const [page, setPage] = useState(1);
  const [perPage] = useState(DEFAULT_PER_PAGE);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
    }),
    [page, perPage],
  );

  const { data, isLoading, isError, isFetching } =
    useDeviceChangeRequests(params);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const nextDisabled = page * perPage >= total;
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const isBusy = isApproving || isRejecting || isPreApproving;

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-dark dark:text-white">
            Device Change Requests
          </h1>
          <p className="text-sm text-dark-5 dark:text-dark-4">
            List of device change requests.
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
                Status
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                User
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Center
              </TableHead>
              <TableHead className="h-11 px-3 text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Created At
              </TableHead>
              <TableHead className="h-11 px-3 text-right text-xs font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-4">
                Actions
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
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                </TableRow>
              ))
            ) : showEmptyState ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Icons.Table className="h-8 w-8 text-dark-4" />
                    <p className="text-sm font-medium text-dark dark:text-white">
                      No device change requests found
                    </p>
                    <p className="text-sm text-dark-5 dark:text-dark-4">
                      There are no requests matching the current criteria.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((request) => {
                const status = String(
                  request.status ?? "pending",
                ).toLowerCase();
                const isFinal = ["approved", "rejected"].includes(status);
                return (
                  <TableRow key={request.id}>
                    <TableCell className="px-3 py-2 text-sm font-medium text-dark dark:text-white">
                      {request.id}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {request.status ? (
                        <span className={getBadgeClass(request.status)}>
                          {formatBadgeLabel(request.status)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {request.user_id ?? "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {request.center_id ?? "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm">
                      {formatDateTime(request.created_at)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            preApproveRequest({ requestId: request.id })
                          }
                          disabled={isBusy || isFinal}
                        >
                          Pre-Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            approveRequest({ requestId: request.id })
                          }
                          disabled={isBusy || isFinal}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            rejectRequest({
                              requestId: request.id,
                              payload: {
                                decision_reason: "Rejected by admin",
                              },
                            })
                          }
                          disabled={isBusy || isFinal}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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
