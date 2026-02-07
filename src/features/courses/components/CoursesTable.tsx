"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useCourses,
  useCenterCourses,
} from "@/features/courses/hooks/use-courses";
import { useTenant } from "@/app/tenant-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Course, CourseSummary } from "../types/course";

const DEFAULT_PER_PAGE = 10;

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

function CourseRow({
  course,
  centerId,
}: {
  course: Course | CourseSummary;
  centerId?: string | number;
}) {
  const status = course.status != null ? getStatusConfig(course.status) : null;
  const viewHref = centerId
    ? `/centers/${centerId}/courses/${course.id}`
    : `/courses/${course.id}`;

  return (
    <TableRow className="group">
      <TableCell className="font-medium text-gray-900 dark:text-white">
        <Link href={viewHref} className="hover:text-primary hover:underline">
          {course.title ?? course.name ?? `Course #${course.id}`}
        </Link>
      </TableCell>
      <TableCell className="text-gray-500 dark:text-gray-400">
        {course.slug ?? "—"}
      </TableCell>
      <TableCell>
        {status && <Badge variant={status.variant}>{status.label}</Badge>}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Link href={viewHref}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
          {!centerId && (
            <Link href={`/courses/${course.id}/edit`}>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
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
};

export function CoursesTable({ centerId: centerIdProp }: CoursesTableProps) {
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const params = useMemo(
    () => ({
      page,
      per_page: DEFAULT_PER_PAGE,
      search: query || undefined,
    }),
    [page, query],
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

  const items = data?.items ?? [];
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;
  const isLoadingState = isLoading || isFetching;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;

  const handleSearch = () => {
    setPage(1);
    setQuery(search.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
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
              onKeyDown={handleKeyDown}
              placeholder="Search courses..."
              className="pl-10"
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {total} {total === 1 ? "course" : "courses"}
          </div>
        </div>

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableHead className="font-medium">Title</TableHead>
                  <TableHead className="font-medium">Slug</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="text-right font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingState ? (
                  <LoadingSkeleton />
                ) : showEmptyState ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48">
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
                  items.map((course) => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      centerId={centerId}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {!isError && lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {lastPage}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || isFetching}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, lastPage))}
                disabled={page >= lastPage || isFetching}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
