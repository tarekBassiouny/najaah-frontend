"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { RequestActionButtons } from "@/features/student-requests/components/RequestActionButtons";
import { useVideoAccessRequests } from "@/features/video-access/hooks/use-video-access";
import { BulkVideoAccessRequestActionDialog } from "@/features/video-access/components/BulkVideoAccessRequestActionDialog";
import { VideoAccessRequestActionDialog } from "@/features/video-access/components/VideoAccessRequestActionDialog";
import type {
  VideoAccessRequest,
  VideoAccessRequestStatus,
} from "@/features/video-access/types/video-access";
import { useTranslation } from "@/features/localization";
import { listVideos } from "@/features/videos/services/videos.service";
import { formatDateTime } from "@/lib/format-date-time";
import { setTenantState } from "@/lib/tenant-store";
import { cn } from "@/lib/utils";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const ALL_COURSES_VALUE = "all";
const ALL_VIDEOS_VALUE = "all";
const FILTER_LIST_PAGE_SIZE = 20;
const FILTER_SEARCH_DEBOUNCE_MS = 300;

type VideoAccessRequestsTableProps = {
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
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "approved") return "success";
  if (normalized === "rejected") return "error";
  if (normalized === "pending") return "warning";
  return "secondary";
}

function resolveStatusLabel(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "unknown";
  return raw
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveStatus(
  request: VideoAccessRequest,
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
      ? t("pages.studentRequests.tables.videoAccess.unknown.status")
      : resolveStatusLabel(asString(request.status)));

  return { key, label };
}

function resolveUserLabel(request: VideoAccessRequest): {
  primary: string;
  phone: string | null;
  email: string | null;
} {
  const user = asRecord(request.user) ?? asRecord(request.student);
  const primary =
    asString(user?.name) ?? asString(request.user_name) ?? "unknown";
  const phone = asString(user?.phone) ?? null;
  const email = asString(user?.email) ?? null;
  return { primary, phone, email };
}

function resolveCourseLabel(request: VideoAccessRequest) {
  const course = asRecord(request.course);
  return (
    asString(course?.name) ??
    asString(course?.title) ??
    asString(request.course_name) ??
    "unknown"
  );
}

function resolveVideoLabel(request: VideoAccessRequest) {
  const video = asRecord(request.video);
  return asString(video?.title) ?? asString(request.video_title) ?? "unknown";
}

function resolveDecidedBy(request: VideoAccessRequest): string | null {
  const decider = asRecord(request.decider) ?? asRecord(request.decided_by);
  return asString(decider?.name) ?? asString(request.decided_by_name) ?? null;
}

function resolveDecidedAt(request: VideoAccessRequest): string | null {
  return asString(request.decided_at) ?? asString(request.updated_at) ?? null;
}

function resolveRequestedAt(request: VideoAccessRequest): string | null {
  return asString(request.requested_at) ?? asString(request.created_at) ?? null;
}

