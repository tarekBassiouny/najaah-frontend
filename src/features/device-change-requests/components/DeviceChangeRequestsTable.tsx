"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTenant } from "@/app/tenant-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
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
import {
  useApproveDeviceChangeRequest,
  useDeviceChangeRequests,
  usePreApproveDeviceChangeRequest,
  useRejectDeviceChangeRequest,
} from "@/features/device-change-requests/hooks/use-device-change-requests";
import type {
  DeviceChangeRequest,
  DeviceChangeRequestStatus,
} from "@/features/device-change-requests/types/device-change-request";
import { RequestActionButtons } from "@/features/student-requests/components/RequestActionButtons";
import { formatDateTime } from "@/lib/format-date-time";
import { setTenantState } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const DEVICE_PAGE_KEY = "dcr_page";
const DEVICE_PER_PAGE_KEY = "dcr_per_page";
const DEVICE_STATUS_KEY = "dcr_status";
const DEVICE_SOURCE_KEY = "dcr_source";
const DEVICE_STUDENT_SEARCH_KEY = "dcr_student";
const DEVICE_DECIDED_BY_KEY = "dcr_decided_by";
const DEVICE_CURRENT_KEY = "dcr_current";
const DEVICE_NEW_KEY = "dcr_new";
const DEVICE_FROM_KEY = "dcr_from";
const DEVICE_TO_KEY = "dcr_to";
const LEGACY_DEVICE_USER_KEY = "dcr_user";

type DeviceChangeRequestsTableProps = {
  centerId?: string | number;
  hideHeader?: boolean;
  showCenterFilter?: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function resolveStatusVariant(
  value: string | null | undefined,
): "warning" | "success" | "error" | "info" | "secondary" {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "APPROVED") return "success";
  if (normalized === "REJECTED") return "error";
  if (normalized === "PRE_APPROVED") return "info";
  if (normalized === "PENDING") return "warning";
  return "secondary";
}

