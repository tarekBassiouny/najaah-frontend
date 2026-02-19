"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
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
import {
  useBulkUpdateEnrollmentStatus,
  useEnrollments,
  useUpdateEnrollment,
} from "@/features/enrollments/hooks/use-enrollments";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import type { Enrollment } from "@/features/enrollments/types/enrollment";
import { RequestActionButtons } from "@/features/student-requests/components/RequestActionButtons";
import { formatDateTime } from "@/lib/format-date-time";
import { setTenantState } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const DEFAULT_REQUEST_STATUS = "PENDING";
const ALL_COURSES_VALUE = "all";
const FILTER_LIST_PAGE_SIZE = 20;
const FILTER_SEARCH_DEBOUNCE_MS = 300;
const ENROLLMENTS_PAGE_KEY = "er_page";
const ENROLLMENTS_PER_PAGE_KEY = "er_per_page";
const ENROLLMENTS_STATUS_KEY = "er_status";
const ENROLLMENTS_COURSE_KEY = "er_course";
const ENROLLMENTS_STUDENT_SEARCH_KEY = "er_student";
const ENROLLMENTS_FROM_KEY = "er_from";
const ENROLLMENTS_TO_KEY = "er_to";
const LEGACY_ENROLLMENTS_USER_KEY = "er_user";
const LEGACY_ENROLLMENTS_STUDENT_NAME_KEY = "er_student_name";
const LEGACY_ENROLLMENTS_STUDENT_PHONE_KEY = "er_student_phone";

type EnrollmentsTableProps = {
  centerId?: string | number;
  showCenterFilter?: boolean;
  initialCourseId?: string | number | null;
  initialUserId?: string | number | null;
};

type EnrollmentStatusVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "secondary";

