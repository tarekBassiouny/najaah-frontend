"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
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
import type { Student } from "@/features/students/types/student";
import { useTenant } from "@/app/tenant-provider";
import { CenterPicker } from "@/features/centers/components/CenterPicker";
import { listCenterCourses } from "@/features/courses/services/courses.service";
import { useCreateCenterEnrollment } from "@/features/enrollments/hooks/use-enrollments";

const FILTER_LIST_PAGE_SIZE = 20;
const FILTER_SEARCH_DEBOUNCE_MS = 300;

type EnrollStudentDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  student?: Student | null;
  centerId?: string | number | null;
  allowCenterChange?: boolean;
  onSuccess?: (_message: string) => void;
};

function normalizeCenterId(value: string | number | null | undefined) {
  if (value == null) return null;
  return String(value).trim().length > 0 ? value : null;
}

function inferStudentCenterId(student?: Student | null) {
  return normalizeCenterId(student?.center_id ?? student?.center?.id ?? null);
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

  return "Unable to enroll student. Please try again.";
}

export function EnrollStudentDialog({
  open,
  onOpenChange,
  student,
  centerId,
  allowCenterChange = false,
  onSuccess,
}: EnrollStudentDialogProps) {
  const { centerSlug, centerId: tenantCenterId } = useTenant();
  const enrollMutation = useCreateCenterEnrollment();
  const isPlatformAdmin = !centerSlug;
  const [courseSearch, setCourseSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<
    string | number | null
  >(null);
  const wasOpenRef = useRef(false);
  const cachedCoursesRef = useRef<
    Map<string, { id: string | number; title?: string | null }>
  >(new Map());
  const defaultCenterId = centerId ?? tenantCenterId ?? null;
  const initialCenterId = useMemo(
    () => normalizeCenterId(defaultCenterId) ?? inferStudentCenterId(student),
    [defaultCenterId, student],
  );
  const centerIdForQuery = normalizeCenterId(selectedCenterId);
  const hasSelectedCenter = centerIdForQuery != null;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch.trim());
    }, FILTER_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [courseSearch]);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setSelectedCenterId(initialCenterId);
      setSelectedCourse(null);
      setErrorMessage(null);
      setCourseSearch("");
      setDebouncedCourseSearch("");
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setSelectedCenterId(initialCenterId);
      setSelectedCourse(null);
      setErrorMessage(null);
    }
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
      "enroll-student-courses",
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

  const showCenterPicker = allowCenterChange && isPlatformAdmin;

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

  const handleEnroll = () => {
    setErrorMessage(null);

    if (!hasSelectedCenter) {
      setErrorMessage("Select a center first.");
      return;
    }

    if (!student?.id) {
      setErrorMessage("Student not found. Please try again.");
      return;
    }

    if (!selectedCourse) {
      setErrorMessage("Select a course first.");
      return;
    }

    enrollMutation.mutate(
      {
        centerId: centerIdForQuery!,
        payload: {
          user_id: student.id,
          course_id: selectedCourse,
        },
      },
      {
        onSuccess: () => {
          onSuccess?.("Student enrolled successfully.");
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(getEnrollErrorMessage(error));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Choose {showCenterPicker ? "a center and " : ""}a course to enroll{" "}
            {student?.name ?? "this student"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
              {errorMessage}
            </div>
          ) : null}

          {showCenterPicker ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Center
              </p>
              <CenterPicker
                value={selectedCenterId}
                onValueChange={(nextCenterId) => {
                  setSelectedCenterId(nextCenterId);
                }}
                className="w-full min-w-0"
                hideWhenCenterScoped={false}
                selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                disabled={enrollMutation.isPending}
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
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={enrollMutation.isPending}>
            {enrollMutation.isPending ? "Enrolling..." : "Enroll"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
