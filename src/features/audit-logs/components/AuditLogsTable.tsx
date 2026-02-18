"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTenant } from "@/app/tenant-provider";
import { listAdminUsers } from "@/features/admin-users/services/admin-users.service";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { useAuditLogs } from "@/features/audit-logs/hooks/use-audit-logs";
import type { AuditLog } from "@/features/audit-logs/types/audit-log";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
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
import { formatDateTime } from "@/lib/format-date-time";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 10;
const FILTER_LIST_PAGE_SIZE = 20;
const ALL_ACTIONS_VALUE = "__all_actions__";
const ALL_USERS_VALUE = "__all_users__";
const ALL_COURSES_VALUE = "__all_courses__";
const COURSE_ENTITY_TYPE = "App\\Models\\Course";
const FILTER_SEARCH_DEBOUNCE_MS = 300;

const ACTION_OPTIONS = [
  { value: ALL_ACTIONS_VALUE, label: "All actions" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
];

const TODAY_RANGE = "today";
const LAST_7_DAYS_RANGE = "last7";
const LAST_30_DAYS_RANGE = "last30";

function formatActionLabel(action?: string | null) {
  if (!action) return "Unknown";
  return action
    .replace(/[_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEntityType(type?: string | null) {
  if (!type) return "Unknown";
  const shortType = type.includes("\\")
    ? type.split("\\").at(-1) || type
    : type;

  return shortType
    .replace(/[_.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getActionVariant(action?: string | null) {
  const normalized = (action ?? "").toLowerCase();

  if (normalized.includes("create") || normalized.includes("add")) {
    return "success" as const;
  }

  if (normalized.includes("update") || normalized.includes("edit")) {
    return "warning" as const;
  }

  if (normalized.includes("delete") || normalized.includes("remove")) {
    return "error" as const;
  }

  if (normalized.includes("login") || normalized.includes("logout")) {
    return "info" as const;
  }

  return "secondary" as const;
}

function formatMetadataPreview(metadata: unknown) {
  if (!metadata) return "-";
  if (typeof metadata === "string") return metadata || "-";

  if (typeof metadata === "object") {
    const objectValue = metadata as Record<string, unknown>;
    if (Object.keys(objectValue).length === 0) return "-";

    const serialized = JSON.stringify(objectValue);
    if (!serialized) return "-";

    return serialized.length > 140
      ? `${serialized.slice(0, 140)}...`
      : serialized;
  }

  return String(metadata);
}

function formatMetadataFull(metadata: unknown) {
  if (!metadata) return "-";
  if (typeof metadata === "string") return metadata;

  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return String(metadata);
  }
}

function getMetadataTypeLabel(metadata: unknown) {
  if (metadata === null || metadata === undefined) return "empty";
  if (Array.isArray(metadata)) return "array";
  if (typeof metadata === "object") return "object";
  return typeof metadata;
}

function getMetadataSizeLabel(metadata: unknown) {
  if (metadata === null || metadata === undefined) return "0";
  if (typeof metadata === "string") return `${metadata.length} chars`;
  if (Array.isArray(metadata)) return `${metadata.length} items`;
  if (typeof metadata === "object") {
    return `${Object.keys(metadata as Record<string, unknown>).length} keys`;
  }
  return "1 value";
}

function buildEventSummary(log: AuditLog) {
  const actor = log.user?.name || `User #${log.user_id ?? "Unknown"}`;
  const entityType = formatEntityType(log.entity_type);
  const entityPart = log.entity_label
    ? `${entityType} "${String(log.entity_label)}"`
    : `${entityType} #${log.entity_id ?? "?"}`;

  return `${actor} ${formatActionLabel(log.action).toLowerCase()} ${entityPart}`;
}

export function AuditLogsTable() {
  const { centerSlug, centerId } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(DEFAULT_PER_PAGE);

  const [action, setAction] = useState(ALL_ACTIONS_VALUE);
  const [selectedUser, setSelectedUser] = useState<string | null>(
    ALL_USERS_VALUE,
  );
  const [selectedCourse, setSelectedCourse] = useState<string | null>(
    ALL_COURSES_VALUE,
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [datePreset, setDatePreset] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const cachedUsersRef = useRef<
    Map<
      string,
      { id: string | number; name?: string | null; email?: string | null }
    >
  >(new Map());
  const cachedCoursesRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [userSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    setPage(1);
  }, [
    action,
    selectedUser,
    selectedCourse,
    centerId,
    dateFrom,
    dateTo,
    perPage,
  ]);

  useEffect(() => {
    setSelectedCourse(ALL_COURSES_VALUE);
    setCourseSearch("");
    setDebouncedCourseSearch("");
  }, [centerId]);

  const usersQuery = useInfiniteQuery({
    queryKey: ["audit-filter-users", centerId ?? "all", debouncedUserSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listAdminUsers({
        page: pageParam,
        per_page: FILTER_LIST_PAGE_SIZE,
        center_id: centerId ?? undefined,
        search: debouncedUserSearch || undefined,
      }),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? FILTER_LIST_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "audit-filter-courses",
      centerId ?? "all",
      debouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerId!,
        page: pageParam,
        per_page: FILTER_LIST_PAGE_SIZE,
        search: debouncedCourseSearch || undefined,
      }),
    enabled: Boolean(centerId),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? FILTER_LIST_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const users = (usersQuery.data?.pages ?? []).flatMap((queryPage) =>
      queryPage.items.map((user) => ({
        id: user.id,
        name: user.name ?? null,
        email: user.email ?? null,
      })),
    );

    users.forEach((user) => {
      cachedUsersRef.current.set(String(user.id), user);
    });
  }, [usersQuery.data?.pages]);

  useEffect(() => {
    const courses = (coursesQuery.data?.pages ?? []).flatMap((queryPage) =>
      queryPage.items.map((course) => ({
        id: course.id,
        title: course.title ?? null,
      })),
    );

    courses.forEach((course) => {
      cachedCoursesRef.current.set(String(course.id), course);
    });
  }, [coursesQuery.data?.pages]);

  const userOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      { value: ALL_USERS_VALUE, label: "All users" },
    ];

    const users = (usersQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (user, index, array) =>
          array.findIndex((item) => String(item.id) === String(user.id)) ===
          index,
      )
      .map((user) => ({
        value: String(user.id),
        label: user.name || `User ${user.id}`,
        description: user.email || undefined,
      }));

    if (
      selectedUser &&
      selectedUser !== ALL_USERS_VALUE &&
      !users.some((option) => option.value === selectedUser)
    ) {
      const selected = cachedUsersRef.current.get(selectedUser);
      users.unshift({
        value: selectedUser,
        label: selected?.name ?? `User ${selectedUser}`,
        description: selected?.email ?? undefined,
      });
    }

    return [...defaults, ...users];
  }, [selectedUser, usersQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      { value: ALL_COURSES_VALUE, label: "All courses" },
    ];

    if (!centerId) {
      return defaults;
    }

    const courses = (coursesQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (course, index, array) =>
          array.findIndex((item) => String(item.id) === String(course.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label: course.title || `Course ${course.id}`,
      }));

    if (
      selectedCourse &&
      selectedCourse !== ALL_COURSES_VALUE &&
      !courses.some((option) => option.value === selectedCourse)
    ) {
      const selected = cachedCoursesRef.current.get(selectedCourse);
      courses.unshift({
        value: selectedCourse,
        label: selected?.title ?? `Course ${selectedCourse}`,
      });
    }

    return [...defaults, ...courses];
  }, [centerId, coursesQuery.data?.pages, selectedCourse]);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      action: action === ALL_ACTIONS_VALUE ? undefined : action,
      user_id:
        selectedUser && selectedUser !== ALL_USERS_VALUE
          ? selectedUser
          : undefined,
      center_id: centerId ?? undefined,
      entity_type:
        selectedCourse && selectedCourse !== ALL_COURSES_VALUE
          ? COURSE_ENTITY_TYPE
          : undefined,
      entity_id:
        selectedCourse && selectedCourse !== ALL_COURSES_VALUE
          ? selectedCourse
          : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [
      action,
      centerId,
      dateFrom,
      dateTo,
      page,
      perPage,
      selectedCourse,
      selectedUser,
    ],
  );

  const { data, isLoading, isError, isFetching } = useAuditLogs(params);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  const resetFilters = () => {
    setAction(ALL_ACTIONS_VALUE);
    setSelectedUser(ALL_USERS_VALUE);
    setSelectedCourse(ALL_COURSES_VALUE);
    setUserSearch("");
    setCourseSearch("");
    setDateFrom("");
    setDateTo("");
    setDatePreset("");
  };

  const applyDatePreset = (preset: string) => {
    const end = new Date();
    const start = new Date();

    if (preset === TODAY_RANGE) {
      // Keep start as today
    } else if (preset === LAST_7_DAYS_RANGE) {
      start.setDate(start.getDate() - 6);
    } else if (preset === LAST_30_DAYS_RANGE) {
      start.setDate(start.getDate() - 29);
    } else {
      return;
    }

    const toIsoDate = (value: Date) => value.toISOString().slice(0, 10);
    setDateFrom(toIsoDate(start));
    setDateTo(toIsoDate(end));
    setDatePreset(preset);
  };

  const clearDatePreset = () => setDatePreset("");

  const hasActiveFilters =
    action !== ALL_ACTIONS_VALUE ||
    selectedUser !== ALL_USERS_VALUE ||
    selectedCourse !== ALL_COURSES_VALUE ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(centerId);
  const activeFilterCount =
    (action !== ALL_ACTIONS_VALUE ? 1 : 0) +
    (selectedUser !== ALL_USERS_VALUE ? 1 : 0) +
    (selectedCourse !== ALL_COURSES_VALUE ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (centerId ? 1 : 0);

  const openDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  return (
    <>
      <ListingCard>
        <ListingFilters
          activeCount={activeFilterCount}
          isFetching={isFetching}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          clearLabel="Reset"
          clearDisabled={isFetching}
          onClear={resetFilters}
          summary={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={datePreset === TODAY_RANGE ? "default" : "outline"}
                className="h-8 px-3 text-xs"
                onClick={() => applyDatePreset(TODAY_RANGE)}
              >
                Today
              </Button>
              <Button
                variant={
                  datePreset === LAST_7_DAYS_RANGE ? "default" : "outline"
                }
                className="h-8 px-3 text-xs"
                onClick={() => applyDatePreset(LAST_7_DAYS_RANGE)}
              >
                Last 7 days
              </Button>
              <Button
                variant={
                  datePreset === LAST_30_DAYS_RANGE ? "default" : "outline"
                }
                className="h-8 px-3 text-xs"
                onClick={() => applyDatePreset(LAST_30_DAYS_RANGE)}
              >
                Last 30 days
              </Button>
              <span className="text-xs text-dark-5 dark:text-dark-4">
                {total} results
              </span>
            </div>
          }
          gridClassName="grid-cols-1 sm:grid-cols-2 lg:grid-cols-6"
        >
          {isPlatformAdmin ? (
            <div className="lg:col-span-2">
              <CenterPicker
                className="w-full min-w-0"
                selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
              />
            </div>
          ) : null}

          <div className="lg:col-span-2">
            <SearchableSelect
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              options={courseOptions}
              searchValue={courseSearch}
              onSearchValueChange={setCourseSearch}
              placeholder={centerId ? "Course" : "Select center first"}
              searchPlaceholder="Search courses..."
              emptyMessage={
                centerId
                  ? "No courses found"
                  : "Select a center to load courses"
              }
              isLoading={coursesQuery.isLoading}
              filterOptions={false}
              showSearch
              disabled={!centerId}
              hasMore={Boolean(coursesQuery.hasNextPage)}
              isLoadingMore={coursesQuery.isFetchingNextPage}
              onReachEnd={() => {
                if (coursesQuery.hasNextPage) {
                  void coursesQuery.fetchNextPage();
                }
              }}
              triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </div>

          <div className="lg:col-span-2">
            <SearchableSelect
              value={selectedUser}
              onValueChange={setSelectedUser}
              options={userOptions}
              searchValue={userSearch}
              onSearchValueChange={setUserSearch}
              placeholder="User"
              searchPlaceholder="Search users..."
              emptyMessage="No users found"
              isLoading={usersQuery.isLoading}
              filterOptions={false}
              showSearch
              hasMore={Boolean(usersQuery.hasNextPage)}
              isLoadingMore={usersQuery.isFetchingNextPage}
              onReachEnd={() => {
                if (usersQuery.hasNextPage) {
                  void usersQuery.fetchNextPage();
                }
              }}
              triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </div>

          <div className="lg:col-span-2">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <input
              type="date"
              title="From date"
              className={cn(
                "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900",
                !dateFrom && "text-gray-500",
              )}
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                clearDatePreset();
              }}
            />
          </div>

          <div className="lg:col-span-2">
            <input
              type="date"
              title="To date"
              className={cn(
                "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900",
                !dateTo && "text-gray-500",
              )}
              min={dateFrom || undefined}
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                clearDatePreset();
              }}
            />
          </div>
        </ListingFilters>

        {hasActiveFilters ? (
          <div className="border-b border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              {action !== ALL_ACTIONS_VALUE ? (
                <Badge variant="secondary" className="gap-1">
                  Action: {formatActionLabel(action)}
                </Badge>
              ) : null}
              {selectedUser !== ALL_USERS_VALUE ? (
                <Badge variant="secondary" className="gap-1">
                  User:{" "}
                  {userOptions.find((option) => option.value === selectedUser)
                    ?.label ?? selectedUser}
                </Badge>
              ) : null}
              {selectedCourse !== ALL_COURSES_VALUE ? (
                <Badge variant="secondary" className="gap-1">
                  Course:{" "}
                  {courseOptions.find(
                    (option) => option.value === selectedCourse,
                  )?.label ?? selectedCourse}
                </Badge>
              ) : null}
              {dateFrom ? (
                <Badge variant="secondary" className="gap-1">
                  From: {dateFrom}
                </Badge>
              ) : null}
              {dateTo ? (
                <Badge variant="secondary" className="gap-1">
                  To: {dateTo}
                </Badge>
              ) : null}
            </div>
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-dark-5 dark:border-gray-700 dark:bg-gray-800 dark:text-dark-4">
            Failed to load data. Please try again later.
          </div>
        ) : null}

        <div
          className={cn(
            "w-full max-w-full overflow-x-auto transition-opacity",
            isFetching && !isLoading ? "opacity-60" : "opacity-100",
          )}
        >
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="whitespace-nowrap font-medium">
                  Action
                </TableHead>
                <TableHead className="font-medium">Event</TableHead>
                <TableHead className="font-medium">Metadata</TableHead>
                <TableHead className="font-medium">Created At</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoadingState ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="animate-pulse">
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-64" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-52" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48">
                    <EmptyState
                      title="No audit logs found"
                      description="There are no audit logs matching the current criteria."
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((log) => (
                  <TableRow
                    key={log.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                  >
                    <TableCell>
                      <Badge variant={getActionVariant(log.action)}>
                        {formatActionLabel(log.action)}
                      </Badge>
                    </TableCell>

                    <TableCell className="max-w-[460px]">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {buildEventSummary(log)}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        User #{log.user_id ?? "-"} | Center #
                        {log.center_id ?? "-"} |{" "}
                        {formatEntityType(log.entity_type)} #
                        {log.entity_id ?? "-"}
                      </p>
                    </TableCell>

                    <TableCell className="max-w-[340px]">
                      <code className="block truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                        {formatMetadataPreview(log.metadata)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 h-7 px-2 text-xs"
                        onClick={() => openDetails(log)}
                      >
                        View details
                      </Button>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <PaginationControls
            page={meta?.page ?? page}
            lastPage={maxPage}
            isFetching={isFetching}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
            labelClassName="text-dark-5 dark:text-dark-4"
          />
        </div>
      </ListingCard>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-4xl overflow-hidden p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>Audit Log #{selectedLog?.id ?? "-"}</span>
              <Badge variant={getActionVariant(selectedLog?.action)}>
                {formatActionLabel(selectedLog?.action)}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Full event details and metadata payload.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(100dvh-12.5rem)] space-y-4 overflow-y-auto pr-1 sm:max-h-[calc(100dvh-13rem)]">
            <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/40 sm:p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Event Details
              </p>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Summary
                  </dt>
                  <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white sm:min-h-[2.5rem]">
                    {selectedLog ? buildEventSummary(selectedLog) : "-"}
                  </dd>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    User
                  </dt>
                  <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">
                    {selectedLog?.user?.name ?? "-"} (#
                    {selectedLog?.user_id ?? "-"})
                  </dd>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Center
                  </dt>
                  <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">
                    #{selectedLog?.center_id ?? "-"}
                  </dd>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Entity
                  </dt>
                  <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">
                    {formatEntityType(selectedLog?.entity_type)} #
                    {selectedLog?.entity_id ?? "-"}
                  </dd>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900 sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Label
                  </dt>
                  <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">
                    {selectedLog?.entity_label ?? "-"}
                  </dd>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-2.5 dark:border-gray-700 dark:bg-gray-900 sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Created
                  </dt>
                  <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">
                    {formatDateTime(selectedLog?.created_at)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900/50">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/70 sm:px-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Metadata
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Type: {getMetadataTypeLabel(selectedLog?.metadata)}
                  </p>
                </div>
                <Badge variant="secondary">
                  {getMetadataSizeLabel(selectedLog?.metadata)}
                </Badge>
              </div>
              <div className="max-h-[46dvh] overflow-auto p-3 sm:max-h-[52dvh] sm:p-4">
                <pre className="whitespace-pre font-mono text-xs leading-5 text-dark dark:text-white">
                  {formatMetadataFull(selectedLog?.metadata)}
                </pre>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
