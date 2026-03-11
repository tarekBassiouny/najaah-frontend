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
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import { useInstructorOptions } from "@/features/instructors/hooks/use-instructor-options";
import { useTranslation } from "@/features/localization";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const { t } = useTranslation();
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
  const {
    options: categoryOptions,
    search: categorySearch,
    setSearch: setCategorySearch,
    isLoading: isLoadingCategories,
    hasMore: hasMoreCategories,
    isLoadingMore: isLoadingMoreCategories,
    onReachEnd: loadMoreCategories,
  } = useCategoryOptions({
    centerId,
    selectedValue: categoryFilter,
    includeAllOption: true,
    allOptionValue: FILTER_ALL_CATEGORIES,
    allOptionLabel: t("pages.courses.table.filters.allCategories"),
    enabled: Boolean(centerId),
  });
  const {
    options: instructorOptions,
    search: instructorSearch,
    setSearch: setInstructorSearch,
    isLoading: isLoadingInstructors,
    hasMore: hasMoreInstructors,
    isLoadingMore: isLoadingMoreInstructors,
    onReachEnd: loadMoreInstructors,
  } = useInstructorOptions({
    centerId,
    selectedValue: instructorFilter,
    includeAllOption: true,
    allOptionValue: FILTER_ALL_INSTRUCTORS,
    allOptionLabel: t("pages.courses.table.filters.allInstructors"),
    enabled: Boolean(centerId),
  });
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
    setCategorySearch("");
    setInstructorFilter(FILTER_ALL_INSTRUCTORS);
    setInstructorSearch("");
  }, [centerId, setCategorySearch, setInstructorSearch]);

  useEffect(() => {
    setSelectedCourses({});
  }, [centerId, page, perPage, query, categoryFilter, instructorFilter]);

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
    const errorMessages: Record<string, string> = {
      PERMISSION_DENIED: t("pages.courses.table.errors.permissionDenied"),
      NOT_FOUND: t("pages.courses.table.errors.notFound"),
      VALIDATION_ERROR: t("pages.courses.table.errors.validationError"),
    };
    return (
      (code ? errorMessages[code] : null) ??
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
              t("pages.courses.table.errors.cloneFailed"),
            );
            showToast(message, "error");
            return;
          }

          showToast(
            getAdminResponseMessage(
              response,
              t("pages.courses.table.errors.cloneSuccess"),
            ),
            "success",
          );
        },
        onError: (error) => {
          showToast(
            getActionErrorMessage(
              error,
              t("pages.courses.table.errors.cloneFailed"),
            ),
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
                t("pages.courses.table.errors.deleteFailed"),
              );
              setActionErrorMessage(message);
              showToast(message, "error");
              return;
            }

            const message = getAdminResponseMessage(
              response,
              t("pages.courses.table.errors.deleteSuccess"),
            );
            showToast(message, "success");
            setConfirmAction(null);
          },
          onError: (error) => {
            const message = getActionErrorMessage(
              error,
              t("pages.courses.table.errors.deleteFailed"),
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
        ? t("pages.courses.table.errors.publishSuccess")
        : t("pages.courses.table.errors.unpublishSuccess");
    const fallbackError =
      confirmAction.action === "publish"
        ? t("pages.courses.table.errors.publishFailed")
        : t("pages.courses.table.errors.unpublishFailed");

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
          setCategorySearch("");
          setInstructorFilter(FILTER_ALL_INSTRUCTORS);
          setInstructorSearch("");
          setPage(1);
        }}
        summary={
          total === 1
            ? t("pages.courses.table.summary", { count: total })
            : t("pages.courses.table.summaryPlural", { count: total })
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
            placeholder={t("pages.courses.table.searchPlaceholder")}
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
            aria-label={t("pages.courses.table.clearSearch")}
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
          <SearchableSelect
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value ?? FILTER_ALL_CATEGORIES);
              setPage(1);
            }}
            options={categoryOptions}
            placeholder={t("pages.courses.table.filters.category")}
            searchPlaceholder={t(
              "pages.courses.table.filters.searchCategories",
            )}
            searchValue={categorySearch}
            onSearchValueChange={setCategorySearch}
            filterOptions={false}
            isLoading={isLoadingCategories}
            hasMore={hasMoreCategories}
            isLoadingMore={isLoadingMoreCategories}
            onReachEnd={loadMoreCategories}
          />
        ) : null}
        {centerId ? (
          <SearchableSelect
            value={instructorFilter}
            onValueChange={(value) => {
              setInstructorFilter(value ?? FILTER_ALL_INSTRUCTORS);
              setPage(1);
            }}
            options={instructorOptions}
            placeholder={t("pages.courses.table.filters.instructor")}
            searchPlaceholder={t(
              "pages.courses.table.filters.searchInstructors",
            )}
            searchValue={instructorSearch}
            onSearchValueChange={setInstructorSearch}
            filterOptions={false}
            isLoading={isLoadingInstructors}
            hasMore={hasMoreInstructors}
            isLoadingMore={isLoadingMoreInstructors}
            onReachEnd={loadMoreInstructors}
          />
        ) : null}
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.courses.table.loadFailed")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              {t("pages.courses.table.retry")}
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
                    aria-label={t("pages.courses.table.selectAll")}
                  />
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.courses.table.headers.title")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.courses.table.headers.language")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.courses.table.headers.status")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.courses.table.headers.publishedAt")}
                </TableHead>
                <TableHead className="w-10 text-right font-medium">
                  {t("pages.courses.table.headers.actions")}
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
                      title={
                        query
                          ? t("pages.courses.table.empty.noResultsTitle")
                          : t("pages.courses.table.empty.noDataTitle")
                      }
                      description={
                        query
                          ? t("pages.courses.table.empty.noResultsDescription")
                          : t("pages.courses.table.empty.noDataDescription")
                      }
                      action={
                        !query &&
                        !centerId && (
                          <Link href="/courses/create">
                            <Button size="sm">
                              {t("pages.courses.createCourse")}
                            </Button>
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
                          aria-label={t("pages.courses.table.selectCourse", {
                            name:
                              course.title ??
                              course.name ??
                              `course ${course.id}`,
                          })}
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
                                {t("pages.courses.table.actions.view")}
                              </Link>
                              <Link
                                href={editHref}
                                className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => setOpenMenuId(null)}
                              >
                                {t("pages.courses.table.actions.edit")}
                              </Link>
                              {centerId ? (
                                <>
                                  <Link
                                    href={sectionsHref}
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    {t(
                                      "pages.courses.table.actions.manageSections",
                                    )}
                                  </Link>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
                                    onClick={() => openStatusConfirm(course)}
                                    disabled={isActionPending}
                                  >
                                    {isPublished
                                      ? t(
                                          "pages.courses.table.actions.unpublish",
                                        )
                                      : t(
                                          "pages.courses.table.actions.publish",
                                        )}
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60 dark:hover:bg-gray-800"
                                    onClick={() => handleClone(course)}
                                    disabled={isActionPending}
                                  >
                                    {isRowActionPending && isCloning
                                      ? t("pages.courses.table.actions.cloning")
                                      : t("pages.courses.table.actions.clone")}
                                  </button>
                                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                                  <button
                                    type="button"
                                    className="block w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-900/20"
                                    onClick={() => openDeleteConfirm(course)}
                                    disabled={isActionPending}
                                  >
                                    {t("pages.courses.table.actions.delete")}
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
            {t("pages.courses.table.bulk.selected", { count: selectedCount })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBulkChangeStatus ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkChangeStatus(selectedCoursesList)}
                disabled={isLoadingState}
              >
                {t("pages.courses.table.bulk.changeStatus")}
              </Button>
            ) : null}
            {onBulkDelete ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onBulkDelete(selectedCoursesList)}
                disabled={isLoadingState}
              >
                {t("pages.courses.table.bulk.delete")}
              </Button>
            ) : null}
            {!hasBulkActions ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCourses({})}
                disabled={isLoadingState}
              >
                {t("pages.courses.table.bulk.clearSelection")}
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
                ? t("pages.courses.table.dialogs.publishTitle")
                : confirmAction?.action === "unpublish"
                  ? t("pages.courses.table.dialogs.unpublishTitle")
                  : t("pages.courses.table.dialogs.deleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.action === "publish"
                ? t("pages.courses.table.dialogs.publishDescription", {
                    name: confirmCourseName,
                  })
                : confirmAction?.action === "unpublish"
                  ? t("pages.courses.table.dialogs.unpublishDescription", {
                      name: confirmCourseName,
                    })
                  : t("pages.courses.table.dialogs.deleteDescription", {
                      name: confirmCourseName,
                    })}
            </DialogDescription>
          </DialogHeader>

          {actionErrorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.courses.table.dialogs.actionFailed")}
              </AlertTitle>
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
              {t("pages.courses.table.dialogs.cancel")}
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
                  ? t("pages.courses.table.dialogs.publishing")
                  : confirmAction?.action === "unpublish"
                    ? t("pages.courses.table.dialogs.unpublishing")
                    : t("pages.courses.table.dialogs.deleting")
                : confirmAction?.action === "publish"
                  ? t("pages.courses.table.dialogs.confirmPublish")
                  : confirmAction?.action === "unpublish"
                    ? t("pages.courses.table.dialogs.confirmUnpublish")
                    : t("pages.courses.table.dialogs.confirmDelete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ListingCard>
  );
}
