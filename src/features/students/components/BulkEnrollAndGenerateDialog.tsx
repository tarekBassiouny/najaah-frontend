"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";
import { useBulkGenerateVideoAccessCodes } from "@/features/video-access/hooks/use-video-access";
import type {
  BulkGenerateVideoAccessCodesPayload,
  BulkGenerateVideoAccessCodesResult,
  VideoAccessWhatsappFormat,
} from "@/features/video-access/types/video-access";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { listVideos } from "@/features/videos/services/videos.service";
import { createCenterEnrollment } from "@/features/enrollments/services/enrollments.service";
import type { Student } from "@/features/students/types/student";
import {
  getEnrollErrorMessage,
  isAlreadyEnrolledMessage,
} from "@/features/students/lib/enrollment-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

const FETCH_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

function normalizeCenterId(value: string | number | null | undefined) {
  if (value == null) return null;
  return String(value).trim().length > 0 ? value : null;
}

type EnrollmentAttempt = {
  user_id: string | number;
  status: "approved" | "skipped" | "failed";
  reason?: string;
};

type BulkEnrollAndGenerateDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  students: Student[];
  centerId?: string | number | null;
  allowCenterChange?: boolean;
};

export function BulkEnrollAndGenerateDialog({
  open,
  onOpenChange,
  students,
  centerId,
  allowCenterChange = false,
}: BulkEnrollAndGenerateDialogProps) {
  const tenant = useTenant();
  const queryClient = useQueryClient();
  const isPlatformAdmin = !tenant.centerSlug;
  const showCenterPicker = allowCenterChange && isPlatformAdmin;
  const defaultCenterId = centerId ?? tenant.centerId ?? null;
  const [selectedCenterId, setSelectedCenterId] = useState<
    string | number | null
  >(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [enrollCourseSearch, setEnrollCourseSearch] = useState("");
  const [enrollDebouncedCourseSearch, setEnrollDebouncedCourseSearch] =
    useState("");
  const [selectedEnrollCourse, setSelectedEnrollCourse] = useState<
    string | null
  >(null);
  const [isEnrollSubmitting, setIsEnrollSubmitting] = useState(false);
  const [enrollAttempts, setEnrollAttempts] = useState<EnrollmentAttempt[]>([]);
  const [enrollResult, setEnrollResult] = useState<{
    counts: {
      total: number;
      approved: number;
      skipped: number;
      failed: number;
    };
    failed?: Array<{ user_id?: string | number; reason?: string }>;
    skipped?: Array<string | number>;
  } | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const coursesCacheRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());
  const videosCacheRef = useRef<Map<string, { title: string }>>(new Map());

  const [generateCourseSearch, setGenerateCourseSearch] = useState("");
  const [generateDebouncedCourseSearch, setGenerateDebouncedCourseSearch] =
    useState("");
  const [selectedGenerateCourse, setSelectedGenerateCourse] = useState<
    string | null
  >(null);
  const [generateVideoSearch, setGenerateVideoSearch] = useState("");
  const [selectedGenerateVideo, setSelectedGenerateVideo] = useState<
    string | null
  >(null);
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [whatsappFormat, setWhatsappFormat] =
    useState<VideoAccessWhatsappFormat>("text_code");
  const [generateResult, setGenerateResult] =
    useState<BulkGenerateVideoAccessCodesResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const bulkGenerateMutation = useBulkGenerateVideoAccessCodes();

  const initialCenterId = useMemo(() => {
    const normalizedDefault = normalizeCenterId(defaultCenterId);
    if (normalizedDefault != null) return normalizedDefault;

    const uniqueCenterIds = new Map<string, string | number>();
    students.forEach((student) => {
      const studentCenterId = normalizeCenterId(
        student.center_id ?? student.center?.id ?? null,
      );
      if (studentCenterId != null) {
        uniqueCenterIds.set(String(studentCenterId), studentCenterId);
      }
    });

    if (uniqueCenterIds.size === 1) {
      return Array.from(uniqueCenterIds.values())[0];
    }

    return null;
  }, [defaultCenterId, students]);

  useEffect(() => {
    setSelectedCenterId(initialCenterId);
    setStep(1);
    setEnrollAttempts([]);
    setEnrollResult(null);
    setEnrollError(null);
    setSelectedEnrollCourse(null);
    setIsEnrollSubmitting(false);
    setGenerateCourseSearch("");
    setGenerateDebouncedCourseSearch("");
    setSelectedGenerateCourse(null);
    setGenerateVideoSearch("");
    setSelectedGenerateVideo(null);
    setSendWhatsapp(false);
    setWhatsappFormat("text_code");
    setGenerateResult(null);
    setGenerateError(null);
    setIsGenerating(false);
  }, [initialCenterId, open]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setEnrollDebouncedCourseSearch(enrollCourseSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [enrollCourseSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGenerateDebouncedCourseSearch(generateCourseSearch.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [generateCourseSearch]);

  useEffect(() => {
    setSelectedEnrollCourse(null);
  }, [open, selectedCenterId]);

  useEffect(() => {
    if (!open) return;
    setSelectedGenerateCourse(null);
    setSelectedGenerateVideo(null);
    setGenerateResult(null);
  }, [open, selectedCenterId]);

  const centerIdForQuery = normalizeCenterId(selectedCenterId);
  const hasSelectedCenter = Boolean(centerIdForQuery);

  const enrollCoursesQuery = useInfiniteQuery({
    queryKey: [
      "bulk-wizard-enroll-courses",
      centerIdForQuery ?? "none",
      enrollDebouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerIdForQuery!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        search: enrollDebouncedCourseSearch || undefined,
      }),
    enabled: open && hasSelectedCenter,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const generateCoursesQuery = useInfiniteQuery({
    queryKey: [
      "bulk-wizard-generate-courses",
      centerIdForQuery ?? "none",
      generateDebouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerIdForQuery!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        search: generateDebouncedCourseSearch || undefined,
      }),
    enabled: open && hasSelectedCenter,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const resolvedGenerateCourseId = selectedGenerateCourse ?? "";

  const generateVideosQuery = useInfiniteQuery({
    queryKey: [
      "bulk-wizard-generate-videos",
      centerIdForQuery ?? "none",
      resolvedGenerateCourseId || "none",
      generateVideoSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listVideos({
        centerId: centerIdForQuery!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        course_id: resolvedGenerateCourseId || undefined,
        search: generateVideoSearch.trim() || undefined,
      }),
    enabled: open && hasSelectedCenter && Boolean(resolvedGenerateCourseId),
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const courses = (enrollCoursesQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    courses.forEach((course) => {
      coursesCacheRef.current.set(String(course.id), course);
    });
  }, [enrollCoursesQuery.data?.pages]);

  useEffect(() => {
    const courses = (generateCoursesQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    courses.forEach((course) => {
      coursesCacheRef.current.set(String(course.id), course);
    });
  }, [generateCoursesQuery.data?.pages]);

  useEffect(() => {
    const videos = (generateVideosQuery.data?.pages ?? []).flatMap(
      (page) => page.items,
    );
    videos.forEach((video) => {
      videosCacheRef.current.set(String(video.id), {
        title:
          video.title ??
          video.title_translations?.en ??
          video.title_translations?.ar ??
          `Video ${video.id}`,
      });
    });
  }, [generateVideosQuery.data?.pages]);

  const enrollCourseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const mapped = (enrollCoursesQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (course, index, array) =>
          array.findIndex((item) => String(item.id) === String(course.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label: course.title ?? `Course ${course.id}`,
      }));

    if (
      selectedEnrollCourse &&
      !mapped.some((option) => option.value === selectedEnrollCourse)
    ) {
      const cached = coursesCacheRef.current.get(selectedEnrollCourse);
      if (cached) {
        mapped.unshift({
          value: selectedEnrollCourse,
          label: cached.title ?? `Course ${selectedEnrollCourse}`,
        });
      }
    }

    return mapped;
  }, [enrollCoursesQuery.data?.pages, selectedEnrollCourse]);

  const generateCourseOptions = useMemo<
    SearchableSelectOption<string>[]
  >(() => {
    const mapped = (generateCoursesQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (course, index, array) =>
          array.findIndex((item) => String(item.id) === String(course.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label: course.title ?? `Course ${course.id}`,
      }));

    if (
      selectedGenerateCourse &&
      !mapped.some((option) => option.value === selectedGenerateCourse)
    ) {
      const cached = coursesCacheRef.current.get(selectedGenerateCourse);
      if (cached) {
        mapped.unshift({
          value: selectedGenerateCourse,
          label: cached.title ?? `Course ${selectedGenerateCourse}`,
        });
      }
    }

    return mapped;
  }, [generateCoursesQuery.data?.pages, selectedGenerateCourse]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    const mapped = (generateVideosQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
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
          `Video ${video.id}`,
      }));

    if (
      selectedGenerateVideo &&
      !mapped.some((option) => option.value === selectedGenerateVideo)
    ) {
      const cached = videosCacheRef.current.get(selectedGenerateVideo);
      if (cached) {
        mapped.unshift({
          value: selectedGenerateVideo,
          label: cached.title,
        });
      }
    }

    return mapped;
  }, [generateVideosQuery.data?.pages, selectedGenerateVideo]);

  const eligibleStudentIds = useMemo(() => {
    const unique = new Map<string | number, string | number>();
    enrollAttempts
      .filter((attempt) => attempt.status !== "failed")
      .forEach((attempt) => {
        unique.set(String(attempt.user_id), attempt.user_id);
      });
    return Array.from(unique.values());
  }, [enrollAttempts]);

  const failedEnrollStudents = useMemo(() => {
    const failedIds = new Set(
      enrollAttempts
        .filter((attempt) => attempt.status === "failed")
        .map((attempt) => attempt.user_id),
    );
    return students.filter((student) => failedIds.has(student.id));
  }, [enrollAttempts, students]);

  const hasFailedEnrollments = failedEnrollStudents.length > 0;

  const hasEligibleStudents = eligibleStudentIds.length > 0;

  const handleEnrollment = async (targetStudents: Student[]) => {
    if (!hasSelectedCenter) {
      setEnrollError("Select a center before enrolling students.");
      return;
    }

    if (!selectedEnrollCourse) {
      setEnrollError("Select a course to enroll students.");
      return;
    }

    if (targetStudents.length === 0) {
      setEnrollError("No students selected.");
      return;
    }

    setEnrollError(null);
    setEnrollResult(null);
    setIsEnrollSubmitting(true);

    try {
      const outcomes = await Promise.all(
        targetStudents.map(async (student) => {
          try {
            await createCenterEnrollment(centerIdForQuery!, {
              user_id: student.id,
              course_id: selectedEnrollCourse,
            });
            return { user_id: student.id, status: "approved" as const };
          } catch (error) {
            const message = getEnrollErrorMessage(error);
            if (isAlreadyEnrolledMessage(message)) {
              return {
                user_id: student.id,
                status: "skipped" as const,
                reason: message,
              };
            }

            return {
              user_id: student.id,
              status: "failed" as const,
              reason: message,
            };
          }
        }),
      );

      const approvedCount = outcomes.filter(
        (item) => item.status === "approved",
      ).length;
      const skippedEntries = outcomes.filter(
        (item) => item.status === "skipped",
      );
      const failedEntries = outcomes.filter((item) => item.status === "failed");

      setEnrollResult({
        counts: {
          total: targetStudents.length,
          approved: approvedCount,
          skipped: skippedEntries.length,
          failed: failedEntries.length,
        },
        failed: failedEntries.map((entry) => ({
          user_id: entry.user_id,
          reason: entry.reason,
        })),
        skipped: skippedEntries.map((entry) => entry.user_id),
      });
      setEnrollAttempts(outcomes);
      setGenerateResult(null);
      setGenerateError(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
      ]);
    } finally {
      setIsEnrollSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    if (!hasSelectedCenter) {
      setGenerateError("Select a center before generating codes.");
      return;
    }

    if (!resolvedGenerateCourseId) {
      setGenerateError("Select a course.");
      return;
    }

    if (!selectedGenerateVideo) {
      setGenerateError("Select a video.");
      return;
    }

    if (!hasEligibleStudents) {
      setGenerateError("No eligible students to generate codes for.");
      return;
    }

    setGenerateError(null);
    setGenerateResult(null);
    setIsGenerating(true);

    try {
      const payload: BulkGenerateVideoAccessCodesPayload = {
        student_ids: eligibleStudentIds,
        course_id: resolvedGenerateCourseId,
        video_id: selectedGenerateVideo,
        ...(sendWhatsapp
          ? { send_whatsapp: true, whatsapp_format: whatsappFormat }
          : {}),
      };

      const response = await bulkGenerateMutation.mutateAsync({
        payload,
        centerId: centerIdForQuery,
      });

      setGenerateResult(response ?? null);
    } catch (error) {
      setGenerateError(
        getStudentRequestApiErrorMessage(error, "Unable to generate codes."),
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const stepLabel = (index: 1 | 2) =>
    step === index
      ? "bg-primary text-white"
      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (
          isEnrollSubmitting ||
          isGenerating ||
          bulkGenerateMutation.isPending
        )
          return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>Enroll & Generate</DialogTitle>
          <DialogDescription>
            Enroll the selected students first, then generate video access codes
            for eligible ones.
          </DialogDescription>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                stepLabel(1),
              )}
            >
              1. Enroll
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                stepLabel(2),
              )}
            >
              2. Generate Codes
            </span>
            {hasEligibleStudents ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(2)}
                disabled={step === 2}
              >
                Go to Step 2
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            {enrollError ? (
              <Alert variant="destructive">
                <AlertTitle>Enrollment failed</AlertTitle>
                <AlertDescription>{enrollError}</AlertDescription>
              </Alert>
            ) : null}

            {showCenterPicker ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Center
                </p>
                <CenterPicker
                  className="w-full min-w-0"
                  hideWhenCenterScoped={false}
                  selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                  value={selectedCenterId}
                  onValueChange={(next) => setSelectedCenterId(next)}
                  disabled={isEnrollSubmitting}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Course
              </p>
              <SearchableSelect
                value={selectedEnrollCourse ?? undefined}
                onValueChange={(value) =>
                  setSelectedEnrollCourse(value ?? null)
                }
                options={enrollCourseOptions}
                searchValue={enrollCourseSearch}
                className="bg-white"
                onSearchValueChange={setEnrollCourseSearch}
                placeholder={
                  hasSelectedCenter ? "Select a course" : "Select center first"
                }
                searchPlaceholder="Search courses..."
                emptyMessage={
                  hasSelectedCenter ? "No courses found" : "Select center first"
                }
                isLoading={enrollCoursesQuery.isLoading}
                filterOptions={false}
                showSearch
                disabled={!hasSelectedCenter}
                hasMore={Boolean(enrollCoursesQuery.hasNextPage)}
                isLoadingMore={enrollCoursesQuery.isFetchingNextPage}
                onReachEnd={() => {
                  if (enrollCoursesQuery.hasNextPage) {
                    void enrollCoursesQuery.fetchNextPage();
                  }
                }}
                triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
              />
            </div>

            {enrollResult?.counts ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">Total</p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                      {enrollResult.counts.total}
                    </p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                    <p>Approved</p>
                    <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-200">
                      {enrollResult.counts.approved}
                    </p>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20">
                    <p>Skipped</p>
                    <p className="mt-1 text-base font-semibold text-amber-800 dark:text-amber-200">
                      {enrollResult.counts.skipped}
                    </p>
                  </div>
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-red-700 dark:border-red-900/40 dark:bg-red-900/20">
                    <p>Failed</p>
                    <p className="mt-1 text-base font-semibold text-red-800 dark:text-red-200">
                      {enrollResult.counts.failed}
                    </p>
                  </div>
                </div>
                {enrollResult.failed && enrollResult.failed.length > 0 ? (
                  <div className="mt-3 space-y-1 text-xs">
                    {enrollResult.failed.map((entry) => (
                      <p key={String(entry.user_id)}>
                        #{entry.user_id ?? "?"}: {entry.reason ?? "Failed"}
                      </p>
                    ))}
                  </div>
                ) : null}
                {enrollResult.skipped && enrollResult.skipped.length > 0 ? (
                  <div className="mt-3 text-xs">
                    Skipped IDs: {enrollResult.skipped.join(", ")}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <p>Eligible for generation: {eligibleStudentIds.length}</p>
                  {hasFailedEnrollments ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEnrollment(failedEnrollStudents)}
                      disabled={isEnrollSubmitting}
                    >
                      Retry failed enroll
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            {generateError ? (
              <Alert variant="destructive">
                <AlertTitle>Generation failed</AlertTitle>
                <AlertDescription>{generateError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="text-sm text-gray-600 dark:text-gray-300">
              Eligible students: {eligibleStudentIds.length}
            </div>

            {!hasEligibleStudents ? (
              <p className="text-xs text-gray-500">
                Complete the enrollment step first to enable this action.
              </p>
            ) : (
              <>
                {showCenterPicker ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Center
                    </p>
                    <CenterPicker
                      className="w-full min-w-0"
                      hideWhenCenterScoped={false}
                      selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                      value={selectedCenterId}
                      onValueChange={(next) => setSelectedCenterId(next)}
                      disabled={isGenerating}
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Course
                  </p>
                  <SearchableSelect
                    value={selectedGenerateCourse ?? undefined}
                    onValueChange={(value) =>
                      setSelectedGenerateCourse(value ?? null)
                    }
                    options={generateCourseOptions}
                    searchValue={generateCourseSearch}
                    onSearchValueChange={setGenerateCourseSearch}
                    placeholder={
                      hasSelectedCenter
                        ? "Select a course"
                        : "Select center first"
                    }
                    searchPlaceholder="Search courses..."
                    emptyMessage={
                      hasSelectedCenter
                        ? "No courses found"
                        : "Select center first"
                    }
                    isLoading={generateCoursesQuery.isLoading}
                    filterOptions={false}
                    showSearch
                    disabled={!hasSelectedCenter}
                    hasMore={Boolean(generateCoursesQuery.hasNextPage)}
                    isLoadingMore={generateCoursesQuery.isFetchingNextPage}
                    onReachEnd={() => {
                      if (generateCoursesQuery.hasNextPage) {
                        void generateCoursesQuery.fetchNextPage();
                      }
                    }}
                    triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Video
                  </p>
                  <SearchableSelect
                    value={selectedGenerateVideo ?? undefined}
                    onValueChange={(value) =>
                      setSelectedGenerateVideo(value ?? null)
                    }
                    options={videoOptions}
                    searchValue={generateVideoSearch}
                    onSearchValueChange={setGenerateVideoSearch}
                    placeholder={
                      resolvedGenerateCourseId
                        ? "Select a video"
                        : "Select course first"
                    }
                    searchPlaceholder="Search videos..."
                    emptyMessage={
                      resolvedGenerateCourseId
                        ? "No videos found"
                        : "Select course first"
                    }
                    filterOptions={false}
                    showSearch
                    isLoading={generateVideosQuery.isLoading}
                    disabled={!resolvedGenerateCourseId}
                    hasMore={Boolean(generateVideosQuery.hasNextPage)}
                    isLoadingMore={generateVideosQuery.isFetchingNextPage}
                    onReachEnd={() => {
                      if (generateVideosQuery.hasNextPage) {
                        void generateVideosQuery.fetchNextPage();
                      }
                    }}
                    triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                  />
                </div>

                <div className="flex items-center">
                  <label
                    htmlFor="bulk-generate-whatsapp-wizard"
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    <input
                      id="bulk-generate-whatsapp-wizard"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                      checked={sendWhatsapp}
                      onChange={(event) =>
                        setSendWhatsapp(event.target.checked)
                      }
                      disabled={isGenerating}
                    />
                    Send via WhatsApp
                  </label>
                </div>

                {sendWhatsapp ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      WhatsApp format
                    </p>
                    <Select
                      value={whatsappFormat}
                      onValueChange={(value) =>
                        setWhatsappFormat(value as VideoAccessWhatsappFormat)
                      }
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text_code">Text code</SelectItem>
                        <SelectItem value="qr_code">QR code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </>
            )}

            {generateResult?.counts ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                  <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-center dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-gray-500 dark:text-gray-400">Total</p>
                    <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                      {generateResult.counts?.total ??
                        eligibleStudentIds.length}
                    </p>
                  </div>
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20">
                    <p>Generated</p>
                    <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-200">
                      {generateResult.counts?.generated ?? 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20">
                    <p>Failed</p>
                    <p className="mt-1 text-base font-semibold text-amber-800 dark:text-amber-200">
                      {generateResult.counts?.failed ?? 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-center text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20">
                    <p>WhatsApp sent</p>
                    <p className="mt-1 text-base font-semibold text-blue-800 dark:text-blue-200">
                      {generateResult.counts?.whatsapp_sent ?? 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-red-700 dark:border-red-900/40 dark:bg-red-900/20">
                    <p>WhatsApp failed</p>
                    <p className="mt-1 text-base font-semibold text-red-800 dark:text-red-200">
                      {generateResult.counts?.whatsapp_failed ?? 0}
                    </p>
                  </div>
                </div>
                {generateResult.failed && generateResult.failed.length > 0 ? (
                  <div className="mt-3 space-y-1 text-xs">
                    {generateResult.failed.map((entry, index) => (
                      <p key={index}>{formatFailure(entry)}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={
              isEnrollSubmitting ||
              isGenerating ||
              bulkGenerateMutation.isPending
            }
          >
            Close
          </Button>
          {step === 1 ? (
            <Button
              onClick={() => handleEnrollment(students)}
              disabled={
                isEnrollSubmitting ||
                !hasSelectedCenter ||
                !selectedEnrollCourse
              }
            >
              {isEnrollSubmitting ? "Enrolling..." : "Enroll Students"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isGenerating}
              >
                Back to Step 1
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  !hasSelectedCenter ||
                  !resolvedGenerateCourseId ||
                  !selectedGenerateVideo
                }
              >
                {isGenerating || bulkGenerateMutation.isPending
                  ? "Generating..."
                  : "Generate Codes"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatFailure(value: Record<string, unknown>) {
  const reference =
    value.student_id ??
    value.user_id ??
    value.id ??
    value.studentId ??
    value.userId;
  const reason =
    (value.reason as string) ?? (value.message as string) ?? "Failed";
  const prefix = reference != null ? `#${reference}` : "";
  return [prefix, reason].filter(Boolean).join(": ") || "Failed";
}