type StudentCellData = {
  primary: string;
  phone: string | null;
  email: string | null;
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
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function formatLabel(value: string): string {
  return value
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

function resolveStatus(enrollment: Enrollment): {
  label: string;
  variant: EnrollmentStatusVariant;
  key: string;
} {
  const raw =
    asString(enrollment.status_label) ??
    asString(enrollment.status_key) ??
    asString(enrollment.status) ??
    asString(enrollment.status_value) ??
    "unknown";

  const normalized = raw.toLowerCase();

  if (
    ["active", "approved", "enrolled", "confirmed", "1"].includes(normalized)
  ) {
    return {
      label: asString(enrollment.status_label) ?? formatLabel(raw),
      variant: "success",
      key: normalized,
    };
  }

  if (["pending", "processing", "in_progress"].includes(normalized)) {
    return {
      label: asString(enrollment.status_label) ?? formatLabel(raw),
      variant: "warning",
      key: normalized,
    };
  }

  if (["cancelled", "canceled", "rejected", "expired"].includes(normalized)) {
    return {
      label: asString(enrollment.status_label) ?? formatLabel(raw),
      variant: "error",
      key: normalized,
    };
  }

  if (["deactivated", "inactive", "disabled", "0"].includes(normalized)) {
    return {
      label: asString(enrollment.status_label) ?? formatLabel(raw),
      variant: "secondary",
      key: normalized,
    };
  }

  return {
    label: asString(enrollment.status_label) ?? formatLabel(raw),
    variant: "default",
    key: normalized,
  };
}

function resolveStudent(enrollment: Enrollment): StudentCellData {
  const student = asRecord(enrollment.student) ?? asRecord(enrollment.user);
  const primary =
    asString(student?.name) ??
    asString(enrollment.student_name) ??
    asString(enrollment.user_name) ??
    "Unknown Student";
  const phone =
    asString(student?.phone) ?? asString(enrollment.student_phone) ?? null;
  const email =
    asString(student?.email) ?? asString(enrollment.student_email) ?? null;

  return { primary, phone, email };
}

function resolveCourse(enrollment: Enrollment): string {
  const course = asRecord(enrollment.course);
  return (
    asString(course?.title) ??
    asString(course?.name) ??
    asString(enrollment.course_title) ??
    "Unknown Course"
  );
}

function resolveCenter(enrollment: Enrollment): string {
  const center = asRecord(enrollment.center);
  return (
    asString(center?.name) ?? asString(enrollment.center_name) ?? "Najaah App"
  );
}

function resolveDecidedBy(enrollment: Enrollment): string | null {
  const decidedBy = asRecord(enrollment.decided_by);
  return (
    asString(decidedBy?.name) ??
    asString(enrollment.decided_by_name) ??
    asString(enrollment.approved_by_name) ??
    null
  );
}

function resolveDecidedAt(enrollment: Enrollment): string | null {
  return (
    asString(enrollment.decided_at) ??
    asString(enrollment.approved_at) ??
    asString(enrollment.updated_at) ??
    null
  );
}

function resolveDecisionTimestamp(
  enrollment: Enrollment,
  statusKey: string,
): string | null {
  if (
    ["active", "approved", "enrolled", "confirmed", "1"].includes(statusKey)
  ) {
    return (
      asString(enrollment.enrolled_at) ??
      asString(enrollment.decided_at) ??
      asString(enrollment.approved_at) ??
      asString(enrollment.updated_at) ??
      null
    );
  }

  return resolveDecidedAt(enrollment);
}

export function EnrollmentsTable({
  centerId: centerIdProp,
  showCenterFilter = true,
  initialCourseId,
  initialUserId,
}: EnrollmentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const tenantCenterId = tenant.centerId ?? undefined;
  const isTenantCenterScoped = Boolean(tenant.centerSlug);
  const centerScopeId = centerIdProp ?? null;
  const shouldShowCenterFilter =
    showCenterFilter && !isTenantCenterScoped && centerScopeId == null;
  const showCenterColumn = centerScopeId == null && !isTenantCenterScoped;

  const updateEnrollmentMutation = useUpdateEnrollment();
  const bulkUpdateStatusMutation = useBulkUpdateEnrollmentStatus();

  const [page, setPage] = useState(() =>
    getPositiveIntParam(searchParams, ENROLLMENTS_PAGE_KEY, 1),
  );
  const [perPage, setPerPage] = useState<number>(() =>
    getPositiveIntParam(
      searchParams,
      ENROLLMENTS_PER_PAGE_KEY,
      DEFAULT_PER_PAGE,
    ),
  );
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    getStringParam(
      searchParams,
      ENROLLMENTS_STATUS_KEY,
      DEFAULT_REQUEST_STATUS,
    ),
  );
  const [studentSearch, setStudentSearch] = useState(() => {
    const fromCurrent = getStringParam(
      searchParams,
      ENROLLMENTS_STUDENT_SEARCH_KEY,
      "",
    );
    if (fromCurrent) return fromCurrent;
    const fromLegacyUser = getStringParam(
      searchParams,
      LEGACY_ENROLLMENTS_USER_KEY,
      "",
    );
    if (fromLegacyUser) return fromLegacyUser;
    const fromLegacyName = getStringParam(
      searchParams,
      LEGACY_ENROLLMENTS_STUDENT_NAME_KEY,
      "",
    );
    if (fromLegacyName) return fromLegacyName;
    const fromLegacyPhone = getStringParam(
      searchParams,
      LEGACY_ENROLLMENTS_STUDENT_PHONE_KEY,
      "",
    );
    if (fromLegacyPhone) return fromLegacyPhone;
    return initialUserId != null ? String(initialUserId) : "";
  });
  const [selectedCourse, setSelectedCourse] = useState(() => {
    const fromUrl = searchParams.get(ENROLLMENTS_COURSE_KEY);
    if (fromUrl && fromUrl.trim().length > 0) return fromUrl.trim();
    return initialCourseId != null
      ? String(initialCourseId)
      : ALL_COURSES_VALUE;
  });
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(() =>
    getStringParam(searchParams, ENROLLMENTS_FROM_KEY, ""),
  );
  const [dateTo, setDateTo] = useState(() =>
    getStringParam(searchParams, ENROLLMENTS_TO_KEY, ""),
  );
  const [selectedEnrollments, setSelectedEnrollments] = useState<
    Record<string, Enrollment>
  >({});
  const [processingId, setProcessingId] = useState<string | number | null>(
    null,
  );
  const hasInitializedFilterSyncRef = useRef(false);
  const queryCenterId = centerScopeId ?? tenantCenterId ?? undefined;
  const cachedCoursesRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [courseSearch]);

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "enrollment-filter-courses",
      queryCenterId ?? "none",
      debouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: queryCenterId!,
        page: pageParam,
        per_page: FILTER_LIST_PAGE_SIZE,
        search: debouncedCourseSearch || undefined,
      }),
    enabled: Boolean(queryCenterId),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? FILTER_LIST_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const courses = (coursesQuery.data?.pages ?? []).flatMap((queryPage) =>
      queryPage.items.map((course) => ({
        id: course.id,
        title: (course as { title?: string | null }).title ?? null,
      })),
    );

    courses.forEach((course) => {
      cachedCoursesRef.current.set(String(course.id), course);
    });
  }, [coursesQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      { value: ALL_COURSES_VALUE, label: "All courses" },
    ];

    if (!queryCenterId) {
      return defaults;
    }

    const courses = (coursesQuery.data?.pages ?? [])
      .flatMap((queryPage) => queryPage.items)
      .filter(
        (course, index, array) =>
          array.findIndex((item) => String(item.id) === String(course.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label:
          (course as { title?: string | null }).title || `Course ${course.id}`,
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
  }, [coursesQuery.data?.pages, queryCenterId, selectedCourse]);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      centerScopeId,
      center_id: shouldShowCenterFilter ? tenantCenterId : undefined,
      status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
      course_id:
        selectedCourse && selectedCourse !== ALL_COURSES_VALUE
          ? selectedCourse
          : undefined,
      search: studentSearch.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [
      centerScopeId,
      dateFrom,
      dateTo,
      page,
      perPage,
      selectedCourse,
      studentSearch,
      shouldShowCenterFilter,
      statusFilter,
      tenantCenterId,
    ],
  );

  const { data, isLoading, isError, isFetching } = useEnrollments(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    statusFilter !== DEFAULT_REQUEST_STATUS ||
    selectedCourse !== ALL_COURSES_VALUE ||
    studentSearch.trim().length > 0 ||
    dateFrom.trim().length > 0 ||
    dateTo.trim().length > 0 ||
    (shouldShowCenterFilter && tenantCenterId != null);
  const activeFilterCount =
    (statusFilter !== DEFAULT_REQUEST_STATUS ? 1 : 0) +
    (selectedCourse !== ALL_COURSES_VALUE ? 1 : 0) +
    (studentSearch.trim().length > 0 ? 1 : 0) +
    (dateFrom.trim().length > 0 ? 1 : 0) +
    (dateTo.trim().length > 0 ? 1 : 0) +
    (shouldShowCenterFilter && tenantCenterId != null ? 1 : 0);

  const selectedIds = useMemo(
    () => Object.keys(selectedEnrollments),
    [selectedEnrollments],
  );
  const selectedCount = selectedIds.length;
  const selectedEnrollmentsList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedEnrollments[id])
        .filter((enrollment): enrollment is Enrollment => Boolean(enrollment)),
    [selectedEnrollments, selectedIds],
  );
  const pageEnrollmentIds = useMemo(
    () => items.map((enrollment) => String(enrollment.id)),
    [items],
  );
  const isAllPageSelected =
    pageEnrollmentIds.length > 0 &&
    pageEnrollmentIds.every((id) => Boolean(selectedEnrollments[id]));

  useEffect(() => {
    if (!hasInitializedFilterSyncRef.current) {
      hasInitializedFilterSyncRef.current = true;
      return;
    }
    setPage(1);
  }, [
    centerScopeId,
    tenantCenterId,
    statusFilter,
    selectedCourse,
    studentSearch,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    const expectedPage = page > 1 ? String(page) : null;
    const expectedPerPage =
      perPage !== DEFAULT_PER_PAGE ? String(perPage) : null;
    const expectedStatus =
      statusFilter !== DEFAULT_REQUEST_STATUS ? statusFilter : null;
    const expectedCourse =
      selectedCourse !== ALL_COURSES_VALUE ? selectedCourse : null;
    const expectedStudentSearch = studentSearch || null;
    const expectedFrom = dateFrom || null;
    const expectedTo = dateTo || null;

    const hasDiff =
      searchParams.get(ENROLLMENTS_PAGE_KEY) !== expectedPage ||
      searchParams.get(ENROLLMENTS_PER_PAGE_KEY) !== expectedPerPage ||
      searchParams.get(ENROLLMENTS_STATUS_KEY) !== expectedStatus ||
      searchParams.get(ENROLLMENTS_COURSE_KEY) !== expectedCourse ||
      searchParams.get(ENROLLMENTS_STUDENT_SEARCH_KEY) !==
        expectedStudentSearch ||
      searchParams.get(ENROLLMENTS_FROM_KEY) !== expectedFrom ||
      searchParams.get(ENROLLMENTS_TO_KEY) !== expectedTo;

    if (!hasDiff) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    setOrDeleteParam(nextParams, ENROLLMENTS_PAGE_KEY, expectedPage);
    setOrDeleteParam(nextParams, ENROLLMENTS_PER_PAGE_KEY, expectedPerPage);
    setOrDeleteParam(nextParams, ENROLLMENTS_STATUS_KEY, expectedStatus);
    setOrDeleteParam(nextParams, ENROLLMENTS_COURSE_KEY, expectedCourse);
    setOrDeleteParam(
      nextParams,
      ENROLLMENTS_STUDENT_SEARCH_KEY,
      expectedStudentSearch,
    );
    nextParams.delete(LEGACY_ENROLLMENTS_USER_KEY);
    nextParams.delete(LEGACY_ENROLLMENTS_STUDENT_NAME_KEY);
    nextParams.delete(LEGACY_ENROLLMENTS_STUDENT_PHONE_KEY);
    setOrDeleteParam(nextParams, ENROLLMENTS_FROM_KEY, expectedFrom);
    setOrDeleteParam(nextParams, ENROLLMENTS_TO_KEY, expectedTo);

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
    selectedCourse,
    studentSearch,
    statusFilter,
  ]);

  useEffect(() => {
    setSelectedEnrollments({});
  }, [
    centerScopeId,
    page,
    perPage,
    tenantCenterId,
    statusFilter,
    selectedCourse,
    studentSearch,
    dateFrom,
    dateTo,
  ]);

  const toggleEnrollmentSelection = (enrollment: Enrollment) => {
    const enrollmentId = String(enrollment.id);
    setSelectedEnrollments((prev) => {
      if (prev[enrollmentId]) {
        const { [enrollmentId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [enrollmentId]: enrollment };
    });
  };

  const toggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedEnrollments((prev) => {
        const next = { ...prev };
        pageEnrollmentIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedEnrollments((prev) => {
      const next = { ...prev };
      items.forEach((enrollment) => {
        next[String(enrollment.id)] = enrollment;
      });
      return next;
    });
  };

  const handleApprove = (enrollment: Enrollment) => {
    setProcessingId(enrollment.id);
    updateEnrollmentMutation.mutate(
      {
        enrollmentId: enrollment.id,
        payload: { status: "ACTIVE" },
        centerId: centerScopeId,
      },
      {
        onSettled: () => setProcessingId(null),
      },
    );
  };

  const handleReject = (enrollment: Enrollment) => {
    setProcessingId(enrollment.id);
    updateEnrollmentMutation.mutate(
      {
        enrollmentId: enrollment.id,
        payload: { status: "CANCELLED" },
        centerId: centerScopeId,
      },
      {
        onSettled: () => setProcessingId(null),
      },
    );
  };

  const handleBulkApprove = () => {
    const ids = selectedEnrollmentsList.map((e) => e.id);
    if (ids.length === 0) return;

    bulkUpdateStatusMutation.mutate(
      {
        payload: { status: "ACTIVE", enrollment_ids: ids },
        centerId: centerScopeId,
      },
      {
        onSuccess: () => setSelectedEnrollments({}),
      },
    );
  };

  const handleBulkReject = () => {
    const ids = selectedEnrollmentsList.map((e) => e.id);
    if (ids.length === 0) return;

    bulkUpdateStatusMutation.mutate(
      {
        payload: { status: "CANCELLED", enrollment_ids: ids },
        centerId: centerScopeId,
      },
      {
        onSuccess: () => setSelectedEnrollments({}),
      },
    );
  };

  return (
    <ListingCard>
      <ListingFilters
        activeCount={activeFilterCount}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setStatusFilter(DEFAULT_REQUEST_STATUS);
          setSelectedCourse(ALL_COURSES_VALUE);
          setCourseSearch("");
          setStudentSearch("");
          setDateFrom("");
          setDateTo("");
          setPage(1);
          if (shouldShowCenterFilter) {
            setTenantState({ centerId: null, centerName: null });
          }
        }}
        summary={
          <>
            {total} {total === 1 ? "enrollment request" : "enrollment requests"}
          </>
        }
        gridClassName={
          shouldShowCenterFilter
            ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
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
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            placeholder="Search by student name or phone"
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

        <SearchableSelect
          value={selectedCourse}
          onValueChange={(value) =>
            setSelectedCourse(value ?? ALL_COURSES_VALUE)
          }
          options={courseOptions}
          searchValue={courseSearch}
          onSearchValueChange={setCourseSearch}
          placeholder={queryCenterId ? "Course" : "Select center first"}
          searchPlaceholder="Search courses..."
          emptyMessage={
            queryCenterId ? "No courses found" : "Select a center first"
          }
          isLoading={coursesQuery.isLoading}
          filterOptions={false}
          disabled={!queryCenterId}
          hasMore={Boolean(coursesQuery.hasNextPage)}
          isLoadingMore={coursesQuery.isFetchingNextPage}
          onReachEnd={() => {
            if (coursesQuery.hasNextPage) {
              void coursesQuery.fetchNextPage();
            }
          }}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

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
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
              Failed to load enrollment requests. Please try again.
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
                    aria-label="Select all enrollment requests on this page"
                  />
                </TableHead>
                <TableHead className="font-medium">Student</TableHead>
                <TableHead className="font-medium">Course</TableHead>
                {showCenterColumn ? (
                  <TableHead className="font-medium">Center</TableHead>
                ) : null}
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Requested At</TableHead>
                <TableHead className="font-medium">Enrollment Window</TableHead>
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
                        <Skeleton className="h-4 w-36" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      {showCenterColumn ? (
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-7 w-32" />
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell
                    colSpan={showCenterColumn ? 8 : 7}
                    className="h-48"
                  >
                    <EmptyState
                      title="No enrollment requests found"
                      description="Try adjusting your filters."
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((enrollment) => {
                  const status = resolveStatus(enrollment);
                  const student = resolveStudent(enrollment);
                  const course = resolveCourse(enrollment);
                  const center = resolveCenter(enrollment);
                  const decidedByName = resolveDecidedBy(enrollment);
                  const decidedAt = resolveDecisionTimestamp(
                    enrollment,
                    status.key,
                  );
                  const isProcessing = processingId === enrollment.id;

                  return (
                    <TableRow
                      key={enrollment.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(
                            selectedEnrollments[String(enrollment.id)],
                          )}
                          onChange={() => toggleEnrollmentSelection(enrollment)}
                          aria-label={`Select enrollment for ${student.primary}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-white">
                            {getInitials(student.primary)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {student.primary}
                            </span>
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
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {course}
                      </TableCell>
                      {showCenterColumn ? (
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {center}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(enrollment.created_at)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <div className="flex flex-col text-xs">
                          <span>
                            Enrolled:{" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {formatDateTime(enrollment.enrolled_at)}
                            </span>
                          </span>
                          <span>
                            Expires:{" "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {formatDateTime(enrollment.expires_at)}
                            </span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <RequestActionButtons
                          status={status.key}
                          decidedByName={decidedByName}
                          decidedAt={decidedAt}
                          onApprove={() => handleApprove(enrollment)}
                          onReject={() => handleReject(enrollment)}
                          isApproving={
                            isProcessing &&
                            updateEnrollmentMutation.isPending &&
                            updateEnrollmentMutation.variables?.payload
                              .status === "ACTIVE"
                          }
                          isRejecting={
                            isProcessing &&
                            updateEnrollmentMutation.isPending &&
                            updateEnrollmentMutation.variables?.payload
                              .status === "CANCELLED"
                          }
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
              className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400"
              onClick={handleBulkApprove}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending
                ? "Processing..."
                : "Approve Selected"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400"
              onClick={handleBulkReject}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending
                ? "Processing..."
                : "Reject Selected"}
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
