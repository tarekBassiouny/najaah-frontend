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
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { listStudents } from "@/features/students/services/students.service";
import { listVideos } from "@/features/videos/services/videos.service";
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
};

type GenerateVideoAccessCodeDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId?: string | number | null;
  studentPreset?: FixedSelection | null;
  coursePreset?: FixedSelection | null;
  videoPreset?: FixedSelection | null;
  onGenerated?: (_code: GeneratedVideoAccessCode) => void;
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
  coursePreset,
  videoPreset,
  onGenerated,
}: GenerateVideoAccessCodeDialogProps) {
  const generateMutation = useGenerateVideoAccessCode();
  const sendWhatsappMutation = useSendVideoAccessCodeWhatsapp();

  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedVideo, setSelectedVideo] = useState("");
  const [generatedCode, setGeneratedCode] =
    useState<GeneratedVideoAccessCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [whatsappFormat, setWhatsappFormat] =
    useState<VideoAccessWhatsappFormat>("text_code");

  const cachedStudentsRef = useRef<Map<string, string>>(new Map());
  const cachedCoursesRef = useRef<Map<string, string>>(new Map());
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
  }, [open, studentPreset, coursePreset, videoPreset]);

  const hasCenterId = Boolean(
    centerId != null && String(centerId).trim().length > 0,
  );
  const resolvedCourseId =
    coursePreset != null ? String(coursePreset.id).trim() : selectedCourse;

  const studentsQuery = useInfiniteQuery({
    queryKey: ["video-access-code-students", centerId ?? "none", studentSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listStudents(
        {
          page: pageParam,
          per_page: FETCH_PAGE_SIZE,
          search: studentSearch.trim() || undefined,
        },
        { centerId },
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
    queryKey: ["video-access-code-courses", centerId ?? "none", courseSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerId!,
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

  const videosQuery = useInfiniteQuery({
    queryKey: [
      "video-access-code-videos",
      centerId ?? "none",
      resolvedCourseId || "none",
      videoSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listVideos({
        centerId: centerId!,
        page: pageParam,
        per_page: FETCH_PAGE_SIZE,
        course_id: resolvedCourseId || undefined,
        search: videoSearch.trim() || undefined,
      }),
    enabled: hasCenterId && !videoPreset && resolvedCourseId.length > 0,
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
      cachedCoursesRef.current.set(
        String(course.id),
        asString((course as { title?: unknown }).title) ??
          `Course ${course.id}`,
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
    if (!hasCenterId) {
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
        centerId,
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

    sendWhatsappMutation.mutate(
      {
        centerId,
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
            disabled={!hasCenterId || Boolean(studentPreset)}
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
            placeholder="Course"
            searchPlaceholder="Search courses..."
            emptyMessage="No courses found"
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
            disabled={!hasCenterId || Boolean(videoPreset) || !resolvedCourseId}
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
            disabled={!hasCenterId || generateMutation.isPending}
          >
            {generateMutation.isPending ? "Generating..." : "Generate Code"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
