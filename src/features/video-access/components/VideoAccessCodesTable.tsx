"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";
import { listStudents } from "@/features/students/services/students.service";
import { listVideos } from "@/features/videos/services/videos.service";
import type { Course } from "@/features/courses/types/course";
import { GenerateVideoAccessCodeDialog } from "@/features/video-access/components/GenerateVideoAccessCodeDialog";
import {
  useBulkSendVideoAccessCodesWhatsapp,
  useBulkWhatsappJob,
  useSendVideoAccessCodeWhatsapp,
  useVideoAccessCodes,
} from "@/features/video-access/hooks/use-video-access";
import type {
  BulkWhatsappJob,
  VideoAccessCode,
  VideoAccessCodeStatus,
  VideoAccessWhatsappFormat,
} from "@/features/video-access/types/video-access";
import { formatDateTime } from "@/lib/format-date-time";
import { setTenantState } from "@/lib/tenant-store";

const DEFAULT_PER_PAGE = 10;
const ALL_STATUS_VALUE = "all";
const ALL_STUDENTS_VALUE = "all";
const ALL_COURSES_VALUE = "all";
const ALL_VIDEOS_VALUE = "all";
const FETCH_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const TERMINAL_JOB_STATUSES = new Set([
  "completed",
  "done",
  "failed",
  "paused",
  "cancelled",
  "canceled",
]);

type VideoAccessCodesTableProps = {
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
): "success" | "warning" | "error" | "secondary" {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "used") return "warning";
  if (normalized === "expired" || normalized === "revoked") return "error";
  return "secondary";
}

function resolveStatusLabel(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Unknown";
  return raw
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveStudentLabel(code: VideoAccessCode): string {
  const student = asRecord(code.student) ?? asRecord(code.user);
  return (
    asString(student?.name) ?? asString(code.user_name) ?? "Unknown Student"
  );
}

function resolveStudentPhone(code: VideoAccessCode): string {
  const student = asRecord(code.student) ?? asRecord(code.user);
  return asString(student?.phone) ?? "—";
}

function resolveCourseLabel(code: VideoAccessCode): string {
  const course = asRecord(code.course);
  return (
    asString(course?.title) ??
    asString(course?.name) ??
    asString(code.course_name) ??
    "Unknown Course"
  );
}

function resolveVideoLabel(code: VideoAccessCode): string {
  const video = asRecord(code.video);
  return (
    asString(video?.title) ?? asString(code.video_title) ?? "Unknown Video"
  );
}

function resolveJobStatus(job: BulkWhatsappJob | undefined): string {
  return asString(job?.status_key) ?? asString(job?.status) ?? "processing";
}

function resolveJobStatusVariant(
  status: string,
): "success" | "warning" | "error" | "secondary" {
  const normalized = status.trim().toLowerCase();
  if (normalized === "completed" || normalized === "done") return "success";
  if (
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return "error";
  }
  if (normalized === "processing" || normalized === "pending") return "warning";
  return "secondary";
}

function readProgressPercent(job: BulkWhatsappJob | undefined): number {
  const raw = Number(job?.progress_percent ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, raw));
}

function readJobRuntimeMaxRetries(job: BulkWhatsappJob | undefined): number {
  const settings = asRecord(job?.settings);
  if (!settings) return 2;

  const value = settings.max_retries;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 2;
}

