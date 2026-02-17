"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
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
import { listCenters } from "@/features/centers/services/centers.service";
import { useBulkAssignAdminCenters } from "@/features/admin-users/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
import type { BulkAssignCentersResult } from "@/features/admin-users/types/admin-user";

const CENTERS_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

type BulkAssignCentersDialogProps = {
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
  return "Unable to assign centers. Please try again.";
}

function normalizeCenterId(centerId: string): string | number {
  const parsed = Number(centerId);
  return Number.isNaN(parsed) ? centerId : parsed;
}

export function BulkAssignCentersDialog({
  open,
  onOpenChange,
  users,
  onSuccess,
}: BulkAssignCentersDialogProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkAssignCentersResult | null>(null);

  const bulkAssignMutation = useBulkAssignAdminCenters();

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
      setSelectedCenterId(null);
      setErrorMessage(null);
      setResult(null);
      resetMutationRef.current();
    }
  }, [open]);

  const centersQuery = useInfiniteQuery({
    queryKey: ["bulk-assign-centers", debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenters({
        page: pageParam,
        per_page: CENTERS_PAGE_SIZE,
        search: debouncedSearch || undefined,
      }),
    enabled: open,
    getNextPageParam: (lastPage) => {
      const page = lastPage.meta?.page ?? 1;
      const perPage = lastPage.meta?.per_page ?? CENTERS_PAGE_SIZE;
      const total = lastPage.meta?.total ?? 0;
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const centers = useMemo(() => {
    return (centersQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (center, index, array) =>
          array.findIndex((c) => String(c.id) === String(center.id)) === index,
      );
  }, [centersQuery.data?.pages]);

  const toggleCenter = (centerId: string) => {
    setSelectedCenterId((prev) => (prev === centerId ? null : centerId));
  };

  const handleAssign = async () => {
    setErrorMessage(null);
    setResult(null);

    if (!selectedCenterId) {
      setErrorMessage("Select a center.");
      return;
    }

    if (users.length === 0) {
      setErrorMessage("No users selected.");
      return;
    }

    try {
      const centerId = normalizeCenterId(selectedCenterId);
      const response = await bulkAssignMutation.mutateAsync({
        assignments: users.map((u) => ({
          user_id: u.id,
          center_id: centerId,
        })),
      });

      setResult(response);

      const counts = response.counts;
      if (counts && (counts.failed ?? 0) === 0 && (counts.skipped ?? 0) === 0) {
        onSuccess?.("All users assigned to centers successfully.");
        onOpenChange(false);
        return;
      }

      onSuccess?.("Bulk center assignment processed.");
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
          <DialogTitle>Assign Centers</DialogTitle>
          <DialogDescription>
            Select a center to assign to {users.length} selected admin
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
                <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
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
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search centers..."
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700">
                {centersQuery.isLoading ? (
                  <div className="space-y-2 p-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : centers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {debouncedSearch
                      ? "No centers found"
                      : "No centers available"}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {centers.map((center) => {
                      const centerId = String(center.id);
                      const isSelected = selectedCenterId === centerId;

                      return (
                        <label
                          key={center.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                            isSelected && "bg-primary/5 dark:bg-primary/10",
                          )}
                        >
                          <input
                            type="radio"
                            name="bulk-assign-center"
                            checked={isSelected}
                            onChange={() => toggleCenter(centerId)}
                            disabled={isSubmitting}
                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {center.name || `Center ${center.id}`}
                            </p>
                            {center.slug && (
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {center.slug}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}

                    {centersQuery.hasNextPage && (
                      <div className="p-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => centersQuery.fetchNextPage()}
                          disabled={centersQuery.isFetchingNextPage}
                        >
                          {centersQuery.isFetchingNextPage
                            ? "Loading..."
                            : "Load more"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedCenterId && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  1 center selected
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
              disabled={isSubmitting || !selectedCenterId}
            >
              {isSubmitting ? "Assigning..." : "Assign Center"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
