"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { createCenterEnrollment } from "@/features/enrollments/services/enrollments.service";
import type { Student } from "@/features/students/types/student";

const FILTER_LIST_PAGE_SIZE = 20;
const FILTER_SEARCH_DEBOUNCE_MS = 300;

type BulkEnrollStudentsDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  students: Student[];
  centerId?: string | number | null;
  allowCenterChange?: boolean;
  onSuccess?: (_message: string) => void;
};

function normalizeCenterId(value: string | number | null | undefined) {
  if (value == null) return null;
  return String(value).trim().length > 0 ? value : null;
}

function extractFirstMessage(node: unknown): string | null {
  if (typeof node === "string" && node.trim()) {
    return node.trim();
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const message = extractFirstMessage(item);
      if (message) return message;
    }
    return null;
  }

  if (!node || typeof node !== "object") return null;

  for (const value of Object.values(node as Record<string, unknown>)) {
    const message = extractFirstMessage(value);
    if (message) return message;
  }

  return null;
}

function getEnrollErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, unknown>;
          error?: {
            code?: string;
            message?: string;
            details?: unknown;
          };
        }
      | undefined;

    const detailsMessage = extractFirstMessage(data?.error?.details);
    if (detailsMessage) return detailsMessage;

    const validationMessage = extractFirstMessage(data?.errors);
    if (validationMessage) return validationMessage;

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (status === 401) {
      return "Your session is invalid. Please sign in again.";
    }
    if (status === 403) {
      return "You do not have permission to enroll this student for the selected center.";
    }
    if (status === 404) {
      return "Selected course was not found for this center.";
    }
    if (status === 422) {
      return "Unable to create enrollment with the selected student/course.";
    }
  }

  return "Unable to enroll students. Please try again.";
}

function isAlreadyEnrolledMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already enrolled") ||
    normalized.includes("already exists") ||
    normalized.includes("already has")
  );
}