function resolveStatusLabel(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Unknown";
  return raw
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function getPositiveIntParam(
  params: { get: (_key: string) => string | null },
  key: string,
  fallback: number,
): number {
  const raw = params.get(key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getStringParam(
  params: { get: (_key: string) => string | null },
  key: string,
  fallback: string,
): string {
  const raw = params.get(key);
  return raw && raw.trim().length > 0 ? raw.trim() : fallback;
}

function setOrDeleteParam(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (value == null || value.length === 0) {
    params.delete(key);
    return;
  }
  params.set(key, value);
}

function resolveUserLabel(request: DeviceChangeRequest): {
  primary: string;
  phone: string | null;
  email: string | null;
} {
  const user = asRecord(request.user);
  const primary =
    asString(user?.name) ?? asString(request.user_name) ?? "Unknown Student";
  const phone = asString(user?.phone) ?? null;
  const email = asString(user?.email) ?? null;
  return { primary, phone, email };
}

function resolveDecidedBy(request: DeviceChangeRequest): string | null {
  const decidedBy = asRecord(request.decided_by);
  return asString(decidedBy?.name) ?? asString(request.decided_by_name) ?? null;
}

function resolveDecidedAt(request: DeviceChangeRequest): string | null {
  return asString(request.decided_at) ?? asString(request.updated_at) ?? null;
}

function resolveCenter(request: DeviceChangeRequest): string {
  const center = asRecord(request.center);
  return (
    asString(center?.name) ?? asString(request.center_name) ?? "Najaah App"
  );
}

export function DeviceChangeRequestsTable({
  centerId: centerIdProp,
  hideHeader = false,
  showCenterFilter = true,
}: DeviceChangeRequestsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const isTenantCenterScoped = Boolean(tenant.centerSlug);
  const selectedCenterId = tenant.centerId ?? undefined;
  const centerScopeId = centerIdProp ?? null;
  const shouldShowCenterFilter =
    showCenterFilter && !isTenantCenterScoped && centerScopeId == null;
  const showCenterColumn = centerScopeId == null && !isTenantCenterScoped;

  const approveMutation = useApproveDeviceChangeRequest();
  const rejectMutation = useRejectDeviceChangeRequest();
  const preApproveMutation = usePreApproveDeviceChangeRequest();

  const [page, setPage] = useState(() =>
    getPositiveIntParam(searchParams, DEVICE_PAGE_KEY, 1),
  );
  const [perPage, setPerPage] = useState<number>(() =>
    getPositiveIntParam(searchParams, DEVICE_PER_PAGE_KEY, DEFAULT_PER_PAGE),
  );
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    getStringParam(searchParams, DEVICE_STATUS_KEY, ALL_STATUS_VALUE),
  );
  const [studentSearch, setStudentSearch] = useState(() => {
    const fromCurrent = getStringParam(
      searchParams,
      DEVICE_STUDENT_SEARCH_KEY,
      "",
    );
    if (fromCurrent) return fromCurrent;
    return getStringParam(searchParams, LEGACY_DEVICE_USER_KEY, "");
  });
  const [dateFrom, setDateFrom] = useState(() =>
    getStringParam(searchParams, DEVICE_FROM_KEY, ""),
  );
  const [dateTo, setDateTo] = useState(() =>
    getStringParam(searchParams, DEVICE_TO_KEY, ""),
  );
  const [selectedRequests, setSelectedRequests] = useState<
    Record<string, DeviceChangeRequest>
  >({});
  const [processingId, setProcessingId] = useState<string | number | null>(
    null,
  );
  const hasInitializedFilterSyncRef = useRef(false);
  const trimmedStudentSearch = studentSearch.trim();

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      centerScopeId,
      center_id: shouldShowCenterFilter ? selectedCenterId : undefined,
      status:
        statusFilter === ALL_STATUS_VALUE
          ? undefined
          : (statusFilter as DeviceChangeRequestStatus),
      search: trimmedStudentSearch || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [
      centerScopeId,
      dateFrom,
      dateTo,
      page,
      perPage,
      selectedCenterId,
      shouldShowCenterFilter,
      statusFilter,
      trimmedStudentSearch,
    ],
  );

  const { data, isLoading, isError, isFetching } =
    useDeviceChangeRequests(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    statusFilter !== ALL_STATUS_VALUE ||
    trimmedStudentSearch.length > 0 ||
    dateFrom.trim().length > 0 ||
    dateTo.trim().length > 0 ||
    (shouldShowCenterFilter && selectedCenterId != null);
  const activeFilterCount =
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (trimmedStudentSearch.length > 0 ? 1 : 0) +
    (dateFrom.trim().length > 0 ? 1 : 0) +
    (dateTo.trim().length > 0 ? 1 : 0) +
    (shouldShowCenterFilter && selectedCenterId != null ? 1 : 0);

  const selectedIds = useMemo(
    () => Object.keys(selectedRequests),
    [selectedRequests],
  );
  const selectedCount = selectedIds.length;
  const selectedList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedRequests[id])
        .filter((item): item is DeviceChangeRequest => Boolean(item)),
    [selectedIds, selectedRequests],
  );
  const pageIds = useMemo(() => items.map((item) => String(item.id)), [items]);
  const isAllPageSelected =
    pageIds.length > 0 && pageIds.every((id) => Boolean(selectedRequests[id]));

  useEffect(() => {
    if (!hasInitializedFilterSyncRef.current) {
      hasInitializedFilterSyncRef.current = true;
      return;
    }
    setPage(1);
  }, [
    centerScopeId,
    selectedCenterId,
    statusFilter,
    studentSearch,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    const expectedPage = page > 1 ? String(page) : null;
    const expectedPerPage =
      perPage !== DEFAULT_PER_PAGE ? String(perPage) : null;
    const expectedStatus =
      statusFilter !== ALL_STATUS_VALUE ? statusFilter : null;
    const expectedStudentSearch = studentSearch || null;
    const expectedFrom = dateFrom || null;
    const expectedTo = dateTo || null;

    const hasDiff =
      searchParams.get(DEVICE_PAGE_KEY) !== expectedPage ||
      searchParams.get(DEVICE_PER_PAGE_KEY) !== expectedPerPage ||
      searchParams.get(DEVICE_STATUS_KEY) !== expectedStatus ||
      searchParams.get(DEVICE_STUDENT_SEARCH_KEY) !== expectedStudentSearch ||
      searchParams.get(DEVICE_SOURCE_KEY) != null ||
      searchParams.get(DEVICE_DECIDED_BY_KEY) != null ||
      searchParams.get(DEVICE_CURRENT_KEY) != null ||
      searchParams.get(DEVICE_NEW_KEY) != null ||
      searchParams.get(DEVICE_FROM_KEY) !== expectedFrom ||
      searchParams.get(DEVICE_TO_KEY) !== expectedTo;

    if (!hasDiff) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    setOrDeleteParam(nextParams, DEVICE_PAGE_KEY, expectedPage);
    setOrDeleteParam(nextParams, DEVICE_PER_PAGE_KEY, expectedPerPage);
    setOrDeleteParam(nextParams, DEVICE_STATUS_KEY, expectedStatus);
    setOrDeleteParam(
      nextParams,
      DEVICE_STUDENT_SEARCH_KEY,
      expectedStudentSearch,
    );
    nextParams.delete(LEGACY_DEVICE_USER_KEY);
    nextParams.delete(DEVICE_SOURCE_KEY);
    nextParams.delete(DEVICE_DECIDED_BY_KEY);
    nextParams.delete(DEVICE_CURRENT_KEY);
    nextParams.delete(DEVICE_NEW_KEY);
    setOrDeleteParam(nextParams, DEVICE_FROM_KEY, expectedFrom);
    setOrDeleteParam(nextParams, DEVICE_TO_KEY, expectedTo);

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [
    dateFrom,
    dateTo,
    page,
    pathname,
    perPage,
    router,
    searchParams,
    studentSearch,
    statusFilter,
  ]);

  useEffect(() => {
    setSelectedRequests({});
  }, [
    centerScopeId,
    page,
    perPage,
    selectedCenterId,
    statusFilter,
    studentSearch,
    dateFrom,
    dateTo,
  ]);

  const toggleSelection = (request: DeviceChangeRequest) => {
    const requestId = String(request.id);
    setSelectedRequests((prev) => {
      if (prev[requestId]) {
        const { [requestId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [requestId]: request };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedRequests((prev) => {
        const next = { ...prev };
        pageIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedRequests((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        next[String(item.id)] = item;
      });
      return next;
    });
  };

  const handlePreApprove = (request: DeviceChangeRequest) => {
    setProcessingId(request.id);
    preApproveMutation.mutate(
      {
        requestId: request.id,
        centerId: centerScopeId,
        payload: {
          decision_reason: "Pre-approved by admin",
        },
      },
      {
        onSettled: () => setProcessingId(null),
      },
    );
  };

  const handleApprove = (request: DeviceChangeRequest) => {
    setProcessingId(request.id);
    approveMutation.mutate(
      {
        requestId: request.id,
        centerId: centerScopeId,
      },
      {
        onSettled: () => setProcessingId(null),
      },
    );
  };

  const handleReject = (request: DeviceChangeRequest) => {
    setProcessingId(request.id);
    rejectMutation.mutate(
      {
        requestId: request.id,
        centerId: centerScopeId,
        payload: {
          decision_reason: "Rejected by admin",
        },
      },
      {
        onSettled: () => setProcessingId(null),
      },
    );
  };

  const handleBulkPreApprove = () => {
    selectedList.forEach((request) => {
      preApproveMutation.mutate({
        requestId: request.id,
        centerId: centerScopeId,
        payload: {
          decision_reason: "Bulk pre-approved by admin",
        },
      });
    });
    setSelectedRequests({});
  };

  const handleBulkApprove = () => {
    selectedList.forEach((request) => {
      approveMutation.mutate({
        requestId: request.id,
        centerId: centerScopeId,
      });
    });
    setSelectedRequests({});
  };

  const handleBulkReject = () => {
    selectedList.forEach((request) => {
      rejectMutation.mutate({
        requestId: request.id,
        centerId: centerScopeId,
        payload: {
          decision_reason: "Bulk rejected by admin",
        },
      });
    });
    setSelectedRequests({});
  };

  return (
    <ListingCard>
      {!hideHeader ? (
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Device Change Requests
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Review and process device change requests.
          </p>
        </div>
      ) : null}

      <ListingFilters
        activeCount={activeFilterCount}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setStatusFilter(ALL_STATUS_VALUE);
          setStudentSearch("");
          setDateFrom("");
          setDateTo("");
          if (shouldShowCenterFilter) {
            setTenantState({ centerId: null, centerName: null });
          }
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "request" : "requests"}
          </>
        }
        gridClassName="grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
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
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Search by student name, phone, or ID"
            className="pl-10 pr-9 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => {
              setStudentSearch("");
              setPage(1);
            }}
            className={cn(
              "absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300",
              studentSearch.trim().length > 0
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
            aria-label="Clear student search"
            tabIndex={studentSearch.trim().length > 0 ? 0 : -1}
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

        {shouldShowCenterFilter ? (
          <CenterPicker
            className="w-full min-w-0"
            hideWhenCenterScoped={false}
            selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        ) : null}

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PRE_APPROVED">Pre-Approved</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          title="From date"
        />

        <Input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => setDateTo(event.target.value)}
          title="To date"
        />
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load device change requests. Please try again.
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
          <Table className="min-w-[1100px]">
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-gray-50/95 [&_th]:backdrop-blur dark:[&_th]:bg-gray-800/95">
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label="Select all requests on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">Student</TableHead>
                <TableHead className="font-medium">Current Device</TableHead>
                <TableHead className="font-medium">New Device</TableHead>
                <TableHead className="font-medium">Source</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                {showCenterColumn ? (
                  <TableHead className="font-medium">Center</TableHead>
                ) : null}
                <TableHead className="font-medium">Requested At</TableHead>
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
                        <Skeleton className="h-4 w-4" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      {showCenterColumn ? (
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-7 w-44" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell
                    colSpan={showCenterColumn ? 9 : 8}
                    className="h-48"
                  >
                    <EmptyState
                      title="No device change requests found"
                      description="Try adjusting your filters."
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((request) => {
                  const statusLabel = resolveStatusLabel(
                    asString(request.status),
                  );
                  const statusKey = String(request.status ?? "").toLowerCase();
                  const centerLabel = resolveCenter(request);
                  const user = resolveUserLabel(request);
                  const decidedByName = resolveDecidedBy(request);
                  const decidedAt = resolveDecidedAt(request);
                  const isProcessing = processingId === request.id;

                  return (
                    <TableRow
                      key={request.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(
                            selectedRequests[String(request.id)],
                          )}
                          onChange={() => toggleSelection(request)}
                          aria-label={`Select request for ${user.primary}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white">
                            {getInitials(user.primary)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {user.primary}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {user.phone ?? "—"}
                            </span>
                            {user.email ? (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {asString(request.current_device_id) ?? "—"}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {asString(request.new_device_id) ?? "—"}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {asString(request.request_source) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={resolveStatusVariant(
                            asString(request.status),
                          )}
                        >
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      {showCenterColumn ? (
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {centerLabel}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(request.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <RequestActionButtons
                          status={statusKey}
                          decidedByName={decidedByName}
                          decidedAt={decidedAt}
                          showPreApprove
                          onPreApprove={() => handlePreApprove(request)}
                          onApprove={() => handleApprove(request)}
                          onReject={() => handleReject(request)}
                          isPreApproving={
                            isProcessing && preApproveMutation.isPending
                          }
                          isApproving={
                            isProcessing && approveMutation.isPending
                          }
                          isRejecting={isProcessing && rejectMutation.isPending}
                          className="justify-end"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400"
              onClick={handleBulkPreApprove}
              disabled={preApproveMutation.isPending}
            >
              {preApproveMutation.isPending
                ? "Processing..."
                : "Pre-Approve Selected"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400"
              onClick={handleBulkApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "Processing..." : "Approve Selected"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400"
              onClick={handleBulkReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Processing..." : "Reject Selected"}
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
