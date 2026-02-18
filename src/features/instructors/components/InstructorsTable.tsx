"use client";

import { useEffect, useMemo, useState } from "react";
import { useInstructors } from "@/features/instructors/hooks/use-instructors";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Instructor } from "@/features/instructors/types/instructor";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";

type StatusVariant = "success" | "warning" | "secondary" | "error" | "default";

type InstructorStatus = string | number | null | undefined;

const statusConfig: Record<string, { variant: StatusVariant; label: string }> =
  {
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
    banned: { variant: "error", label: "Banned" },
  };

function resolveStatusLabel(
  status: InstructorStatus,
  statusLabel?: string | null,
) {
  const raw = String(status ?? "")
    .trim()
    .toLowerCase();
  const config = statusConfig[raw] ?? {
    variant: "default" as const,
    label: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Unknown",
  };

  if (typeof statusLabel === "string" && statusLabel.trim()) {
    return { ...config, label: statusLabel.trim() };
  }

  return config;
}

function getInitials(value: string): string {
  const parts = value.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const StatusIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.6}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8.25 18.75h7.5a2.25 2.25 0 002.25-2.25v-1.125a2.25 2.25 0 00-2.25-2.25h-7.5A2.25 2.25 0 006 15.375V16.5a2.25 2.25 0 002.25 2.25zM8.25 10.875h7.5a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25h-7.5A2.25 2.25 0 006 7.5v1.125a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

type InstructorsTableProps = {
  centerId?: string | number;
  onEdit?: (_instructor: Instructor) => void;
  onAssignCenters?: (_instructor: Instructor) => void;
  onToggleStatus?: (_instructor: Instructor) => void;
  onDelete?: (_instructor: Instructor) => void;
  onBulkAssignCenters?: (_instructors: Instructor[]) => void;
  onBulkChangeStatus?: (_instructors: Instructor[]) => void;
};

export function InstructorsTable({
  centerId: centerIdProp,
  onEdit,
  onAssignCenters,
  onToggleStatus,
  onDelete,
  onBulkAssignCenters,
  onBulkChangeStatus,
}: InstructorsTableProps) {
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedInstructors, setSelectedInstructors] = useState<
    Record<string, Instructor>
  >({});

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: centerId,
      status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
    }),
    [page, perPage, query, centerId, statusFilter],
  );

  const { data, isLoading, isError, isFetching } = useInstructors(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 || statusFilter !== ALL_STATUS_VALUE;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0);
  const selectedIds = useMemo(
    () => Object.keys(selectedInstructors),
    [selectedInstructors],
  );
  const selectedCount = selectedIds.length;
  const selectedInstructorsList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedInstructors[id])
        .filter((instructor): instructor is Instructor => Boolean(instructor)),
    [selectedIds, selectedInstructors],
  );
  const pageInstructorIds = useMemo(
    () => items.map((instructor) => String(instructor.id)),
    [items],
  );
  const isAllPageSelected =
    pageInstructorIds.length > 0 &&
    pageInstructorIds.every((id) => selectedInstructors[id]);

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [centerId]);

  useEffect(() => {
    setSelectedInstructors({});
  }, [centerId, page, perPage, query, statusFilter]);

  const toggleInstructorSelection = (instructor: Instructor) => {
    const instructorId = String(instructor.id);
    setSelectedInstructors((prev) => {
      if (prev[instructorId]) {
        const { [instructorId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [instructorId]: instructor };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedInstructors((prev) => {
        if (pageInstructorIds.length === 0) return prev;
        const next = { ...prev };
        pageInstructorIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedInstructors((prev) => {
      const next = { ...prev };
      items.forEach((instructor) => {
        next[String(instructor.id)] = instructor;
      });
      return next;
    });
  };

  return (
    <ListingCard>
      <ListingFilters
        activeCount={activeFilterCount}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearch("");
          setQuery("");
          setStatusFilter(ALL_STATUS_VALUE);
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "instructor" : "instructors"}
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
            placeholder="Search by name or email"
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

        <CenterPicker
          className="w-full min-w-0"
          hideWhenCenterScoped={false}
          selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setPage(1);
            setStatusFilter(value);
          }}
        >
          <SelectTrigger
            className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            icon={<StatusIcon />}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>Status</SelectItem>
            <SelectItem value="1">Active</SelectItem>
            <SelectItem value="0">Inactive</SelectItem>
            <SelectItem value="2">Banned</SelectItem>
          </SelectContent>
        </Select>
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load instructors. Please try again.
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
        <div
          className={cn(
            "overflow-x-auto transition-opacity",
            isFetching && !isLoading ? "opacity-60" : "opacity-100",
          )}
        >
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label="Select all instructors on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">Instructor</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Center</TableHead>
                {(onEdit || onDelete || onAssignCenters || onToggleStatus) && (
                  <TableHead className="w-10 text-right font-medium">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      <TableCell>
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-44" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      {(onEdit ||
                        onDelete ||
                        onAssignCenters ||
                        onToggleStatus) && (
                        <TableCell>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48">
                    <EmptyState
                      title={
                        query ? "No instructors found" : "No instructors yet"
                      }
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Add an instructor to get started"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((instructor, index) => {
                  const status = resolveStatusLabel(instructor.status);
                  const shouldOpenUp =
                    index >= Math.max(0, items.length - 2);

                  return (
                    <TableRow
                      key={instructor.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(
                            selectedInstructors[String(instructor.id)],
                          )}
                          onChange={() => toggleInstructorSelection(instructor)}
                          aria-label={`Select ${instructor.name ?? `instructor ${instructor.id}`}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white">
                            {getInitials(
                              instructor.name ??
                                instructor.email ??
                                `Instructor ${instructor.id ?? ""}`,
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {instructor.name ?? "—"}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {instructor.title ?? "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {instructor.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {instructor.status ? (
                          <Badge variant={status.variant}>{status.label}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {instructor.center_id != null
                          ? `Center #${instructor.center_id}`
                          : "—"}
                      </TableCell>
                      {(onEdit ||
                        onDelete ||
                        onAssignCenters ||
                        onToggleStatus) && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Dropdown
                              isOpen={openMenuId === instructor.id}
                              setIsOpen={(value) =>
                                setOpenMenuId(value ? instructor.id : null)
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
                                {onEdit && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit?.(instructor);
                                    }}
                                  >
                                    Edit profile
                                  </button>
                                )}
                                {onAssignCenters && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onAssignCenters?.(instructor);
                                    }}
                                  >
                                    Assign centers
                                  </button>
                                )}
                                {onToggleStatus && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onToggleStatus?.(instructor);
                                    }}
                                  >
                                    Change status
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onDelete?.(instructor);
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </DropdownContent>
                            </Dropdown>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkAssignCenters?.(selectedInstructorsList)}
              disabled={isLoadingState}
            >
              Assign Centers
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkChangeStatus?.(selectedInstructorsList)}
              disabled={isLoadingState}
            >
              Change Status
            </Button>
          </div>
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
  );
}
