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
  useBulkApproveExtraViewRequests,
  useBulkRejectExtraViewRequests,
  useExtraViewRequests,
} from "@/features/extra-view-requests/hooks/use-extra-view-requests";
import { ExtraViewActionDialog } from "@/features/extra-view-requests/components/ExtraViewActionDialog";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { listVideos } from "@/features/videos/services/videos.service";
import type {
  ExtraViewRequest,
  ExtraViewRequestStatus,
} from "@/features/extra-view-requests/types/extra-view-request";
import { BulkExtraViewActionDialog } from "@/features/student-requests/components/BulkExtraViewActionDialog";
import { RequestActionButtons } from "@/features/student-requests/components/RequestActionButtons";
import { formatDateTime } from "@/lib/format-date-time";
import { setTenantState } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/features/localization";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const ALL_COURSES_VALUE = "all";
const ALL_VIDEOS_VALUE = "all";
const FILTER_LIST_PAGE_SIZE = 20;
const FILTER_SEARCH_DEBOUNCE_MS = 300;
const EXTRA_PAGE_KEY = "xv_page";
const EXTRA_PER_PAGE_KEY = "xv_per_page";
const EXTRA_STATUS_KEY = "xv_status";
const EXTRA_COURSE_KEY = "xv_course";
const EXTRA_VIDEO_KEY = "xv_video";
const EXTRA_STUDENT_SEARCH_KEY = "xv_student";
const EXTRA_FROM_KEY = "xv_from";
const EXTRA_TO_KEY = "xv_to";
const LEGACY_EXTRA_USER_KEY = "xv_user";
const LEGACY_EXTRA_STUDENT_NAME_KEY = "xv_student_name";
const LEGACY_EXTRA_STUDENT_PHONE_KEY = "xv_student_phone";

