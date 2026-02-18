"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCenters } from "@/features/centers/hooks/use-centers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { Center } from "@/features/centers/types/center";

const DEFAULT_PER_PAGE = 10;

type CenterStatus = "active" | "inactive" | "pending" | string;

const statusConfig: Record<
  string,
  {
    variant: "success" | "warning" | "secondary" | "error" | "default";
    label: string;
  }
> = {
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

function getStatusConfig(status: CenterStatus) {
  const normalized = status.toLowerCase();
  return (
    statusConfig[normalized] || {
      variant: "default" as const,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    }
  );
}

type CentersTableProps = {
  onToggleStatus?: (_center: Center) => void;
  onBulkChangeStatus?: (_centers: Center[]) => void;
};

export function CentersTable({
  onToggleStatus,
  onBulkChangeStatus,
}: CentersTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedCenters, setSelectedCenters] = useState<
    Record<string, Center>
  >({});

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [page, perPage, query],
  );

  const { data, isLoading, isError, isFetching } = useCenters(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const selectedIds = useMemo(
    () => Object.keys(selectedCenters),
    [selectedCenters],
  );
  const selectedCount = selectedIds.length;
  const selectedCentersList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedCenters[id])
        .filter((center): center is Center => Boolean(center)),
    [selectedCenters, selectedIds],
  );
  const pageCenterIds = useMemo(
    () => items.map((center) => String(center.id)),
    [items],
  );
  const isAllPageSelected =
    pageCenterIds.length > 0 &&
    pageCenterIds.every((id) => Boolean(selectedCenters[id]));

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setSelectedCenters({});
  }, [page, perPage, query]);

  const toggleCenterSelection = (center: Center) => {
    const centerId = String(center.id);
    setSelectedCenters((prev) => {
      if (prev[centerId]) {
        const { [centerId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [centerId]: center };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedCenters((prev) => {
        if (pageCenterIds.length === 0) return prev;

        const next = { ...prev };
        pageCenterIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedCenters((prev) => {
      const next = { ...prev };
      items.forEach((center) => {
        next[String(center.id)] = center;
      });
      return next;
    });
  };

  return (
    <ListingCard>
      <ListingFilters
        activeCount={search.trim() ? 1 : 0}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={Boolean(search.trim())}
        onClear={() => {
          setSearch("");
          setQuery("");
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "center" : "centers"}
          </>
        }
        gridClassName="grid-cols-1"
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
            placeholder="Search centers..."
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
              Failed to load centers. Please try again.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "overflow-x-auto transition-opacity",
            isFetching && !isLoading ? "opacity-60" : "opacity-100",
          )}
        >
          <Table className="min-w-[780px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label="Select all centers on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Slug</TableHead>
                <TableHead className="font-medium">Type</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="w-10 text-right font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-6" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <EmptyState
                      title={query ? "No centers found" : "No centers yet"}
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Get started by creating your first center"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((center, index) => {
                  const shouldOpenUp =
                    items.length > 4 && index >= Math.max(0, items.length - 2);

                  return (
                    <TableRow
                      key={center.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(selectedCenters[String(center.id)])}
                          onChange={() => toggleCenterSelection(center)}
                          aria-label={`Select ${center.name ?? `center ${center.id}`}`}
                        />
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <Link
                          href={`/centers/${center.id}`}
                          className="font-medium text-gray-900 transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
                        >
                          {center.name ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {center.slug ?? "—"}
                      </TableCell>
                      <TableCell>
                        {center.type ? (
                          <Badge variant={getStatusConfig(center.type).variant}>
                            {getStatusConfig(center.type).label}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {center.status ? (
                          <Badge
                            variant={getStatusConfig(center.status).variant}
                          >
                            {getStatusConfig(center.status).label}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === center.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? center.id : null)
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
                              <Link
                                href={`/centers/${center.id}`}
                                className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => {
                                  setOpenMenuId(null);
                                }}
                              >
                                Manage
                              </Link>
                              {onToggleStatus ? (
                                <button
                                  type="button"
                                  className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onToggleStatus(center);
                                  }}
                                >
                                  Change status
                                </button>
                              ) : null}
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

      {selectedCount > 0 && onBulkChangeStatus ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOpenMenuId(null);
                onBulkChangeStatus(selectedCentersList);
              }}
              disabled={isLoadingState}
            >
              Change Status
            </Button>
          </div>
        </div>
      ) : null}

      {!isError && maxPage > 1 ? (
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
      ) : null}
    </ListingCard>
  );
}
