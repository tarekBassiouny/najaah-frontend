"use client";

import { useEffect, useMemo, useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { setTenantState } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";
import { useInstructors } from "@/features/instructors/hooks/use-instructors";
import { getInstructorApiErrorMessage } from "@/features/instructors/lib/api-error";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import type { Instructor } from "@/features/instructors/types/instructor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  scopeCenterId?: string | number | null;
  showCenterFilter?: boolean;
  onEdit?: (_instructor: Instructor) => void;
  onDelete?: (_instructor: Instructor) => void;
};

export function InstructorsTable({
  scopeCenterId = null,
  showCenterFilter = true,
  onEdit,
  onDelete,
}: InstructorsTableProps) {
  const tenant = useTenant();
  const effectiveScopeCenterId = scopeCenterId ?? null;
  const selectedCenterId =
    effectiveScopeCenterId == null
      ? (tenant.centerId ?? null)
      : effectiveScopeCenterId;
  const hasSelectedCenter = selectedCenterId != null;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: selectedCenterId ?? undefined,
      status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
    }),
    [page, perPage, query, selectedCenterId, statusFilter],
  );

  const { data, isLoading, isError, isFetching, error } = useInstructors(
    params,
    { centerId: selectedCenterId },
    { enabled: hasSelectedCenter },
  );

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showCenterSelectionState =
    !isLoadingState && !isError && !hasSelectedCenter;
  const showEmptyState =
    !isLoadingState && !isError && hasSelectedCenter && items.length === 0;
  const columnCount = onEdit || onDelete ? 5 : 4;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== ALL_STATUS_VALUE ||
    (showCenterFilter &&
      effectiveScopeCenterId == null &&
      selectedCenterId != null);
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (showCenterFilter &&
    effectiveScopeCenterId == null &&
    selectedCenterId != null
      ? 1
      : 0);

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
  }, [selectedCenterId]);

  const errorMessage = getInstructorApiErrorMessage(
    error,
    "Failed to load instructors. Please try again.",
  );

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

          if (showCenterFilter && effectiveScopeCenterId == null) {
            setTenantState({ centerId: null, centerName: null });
          }
        }}
        summary={
          hasSelectedCenter ? (
            <>
              {total} {total === 1 ? "instructor" : "instructors"}
            </>
          ) : (
            <>Select a center</>
          )
        }
        gridClassName={
          showCenterFilter && effectiveScopeCenterId == null
            ? "grid-cols-1 md:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2"
        }
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

        {showCenterFilter && effectiveScopeCenterId == null ? (
          <CenterPicker
            className="w-full min-w-0"
            hideWhenCenterScoped={false}
            selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        ) : null}

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
              {errorMessage}
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
                <TableHead className="font-medium">Instructor</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Center</TableHead>
                {(onEdit || onDelete) && (
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
                      {(onEdit || onDelete) && (
                        <TableCell>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </>
              ) : showCenterSelectionState ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-48">
                    <EmptyState
                      title="Select a center first"
                      description="Choose a center to load instructors."
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-48">
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
                  const shouldOpenUp = index >= Math.max(0, items.length - 2);

                  return (
                    <TableRow
                      key={instructor.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
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
                        {effectiveScopeCenterId != null
                          ? "Current Center"
                          : instructor.center_id != null
                            ? `Center #${instructor.center_id}`
                            : "—"}
                      </TableCell>
                      {(onEdit || onDelete) && (
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

      {!isError && hasSelectedCenter && maxPage > 1 && (
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
