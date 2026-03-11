"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useTenant } from "@/app/tenant-provider";
import { setTenantState } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-date-time";
import { useInstructors } from "@/features/instructors/hooks/use-instructors";
import { deleteInstructor } from "@/features/instructors/services/instructors.service";
import { getInstructorApiErrorMessage } from "@/features/instructors/lib/api-error";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import type { Instructor } from "@/features/instructors/types/instructor";
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
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useModal } from "@/components/ui/modal-store";
import { useTranslation } from "@/features/localization";

const DEFAULT_PER_PAGE = 10;
const COURSES_PAGE_SIZE = 20;
const ALL_COURSES_VALUE = "all";

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
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

function getTranslationValue(record: unknown): string | null {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return null;
  }

  const translations = record as Record<string, unknown>;
  const preferred = ["en", "ar"]
    .map((key) => translations[key])
    .find((value) => typeof value === "string" && value.trim().length > 0);
  if (typeof preferred === "string" && preferred.trim())
    return preferred.trim();

  const fallback = Object.values(translations).find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return typeof fallback === "string" && fallback.trim()
    ? fallback.trim()
    : null;
}

function resolveInstructorName(instructor: Instructor): string {
  if (typeof instructor.name === "string" && instructor.name.trim()) {
    return instructor.name.trim();
  }
  return (
    getTranslationValue(instructor.name_translations) ??
    (typeof instructor.email === "string" && instructor.email.trim()
      ? instructor.email.trim()
      : `Instructor ${instructor.id ?? ""}`)
  );
}

function resolveInstructorTitle(instructor: Instructor): string | null {
  if (typeof instructor.title === "string" && instructor.title.trim()) {
    return instructor.title.trim();
  }
  return getTranslationValue(instructor.title_translations);
}

type InstructorsTableProps = {
  scopeCenterId?: string | number | null;
  showCenterFilter?: boolean;
  onViewDetails?: (_instructor: Instructor) => void;
  onEdit?: (_instructor: Instructor) => void;
  onDelete?: (_instructor: Instructor) => void;
};

