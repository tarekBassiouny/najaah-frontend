"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useCourses,
  useCenterCourses,
} from "@/features/courses/hooks/use-courses";
import { useTenant } from "@/app/tenant-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { ListingCard } from "@/components/ui/listing-card";
import { ListingFilters } from "@/components/ui/listing-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Course, CourseSummary } from "../types/course";

const DEFAULT_PER_PAGE = 10;
type CourseRecord = Course | CourseSummary;

type CourseStatus =
  | "published"
  | "draft"
  | "archived"
  | "pending"
  | string
  | number
  | boolean
  | Record<string, unknown>
  | null
  | undefined;

const statusConfig: Record<
  string,
  {
    variant: "success" | "warning" | "secondary" | "error" | "default";
    label: string;
  }
> = {
  published: { variant: "success", label: "Published" },
  active: { variant: "success", label: "Active" },
  draft: { variant: "secondary", label: "Draft" },
  pending: { variant: "warning", label: "Pending" },
  archived: { variant: "default", label: "Archived" },
  inactive: { variant: "default", label: "Inactive" },
};

function getStatusConfig(status: CourseStatus) {
  if (typeof status !== "string") {
    if (status && typeof status === "object") {
      const label = String(
        status.label ??
          status.name ??
          status.status ??
          status.value ??
          "Unknown",
      );
      return { variant: "default" as const, label };
    }

    return { variant: "default" as const, label: String(status ?? "Unknown") };
  }

  const normalized = status.toLowerCase();
  return (
    statusConfig[normalized] || { variant: "default" as const, label: status }
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className="animate-pulse">
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

type CoursesTableProps = {
  centerId?: string | number;
  onBulkChangeStatus?: (_courses: CourseRecord[]) => void;
  onBulkDelete?: (_courses: CourseRecord[]) => void;
};

export function CoursesTable({
  centerId: centerIdProp,
  onBulkChangeStatus,
  onBulkDelete,
}: CoursesTableProps) {
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<
    Record<string, CourseRecord>
  >({});

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
    }),
    [page, perPage, query],
  );

  const centerParams = useMemo(
    () =>
      centerId
        ? {
            ...params,
            center_id: centerId,
          }
        : null,
    [params, centerId],
  );

  const globalQuery = useCourses(params, { enabled: !centerId });
  const centerQuery = useCenterCourses(
    centerParams as NonNullable<typeof centerParams>,
    { enabled: !!centerParams },
  );

  const data = centerId ? centerQuery.data : globalQuery.data;
  const isLoading = centerId ? centerQuery.isLoading : globalQuery.isLoading;
  const isError = centerId ? centerQuery.isError : globalQuery.isError;
  const isFetching = centerId ? centerQuery.isFetching : globalQuery.isFetching;

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters = search.trim().length > 0;
  const activeFilterCount = search.trim().length > 0 ? 1 : 0;
  const selectedIds = useMemo(
    () => Object.keys(selectedCourses),
    [selectedCourses],
  );
  const selectedCount = selectedIds.length;
  const selectedCoursesList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedCourses[id])
        .filter((course): course is CourseRecord => Boolean(course)),
    [selectedCourses, selectedIds],
  );
  const pageCourseIds = useMemo(
    () => items.map((course) => String(course.id)),
    [items],
  );
  const isAllPageSelected =
    pageCourseIds.length > 0 &&
    pageCourseIds.every((id) => selectedCourses[id]);
  const hasBulkActions = Boolean(onBulkChangeStatus || onBulkDelete);

  useEffect(() => {
    const nextQuery = search.trim();
    const timeout = setTimeout(() => {
      setPage(1);
      setQuery(nextQuery);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setSelectedCourses({});
  }, [centerId, page, perPage, query]);

  const toggleCourseSelection = (course: CourseRecord) => {
    const id = String(course.id);
    setSelectedCourses((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = course;
      }
      return next;
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedCourses((prev) => {
        const next = { ...prev };
        pageCourseIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedCourses((prev) => {
      const next = { ...prev };
      items.forEach((course) => {
        next[String(course.id)] = course;
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
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "course" : "courses"}
          </>
        }
        gridClassName="grid-cols-1 md:grid-cols-2"
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
            placeholder="Search courses..."
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
              Failed to load courses. Please try again.
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
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={toggleAllSelections}
                    disabled={isLoadingState || items.length === 0}
                    aria-label="Select all courses on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">Title</TableHead>
                <TableHead className="font-medium">Slug</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="w-10 text-right font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <LoadingSkeleton />
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48">
                    <EmptyState
                      title={query ? "No courses found" : "No courses yet"}
                      description={
                        query
                          ? "Try adjusting your search terms"
                          : "Get started by creating your first course"
                      }
                      action={
                        !query &&
                        !centerId && (
                          <Link href="/courses/create">
                            <Button size="sm">Create Course</Button>
                          </Link>
                        )
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((course, index) => {
                  const status =
                    course.status != null
                      ? getStatusConfig(course.status)
                      : null;
                  const viewHref = centerId
                    ? `/centers/${centerId}/courses/${course.id}`
                    : `/courses/${course.id}`;
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;

                  return (
                    <TableRow
                      key={course.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(selectedCourses[String(course.id)])}
                          onChange={() => toggleCourseSelection(course)}
                          aria-label={`Select ${course.title ?? course.name ?? `course ${course.id}`}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <Link
                          href={viewHref}
                          className="transition-colors hover:text-primary hover:underline"
                        >
                          {course.title ??
                            course.name ??
                            `Course #${course.id}`}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {course.slug ?? "—"}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant={status.variant}>{status.label}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === course.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? course.id : null)
                            }
                          >
                            <DropdownTrigger className="text-gray-400 hover:text-gray-600">
                              ⋮
                            </DropdownTrigger>
                            <DropdownContent
                              align="end"
                              className={cn(
                                "w-40 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
                                shouldOpenUp && "bottom-full mb-2 mt-0",
                              )}
                            >
                              <Link
                                href={viewHref}
                                className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => setOpenMenuId(null)}
                              >
                                View
                              </Link>
                              {!centerId ? (
                                <Link
                                  href={`/courses/${course.id}/edit`}
                                  className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                  onClick={() => setOpenMenuId(null)}
                                >
                                  Edit
                                </Link>
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

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {selectedCount} selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBulkChangeStatus ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkChangeStatus(selectedCoursesList)}
                disabled={isLoadingState}
              >
                Change Status
              </Button>
            ) : null}
            {onBulkDelete ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkDelete(selectedCoursesList)}
                disabled={isLoadingState}
              >
                Delete
              </Button>
            ) : null}
            {!hasBulkActions ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCourses({})}
                disabled={isLoadingState}
              >
                Clear Selection
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!isError && lastPage > 1 ? (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <PaginationControls
            page={page}
            lastPage={lastPage}
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
