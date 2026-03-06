"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenant } from "@/app/tenant-provider";
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
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { listStudents } from "@/features/students/services/students.service";
import { listVideos } from "@/features/videos/services/videos.service";
import type { StudentCenter } from "@/features/students/types/student";
import type { Course } from "@/features/courses/types/course";
import {
  useGenerateVideoAccessCode,
  useSendVideoAccessCodeWhatsapp,
} from "@/features/video-access/hooks/use-video-access";
import type {
  GeneratedVideoAccessCode,
  VideoAccessWhatsappFormat,
} from "@/features/video-access/types/video-access";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";

type FixedSelection = {
  id: string | number;
  label: string;
  centerId?: string | number | null;
};

type GenerateVideoAccessCodeDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId?: string | number | null;
  studentPreset?: FixedSelection | null;
  studentCenter?: StudentCenter | null;
  coursePreset?: FixedSelection | null;
  videoPreset?: FixedSelection | null;
  onGenerated?: (_code: GeneratedVideoAccessCode) => void;
  allowCenterChange?: boolean;
};

const FETCH_PAGE_SIZE = 20;

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

function normalizeCenterId(
  value: string | number | null | undefined,
): string | number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isUnbrandedCenterType(type: unknown): boolean {
  const normalized = String(type ?? "")
    .trim()
    .toLowerCase();
  return normalized === "unbranded" || normalized === "0";
}

function resolveCodeStatusVariant(
  value: string | null | undefined,
): "success" | "warning" | "error" | "secondary" {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "used") return "warning";
  if (normalized === "revoked" || normalized === "expired") return "error";
  return "secondary";
}

