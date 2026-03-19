"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
import { useTranslation } from "@/features/localization";
import { getEnrollErrorMessage } from "@/features/students/lib/enrollment-utils";

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

export function EnrollStudentDialog({
  open,
  onOpenChange,
  student,
  centerId,
  allowCenterChange = false,
  onSuccess,
}: EnrollStudentDialogProps) {
  const { t } = useTranslation();

  const { centerSlug, centerId: tenantCenterId } = useTenant();
  const enrollMutation = useCreateCenterEnrollment();
  const queryClient = useQueryClient();
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
  const studentCenterId = normalizeCenterId(
    student?.center_id ?? student?.center?.id ?? null,
  );
  const isUnbrandedStudent = studentCenterId == null;
  const centerPickerTypeFilter = isUnbrandedStudent ? "unbranded" : undefined;
  const centerPickerAllLabel = isUnbrandedStudent
    ? t("pages.students.dialogs.enroll.centerPickerUnbranded")
    : t("pages.students.dialogs.enroll.centerPicker");
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
        access_model: "enrollment",
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
  const centerPickerDisabled =
    Boolean(studentCenterId) || enrollMutation.isPending;

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
      setErrorMessage(t("pages.students.dialogs.enroll.errors.selectCenter"));
      return;
    }

    if (!student?.id) {
      setErrorMessage(
        t("pages.students.dialogs.enroll.errors.studentNotFound"),
      );
      return;
    }

    if (!selectedCourse) {
      setErrorMessage(t("pages.students.dialogs.enroll.errors.selectCourse"));
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
          onSuccess?.(t("pages.students.dialogs.enroll.messages.enrolled"));
          void queryClient.invalidateQueries({ queryKey: ["students"] });
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(getEnrollErrorMessage(error, t));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("pages.students.dialogs.enroll.title")}</DialogTitle>
          <DialogDescription>
            {showCenterPicker
              ? t("pages.students.dialogs.enroll.descriptionWithCenter", {
                  name:
                    student?.name ??
                    t("pages.students.dialogs.enrollmentPrompt.entityFallback"),
                })
              : t("pages.students.dialogs.enroll.description", {
                  name:
                    student?.name ??
                    t("pages.students.dialogs.enrollmentPrompt.entityFallback"),
                })}
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
                {t("pages.students.dialogs.enroll.fields.center")}
              </p>
              <CenterPicker
                value={selectedCenterId}
                onValueChange={(nextCenterId) => {
                  setSelectedCenterId(nextCenterId);
                }}
                className="w-full min-w-0"
                hideWhenCenterScoped={false}
                selectClassName="bg-none bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
                disabled={centerPickerDisabled}
                typeFilter={centerPickerTypeFilter}
                allLabel={centerPickerAllLabel}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("pages.students.dialogs.enroll.fields.course")}
            </p>
            <SearchableSelect
              key={String(centerIdForQuery ?? "none")}
              value={selectedCourse}
              onValueChange={setSelectedCourse}
              options={courseOptions}
              searchValue={courseSearch}
              onSearchValueChange={setCourseSearch}
              placeholder={
                hasSelectedCenter
                  ? t("pages.students.dialogs.enroll.placeholders.course")
                  : t(
                      "pages.students.dialogs.enroll.placeholders.selectCenterFirst",
                    )
              }
              searchPlaceholder={t(
                "pages.students.dialogs.enroll.placeholders.searchCourses",
              )}
              emptyMessage={
                hasSelectedCenter
                  ? t("pages.students.dialogs.enroll.empty.noCourses")
                  : t("pages.students.dialogs.enroll.empty.loadCenterFirst")
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
            {t("common.actions.cancel")}
          </Button>
          <Button onClick={handleEnroll} disabled={enrollMutation.isPending}>
            {enrollMutation.isPending
              ? t("pages.students.dialogs.enroll.actions.enrolling")
              : t("pages.students.dialogs.enroll.actions.enroll")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
