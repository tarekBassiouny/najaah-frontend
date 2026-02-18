"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Student } from "@/features/students/types/student";
import { useStudents } from "@/features/students/hooks/use-students";
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
import { formatDateTime } from "@/lib/format-date-time";
import { cn } from "@/lib/utils";
import { resolveStudentStatus } from "@/features/students/utils/student-status";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const ALL_CENTER_TYPE_VALUE = "all";
type CenterTypeFilterValue =
  | typeof ALL_CENTER_TYPE_VALUE
  | "branded"
  | "unbranded";

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

type StudentsTableProps = {
  centerId?: string | number;
  courseId?: string | number;
  showCenterFilter?: boolean;
  initialPage?: number;
  initialPerPage?: number;
  buildProfileHref?: (_student: Student) => string | null;
  onEdit?: (_student: Student) => void;
  onDelete?: (_student: Student) => void;
  onViewDetails?: (_student: Student) => void;
  onEnrollCourse?: (_student: Student) => void;
  onBulkEnrollCourse?: (_students: Student[]) => void;
  onBulkChangeStatus?: (_students: Student[]) => void;
};

export function StudentsTable({
  centerId: centerIdProp,
  courseId,
  showCenterFilter = true,
  initialPage,
  initialPerPage,
  buildProfileHref,
  onEdit,
  onDelete,
  onViewDetails,
  onEnrollCourse,
  onBulkEnrollCourse,
  onBulkChangeStatus,
}: StudentsTableProps) {
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(initialPage ?? 1);
  const [perPage, setPerPage] = useState<number>(
    initialPerPage ?? DEFAULT_PER_PAGE,
  );
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [centerTypeFilter, setCenterTypeFilter] =
    useState<CenterTypeFilterValue>(ALL_CENTER_TYPE_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<
    Record<string, Student>
  >({});

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: centerId,
      course_id: courseId,
      status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
      type:
        centerTypeFilter === ALL_CENTER_TYPE_VALUE
          ? undefined
          : centerTypeFilter,
    }),
    [page, perPage, query, centerId, courseId, statusFilter, centerTypeFilter],
  );

  const { data, isLoading, isError, isFetching } = useStudents(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    statusFilter !== ALL_STATUS_VALUE ||
    centerTypeFilter !== ALL_CENTER_TYPE_VALUE;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (centerTypeFilter !== ALL_CENTER_TYPE_VALUE ? 1 : 0);
  const selectedIds = useMemo(
    () => Object.keys(selectedStudents),
    [selectedStudents],
  );
  const selectedCount = selectedIds.length;
  const selectedStudentsList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedStudents[id])
        .filter((student): student is Student => Boolean(student)),
    [selectedIds, selectedStudents],
  );
  const pageStudentIds = useMemo(
    () => items.map((student) => String(student.id)),
    [items],
  );
  const isAllPageSelected =
    pageStudentIds.length > 0 &&
    pageStudentIds.every((id) => selectedStudents[id]);

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
  }, [centerId, courseId]);

  useEffect(() => {
    setSelectedStudents({});
  }, [
    centerId,
    courseId,
    page,
    perPage,
    query,
    statusFilter,
    centerTypeFilter,
  ]);

  const hasActions = Boolean(
    onEdit || onDelete || onViewDetails || onEnrollCourse || buildProfileHref,
  );

  const toggleStudentSelection = (student: Student) => {
    const studentId = String(student.id);
    setSelectedStudents((prev) => {
      if (prev[studentId]) {
        const { [studentId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [studentId]: student };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedStudents((prev) => {
        if (pageStudentIds.length === 0) return prev;
        const next = { ...prev };
        pageStudentIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedStudents((prev) => {
      const next = { ...prev };
      items.forEach((student) => {
        next[String(student.id)] = student;
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
          setCenterTypeFilter(ALL_CENTER_TYPE_VALUE);
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "student" : "students"}
          </>
        }
        gridClassName={
          showCenterFilter
            ? "grid-cols-1 md:grid-cols-4"
            : "grid-cols-1 md:grid-cols-3"
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
            placeholder="Search by name, phone, or email"
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

        {showCenterFilter ? (
          <CenterPicker
            className="w-full min-w-0"
            hideWhenCenterScoped={false}
            selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        ) : null}

        <Select
          value={centerTypeFilter}
          onValueChange={(value) => {
            setPage(1);
            if (
              value === ALL_CENTER_TYPE_VALUE ||
              value === "branded" ||
              value === "unbranded"
            ) {
              setCenterTypeFilter(value);
              return;
            }
            setCenterTypeFilter(ALL_CENTER_TYPE_VALUE);
          }}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder="Center Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CENTER_TYPE_VALUE}>Center Type</SelectItem>
            <SelectItem value="branded">Branded</SelectItem>
            <SelectItem value="unbranded">Unbranded</SelectItem>
          </SelectContent>
        </Select>

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
              Failed to load students. Please try again.
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
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label="Select all students on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">Student</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Center</TableHead>
                <TableHead className="font-medium">Activity</TableHead>
                <TableHead className="font-medium">Last Activity</TableHead>
                <TableHead className="font-medium">Device</TableHead>
                {hasActions && (
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
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>
                      {hasActions && (
                        <TableCell>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={hasActions ? 8 : 7} className="h-48">
                    <EmptyState
                      title={query ? "No students found" : "No students yet"}
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Students will appear here once they are added"
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((student, index) => {
                  const status = resolveStudentStatus(
                    student.status_key ?? student.status,
                    student.status_label,
                  );
                  const analytics = student.analytics ?? null;
                  const activityLabel = analytics
                    ? `${analytics.total_enrollments ?? 0} enrollments · ${
                        analytics.total_sessions ?? 0
                      } sessions`
                    : "—";
                  const lastActivityLabel = analytics?.last_activity_at
                    ? formatDateTime(analytics.last_activity_at)
                    : "—";
                  const shouldOpenUp =
                    items.length > 4 && index >= Math.max(0, items.length - 2);
                  const profileHref = buildProfileHref?.(student) ?? null;

                  return (
                    <TableRow
                      key={student.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(
                            selectedStudents[String(student.id)],
                          )}
                          onChange={() => toggleStudentSelection(student)}
                          aria-label={`Select ${student.name ?? `student ${student.id}`}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white">
                            {getInitials(
                              student.name ??
                                student.email ??
                                `Student ${student.id ?? ""}`,
                            )}
                          </div>
                          <div className="flex flex-col">
                            {profileHref ? (
                              <Link
                                href={profileHref}
                                className="font-medium text-gray-900 transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
                              >
                                {student.name ?? "—"}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-900 dark:text-white">
                                {student.name ?? "—"}
                              </span>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {student.phone ?? "—"}
                            </span>
                            {student.email ? (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {student.email}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.status != null || student.status_label ? (
                          <Badge variant={status.variant}>{status.label}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {student.center?.name ??
                          student.center?.id ??
                          student.center_id ??
                          "Najaah App"}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {activityLabel}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {lastActivityLabel}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {student.device ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Device Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                            No Device
                          </span>
                        )}
                      </TableCell>
                      {hasActions && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <Dropdown
                              isOpen={openMenuId === student.id}
                              setIsOpen={(value) =>
                                setOpenMenuId(value ? student.id : null)
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
                                {profileHref ? (
                                  <Link
                                    href={profileHref}
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                    }}
                                  >
                                    View profile
                                  </Link>
                                ) : null}
                                {onViewDetails && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onViewDetails(student);
                                    }}
                                  >
                                    View details
                                  </button>
                                )}
                                {onEnrollCourse && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEnrollCourse(student);
                                    }}
                                  >
                                    Enroll in Course
                                  </button>
                                )}
                                {onEdit && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit(student);
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
                                      onDelete(student);
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
              onClick={() => onBulkEnrollCourse?.(selectedStudentsList)}
              disabled={isLoadingState}
            >
              Enroll to Course
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkChangeStatus?.(selectedStudentsList)}
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