export function VideoAccessCodesTable({
  centerId: centerIdProp,
  hideHeader = false,
  showCenterFilter = true,
}: VideoAccessCodesTableProps) {
  const tenant = useTenant();
  const isTenantCenterScoped = Boolean(tenant.centerSlug);
  const selectedCenterId = tenant.centerId ?? undefined;
  const centerScopeId = centerIdProp ?? null;
  const shouldShowCenterFilter =
    showCenterFilter && !isTenantCenterScoped && centerScopeId == null;
  const queryCenterId = centerScopeId ?? selectedCenterId ?? null;
  const hasCenterContext =
    queryCenterId != null && String(queryCenterId).trim().length > 0;

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);
  const [selectedStudent, setSelectedStudent] = useState(ALL_STUDENTS_VALUE);
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(ALL_COURSES_VALUE);
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(ALL_VIDEOS_VALUE);
  const [videoSearch, setVideoSearch] = useState("");
  const [debouncedVideoSearch, setDebouncedVideoSearch] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<
    Record<string, VideoAccessCode>
  >({});
  const [whatsappFormat, setWhatsappFormat] =
    useState<VideoAccessWhatsappFormat>("text_code");
  const [processingSendId, setProcessingSendId] = useState<
    string | number | null
  >(null);
  const [activeJob, setActiveJob] = useState<BulkWhatsappJob | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  const sendWhatsappMutation = useSendVideoAccessCodeWhatsapp();
  const bulkSendMutation = useBulkSendVideoAccessCodesWhatsapp();

  const cachedStudentsRef = useRef<Map<string, string>>(new Map());
  const cachedCoursesRef = useRef<
    Map<string, { label: string; centerId?: string | number | null }>
  >(new Map());
  const cachedVideosRef = useRef<
    Map<string, { title: string; courseId?: string }>
  >(new Map());

  useEffect(() => {
    setPage(1);
    setSelectedCodes({});
    setSelectedStudent(ALL_STUDENTS_VALUE);
    setSelectedCourse(ALL_COURSES_VALUE);
    setSelectedVideo(ALL_VIDEOS_VALUE);
    setStudentSearch("");
    setCourseSearch("");
    setVideoSearch("");
    setDebouncedStudentSearch("");
    setDebouncedCourseSearch("");
    setDebouncedVideoSearch("");
    setActiveJob(null);
    setJobError(null);
  }, [queryCenterId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedStudentSearch(studentSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [studentSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedVideoSearch(videoSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [videoSearch]);

  const studentsQuery = useInfiniteQuery({
    queryKey: [
      "video-access-code-filter-students",
      queryCenterId ?? "none",
      debouncedStudentSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listStudents(
        {
          page: pageParam,
          per_page: FETCH_PAGE_SIZE,
          search: debouncedStudentSearch || undefined,
        },
        { centerId: queryCenterId },
      ),
    enabled: hasCenterContext,
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.meta?.page ?? 1);
      const currentPerPage = Number(lastPage.meta?.per_page ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return currentPage * currentPerPage < total ? currentPage + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "video-access-code-filter-courses",
      queryCenterId ?? "none",
      debouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: queryCenterId!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        search: debouncedCourseSearch || undefined,
      }),
    enabled: hasCenterContext,
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.page ?? 1);
      const currentPerPage = Number(lastPage.perPage ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return currentPage * currentPerPage < total ? currentPage + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const videosQuery = useInfiniteQuery({
    queryKey: [
      "video-access-code-filter-videos",
      queryCenterId ?? "none",
      selectedCourse,
      debouncedVideoSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listVideos({
        centerId: queryCenterId!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        course_id:
          selectedCourse !== ALL_COURSES_VALUE ? selectedCourse : undefined,
        search: debouncedVideoSearch || undefined,
      }),
    enabled: hasCenterContext,
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage.meta?.page ?? 1);
      const currentPerPage = Number(lastPage.meta?.per_page ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return currentPage * currentPerPage < total ? currentPage + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const students = (studentsQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    students.forEach((student) => {
      cachedStudentsRef.current.set(
        String(student.id),
        asString(student.name) ?? `Student ${student.id}`,
      );
    });
  }, [studentsQuery.data?.pages]);

  useEffect(() => {
    const courses = (coursesQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    courses.forEach((course) => {
      cachedCoursesRef.current.set(String(course.id), {
        label:
          asString((course as { title?: unknown }).title) ??
          `Course ${course.id}`,
        centerId:
          (course as Course).center_id ?? (course as Course).center?.id ?? null,
      });
    });
  }, [coursesQuery.data?.pages]);

  useEffect(() => {
    const videos = (videosQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    videos.forEach((video) => {
      cachedVideosRef.current.set(String(video.id), {
        title:
          asString(video.title) ??
          asString(video.title_translations?.en) ??
          asString(video.title_translations?.ar) ??
          `Video ${video.id}`,
        courseId: video.course_id != null ? String(video.course_id) : undefined,
      });
    });
  }, [videosQuery.data?.pages]);

  const studentOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      { value: ALL_STUDENTS_VALUE, label: "All students" },
    ];

    if (!hasCenterContext) return defaults;

    const students = (studentsQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => String(entry.id) === String(item.id)) ===
          index,
      )
      .map((student) => ({
        value: String(student.id),
        label: asString(student.name) ?? `Student ${student.id}`,
      }));

    if (
      selectedStudent !== ALL_STUDENTS_VALUE &&
      !students.some((option) => option.value === selectedStudent)
    ) {
      students.unshift({
        value: selectedStudent,
        label:
          cachedStudentsRef.current.get(selectedStudent) ??
          `Student ${selectedStudent}`,
      });
    }

    return [...defaults, ...students];
  }, [hasCenterContext, selectedStudent, studentsQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      { value: ALL_COURSES_VALUE, label: "All courses" },
    ];

    if (!hasCenterContext) return defaults;

    const courses = (coursesQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
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
        label:
          cachedCoursesRef.current.get(selectedCourse)?.label ??
          `Course ${selectedCourse}`,
      });
    }

    return [...defaults, ...courses];
  }, [coursesQuery.data?.pages, hasCenterContext, selectedCourse]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const defaults: SearchableSelectOption<string>[] = [
      { value: ALL_VIDEOS_VALUE, label: "All videos" },
    ];

    if (!hasCenterContext) return defaults;

    const videos = (videosQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (item, index, array) =>
          array.findIndex((entry) => String(entry.id) === String(item.id)) ===
          index,
      )
      .map((video) => ({
        value: String(video.id),
        label:
          asString(video.title) ??
          asString(video.title_translations?.en) ??
          asString(video.title_translations?.ar) ??
          `Video ${video.id}`,
      }));

    if (
      selectedVideo !== ALL_VIDEOS_VALUE &&
      !videos.some((option) => option.value === selectedVideo)
    ) {
      videos.unshift({
        value: selectedVideo,
        label:
          cachedVideosRef.current.get(selectedVideo)?.title ??
          `Video ${selectedVideo}`,
      });
    }

    return [...defaults, ...videos];
  }, [hasCenterContext, selectedVideo, videosQuery.data?.pages]);

  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    selectedStudent,
    selectedCourse,
    selectedVideo,
    queryCenterId,
  ]);

  useEffect(() => {
    setSelectedCodes({});
  }, [
    page,
    perPage,
    statusFilter,
    selectedStudent,
    selectedCourse,
    selectedVideo,
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
          : (statusFilter as VideoAccessCodeStatus),
      user_id:
        selectedStudent !== ALL_STUDENTS_VALUE ? selectedStudent : undefined,
      course_id:
        selectedCourse !== ALL_COURSES_VALUE ? selectedCourse : undefined,
      video_id: selectedVideo !== ALL_VIDEOS_VALUE ? selectedVideo : undefined,
    }),
    [
      page,
      perPage,
      queryCenterId,
      selectedCourse,
      selectedStudent,
      selectedVideo,
      statusFilter,
    ],
  );

  const { data, isLoading, isError, isFetching } = useVideoAccessCodes(params, {
    enabled: hasCenterContext,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.meta?.total ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const showEmptyState = !isLoading && !isError && items.length === 0;

  const selectedIds = useMemo(
    () => Object.keys(selectedCodes),
    [selectedCodes],
  );
  const selectedCount = selectedIds.length;
  const selectedList = useMemo(
    () =>
      selectedIds
        .map((id) => selectedCodes[id])
        .filter((item): item is VideoAccessCode => Boolean(item)),
    [selectedCodes, selectedIds],
  );

  const pageIds = useMemo(() => items.map((item) => String(item.id)), [items]);
  const isAllPageSelected =
    pageIds.length > 0 && pageIds.every((id) => Boolean(selectedCodes[id]));

  const activeJobQuery = useBulkWhatsappJob(
    {
      centerId: queryCenterId,
      jobId: activeJob?.id ?? null,
    },
    {
      enabled: Boolean(queryCenterId) && Boolean(activeJob?.id),
      refetchInterval: (query) => {
        const status = resolveJobStatus(
          query.state.data ?? activeJob ?? undefined,
        )
          .trim()
          .toLowerCase();
        return TERMINAL_JOB_STATUSES.has(status) ? false : 10_000;
      },
      refetchIntervalInBackground: true,
    },
  );

  const activeJobData = activeJobQuery.data ?? activeJob ?? undefined;
  const runtimeMaxRetries = readJobRuntimeMaxRetries(activeJobQuery.data);
  const activeJobStatus = resolveJobStatus(activeJobData);
  const activeJobIsTerminal = TERMINAL_JOB_STATUSES.has(
    activeJobStatus.trim().toLowerCase(),
  );

  useEffect(() => {
    if (!activeJobData) return;
    setActiveJob(activeJobData);
  }, [activeJobData]);

  const handleToggleSelection = (code: VideoAccessCode) => {
    const codeId = String(code.id);
    setSelectedCodes((prev) => {
      if (prev[codeId]) {
        const { [codeId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [codeId]: code };
    });
  };

  const handleToggleAllSelections = () => {
    if (isAllPageSelected) {
      setSelectedCodes((prev) => {
        const next = { ...prev };
        pageIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
      return;
    }

    setSelectedCodes((prev) => {
      const next = { ...prev };
      items.forEach((code) => {
        next[String(code.id)] = code;
      });
      return next;
    });
  };

  const handleSendSingle = (code: VideoAccessCode) => {
    if (!hasCenterContext) return;

    setJobError(null);
    setProcessingSendId(code.id);

    sendWhatsappMutation.mutate(
      {
        centerId: queryCenterId,
        codeId: code.id,
        payload: {
          format: whatsappFormat,
        },
      },
      {
        onSettled: () => {
          setProcessingSendId(null);
        },
        onError: (error) => {
          setJobError(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to send code via WhatsApp.",
            ),
          );
        },
      },
    );
  };

  const handleBulkSend = () => {
    if (!hasCenterContext || selectedList.length === 0) return;

    setJobError(null);

    bulkSendMutation.mutate(
      {
        centerId: queryCenterId,
        payload: {
          code_ids: selectedList.map((item) => item.id),
          format: whatsappFormat,
        },
      },
      {
        onSuccess: (job) => {
          setActiveJob(job);
          setSelectedCodes({});
        },
        onError: (error) => {
          setJobError(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to bulk send codes via WhatsApp.",
            ),
          );
        },
      },
    );
  };

  const hasActiveFilters =
    statusFilter !== ALL_STATUS_VALUE ||
    selectedStudent !== ALL_STUDENTS_VALUE ||
    selectedCourse !== ALL_COURSES_VALUE ||
    selectedVideo !== ALL_VIDEOS_VALUE ||
    (shouldShowCenterFilter && selectedCenterId != null);

  const activeFilterCount =
    (statusFilter !== ALL_STATUS_VALUE ? 1 : 0) +
    (selectedStudent !== ALL_STUDENTS_VALUE ? 1 : 0) +
    (selectedCourse !== ALL_COURSES_VALUE ? 1 : 0) +
    (selectedVideo !== ALL_VIDEOS_VALUE ? 1 : 0) +
    (shouldShowCenterFilter && selectedCenterId != null ? 1 : 0);

  return (
    <ListingCard>
      {!hideHeader ? (
        <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Video Access Codes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage generated codes and send them via WhatsApp.
          </p>
        </div>
      ) : null}

      {jobError ? (
        <div className="px-4 pt-4">
          <Alert variant="destructive">
            <AlertTitle>WhatsApp action failed</AlertTitle>
            <AlertDescription>{jobError}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {activeJobData ? (
        <div className="px-4 pt-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Bulk WhatsApp Job #{String(activeJobData.id)}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Track sending progress for large batches.
                </p>
              </div>
              <Badge variant={resolveJobStatusVariant(activeJobStatus)}>
                {resolveStatusLabel(activeJobStatus)}
              </Badge>
            </div>

            <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${readProgressPercent(activeJobData)}%` }}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-300">
              <span>Total: {Number(activeJobData.total_codes ?? 0)}</span>
              <span>Sent: {Number(activeJobData.sent_count ?? 0)}</span>
              <span>Failed: {Number(activeJobData.failed_count ?? 0)}</span>
              <span>Pending: {Number(activeJobData.pending_count ?? 0)}</span>
              <span>Progress: {readProgressPercent(activeJobData)}%</span>
              <span>Max retries (runtime): {runtimeMaxRetries}</span>
            </div>

            {activeJobIsTerminal ? (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveJob(null)}
                >
                  Clear Job
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ListingFilters
        activeCount={activeFilterCount}
        isFetching={isFetching}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setStatusFilter(ALL_STATUS_VALUE);
          setSelectedStudent(ALL_STUDENTS_VALUE);
          setStudentSearch("");
          setSelectedCourse(ALL_COURSES_VALUE);
          setCourseSearch("");
          setSelectedVideo(ALL_VIDEOS_VALUE);
          setVideoSearch("");
          if (shouldShowCenterFilter) {
            setTenantState({ centerId: null, centerName: null });
          }
          setPage(1);
        }}
        summary={
          <>
            {total} {total === 1 ? "code" : "codes"}
          </>
        }
        gridClassName="grid-cols-1 md:grid-cols-3 lg:grid-cols-5"
      >
        {shouldShowCenterFilter ? (
          <CenterPicker
            className="w-full min-w-0"
            hideWhenCenterScoped={false}
            selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        ) : null}

        <SearchableSelect
          value={selectedStudent}
          onValueChange={(value) =>
            setSelectedStudent(value ?? ALL_STUDENTS_VALUE)
          }
          options={studentOptions}
          searchValue={studentSearch}
          onSearchValueChange={setStudentSearch}
          placeholder={hasCenterContext ? "Student" : "Select center first"}
          searchPlaceholder="Search students..."
          emptyMessage={
            hasCenterContext ? "No students found" : "Select a center first"
          }
          isLoading={studentsQuery.isLoading}
          filterOptions={false}
          disabled={!hasCenterContext}
          hasMore={Boolean(studentsQuery.hasNextPage)}
          isLoadingMore={studentsQuery.isFetchingNextPage}
          onReachEnd={() => {
            if (studentsQuery.hasNextPage) {
              void studentsQuery.fetchNextPage();
            }
          }}
          triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
        />

        <SearchableSelect
          value={selectedCourse}
          onValueChange={(value) =>
            setSelectedCourse(value ?? ALL_COURSES_VALUE)
          }
          options={courseOptions}
          searchValue={courseSearch}
          onSearchValueChange={setCourseSearch}
          placeholder={hasCenterContext ? "Course" : "Select center first"}
          searchPlaceholder="Search courses..."
          emptyMessage={
            hasCenterContext ? "No courses found" : "Select a center first"
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
          placeholder={hasCenterContext ? "Video" : "Select center first"}
          searchPlaceholder="Search videos..."
          emptyMessage={
            hasCenterContext ? "No videos found" : "Select a center first"
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
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={whatsappFormat}
          onValueChange={(value) =>
            setWhatsappFormat(value as VideoAccessWhatsappFormat)
          }
        >
          <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
            <SelectValue placeholder="WhatsApp format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text_code">WhatsApp: Text</SelectItem>
            <SelectItem value="qr_code">WhatsApp: QR</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-end">
          <Button
            className="w-full"
            onClick={() => setGenerateDialogOpen(true)}
            disabled={!hasCenterContext}
          >
            Generate Code
          </Button>
        </div>
      </ListingFilters>

      {!hasCenterContext ? (
        <div className="p-6">
          <EmptyState
            title="Select a center first"
            description="Video access code endpoints are center-scoped. Choose a center to continue."
            className="border-0 bg-transparent"
          />
        </div>
      ) : isError ? (
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load video access codes. Please try again.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[1150px]">
            <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-gray-50/95 [&_th]:backdrop-blur dark:[&_th]:bg-gray-800/95">
              <TableRow className="bg-gray-50/80 dark:bg-gray-800/60">
                <TableHead className="w-8">
                  <input
                    type="checkbox"
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                    checked={isAllPageSelected}
                    onChange={handleToggleAllSelections}
                    disabled={isLoading || items.length === 0}
                    aria-label="Select all codes on this page"
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : showEmptyState ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-48">
                    <EmptyState
                      title="No video access codes found"
                      description="Try adjusting your filters or generate a new code."
                      className="border-0 bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                items.map((code) => {
                  const statusKey =
                    asString(code.status_key) ??
                    asString(code.status) ??
                    "unknown";
                  const statusLabel =
                    asString(code.status_label) ??
                    resolveStatusLabel(statusKey);

                  const isSending =
                    processingSendId === code.id &&
                    sendWhatsappMutation.isPending;

                  return (
                    <TableRow
                      key={code.id}
                      className="group transition-colors hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="text-primary-600 focus:ring-primary-500 h-4 w-4 cursor-pointer rounded border-gray-300"
                          checked={Boolean(selectedCodes[String(code.id)])}
                          onChange={() => handleToggleSelection(code)}
                          aria-label={`Select code ${String(code.id)}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {resolveStudentLabel(code)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {resolveStudentPhone(code)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {resolveVideoLabel(code)}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {resolveCourseLabel(code)}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                          {asString(code.code) ?? "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resolveStatusVariant(statusKey)}>
                          {statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(asString(code.expires_at))}
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDateTime(asString(code.created_at))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendSingle(code)}
                          disabled={isSending}
                        >
                          {isSending ? "Sending..." : "Send WhatsApp"}
                        </Button>
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
          <Button
            size="sm"
            onClick={handleBulkSend}
            disabled={bulkSendMutation.isPending}
          >
            {bulkSendMutation.isPending ? "Queueing..." : "Bulk Send WhatsApp"}
          </Button>
        </div>
      ) : null}

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

      <GenerateVideoAccessCodeDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        centerId={queryCenterId}
        coursePreset={
          selectedCourse !== ALL_COURSES_VALUE
            ? (() => {
                const cachedCourse =
                  cachedCoursesRef.current.get(selectedCourse);
                return {
                  id: selectedCourse,
                  label: cachedCourse?.label ?? `Course ${selectedCourse}`,
                  centerId: cachedCourse?.centerId ?? null,
                };
              })()
            : null
        }
        videoPreset={
          selectedVideo !== ALL_VIDEOS_VALUE
            ? {
                id: selectedVideo,
                label:
                  cachedVideosRef.current.get(selectedVideo)?.title ??
                  `Video ${selectedVideo}`,
              }
            : null
        }
      />
    </ListingCard>
  );
}