export function GenerateVideoAccessCodeDialog({
  open,
  onOpenChange,
  centerId,
  studentPreset,
  studentCenter,
  coursePreset,
  videoPreset,
  onGenerated,
  allowCenterChange = false,
}: GenerateVideoAccessCodeDialogProps) {
  const { centerSlug, centerId: tenantCenterId } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const generateMutation = useGenerateVideoAccessCode();
  const sendWhatsappMutation = useSendVideoAccessCodeWhatsapp();

  const studentCenterId = normalizeCenterId(studentCenter?.id ?? null);
  const preferredCenterId =
    studentCenterId ?? normalizeCenterId(centerId ?? tenantCenterId ?? null);
  const [selectedCenterId, setSelectedCenterId] = useState<
    string | number | null
  >(preferredCenterId);
  const showCenterPicker = allowCenterChange && isPlatformAdmin;
  const centerContextId = normalizeCenterId(
    selectedCenterId ?? preferredCenterId,
  );
  const hasCenterId = Boolean(centerContextId);
  const isUnbrandedStudent =
    Boolean(studentCenter) && isUnbrandedCenterType(studentCenter?.type);
  const needsUnbrandedCenterSelection = !studentCenterId;
  const centerPickerTypeFilter =
    isUnbrandedStudent || needsUnbrandedCenterSelection
      ? "unbranded"
      : undefined;
  const centerPickerAllLabel =
    isUnbrandedStudent || needsUnbrandedCenterSelection
      ? "Select unbranded center"
      : "Select center";
  const centerPickerDisabled =
    Boolean(studentCenterId) ||
    generateMutation.isPending ||
    sendWhatsappMutation.isPending;

  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [selectedCourseCenterId, setSelectedCourseCenterId] = useState<
    string | number | null
  >(null);
  const [generatedCode, setGeneratedCode] =
    useState<GeneratedVideoAccessCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [whatsappFormat, setWhatsappFormat] =
    useState<VideoAccessWhatsappFormat>("text_code");

  const cachedStudentsRef = useRef<Map<string, string>>(new Map());
  const cachedCoursesRef = useRef<Map<string, string>>(new Map());
  const courseCenterMapRef = useRef<Map<string, string | number | null>>(
    new Map(),
  );
  const cachedVideosRef = useRef<Map<string, { title: string }>>(new Map());

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);
    setGeneratedCode(null);
    setStudentSearch("");
    setCourseSearch("");
    setVideoSearch("");
    setWhatsappFormat("text_code");

    setSelectedStudent(studentPreset ? String(studentPreset.id) : "");
    setSelectedCourse(coursePreset ? String(coursePreset.id) : "");
    setSelectedVideo(videoPreset ? String(videoPreset.id) : "");
    setSelectedCenterId(preferredCenterId);
  }, [open, preferredCenterId, studentPreset, coursePreset, videoPreset]);

  useEffect(() => {
    setCourseSearch("");
    setVideoSearch("");
    setSelectedCourse("");
    setSelectedVideo("");
    setGeneratedCode(null);
    setErrorMessage(null);
    if (!studentPreset) {
      setSelectedStudent("");
      setStudentSearch("");
    }
  }, [centerContextId, studentPreset]);

  useEffect(() => {
    if (coursePreset) {
      setSelectedCourseCenterId(
        normalizeCenterId(coursePreset.centerId ?? null),
      );
      return;
    }

    if (!selectedCourse) {
      setSelectedCourseCenterId(null);
      return;
    }

    setSelectedCourseCenterId(
      normalizeCenterId(courseCenterMapRef.current.get(selectedCourse) ?? null),
    );
  }, [selectedCourse, coursePreset]);

  const resolvedCourseId =
    coursePreset != null ? String(coursePreset.id).trim() : selectedCourse;

  const studentsQuery = useInfiniteQuery({
    queryKey: [
      "video-access-code-students",
      centerContextId ?? "none",
      studentSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listStudents(
        {
          page: pageParam,
          per_page: FETCH_PAGE_SIZE,
          search: studentSearch.trim() || undefined,
        },
        { centerId: centerContextId },
      ),
    enabled: hasCenterId && !studentPreset,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "video-access-code-courses",
      centerContextId ?? "none",
      courseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerContextId!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        search: courseSearch.trim() || undefined,
      }),
    enabled: hasCenterId && !coursePreset,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.page ?? 1);
      const perPage = Number(lastPage.perPage ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
    },
    staleTime: 60_000,
  });

  const resolvedVideoCenterId = selectedCourseCenterId ?? centerContextId;

  const videosQuery = useInfiniteQuery({
    queryKey: [
      "video-access-code-videos",
      resolvedVideoCenterId ?? "none",
      resolvedCourseId || "none",
      videoSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listVideos({
        centerId: resolvedVideoCenterId!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        course_id: resolvedCourseId || undefined,
        search: videoSearch.trim() || undefined,
      }),
    enabled:
      Boolean(resolvedVideoCenterId) &&
      !videoPreset &&
      resolvedCourseId.length > 0,
    getNextPageParam: (lastPage) => {
      const page = Number(lastPage.meta?.page ?? 1);
      const perPage = Number(lastPage.meta?.per_page ?? FETCH_PAGE_SIZE);
      const total = Number(lastPage.meta?.total ?? 0);
      return page * perPage < total ? page + 1 : undefined;
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
      const courseLabel =
        asString((course as { title?: unknown }).title) ??
        `Course ${course.id}`;
      cachedCoursesRef.current.set(String(course.id), courseLabel);
      const centerIdFromCourse =
        (course as Course).center_id ?? (course as Course).center?.id ?? null;
      courseCenterMapRef.current.set(
        String(course.id),
        normalizeCenterId(centerIdFromCourse),
      );
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
      });
    });
  }, [videosQuery.data?.pages]);

  const studentOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    if (studentPreset) {
      return [{ value: String(studentPreset.id), label: studentPreset.label }];
    }

    const mapped = (studentsQuery.data?.pages ?? [])
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
      selectedStudent &&
      !mapped.some((option) => option.value === selectedStudent)
    ) {
      mapped.unshift({
        value: selectedStudent,
        label:
          cachedStudentsRef.current.get(selectedStudent) ??
          `Student ${selectedStudent}`,
      });
    }

    return mapped;
  }, [selectedStudent, studentPreset, studentsQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    if (coursePreset) {
      return [{ value: String(coursePreset.id), label: coursePreset.label }];
    }

    const mapped = (coursesQuery.data?.pages ?? [])
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
      selectedCourse &&
      !mapped.some((option) => option.value === selectedCourse)
    ) {
      mapped.unshift({
        value: selectedCourse,
        label:
          cachedCoursesRef.current.get(selectedCourse) ??
          `Course ${selectedCourse}`,
      });
    }

    return mapped;
  }, [coursePreset, coursesQuery.data?.pages, selectedCourse]);

  const videoOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    if (videoPreset) {
      return [{ value: String(videoPreset.id), label: videoPreset.label }];
    }

    const mapped = (videosQuery.data?.pages ?? [])
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
      selectedVideo &&
      !mapped.some((option) => option.value === selectedVideo)
    ) {
      mapped.unshift({
        value: selectedVideo,
        label:
          cachedVideosRef.current.get(selectedVideo)?.title ??
          `Video ${selectedVideo}`,
      });
    }

    return mapped;
  }, [selectedVideo, videoPreset, videosQuery.data?.pages]);

  const handleGenerate = () => {
    const centerIdForMutation = resolvedVideoCenterId;
    if (!centerIdForMutation) {
      setErrorMessage("Center context is required.");
      return;
    }

    if (!resolvedCourseId) {
      setErrorMessage("Select course first.");
      return;
    }

    if (
      selectedStudent.trim().length === 0 ||
      selectedVideo.trim().length === 0
    ) {
      setErrorMessage("Select student and video first.");
      return;
    }

    setErrorMessage(null);

    generateMutation.mutate(
      {
        centerId: centerIdForMutation,
        studentId: selectedStudent,
        payload: {
          video_id: selectedVideo,
          course_id: resolvedCourseId,
          send_whatsapp: false,
        },
      },
      {
        onSuccess: (code) => {
          setGeneratedCode(code);
          onGenerated?.(code);
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to generate access code.",
            ),
          );
        },
      },
    );
  };

  const handleSendWhatsapp = () => {
    if (!generatedCode?.id) {
      setErrorMessage("Generate code first.");
      return;
    }

    setErrorMessage(null);

    const centerIdForMutation = resolvedVideoCenterId;
    if (!centerIdForMutation) {
      setErrorMessage("Center context is required.");
      return;
    }
    sendWhatsappMutation.mutate(
      {
        centerId: centerIdForMutation,
        codeId: generatedCode.id,
        payload: { format: whatsappFormat },
      },
      {
        onSuccess: () => {
          setErrorMessage(null);
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to send generated code via WhatsApp.",
            ),
          );
        },
      },
    );
  };

  const selectedCodeValue = asString(generatedCode?.code);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (generateMutation.isPending || sendWhatsappMutation.isPending)
          return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>Generate Video Access Code</DialogTitle>
          <DialogDescription>
            Generate a single-use code and optionally send it via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {showCenterPicker ? (
            <CenterPicker
              hideWhenCenterScoped={false}
              value={selectedCenterId}
              onValueChange={(value) => setSelectedCenterId(value)}
              selectClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
              typeFilter={centerPickerTypeFilter}
              allLabel={centerPickerAllLabel}
              disabled={centerPickerDisabled}
            />
          ) : null}
          {studentPreset ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                Student
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {studentPreset.label}
              </p>
            </div>
          ) : (
            <SearchableSelect
              value={selectedStudent || undefined}
              onValueChange={(value) => setSelectedStudent(value ?? "")}
              options={studentOptions}
              searchValue={studentSearch}
              onSearchValueChange={setStudentSearch}
              placeholder="Student"
              searchPlaceholder="Search students..."
              emptyMessage="No students found"
              isLoading={studentsQuery.isLoading}
              filterOptions={false}
              disabled={!hasCenterId}
              hasMore={Boolean(studentsQuery.hasNextPage)}
              isLoadingMore={studentsQuery.isFetchingNextPage}
              onReachEnd={() => {
                if (studentsQuery.hasNextPage) {
                  void studentsQuery.fetchNextPage();
                }
              }}
              triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          )}

          <SearchableSelect
            value={selectedCourse || undefined}
            onValueChange={(value) => {
              const nextCourseId = value ?? "";
              setSelectedCourse(nextCourseId);
              setVideoSearch("");
              if (!videoPreset) {
                setSelectedVideo("");
              }
            }}
            options={courseOptions}
            searchValue={courseSearch}
            onSearchValueChange={setCourseSearch}
            placeholder={
              hasCenterId ? "Course" : "Select a center to load courses"
            }
            searchPlaceholder="Search courses..."
            emptyMessage={
              hasCenterId
                ? "No courses found"
                : "Select a center to load courses"
            }
            isLoading={coursesQuery.isLoading}
            filterOptions={false}
            disabled={!hasCenterId || Boolean(coursePreset)}
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
            value={selectedVideo || undefined}
            onValueChange={(value) => setSelectedVideo(value ?? "")}
            options={videoOptions}
            searchValue={videoSearch}
            onSearchValueChange={setVideoSearch}
            placeholder={resolvedCourseId ? "Video" : "Select course first"}
            searchPlaceholder="Search videos..."
            emptyMessage={
              resolvedCourseId ? "No videos found" : "Select course first"
            }
            isLoading={videosQuery.isLoading}
            filterOptions={false}
            disabled={
              !resolvedVideoCenterId ||
              Boolean(videoPreset) ||
              !resolvedCourseId
            }
            hasMore={Boolean(videosQuery.hasNextPage)}
            isLoadingMore={videosQuery.isFetchingNextPage}
            onReachEnd={() => {
              if (videosQuery.hasNextPage) {
                void videosQuery.fetchNextPage();
              }
            }}
            triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        </div>

        {generatedCode ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
            <div className="flex items-center gap-2">
              <Badge
                variant={resolveCodeStatusVariant(
                  asString(generatedCode.status_key) ??
                    asString(generatedCode.status),
                )}
              >
                {asString(generatedCode.status_label) ??
                  asString(generatedCode.status) ??
                  "Generated"}
              </Badge>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                Code
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-gray-900 dark:text-white">
                {selectedCodeValue ?? "—"}
              </p>
            </div>

            {generatedCode.expires_at ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Expires at:{" "}
                {new Date(generatedCode.expires_at).toLocaleString()}
              </p>
            ) : null}

            {generatedCode.qr_code_url ? (
              <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-950/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={generatedCode.qr_code_url}
                  alt="Generated QR Code"
                  className="mx-auto max-h-44 max-w-full rounded"
                />
              </div>
            ) : null}

            <div className="grid gap-3 text-sm sm:grid-cols-3 sm:text-xs">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Student
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {generatedCode.student?.name ??
                    studentPreset?.label ??
                    cachedStudentsRef.current.get(selectedStudent) ??
                    `Student ${selectedStudent || "?"}`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Course
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {generatedCode.course?.title ??
                    coursePreset?.label ??
                    cachedCoursesRef.current.get(resolvedCourseId) ??
                    `Course ${resolvedCourseId || "?"}`}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Video
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {generatedCode.video?.title ??
                    videoPreset?.label ??
                    cachedVideosRef.current.get(selectedVideo)?.title ??
                    `Video ${selectedVideo || "?"}`}
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  Center
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {generatedCode.center?.name ??
                    (centerContextId ? `Center ${centerContextId}` : "N/A")}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                  WhatsApp
                </p>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {generatedCode.whatsapp_sent == null
                    ? "Not requested"
                    : generatedCode.whatsapp_sent
                      ? "Sent"
                      : "Failed"}
                </p>
              </div>
            </div>

            {generatedCode.generated_by?.name ||
            generatedCode.generated_at ||
            generatedCode.whatsapp_error ? (
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                {generatedCode.generated_by?.name ? (
                  <p>
                    Generated by:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {generatedCode.generated_by.name}
                    </span>
                  </p>
                ) : null}
                {generatedCode.generated_at ? (
                  <p>
                    Generated at:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(generatedCode.generated_at).toLocaleString()}
                    </span>
                  </p>
                ) : null}
                {generatedCode.whatsapp_error ? (
                  <p className="text-red-500 dark:text-red-400">
                    WhatsApp error: {generatedCode.whatsapp_error}
                  </p>
                ) : null}
              </div>
            ) : null}
            {generatedCode.generated_by?.name ||
            generatedCode.generated_at ||
            generatedCode.whatsapp_error ? (
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                {generatedCode.generated_by?.name ? (
                  <p>
                    Generated by:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {generatedCode.generated_by.name}
                    </span>
                  </p>
                ) : null}
                {generatedCode.generated_at ? (
                  <p>
                    Generated at:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(generatedCode.generated_at).toLocaleString()}
                    </span>
                  </p>
                ) : null}
                {generatedCode.whatsapp_error ? (
                  <p className="text-red-500 dark:text-red-400">
                    WhatsApp error: {generatedCode.whatsapp_error}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!selectedCodeValue || typeof navigator === "undefined")
                    return;
                  void navigator.clipboard.writeText(selectedCodeValue);
                }}
                disabled={!selectedCodeValue}
              >
                Copy Code
              </Button>

              <div className="flex flex-1 items-center gap-2">
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
                    <SelectItem value="text_code">Text code</SelectItem>
                    <SelectItem value="qr_code">QR code</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  onClick={handleSendWhatsapp}
                  disabled={sendWhatsappMutation.isPending}
                >
                  {sendWhatsappMutation.isPending
                    ? "Sending..."
                    : "Send WhatsApp"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={
              generateMutation.isPending || sendWhatsappMutation.isPending
            }
          >
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!resolvedVideoCenterId || generateMutation.isPending}
          >
            {generateMutation.isPending ? "Generating..." : "Generate Code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