export function InstructorsTable({
  scopeCenterId = null,
  showCenterFilter = true,
  onViewDetails,
  onEdit,
  onDelete,
}: InstructorsTableProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useModal();
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
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourse, setSelectedCourse] =
    useState<string>(ALL_COURSES_VALUE);
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const [selectedInstructors, setSelectedInstructors] = useState<
    Record<string, Instructor>
  >({});
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "instructors-course-filter-options",
      selectedCenterId ?? "none",
      courseSearchTerm,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: selectedCenterId!,
        page: Number(pageParam ?? 1),
        per_page: COURSES_PAGE_SIZE,
        search: courseSearchTerm || undefined,
      }),
    enabled: hasSelectedCenter,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? COURSES_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: query || undefined,
      center_id: selectedCenterId ?? undefined,
      course_id:
        selectedCourse !== ALL_COURSES_VALUE ? selectedCourse : undefined,
    }),
    [page, perPage, query, selectedCenterId, selectedCourse],
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
  const hasActions = Boolean(onViewDetails || onEdit || onDelete);
  const enableBulkSelection = hasSelectedCenter && Boolean(onDelete);
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
    pageInstructorIds.every((id) => Boolean(selectedInstructors[id]));
  const columnCount = 4 + (enableBulkSelection ? 1 : 0) + (hasActions ? 1 : 0);
  const hasActiveFilters =
    search.trim().length > 0 ||
    selectedCourse !== ALL_COURSES_VALUE ||
    (showCenterFilter &&
      effectiveScopeCenterId == null &&
      selectedCenterId != null);
  const activeFilterCount =
    (search.trim().length > 0 ? 1 : 0) +
    (selectedCourse !== ALL_COURSES_VALUE ? 1 : 0) +
    (showCenterFilter &&
    effectiveScopeCenterId == null &&
    selectedCenterId != null
      ? 1
      : 0);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      {
        value: ALL_COURSES_VALUE,
        label: t("pages.instructors.table.filters.allCourses"),
      },
    ];

    if (!hasSelectedCenter) return defaults;

    const courses = (coursesQuery.data?.pages ?? [])
      .flatMap((pageData) => pageData.items)
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => String(entry.id) === String(item.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label:
          asString((course as { title?: unknown }).title) ??
          `Course ${course.id}`,
      }));

    if (
      selectedCourse !== ALL_COURSES_VALUE &&
      !courses.some((option) => option.value === selectedCourse)
    ) {
      courses.unshift({
        value: selectedCourse,
        label: `${t("pages.instructors.table.filters.course")} ${selectedCourse}`,
      });
    }

    return [...defaults, ...courses];
  }, [coursesQuery.data?.pages, hasSelectedCenter, selectedCourse, t]);

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
    setSelectedCourse(ALL_COURSES_VALUE);
    setCourseSearch("");
    setCourseSearchTerm("");
  }, [selectedCenterId]);

  useEffect(() => {
    const nextQuery = courseSearch.trim();
    const timeout = setTimeout(() => {
      setCourseSearchTerm(nextQuery);
    }, 350);
    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    setSelectedInstructors({});
  }, [selectedCenterId, page, perPage, query, selectedCourse]);

  const errorMessage = getInstructorApiErrorMessage(
    error,
    t("pages.instructors.table.loadFailed"),
  );

  const toggleInstructorSelection = (instructor: Instructor) => {
    const id = String(instructor.id);
    setSelectedInstructors((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = instructor;
      }
      return next;
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedInstructors((prev) => {
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

  const handleBulkDelete = async () => {
    if (
      selectedInstructorsList.length === 0 ||
      selectedCenterId == null ||
      isBulkDeleting
    ) {
      return;
    }

    const confirmed = window.confirm(
      t("pages.instructors.table.bulk.confirmDeleteMessage", {
        count: selectedInstructorsList.length,
      }),
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);

    let deletedCount = 0;
    for (const instructor of selectedInstructorsList) {
      try {
        await deleteInstructor(instructor.id, { centerId: selectedCenterId });
        deletedCount += 1;
      } catch {
        // Continue deleting remaining selections even if one fails.
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["instructors"] });
    setSelectedInstructors({});
    setIsBulkDeleting(false);

    if (deletedCount === selectedInstructorsList.length) {
      showToast(t("pages.instructors.table.bulk.deleteSuccess"), "success");
      return;
    }

    showToast(t("pages.instructors.table.bulk.deleteFailed"), "error");
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
          setSelectedCourse(ALL_COURSES_VALUE);
          setCourseSearch("");
          setCourseSearchTerm("");
          setPage(1);

          if (showCenterFilter && effectiveScopeCenterId == null) {
            setTenantState({ centerId: null, centerName: null });
          }
        }}
        summary={
          hasSelectedCenter ? (
            <>
              {total === 1
                ? t("pages.instructors.table.summary", { count: total })
                : t("pages.instructors.table.summaryPlural", { count: total })}
            </>
          ) : (
            <>{t("pages.instructors.table.filters.selectCenterFirst")}</>
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
            placeholder={t("pages.instructors.table.searchPlaceholder")}
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
            aria-label={t("pages.instructors.table.clearSearch")}
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

        <SearchableSelect
          value={selectedCourse}
          onValueChange={(value) => {
            setPage(1);
            setSelectedCourse(value ?? ALL_COURSES_VALUE);
          }}
          options={courseOptions}
          searchValue={courseSearch}
          onSearchValueChange={setCourseSearch}
          placeholder={t("pages.instructors.table.filters.allCourses")}
          searchPlaceholder={t("pages.instructors.table.filters.searchCourses")}
          emptyMessage={t("pages.instructors.table.filters.noCourses")}
          isLoading={coursesQuery.isLoading}
          filterOptions={false}
          disabled={!hasSelectedCenter}
          hasMore={Boolean(coursesQuery.hasNextPage)}
          isLoadingMore={coursesQuery.isFetchingNextPage}
          onReachEnd={() => {
            if (coursesQuery.hasNextPage) {
              void coursesQuery.fetchNextPage();
            }
          }}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />
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
              {t("pages.instructors.table.retry")}
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
                {enableBulkSelection ? (
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                      checked={isAllPageSelected}
                      onChange={toggleAllSelections}
                      disabled={isLoadingState || items.length === 0}
                      aria-label={t("pages.instructors.table.selectAll")}
                    />
                  </TableHead>
                ) : null}
                <TableHead className="font-medium">
                  {t("pages.instructors.table.headers.instructor")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.instructors.table.headers.bio")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.instructors.table.headers.createdBy")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.instructors.table.headers.createdAt")}
                </TableHead>
                {hasActions ? (
                  <TableHead className="w-10 text-right font-medium">
                    {t("pages.instructors.table.headers.actions")}
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingState ? (
                <>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      {enableBulkSelection ? (
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Skeleton className="h-4 w-44" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      {hasActions ? (
                        <TableCell>
                          <Skeleton className="ml-auto h-4 w-16" />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </>
              ) : showCenterSelectionState ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-48">
                    <EmptyState
                      title={t("pages.instructors.selectCenterTitle")}
                      description={t(
                        "pages.instructors.selectCenterDescription",
                      )}
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="h-48">
                    <EmptyState
                      title={
                        query
                          ? t("pages.instructors.table.empty.noResultsTitle")
                          : t("pages.instructors.table.empty.noDataTitle")
                      }
                      description={
                        query
                          ? t(
                              "pages.instructors.table.empty.noResultsDescription",
                            )
                          : t("pages.instructors.table.empty.noDataDescription")
                      }
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((instructor, index) => {
                  const shouldOpenUp =
                    items.length > 4 && index >= items.length - 2;
                  const avatarUrl =
                    typeof instructor.avatar_url === "string" &&
                    instructor.avatar_url.trim().length > 0
                      ? instructor.avatar_url
                      : null;
                  const displayName = resolveInstructorName(instructor);
                  const displayTitle = resolveInstructorTitle(instructor);
                  const displayPhone =
                    typeof instructor.phone === "string" &&
                    instructor.phone.trim().length > 0
                      ? instructor.phone.trim()
                      : null;
                  const displayEmail =
                    typeof instructor.email === "string" &&
                    instructor.email.trim().length > 0
                      ? instructor.email.trim()
                      : null;
                  const displayBio =
                    typeof instructor.bio === "string" &&
                    instructor.bio.trim().length > 0
                      ? instructor.bio.trim()
                      : (getTranslationValue(instructor.bio_translations) ??
                        t("pages.instructors.table.noBio"));
                  const createdByLabel =
                    typeof instructor.creator?.name === "string" &&
                    instructor.creator.name.trim().length > 0
                      ? instructor.creator.name.trim()
                      : instructor.creator?.id != null
                        ? String(instructor.creator.id)
                        : "—";
                  const createdAtLabel = formatDateTime(
                    asString(instructor.created_at),
                  );

                  return (
                    <TableRow
                      key={instructor.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      {enableBulkSelection ? (
                        <TableCell>
                          <input
                            type="checkbox"
                            className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                            checked={Boolean(
                              selectedInstructors[String(instructor.id)],
                            )}
                            onChange={() =>
                              toggleInstructorSelection(instructor)
                            }
                            aria-label={t(
                              "pages.instructors.table.selectInstructor",
                              { name: displayName },
                            )}
                            disabled={isBulkDeleting}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold uppercase text-white">
                            {avatarUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={avatarUrl}
                                alt={`${displayName} avatar`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitials(displayName)
                            )}
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {displayTitle
                                ? `${displayTitle} ${displayName}`
                                : displayName}
                            </span>
                            {displayPhone ? (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span>{displayPhone}</span>
                              </div>
                            ) : null}
                            {displayEmail ? (
                              <span className="truncate text-sm text-gray-500 dark:text-gray-400">
                                {displayEmail}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <p className="line-clamp-2 max-w-[340px]">
                          {displayBio}
                        </p>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {createdByLabel}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {createdAtLabel}
                      </TableCell>
                      {hasActions ? (
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
                                {onViewDetails && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onViewDetails?.(instructor);
                                    }}
                                  >
                                    {t(
                                      "pages.instructors.table.actions.viewDetails",
                                    )}
                                  </button>
                                )}
                                {onEdit && (
                                  <button
                                    className="w-full rounded px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onEdit?.(instructor);
                                    }}
                                  >
                                    {t(
                                      "pages.instructors.table.actions.editProfile",
                                    )}
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
                                    {t(
                                      "pages.instructors.table.actions.delete",
                                    )}
                                  </button>
                                )}
                              </DropdownContent>
                            </Dropdown>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCount > 0 && enableBulkSelection ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {t("pages.instructors.table.bulk.selected", {
              count: selectedCount,
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isLoadingState || isBulkDeleting}
            >
              {isBulkDeleting
                ? t("pages.instructors.table.bulk.deleting")
                : t("pages.instructors.table.bulk.delete")}
            </Button>
          </div>
        </div>
      ) : null}

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