function resolveCenter(request: VideoAccessRequest): string {
  const center = asRecord(request.center);
  return asString(center?.name) ?? asString(request.center_name) ?? "unknown";
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

export function VideoAccessRequestsTable({
  centerId: centerIdProp,
  hideHeader = false,
  showCenterFilter = true,
}: VideoAccessRequestsTableProps) {
  const { t } = useTranslation();
  const tenant = useTenant();
  const isTenantCenterScoped = Boolean(tenant.centerSlug);
  const selectedCenterId = tenant.centerId ?? undefined;
  const centerScopeId = centerIdProp ?? null;
  const shouldShowCenterFilter =
    showCenterFilter && !isTenantCenterScoped && centerScopeId == null;
  const showCenterColumn = centerScopeId == null && !isTenantCenterScoped;
  const queryCenterId = centerScopeId ?? selectedCenterId ?? null;
  const hasCenterContext =
    queryCenterId != null && String(queryCenterId).trim().length > 0;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [debouncedVideoSearch, setDebouncedVideoSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(ALL_COURSES_VALUE);
  const [selectedVideo, setSelectedVideo] = useState(ALL_VIDEOS_VALUE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedRequests, setSelectedRequests] = useState<
    Record<string, VideoAccessRequest>
  >({});
  const [singleAction, setSingleAction] = useState<{
    action: "approve" | "reject";
    request: VideoAccessRequest;
  } | null>(null);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(
    null,
  );

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
    setPage(1);
    setSelectedRequests({});
    setSelectedCourse(ALL_COURSES_VALUE);
    setSelectedVideo(ALL_VIDEOS_VALUE);
    setCourseSearch("");
    setVideoSearch("");
    setDebouncedCourseSearch("");
    setDebouncedVideoSearch("");
  }, [queryCenterId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedVideoSearch(videoSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [videoSearch]);

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "video-access-filter-courses",
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
    enabled: hasCenterContext,
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.page ?? 1);
      const currentPerPage = Number(lastPage.perPage ?? FILTER_LIST_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return currentPage * currentPerPage < total ? currentPage + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const videosQuery = useInfiniteQuery({
    queryKey: [
      "video-access-filter-videos",
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
        course_id:
          selectedCourse !== ALL_COURSES_VALUE ? selectedCourse : undefined,
        search: debouncedVideoSearch || undefined,
      }),
    enabled: hasCenterContext,
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.meta?.page ?? 1);
      const currentPerPage = Number(
        lastPage.meta?.per_page ?? FILTER_LIST_PAGE_SIZE,
      );
      const total = Number(lastPage.meta?.total ?? 0);
      return currentPage * currentPerPage < total ? currentPage + 1 : undefined;
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
        label: t("pages.studentRequests.tables.videoAccess.filters.allCourses"),
      },
    ];

    if (!hasCenterContext) return defaults;

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
          `${t("pages.studentRequests.tables.videoAccess.filters.course")} ${course.id}`,
      }));

    if (
      selectedCourse !== ALL_COURSES_VALUE &&
      !courses.some((option) => option.value === selectedCourse)
    ) {
      const selected = cachedCoursesRef.current.get(selectedCourse);
      courses.unshift({
        value: selectedCourse,
        label:
          selected?.title ??
          `${t("pages.studentRequests.tables.videoAccess.filters.course")} ${selectedCourse}`,
      });
    }

    return [...defaults, ...courses];
  }, [coursesQuery.data?.pages, hasCenterContext, selectedCourse, t]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      {
        value: ALL_VIDEOS_VALUE,
        label: t("pages.studentRequests.tables.videoAccess.filters.allVideos"),
      },
    ];

    if (!hasCenterContext) return defaults;

    const videos = (videosQuery.data?.pages ?? [])
      .flatMap((queryPage) => queryPage.items)
      .filter(
        (video, index, array) =>
          array.findIndex((item) => String(item.id) === String(video.id)) ===
          index,
      )
      .map((video) => ({
        value: String(video.id),
        label:
          video.title ??
          video.title_translations?.en ??
          video.title_translations?.ar ??
          `${t("pages.studentRequests.tables.videoAccess.filters.video")} ${video.id}`,
      }));

    if (
      selectedVideo !== ALL_VIDEOS_VALUE &&
      !videos.some((option) => option.value === selectedVideo)
    ) {
      const selected = cachedVideosRef.current.get(selectedVideo);
      videos.unshift({
        value: selectedVideo,
        label:
          selected?.title ??
          `${t("pages.studentRequests.tables.videoAccess.filters.video")} ${selectedVideo}`,
      });
    }

    return [...defaults, ...videos];
  }, [hasCenterContext, selectedVideo, t, videosQuery.data?.pages]);

  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    studentSearch,
    selectedCourse,
    selectedVideo,
    dateFrom,
    dateTo,
    queryCenterId,
  ]);

  useEffect(() => {
    setSelectedRequests({});
  }, [
    page,
    perPage,
    statusFilter,
    selectedCourse,
    selectedVideo,
    studentSearch,
    dateFrom,
    dateTo,
    queryCenterId,
  ]);

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      centerScopeId: queryCenterId,
      status:
        statusFilter === ALL_STATUS_VALUE
          ? undefined
          : (statusFilter as VideoAccessRequestStatus),
      user_id: undefined,
      course_id:
        selectedCourse !== ALL_COURSES_VALUE ? selectedCourse : undefined,
      video_id: selectedVideo !== ALL_VIDEOS_VALUE ? selectedVideo : undefined,
      search: studentSearch.trim() || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [
      dateFrom,
      dateTo,
      page,
      perPage,
      queryCenterId,
      selectedCourse,
      selectedVideo,
      statusFilter,
      studentSearch,
    ],
  );

  const { data, isLoading, isError, isFetching } = useVideoAccessRequests(
    params,
    {
      enabled: hasCenterContext,
    },
  );

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const showEmptyState = !isLoading && !isError && items.length === 0;
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
        .filter((item): item is VideoAccessRequest => Boolean(item)),
    [selectedIds, selectedRequests],
  );

  const pageIds = useMemo(() => items.map((item) => String(item.id)), [items]);
  const isAllPageSelected =
    pageIds.length > 0 && pageIds.every((id) => Boolean(selectedRequests[id]));

  const toggleSelection = (request: VideoAccessRequest) => {
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
            {t("pages.studentRequests.tables.videoAccess.title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.studentRequests.tables.videoAccess.description")}
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
              ? t("pages.studentRequests.tables.videoAccess.summary", {
                  count: total,
                })
              : t("pages.studentRequests.tables.videoAccess.summaryPlural", {
                  count: total,
                })}
          </>
        }
        gridClassName="grid-cols-1 md:grid-cols-3 lg:grid-cols-4"
      >
        <Input
          value={studentSearch}
          onChange={(event) => setStudentSearch(event.target.value)}
          placeholder={t(
            "pages.studentRequests.tables.videoAccess.searchPlaceholder",
          )}
        />

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
            hasCenterContext
              ? t("pages.studentRequests.tables.videoAccess.filters.course")
              : t(
                  "pages.studentRequests.tables.videoAccess.filters.selectCenter",
                )
          }
          searchPlaceholder={t(
            "pages.studentRequests.tables.videoAccess.filters.searchCourses",
          )}
          emptyMessage={
            hasCenterContext
              ? t("pages.studentRequests.tables.videoAccess.filters.noCourses")
              : t(
                  "pages.studentRequests.tables.videoAccess.filters.selectCenter",
                )
          }
          isLoading={coursesQuery.isLoading}
          filterOptions={false}
          disabled={!hasCenterContext}
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
            hasCenterContext
              ? t("pages.studentRequests.tables.videoAccess.filters.video")
              : t(
                  "pages.studentRequests.tables.videoAccess.filters.selectCenter",
                )
          }
          searchPlaceholder={t(
            "pages.studentRequests.tables.videoAccess.filters.searchVideos",
          )}
          emptyMessage={
            hasCenterContext
              ? t("pages.studentRequests.tables.videoAccess.filters.noVideos")
              : t(
                  "pages.studentRequests.tables.videoAccess.filters.selectCenter",
                )
          }
          isLoading={videosQuery.isLoading}
          filterOptions={false}
          disabled={!hasCenterContext}
          hasMore={Boolean(videosQuery.hasNextPage)}
          isLoadingMore={videosQuery.isFetchingNextPage}
          onReachEnd={() => {
            if (videosQuery.hasNextPage) {
              void videosQuery.fetchNextPage();
            }
          }}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue
              placeholder={t(
                "pages.studentRequests.tables.videoAccess.filters.status",
              )}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>
              {t(
                "pages.studentRequests.tables.videoAccess.filters.allStatuses",
              )}
            </SelectItem>
            <SelectItem value="pending">
              {t("pages.studentRequests.tables.videoAccess.filters.pending")}
            </SelectItem>
            <SelectItem value="approved">
              {t("pages.studentRequests.tables.videoAccess.filters.approved")}
            </SelectItem>
            <SelectItem value="rejected">
              {t("pages.studentRequests.tables.videoAccess.filters.rejected")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          title={t("pages.studentRequests.tables.videoAccess.filters.fromDate")}
        />

        <Input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => setDateTo(event.target.value)}
          title={t("pages.studentRequests.tables.videoAccess.filters.toDate")}
        />
      </ListingFilters>

      {!hasCenterContext ? (
        <div className="p-6">
          <EmptyState
            title={t(
              "pages.studentRequests.tables.videoAccess.empty.selectCenterTitle",
            )}
            description={t(
              "pages.studentRequests.tables.videoAccess.empty.selectCenterDescription",
            )}
            className="border-0 bg-transparent"
          />
        </div>
      ) : isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("pages.studentRequests.tables.videoAccess.loadFailed")}
            </p>
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
                    disabled={isLoading || items.length === 0}
                    aria-label={t(
                      "pages.studentRequests.tables.videoAccess.selectAll",
                    )}
                  />
                </TableHead>
                <TableHead className="font-medium">
                  {t(
                    "pages.studentRequests.tables.videoAccess.headers.student",
                  )}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.studentRequests.tables.videoAccess.headers.video")}
                </TableHead>
                <TableHead className="font-medium">
                  {t("pages.studentRequests.tables.videoAccess.headers.course")}
                </TableHead>
                {showCenterColumn ? (
                  <TableHead className="font-medium">
                    {t(
                      "pages.studentRequests.tables.videoAccess.headers.center",
                    )}
                  </TableHead>
                ) : null}
                <TableHead className="font-medium">
                  {t("pages.studentRequests.tables.videoAccess.headers.status")}
                </TableHead>
                <TableHead className="font-medium">
                  {t(
                    "pages.studentRequests.tables.videoAccess.headers.requestedAt",
                  )}
                </TableHead>
                <TableHead className="w-10 text-right font-medium">
                  {t(
                    "pages.studentRequests.tables.videoAccess.headers.actions",
                  )}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
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
                ))
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell
                    colSpan={showCenterColumn ? 8 : 7}
                    className="h-48"
                  >
                    <EmptyState
                      title={t(
                        "pages.studentRequests.tables.videoAccess.empty.noResultsTitle",
                      )}
                      description={t(
                        "pages.studentRequests.tables.videoAccess.empty.noResultsDescription",
                      )}
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((request) => {
                  const status = resolveStatus(request, t);
                  const user = resolveUserLabel(request);
                  const center = resolveCenter(request);

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
                            "pages.studentRequests.tables.videoAccess.selectRequest",
                            {
                              name:
                                user.primary === "unknown"
                                  ? t(
                                      "pages.studentRequests.tables.videoAccess.unknown.student",
                                    )
                                  : user.primary,
                            },
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
                              {user.primary === "unknown"
                                ? t(
                                    "pages.studentRequests.tables.videoAccess.unknown.student",
                                  )
                                : user.primary}
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
                        {resolveVideoLabel(request) === "unknown"
                          ? t(
                              "pages.studentRequests.tables.videoAccess.unknown.video",
                            )
                          : resolveVideoLabel(request)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {resolveCourseLabel(request) === "unknown"
                          ? t(
                              "pages.studentRequests.tables.videoAccess.unknown.course",
                            )
                          : resolveCourseLabel(request)}
                      </TableCell>
                      {showCenterColumn ? (
                        <TableCell className="text-gray-500 dark:text-gray-400">
                          {center === "unknown"
                            ? t(
                                "pages.studentRequests.tables.videoAccess.unknown.center",
                              )
                            : center}
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Badge variant={resolveStatusVariant(status.key)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(resolveRequestedAt(request))}
                      </TableCell>
                      <TableCell className="text-right">
                        <RequestActionButtons
                          status={status.key}
                          decidedByName={resolveDecidedBy(request)}
                          decidedAt={resolveDecidedAt(request)}
                          onApprove={() =>
                            setSingleAction({ action: "approve", request })
                          }
                          onReject={() =>
                            setSingleAction({ action: "reject", request })
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
            {t("pages.studentRequests.tables.videoAccess.bulk.selected", {
              count: selectedCount,
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:text-green-400"
              onClick={handleBulkApprove}
              disabled={bulkAction !== null}
            >
              {t(
                "pages.studentRequests.tables.videoAccess.bulk.approveSelected",
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400"
              onClick={handleBulkReject}
              disabled={bulkAction !== null}
            >
              {t(
                "pages.studentRequests.tables.videoAccess.bulk.rejectSelected",
              )}
            </Button>
          </div>
        </div>
      ) : null}

      <VideoAccessRequestActionDialog
        open={Boolean(singleAction)}
        action={singleAction?.action ?? "approve"}
        request={singleAction?.request ?? null}
        centerId={queryCenterId}
        onOpenChange={(open) => {
          if (!open) setSingleAction(null);
        }}
      />

      <BulkVideoAccessRequestActionDialog
        open={bulkAction !== null}
        action={bulkAction ?? "approve"}
        requests={selectedList}
        centerId={queryCenterId ?? undefined}
        onOpenChange={(open) => {
          if (!open) setBulkAction(null);
        }}
        onSuccess={() => {
          setSelectedRequests({});
        }}
      />

      {!isError && hasCenterContext && maxPage > 1 ? (
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