type ExtraViewRequestsTableProps = {
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
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function resolveStatusVariant(
  value: string | null | undefined,
): "warning" | "success" | "error" | "secondary" {
  const normalized = String(value ?? "").toUpperCase();
  if (normalized === "APPROVED") return "success";
  if (normalized === "REJECTED") return "error";
  if (normalized === "PENDING") return "warning";
  return "secondary";
}

function resolveStatusLabel(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "unknown";
  }
  return raw
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveStatus(
  request: ExtraViewRequest,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): {
  key: string;
  label: string;
} {
  const key =
    asString(request.status_key) ?? asString(request.status) ?? "unknown";

  const label =
    asString(request.status_label) ??
    (resolveStatusLabel(asString(request.status)) === "unknown"
      ? t("pages.studentRequests.tables.extraView.unknown.status")
      : resolveStatusLabel(asString(request.status)));

  return { key, label };
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

function resolveUserLabel(
  request: ExtraViewRequest,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): {
  primary: string;
  phone: string | null;
  email: string | null;
} {
  const user = asRecord(request.user);
  const primary =
    asString(user?.name) ??
    asString(request.user_name) ??
    t("pages.studentRequests.tables.extraView.unknown.student");
  const phone = asString(user?.phone) ?? null;
  const email = asString(user?.email) ?? null;
  return { primary, phone, email };
}

function resolveCourseLabel(
  request: ExtraViewRequest,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const course = asRecord(request.course);
  return (
    asString(course?.name) ??
    asString(course?.title) ??
    asString(request.course_name) ??
    t("pages.studentRequests.tables.extraView.unknown.course")
  );
}

function resolveVideoLabel(
  request: ExtraViewRequest,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const video = asRecord(request.video);
  return (
    asString(video?.title) ??
    asString(request.video_title) ??
    t("pages.studentRequests.tables.extraView.unknown.video")
  );
}

function resolveDecidedBy(request: ExtraViewRequest): string | null {
  const decider = asRecord(request.decider);
  const decidedBy = asRecord(request.decided_by);
  return (
    asString(decider?.name) ??
    asString(decidedBy?.name) ??
    asString(request.decided_by_name) ??
    null
  );
}

function resolveDecidedAt(request: ExtraViewRequest): string | null {
  return asString(request.decided_at) ?? asString(request.updated_at) ?? null;
}

function resolveRequestedAt(request: ExtraViewRequest): string | null {
  return asString(request.requested_at) ?? asString(request.created_at) ?? null;
}

function resolveCenter(
  request: ExtraViewRequest,
  t: (_key: string, _params?: Record<string, string | number>) => string,
): string {
  const center = asRecord(request.center);
  return (
    asString(center?.name) ??
    asString(request.center_name) ??
    t("pages.studentRequests.tables.extraView.unknown.center")
  );
}

export function ExtraViewRequestsTable({
  centerId: centerIdProp,
  hideHeader = false,
  showCenterFilter = true,
}: ExtraViewRequestsTableProps) {
  const { t } = useTranslation();
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

  const bulkApproveMutation = useBulkApproveExtraViewRequests();
  const bulkRejectMutation = useBulkRejectExtraViewRequests();

  const [page, setPage] = useState(() =>
    getPositiveIntParam(searchParams, EXTRA_PAGE_KEY, 1),
  );
  const [perPage, setPerPage] = useState<number>(() =>
    getPositiveIntParam(searchParams, EXTRA_PER_PAGE_KEY, DEFAULT_PER_PAGE),
  );
  const [statusFilter, setStatusFilter] = useState<string>(() =>
    getStringParam(searchParams, EXTRA_STATUS_KEY, ALL_STATUS_VALUE),
  );
  const [studentSearch, setStudentSearch] = useState(() => {
    const fromCurrent = getStringParam(
      searchParams,
      EXTRA_STUDENT_SEARCH_KEY,
      "",
    );
    if (fromCurrent) return fromCurrent;
    const fromLegacyUser = getStringParam(
      searchParams,
      LEGACY_EXTRA_USER_KEY,
      "",
    );
    if (fromLegacyUser) return fromLegacyUser;
    const fromLegacyName = getStringParam(
      searchParams,
      LEGACY_EXTRA_STUDENT_NAME_KEY,
      "",
    );
    if (fromLegacyName) return fromLegacyName;
    const fromLegacyPhone = getStringParam(
      searchParams,
      LEGACY_EXTRA_STUDENT_PHONE_KEY,
      "",
    );
    return fromLegacyPhone;
  });
  const [selectedCourse, setSelectedCourse] = useState(() =>
    getStringParam(searchParams, EXTRA_COURSE_KEY, ALL_COURSES_VALUE),
  );
  const [courseSearch, setCourseSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [debouncedVideoSearch, setDebouncedVideoSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(() =>
    getStringParam(searchParams, EXTRA_VIDEO_KEY, ALL_VIDEOS_VALUE),
  );
  const [dateFrom, setDateFrom] = useState(() =>
    getStringParam(searchParams, EXTRA_FROM_KEY, ""),
  );
  const [dateTo, setDateTo] = useState(() =>
    getStringParam(searchParams, EXTRA_TO_KEY, ""),
  );
  const [selectedRequests, setSelectedRequests] = useState<
    Record<string, ExtraViewRequest>
  >({});
  const [singleAction, setSingleAction] = useState<{
    action: "approve" | "reject";
    request: ExtraViewRequest;
  } | null>(null);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(
    null,
  );
  const hasInitializedFilterSyncRef = useRef(false);
  const queryCenterId = centerScopeId ?? selectedCenterId ?? undefined;
  const cachedCoursesRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());
  const cachedVideosRef = useRef<
    Map<
      string,
      { id: string | number; title?: string | null; courseId?: string }
    >
  >(new Map());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedVideoSearch(videoSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [videoSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [courseSearch]);

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "extra-view-filter-courses",
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

  const videosQuery = useInfiniteQuery({
    queryKey: [
      "extra-view-filter-videos",
      queryCenterId ?? "none",
      selectedCourse,
      debouncedVideoSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listVideos({
        centerId: queryCenterId!,
        page: pageParam,
        per_page: FILTER_LIST_PAGE_SIZE,
        search: debouncedVideoSearch || undefined,
      }),
    enabled: Boolean(queryCenterId),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? FILTER_LIST_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
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

  useEffect(() => {
    const videos = (videosQuery.data?.pages ?? []).flatMap((queryPage) =>
      queryPage.items.map((video) => ({
        id: video.id,
        title:
          video.title ??
          video.title_translations?.en ??
          video.title_translations?.ar ??
          null,
        courseId: video.course_id != null ? String(video.course_id) : undefined,
      })),
    );

    videos.forEach((video) => {
      cachedVideosRef.current.set(String(video.id), video);
    });
  }, [videosQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      {
        value: ALL_COURSES_VALUE,
        label: t("pages.studentRequests.tables.extraView.filters.allCourses"),
      },
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
          (course as { title?: string | null }).title ||
          `${t("pages.studentRequests.tables.extraView.filters.course")} ${course.id}`,
      }));

    if (
      selectedCourse &&
      selectedCourse !== ALL_COURSES_VALUE &&
      !courses.some((option) => option.value === selectedCourse)
    ) {
      const selected = cachedCoursesRef.current.get(selectedCourse);
      courses.unshift({
        value: selectedCourse,
        label:
          selected?.title ??
          `${t("pages.studentRequests.tables.extraView.filters.course")} ${selectedCourse}`,
      });
    }

    return [...defaults, ...courses];
  }, [coursesQuery.data?.pages, queryCenterId, selectedCourse, t]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      {
        value: ALL_VIDEOS_VALUE,
        label: t("pages.studentRequests.tables.extraView.filters.allVideos"),
      },
    ];

    if (!queryCenterId) return defaults;

    const videos = (videosQuery.data?.pages ?? [])
      .flatMap((queryPage) => queryPage.items)
      .filter((video, index, array) => {
        if (selectedCourse !== ALL_COURSES_VALUE) {
          const videoCourseId =
            video.course_id != null ? String(video.course_id) : null;
          if (videoCourseId !== selectedCourse) return false;
        }
        return (
          array.findIndex((item) => String(item.id) === String(video.id)) ===
          index
        );
      })
      .map((video) => ({
        value: String(video.id),
        label:
          video.title ??
          video.title_translations?.en ??
          video.title_translations?.ar ??
          `${t("pages.studentRequests.tables.extraView.filters.video")} ${video.id}`,
      }));

    if (
      selectedVideo &&
      selectedVideo !== ALL_VIDEOS_VALUE &&
      !videos.some((option) => option.value === selectedVideo)
    ) {
      const selected = cachedVideosRef.current.get(selectedVideo);
      videos.unshift({
        value: selectedVideo,
        label:
          selected?.title ??
          `${t("pages.studentRequests.tables.extraView.filters.video")} ${selectedVideo}`,
      });
    }

    return [...defaults, ...videos];
  }, [
    queryCenterId,
    selectedCourse,
    selectedVideo,
    t,
    videosQuery.data?.pages,
  ]);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      centerScopeId,
      center_id: shouldShowCenterFilter ? selectedCenterId : undefined,
      status:
        statusFilter === ALL_STATUS_VALUE
          ? undefined
          : (statusFilter as ExtraViewRequestStatus),
      course_id:
        selectedCourse && selectedCourse !== ALL_COURSES_VALUE
          ? selectedCourse
          : undefined,
      video_id:
        selectedVideo && selectedVideo !== ALL_VIDEOS_VALUE
          ? selectedVideo
          : undefined,
      search: studentSearch.trim() || undefined,
      requested_at_from: dateFrom || undefined,
      requested_at_to: dateTo || undefined,
    }),
    [
      centerScopeId,
      dateFrom,
      dateTo,
      page,
      perPage,
      selectedCenterId,
      selectedCourse,
      selectedVideo,
      studentSearch,
      shouldShowCenterFilter,
      statusFilter,
    ],
  );

  const { data, isLoading, isError, isFetching } = useExtraViewRequests(params);

  const items = useMemo(() => data?.items ?? [], [data]);
  const meta = data?.meta;
  const total = meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const isLoadingState = isLoading;
  const showEmptyState = !isLoadingState && !isError && items.length === 0;
  const hasActiveFilters =
    statusFilter !== ALL_STATUS_VALUE ||
    selectedCourse !== ALL_COURSES_VALUE ||
    selectedVideo !== ALL_VIDEOS_VALUE ||
    studentSearch.trim().length > 0 ||
    dateFrom.trim().length > 0 ||
    dateTo.trim().length > 0 ||
    (shouldShowCenterFilter && selectedCenterId != null);
  const activeFilterCount =
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (selectedCourse !== ALL_COURSES_VALUE ? 1 : 0) +
    (selectedVideo !== ALL_VIDEOS_VALUE ? 1 : 0) +
    (studentSearch.trim().length > 0 ? 1 : 0) +
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
        .filter((item): item is ExtraViewRequest => Boolean(item)),
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
    selectedCourse,
    selectedVideo,
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
    const expectedCourse =
      selectedCourse !== ALL_COURSES_VALUE ? selectedCourse : null;
    const expectedVideo =
      selectedVideo !== ALL_VIDEOS_VALUE ? selectedVideo : null;
    const expectedStudentSearch = studentSearch || null;
    const expectedFrom = dateFrom || null;
    const expectedTo = dateTo || null;

    const hasDiff =
      searchParams.get(EXTRA_PAGE_KEY) !== expectedPage ||
      searchParams.get(EXTRA_PER_PAGE_KEY) !== expectedPerPage ||
      searchParams.get(EXTRA_STATUS_KEY) !== expectedStatus ||
      searchParams.get(EXTRA_COURSE_KEY) !== expectedCourse ||
      searchParams.get(EXTRA_VIDEO_KEY) !== expectedVideo ||
      searchParams.get(EXTRA_STUDENT_SEARCH_KEY) !== expectedStudentSearch ||
      searchParams.get(EXTRA_FROM_KEY) !== expectedFrom ||
      searchParams.get(EXTRA_TO_KEY) !== expectedTo;

    if (!hasDiff) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    setOrDeleteParam(nextParams, EXTRA_PAGE_KEY, expectedPage);
    setOrDeleteParam(nextParams, EXTRA_PER_PAGE_KEY, expectedPerPage);
    setOrDeleteParam(nextParams, EXTRA_STATUS_KEY, expectedStatus);
    setOrDeleteParam(nextParams, EXTRA_COURSE_KEY, expectedCourse);
    setOrDeleteParam(nextParams, EXTRA_VIDEO_KEY, expectedVideo);
    setOrDeleteParam(
      nextParams,
      EXTRA_STUDENT_SEARCH_KEY,
      expectedStudentSearch,
    );
    nextParams.delete(LEGACY_EXTRA_USER_KEY);
    nextParams.delete(LEGACY_EXTRA_STUDENT_NAME_KEY);
    nextParams.delete(LEGACY_EXTRA_STUDENT_PHONE_KEY);
    setOrDeleteParam(nextParams, EXTRA_FROM_KEY, expectedFrom);
    setOrDeleteParam(nextParams, EXTRA_TO_KEY, expectedTo);

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
    selectedVideo,
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
    selectedCourse,
    selectedVideo,
    studentSearch,
    dateFrom,
    dateTo,
  ]);

  const toggleSelection = (request: ExtraViewRequest) => {
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

  const handleApprove = (request: ExtraViewRequest) => {
    setSingleAction({ action: "approve", request });
  };

  const handleReject = (request: ExtraViewRequest) => {
    setSingleAction({ action: "reject", request });
  };

  const handleBulkApprove = () => {
    if (selectedList.length === 0) return;
    setBulkAction("approve");
  };

  const handleBulkReject = () => {
    if (selectedList.length === 0) return;
    setBulkAction("reject");
  };

  return (
    <ListingCard>
      {!hideHeader ? (
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("pages.studentRequests.tables.extraView.title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.studentRequests.tables.extraView.description")}
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
          setSelectedCourse(ALL_COURSES_VALUE);
          setSelectedVideo(ALL_VIDEOS_VALUE);
          setStudentSearch("");
          setCourseSearch("");
          setVideoSearch("");
          setDateFrom("");
          setDateTo("");
          if (shouldShowCenterFilter) {
            setTenantState({ centerId: null, centerName: null });
          }
          setPage(1);
        }}
        summary={
          <>
            {total === 1
              ? t("pages.studentRequests.tables.extraView.summary", {
                  count: total,
                })
              : t("pages.studentRequests.tables.extraView.summaryPlural", {
                  count: total,
                })}
          </>
        }
        gridClassName={
          shouldShowCenterFilter
            ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
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
            placeholder={t(
              "pages.studentRequests.tables.extraView.searchPlaceholder",
            )}
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
            aria-label={t("pages.studentRequests.tables.extraView.clearSearch")}
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
          placeholder={
            queryCenterId
              ? t("pages.studentRequests.tables.extraView.filters.course")
              : t("pages.studentRequests.tables.extraView.filters.selectCenter")
          }
          searchPlaceholder={t(
            "pages.studentRequests.tables.extraView.filters.searchCourses",
          )}
          emptyMessage={
            queryCenterId
              ? t("pages.studentRequests.tables.extraView.filters.noCourses")
              : t("pages.studentRequests.tables.extraView.filters.selectCenter")
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

        <SearchableSelect
          value={selectedVideo}
          onValueChange={(value) => setSelectedVideo(value ?? ALL_VIDEOS_VALUE)}
          options={videoOptions}
          searchValue={videoSearch}
          onSearchValueChange={setVideoSearch}
          placeholder={
            queryCenterId
              ? t("pages.studentRequests.tables.extraView.filters.video")
              : t("pages.studentRequests.tables.extraView.filters.selectCenter")
          }
          searchPlaceholder={t(
            "pages.studentRequests.tables.extraView.filters.searchVideos",
          )}
          emptyMessage={
            queryCenterId
              ? t("pages.studentRequests.tables.extraView.filters.noVideos")
              : t("pages.studentRequests.tables.extraView.filters.selectCenter")
          }
          isLoading={videosQuery.isLoading}
          filterOptions={false}
          disabled={!queryCenterId}
          hasMore={Boolean(videosQuery.hasNextPage)}
          isLoadingMore={videosQuery.isFetchingNextPage}
          onReachEnd={() => {
            if (videosQuery.hasNextPage) {
              void videosQuery.fetchNextPage();
            }
          }}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value)}
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue
              placeholder={t(
                "pages.studentRequests.tables.extraView.filters.status",
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>
              {t("pages.studentRequests.tables.extraView.filters.allStatuses")}
            </SelectItem>
            <SelectItem value="PENDING">
              {t("pages.studentRequests.tables.extraView.filters.pending")}
            </SelectItem>
            <SelectItem value="APPROVED">
              {t("pages.studentRequests.tables.extraView.filters.approved")}
            </SelectItem>
            <SelectItem value="REJECTED">
              {t("pages.studentRequests.tables.extraView.filters.rejected")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          title={t("pages.studentRequests.tables.extraView.filters.fromDate")}
        />

        <Input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => setDateTo(event.target.value)}
          title={t("pages.studentRequests.tables.extraView.filters.toDate")}
        />
      </ListingFilters>

      {isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.studentRequests.tables.extraView.loadFailed")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              {t("pages.studentRequests.tables.extraView.retry")}
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
                    aria-label={t(
                      "pages.studentRequests.tables.extraView.selectAll",
                    )}
                  />
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.studentRequests.tables.extraView.headers.student")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.studentRequests.tables.extraView.headers.video")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.studentRequests.tables.extraView.headers.course")}
                </TableHead>
                {showCenterColumn ? (
                  <TableHead className="font-medium">
                    {t("pages.studentRequests.tables.extraView.headers.center")}
                  </TableHead>
                ) : null}
                <TableHead className="font-medium">
                  {t("pages.studentRequests.tables.extraView.headers.status")}
                </TableHead>
                <TableHead className="font-medium">
                  {t(
                    "pages.studentRequests.tables.extraView.headers.requestedAt",
                  )}
                </TableHead>
                <TableHead className="w-10 text-right font-medium">
                  {t("pages.studentRequests.tables.extraView.headers.actions")}
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
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      {showCenterColumn ? (
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
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
                      title={t(
                        "pages.studentRequests.tables.extraView.empty.noResultsTitle",
                      )}
                      description={t(
                        "pages.studentRequests.tables.extraView.empty.noResultsDescription",
                      )}
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((request) => {
                  const status = resolveStatus(request, t);
                  const user = resolveUserLabel(request, t);
                  const center = resolveCenter(request, t);
                  const decidedByName = resolveDecidedBy(request);
                  const decidedAt = resolveDecidedAt(request);
                  const requestedAt = resolveRequestedAt(request);

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
                          aria-label={t(
                            "pages.studentRequests.tables.extraView.selectRequest",
                            { name: user.primary },
                          )}
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
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {resolveVideoLabel(request, t)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {resolveCourseLabel(request, t)}
                      </TableCell>
                      {showCenterColumn ? (
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {center}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Badge variant={resolveStatusVariant(status.key)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(requestedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <RequestActionButtons
                          status={status.key}
                          decidedByName={decidedByName}
                          decidedAt={decidedAt}
                          onApprove={() => handleApprove(request)}
                          onReject={() => handleReject(request)}
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
            {t("pages.studentRequests.tables.extraView.bulk.selected", {
              count: selectedCount,
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400"
              onClick={handleBulkApprove}
              disabled={
                bulkApproveMutation.isPending || bulkRejectMutation.isPending
              }
            >
              {bulkApproveMutation.isPending
                ? t("pages.studentRequests.tables.extraView.bulk.processing")
                : t(
                    "pages.studentRequests.tables.extraView.bulk.approveSelected",
                  )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400"
              onClick={handleBulkReject}
              disabled={
                bulkApproveMutation.isPending || bulkRejectMutation.isPending
              }
            >
              {bulkRejectMutation.isPending
                ? t("pages.studentRequests.tables.extraView.bulk.processing")
                : t(
                    "pages.studentRequests.tables.extraView.bulk.rejectSelected",
                  )}
            </Button>
          </div>
        </div>
      ) : null}

      <ExtraViewActionDialog
        open={Boolean(singleAction)}
        action={singleAction?.action ?? "approve"}
        request={singleAction?.request ?? null}
        centerId={centerScopeId}
        onOpenChange={(open) => {
          if (!open) setSingleAction(null);
        }}
      />

      <BulkExtraViewActionDialog
        open={bulkAction !== null}
        action={bulkAction ?? "approve"}
        requests={selectedList}
        centerId={centerScopeId ?? undefined}
        onOpenChange={(open) => {
          if (!open) setBulkAction(null);
        }}
        onSuccess={() => {
          setSelectedRequests({});
        }}
      />

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