export function BulkEnrollStudentsDialog({
  open,
  onOpenChange,
  students,
  centerId,
  allowCenterChange = false,
  onSuccess,
}: BulkEnrollStudentsDialogProps) {
  const queryClient = useQueryClient();
  const { centerSlug, centerId: tenantCenterId } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const showCenterPicker = allowCenterChange && isPlatformAdmin;
  const [selectedCenterId, setSelectedCenterId] = useState<
    string | number | null
  >(null);
  const defaultCenterId = centerId ?? tenantCenterId ?? null;
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
  const centerIdForQuery = normalizeCenterId(selectedCenterId);
  const hasSelectedCenter = centerIdForQuery != null;
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cachedCoursesRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());
  const [result, setResult] = useState<{
    counts?: {
      total?: number;
      approved?: number;
      skipped?: number;
      failed?: number;
    };
    skipped?: Array<string | number>;
    failed?: Array<{ user_id?: string | number; reason?: string }>;
  } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    if (!open) {
      setSelectedCenterId(initialCenterId);
      setSelectedCourse(null);
      setCourseSearch("");
      setDebouncedCourseSearch("");
      setErrorMessage(null);
      setResult(null);
      return;
    }

    setSelectedCenterId(initialCenterId);
    setSelectedCourse(null);
    setErrorMessage(null);
    setResult(null);
  }, [initialCenterId, open]);

  useEffect(() => {
    if (!open) return;
    setSelectedCourse(null);
    setCourseSearch("");
    setDebouncedCourseSearch("");
    setErrorMessage(null);
  }, [open, centerIdForQuery]);

  const coursesQuery = useInfiniteQuery({
    queryKey: [
      "bulk-enroll-student-courses",
      centerIdForQuery ?? "none",
      debouncedCourseSearch,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      listCenterCourses({
        center_id: centerIdForQuery!,
        page: pageParam,
        per_page: FILTER_LIST_PAGE_SIZE,
        search: debouncedCourseSearch || undefined,
      }),
    enabled: open && hasSelectedCenter,
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
        title: course.title ?? null,
      })),
    );

    courses.forEach((course) => {
      cachedCoursesRef.current.set(String(course.id), course);
    });
  }, [coursesQuery.data?.pages]);

  const courseOptions = useMemo<SearchableSelectOption<string>[]>(() => {
    if (!hasSelectedCenter) {
      return [];
    }

    const courses = (coursesQuery.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter(
        (course, index, array) =>
          array.findIndex((item) => String(item.id) === String(course.id)) ===
          index,
      )
      .map((course) => ({
        value: String(course.id),
        label: course.title || `Course ${course.id}`,
      }));

    if (
      selectedCourse &&
      !courses.some((option) => option.value === selectedCourse)
    ) {
      const selected = cachedCoursesRef.current.get(selectedCourse);
      courses.unshift({
        value: selectedCourse,
        label: selected?.title ?? `Course ${selectedCourse}`,
      });
    }

    return courses;
  }, [coursesQuery.data?.pages, hasSelectedCenter, selectedCourse]);

  const handleEnroll = async () => {
    setErrorMessage(null);
    setResult(null);

    if (!hasSelectedCenter) {
      setErrorMessage("Select a center before enrolling students.");
      return;
    }

    if (!selectedCourse) {
      setErrorMessage("Select a course to enroll students.");
      return;
    }
    if (students.length === 0) {
      setErrorMessage("No students selected.");
      return;
    }

    setIsSubmitting(true);

    try {
      const enrollmentResults = await Promise.all(
        students.map(async (student) => {
          try {
            await createCenterEnrollment(centerIdForQuery!, {
              user_id: student.id,
              course_id: selectedCourse,
            });

            return {
              user_id: student.id,
              status: "approved" as const,
            };
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

      const skipped = enrollmentResults
        .filter((item) => item.status === "skipped")
        .map((item) => item.user_id);
      const failed = enrollmentResults
        .filter((item) => item.status === "failed")
        .map((item) => ({
          user_id: item.user_id,
          reason: item.reason ?? "Failed",
        }));
      const approved = enrollmentResults.filter(
        (item) => item.status === "approved",
      ).length;

      setResult({
        counts: {
          total: students.length,
          approved,
          skipped: skipped.length,
          failed: failed.length,
        },
        skipped,
        failed,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
      ]);

      if (failed.length === 0 && skipped.length === 0) {
        onSuccess?.("All selected students were enrolled successfully.");
        onOpenChange(false);
        return;
      }

      onSuccess?.("Bulk enrollment processed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        if (!nextOpen) {
          setSelectedCenterId(initialCenterId);
          setCourseSearch("");
          setDebouncedCourseSearch("");
          setSelectedCourse(null);
          setErrorMessage(null);
          setResult(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="w-[calc(100vw-1.5rem)] max-w-2xl p-4 sm:p-6"
      >
        <DialogHeader>
          <DialogTitle>Enroll Students</DialogTitle>
          <DialogDescription>
            Choose {showCenterPicker ? "a center and " : ""}a course to enroll{" "}
            {students.length} selected students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
              {errorMessage}
            </div>
          )}

          {result?.counts ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-center dark:border-gray-700 dark:bg-gray-900">
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                  <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                    {result.counts.total ?? students.length}
                  </p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center dark:border-emerald-900/40 dark:bg-emerald-900/20">
                  <p className="text-emerald-700 dark:text-emerald-300">
                    Approved
                  </p>
                  <p className="mt-1 text-base font-semibold text-emerald-800 dark:text-emerald-200">
                    {result.counts.approved ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center dark:border-amber-900/40 dark:bg-amber-900/20">
                  <p className="text-amber-700 dark:text-amber-300">Skipped</p>
                  <p className="mt-1 text-base font-semibold text-amber-800 dark:text-amber-200">
                    {result.counts.skipped ?? 0}
                  </p>
                </div>
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center dark:border-red-900/40 dark:bg-red-900/20">
                  <p className="text-red-700 dark:text-red-300">Failed</p>
                  <p className="mt-1 text-base font-semibold text-red-800 dark:text-red-200">
                    {result.counts.failed ?? 0}
                  </p>
                </div>
              </div>
              {result.failed && result.failed.length > 0 ? (
                <div className="mt-3 space-y-1 text-xs">
                  {result.failed.map((item, index) => (
                    <p key={`${item.user_id}-${index}`}>
                      #{item.user_id ?? "?"}: {item.reason ?? "Failed"}
                    </p>
                  ))}
                </div>
              ) : null}
              {result.skipped && result.skipped.length > 0 ? (
                <div className="mt-3 text-xs">
                  Skipped student IDs: {result.skipped.join(", ")}
                </div>
              ) : null}
            </div>
          ) : null}

          {showCenterPicker ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Center
              </p>
              <CenterPicker
                value={selectedCenterId}
                onValueChange={(nextCenterId) =>
                  setSelectedCenterId(nextCenterId)
                }
                className="w-full min-w-0"
                hideWhenCenterScoped={false}
                selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                disabled={isSubmitting}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Course
            </p>
            <SearchableSelect
              key={String(centerIdForQuery ?? "none")}
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              options={courseOptions}
              searchValue={courseSearch}
              onSearchValueChange={setCourseSearch}
              placeholder={
                hasSelectedCenter ? "Select a course" : "Select center first"
              }
              searchPlaceholder="Search courses..."
              emptyMessage={
                hasSelectedCenter
                  ? "No courses found"
                  : "Select a center to load courses"
              }
              isLoading={coursesQuery.isLoading}
              filterOptions={false}
              showSearch
              disabled={!hasSelectedCenter || isSubmitting}
              hasMore={Boolean(coursesQuery.hasNextPage)}
              isLoadingMore={coursesQuery.isFetchingNextPage}
              onReachEnd={() => {
                if (coursesQuery.hasNextPage) {
                  void coursesQuery.fetchNextPage();
                }
              }}
              triggerClassName="bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={isSubmitting}>
            {isSubmitting ? "Enrolling..." : "Enroll Students"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
