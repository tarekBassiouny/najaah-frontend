"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useCourses,
  useCenterCourses,
  useCloneCourse,
  useDeleteCenterCourse,
  usePublishCourse,
  useUnpublishCourse,
} from "@/features/courses/hooks/use-courses";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useInstructors } from "@/features/instructors/hooks/use-instructors";
import { useTenant } from "@/app/tenant-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/ui/modal-store";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date-time";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import type { Course, CourseSummary } from "../types/course";

const DEFAULT_PER_PAGE = 10;
const FILTER_ALL_CATEGORIES = "all";
const FILTER_ALL_INSTRUCTORS = "all";
type CourseRecord = Course | CourseSummary;
type CourseActionType = "publish" | "unpublish" | "delete";

type ConfirmCourseActionState = {
  action: CourseActionType;
  course: CourseRecord;
};

const COURSE_ACTION_ERROR_CODE_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED:
    "You do not have permission to perform this course action.",
  NOT_FOUND: "Course not found in this center scope.",
  VALIDATION_ERROR: "Course action could not be completed.",
};

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
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
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
  const { showToast } = useModal();
  const tenant = useTenant();
  const centerId = centerIdProp ?? tenant.centerId ?? undefined;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(FILTER_ALL_CATEGORIES);
  const [instructorFilter, setInstructorFilter] = useState(
    FILTER_ALL_INSTRUCTORS,
  );
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [confirmAction, setConfirmAction] =
    useState<ConfirmCourseActionState | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );
  const [activeActionCourseId, setActiveActionCourseId] = useState<
    string | number | null
  >(null);
  const [selectedCourses, setSelectedCourses] = useState<
    Record<string, CourseRecord>
  >({});

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      category_id:
        categoryFilter !== FILTER_ALL_CATEGORIES ? categoryFilter : undefined,
      primary_instructor_id:
        instructorFilter !== FILTER_ALL_INSTRUCTORS
          ? instructorFilter
          : undefined,
    }),
    [page, perPage, query, categoryFilter, instructorFilter],
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
  const { data: categoriesData, isLoading: isCategoriesLoading } =
    useCategories(
      centerId,
      {
        page: 1,
        per_page: 100,
      },
      { enabled: Boolean(centerId) },
    );
  const { data: instructorsData, isLoading: isInstructorsLoading } =
    useInstructors(
      {
        page: 1,
        per_page: 100,
      },
      { centerId },
      { enabled: Boolean(centerId) },
    );
  const { mutate: publishCourse, isPending: isPublishing } = usePublishCourse();
  const { mutate: unpublishCourse, isPending: isUnpublishing } =
    useUnpublishCourse();
  const { mutate: cloneCourse, isPending: isCloning } = useCloneCourse();
  const { mutate: deleteCenterCourse, isPending: isDeleting } =
    useDeleteCenterCourse();

  const data = centerId ? centerQuery.data : globalQuery.data;
  const isLoading = centerId ? centerQuery.isLoading : globalQuery.isLoading;
  const isError = centerId ? centerQuery.isError : globalQuery.isError;
  const isFetching = centerId ? centerQuery.isFetching : globalQuery.isFetching;

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const lastPage = data?.lastPage ?? 1;
  const total = data?.total ?? 0;
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    categoryFilter !== FILTER_ALL_CATEGORIES ||
    instructorFilter !== FILTER_ALL_INSTRUCTORS;
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (categoryFilter !== FILTER_ALL_CATEGORIES ? 1 : 0) +
    (instructorFilter !== FILTER_ALL_INSTRUCTORS ? 1 : 0);
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
  const isActionPending =
    isPublishing || isUnpublishing || isCloning || isDeleting;

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
    setCategoryFilter(FILTER_ALL_CATEGORIES);
    setInstructorFilter(FILTER_ALL_INSTRUCTORS);
  }, [centerId]);

  useEffect(() => {
    setSelectedCourses({});
  }, [centerId, page, perPage, query, categoryFilter, instructorFilter]);

  const categoryOptions = useMemo(
    () => categoriesData?.items ?? [],
    [categoriesData?.items],
  );
  const instructorOptions = useMemo(
    () => instructorsData?.items ?? [],
    [instructorsData?.items],
  );

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

  const getCourseName = (course: CourseRecord) =>
    String(course.title ?? course.name ?? `Course #${course.id}`);

  const isCoursePublished = (course: CourseRecord) => {
    const value = (course as { is_published?: boolean | null }).is_published;
    return value === true;
  };

  const getActionErrorMessage = (error: unknown, fallback: string) => {
    const code = getAdminApiErrorCode(error);
    return (
      (code ? COURSE_ACTION_ERROR_CODE_MESSAGES[code] : null) ??
      getAdminApiErrorMessage(error, fallback)
    );
  };

  const handleClone = (course: CourseRecord) => {
    if (!centerId) return;
    setOpenMenuId(null);
    setActionErrorMessage(null);
    setActiveActionCourseId(course.id);

    cloneCourse(
      { centerId, courseId: course.id, options: {} },
      {
        onSuccess: (response) => {
          if (!isAdminRequestSuccessful(response)) {
            const message = getAdminResponseMessage(
              response,
              "Unable to clone course.",
            );
            showToast(message, "error");
            return;
          }

          showToast(
            getAdminResponseMessage(response, "Course cloned successfully."),
            "success",
          );
        },
        onError: (error) => {
          showToast(
            getActionErrorMessage(error, "Unable to clone course."),
            "error",
          );
        },
        onSettled: () => {
          setActiveActionCourseId(null);
        },
      },
    );
  };

  const openStatusConfirm = (course: CourseRecord) => {
    const action: CourseActionType = isCoursePublished(course)
      ? "unpublish"
      : "publish";
    setActionErrorMessage(null);
    setConfirmAction({ action, course });
    setOpenMenuId(null);
  };

  const openDeleteConfirm = (course: CourseRecord) => {
    setActionErrorMessage(null);
    setConfirmAction({ action: "delete", course });
    setOpenMenuId(null);
  };

  const handleConfirmAction = () => {
    if (!confirmAction || !centerId) return;

    setActionErrorMessage(null);
    setActiveActionCourseId(confirmAction.course.id);

    if (confirmAction.action === "delete") {
      deleteCenterCourse(
        { centerId, courseId: confirmAction.course.id },
        {
          onSuccess: (response) => {
            if (!isAdminRequestSuccessful(response)) {
              const message = getAdminResponseMessage(
                response,
                "Unable to delete course.",
              );
              setActionErrorMessage(message);
              showToast(message, "error");
              return;
            }

            const message = getAdminResponseMessage(
              response,
              "Course deleted successfully.",
            );
            showToast(message, "success");
            setConfirmAction(null);
          },
          onError: (error) => {
            const message = getActionErrorMessage(
              error,
              "Unable to delete course.",
            );
            setActionErrorMessage(message);
            showToast(message, "error");
          },
          onSettled: () => {
            setActiveActionCourseId(null);
          },
        },
      );
      return;
    }

    const actionMutation =
      confirmAction.action === "publish" ? publishCourse : unpublishCourse;
    const fallbackSuccess =
      confirmAction.action === "publish"
        ? "Course published successfully."
        : "Course unpublished successfully.";
    const fallbackError =
      confirmAction.action === "publish"
        ? "Unable to publish course."
        : "Unable to unpublish course.";

    actionMutation(
      { centerId, courseId: confirmAction.course.id },
      {
        onSuccess: (response) => {
          if (!isAdminRequestSuccessful(response)) {
            const message = getAdminResponseMessage(response, fallbackError);
            setActionErrorMessage(message);
            showToast(message, "error");
            return;
          }

          showToast(
            getAdminResponseMessage(response, fallbackSuccess),
            "success",
          );
          setConfirmAction(null);
        },
        onError: (error) => {
          const message = getActionErrorMessage(error, fallbackError);
          setActionErrorMessage(message);
          showToast(message, "error");
        },
        onSettled: () => {
          setActiveActionCourseId(null);
        },
      },
    );
  };

  const confirmCourseName = confirmAction
    ? getCourseName(confirmAction.course)
    : "this course";

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
          setCategoryFilter(FILTER_ALL_CATEGORIES);
          setInstructorFilter(FILTER_ALL_INSTRUCTORS);
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "course" : "courses"}
          </>
        }
        gridClassName={
          centerId ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
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
        {centerId ? (
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(1);
            }}
            disabled={isCategoriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL_CATEGORIES}>
                All categories
              </SelectItem>
              {categoryOptions.map((category) => {
                const label =
                  (typeof category.title === "string" && category.title) ||
                  (typeof category.name === "string" && category.name) ||
                  `Category #${category.id}`;
                return (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : null}
        {centerId ? (
          <Select
            value={instructorFilter}
            onValueChange={(value) => {
              setInstructorFilter(value);
              setPage(1);
            }}
            disabled={isInstructorsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL_INSTRUCTORS}>
                All instructors
              </SelectItem>
              {instructorOptions.map((instructor) => {
                const label =
                  (typeof instructor.name === "string" && instructor.name) ||
                  `Instructor #${instructor.id}`;
                return (
                  <SelectItem key={instructor.id} value={String(instructor.id)}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : null}
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
                <TableHead className="font-medium">Language</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Published At</TableHead>
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
                  <TableCell colSpan={6} className="h-48">
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
                  const statusSource = course.status_key ?? course.status;
                  const status =
                    statusSource != null ? getStatusConfig(statusSource) : null;
                  const statusLabel =
                    (typeof course.status_label === "string" &&
                    course.status_label.trim().length > 0
                      ? course.status_label
                      : status?.label) ?? "—";
                  const viewHref = centerId
                    ? `/centers/${centerId}/courses/${course.id}`
                    : `/courses/${course.id}`;
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;
                  const isPublished = isCoursePublished(course);
                  const isRowActionPending = activeActionCourseId === course.id;
                  const editHref = centerId
                    ? `/centers/${centerId}/courses/${course.id}/edit`
                    : `/courses/${course.id}/edit`;
                  const sectionsHref = centerId
                    ? `/centers/${centerId}/courses/${course.id}/sections`
                    : `/courses/${course.id}/sections`;

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
                          className="font-medium text-gray-900 transition-colors hover:text-primary dark:text-white dark:hover:text-primary"
                        >
                          {course.title ??
                            course.name ??
                            `Course #${course.id}`}
                        </Link>
                        {course.description ? (
                          <p className="mt-1 line-clamp-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                            {String(course.description)}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {course.language ?? "—"}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant={status.variant}>{statusLabel}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {course.published_at
                          ? formatDateTime(String(course.published_at))
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          <Dropdown
                            isOpen={openMenuId === course.id}
                            setIsOpen={(value) =>
                              setOpenMenuId(value ? course.id : null)
                            }
                          >
                            <DropdownTrigger
                              className="text-gray-400 hover:text-gray-600"
                              disabled={isRowActionPending}
                            >
                              ⋮
                            </DropdownTrigger>
                            <DropdownContent
                              align="end"
                              className={cn(
                                "w-48 rounded-md border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200",
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
                              <Link
                                href={editHref}
                                className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => setOpenMenuId(null)}
                              >
                                Edit
                              </Link>
                              {centerId ? (
                                <>
                                  <Link
                                    href={sectionsHref}
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    Manage Sections
                                  </Link>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
                                    onClick={() => openStatusConfirm(course)}
                                    disabled={isActionPending}
                                  >
                                    {isPublished ? "Unpublish" : "Publish"}
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
                                    onClick={() => handleClone(course)}
                                    disabled={isActionPending}
                                  >
                                    {isRowActionPending && isCloning
                                      ? "Cloning..."
                                      : "Clone"}
                                  </button>
                                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
                                    onClick={() => openDeleteConfirm(course)}
                                    disabled={isActionPending}
                                  >
                                    Delete
                                  </button>
                                </>
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

      <Dialog
        open={Boolean(confirmAction)}
        onOpenChange={(nextOpen) => {
          if (isActionPending) return;
          if (!nextOpen) {
            setActionErrorMessage(null);
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.action === "publish"
                ? "Publish Course"
                : confirmAction?.action === "unpublish"
                  ? "Unpublish Course"
                  : "Delete Course"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "publish"
                ? `Publish "${confirmCourseName}" and make it available to students.`
                : confirmAction?.action === "unpublish"
                  ? `Unpublish "${confirmCourseName}" and hide it from students.`
                  : `Delete "${confirmCourseName}". This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {actionErrorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>Action failed</AlertTitle>
              <AlertDescription>{actionErrorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              variant="outline"
              onClick={() => {
                setActionErrorMessage(null);
                setConfirmAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmAction?.action === "delete" ? "destructive" : "default"
              }
              onClick={handleConfirmAction}
              disabled={isActionPending}
            >
              {isActionPending
                ? confirmAction?.action === "publish"
                  ? "Publishing..."
                  : confirmAction?.action === "unpublish"
                    ? "Unpublishing..."
                    : "Deleting..."
                : confirmAction?.action === "publish"
                  ? "Confirm Publish"
                  : confirmAction?.action === "unpublish"
                    ? "Confirm Unpublish"
                    : "Confirm Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ListingCard>
  );
}
