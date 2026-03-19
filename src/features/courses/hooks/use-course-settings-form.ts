"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/components/ui/modal-store";
import { useUpdateCenterCourse } from "@/features/courses/hooks/use-courses";
import { useCategoryOptions } from "@/features/categories/hooks/use-category-options";
import {
  getCourseEducationTargetingValues,
  getEducationTargetingError,
  hasAnyEducationTarget,
  isEducationTargetingFieldKey,
  toCourseEducationTargetingPayload,
  type CourseEducationTargetingValues,
} from "@/features/courses/utils/education-targeting";
import { resolveCategoryId } from "@/features/courses/utils/course-helpers";
import { getAdminApiFieldErrors } from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";
import type { Course } from "@/features/courses/types/course";

type SettingsFormState = {
  title: string;
  slug: string;
  description: string;
  category_id: string;
};

export function useCourseSettingsForm({
  centerId,
  courseId,
  course,
}: {
  centerId: string;
  courseId: string;
  course: Course | undefined;
}) {
  const { t } = useTranslation();
  const { showToast } = useModal();

  const {
    mutate: updateCourse,
    isPending: isSavingSettings,
    isError: isSettingsError,
    error: settingsError,
  } = useUpdateCenterCourse();

  const [settingsForm, setSettingsForm] = useState<SettingsFormState>({
    title: "",
    slug: "",
    description: "",
    category_id: "none",
  });
  const [settingsFieldErrors, setSettingsFieldErrors] = useState<
    Record<string, string[]>
  >({});
  const [educationTargeting, setEducationTargeting] =
    useState<CourseEducationTargetingValues>({
      showForAllStudents: true,
      gradeIds: [],
      schoolIds: [],
      collegeIds: [],
    });
  const [
    educationTargetingValidationError,
    setEducationTargetingValidationError,
  ] = useState<string | null>(null);

  const {
    options: categoryOptions,
    search: categorySearch,
    setSearch: setCategorySearch,
    isLoading: isLoadingCategories,
    hasMore: hasMoreCategories,
    isLoadingMore: isLoadingMoreCategories,
    onReachEnd: loadMoreCategories,
  } = useCategoryOptions({
    centerId,
    selectedValue: settingsForm.category_id,
    includeNoneOption: true,
    noneOptionValue: "none",
    noneOptionLabel: t("pages.centerCourseDetail.settings.fields.noCategory"),
  });

  useEffect(() => {
    if (!course) return;

    const record = course as Record<string, unknown>;

    setSettingsForm({
      title: String(record.title ?? record.name ?? ""),
      slug: String(record.slug ?? ""),
      description: String(record.description ?? ""),
      category_id: resolveCategoryId(record),
    });
    setEducationTargeting(getCourseEducationTargetingValues(course));
    setSettingsFieldErrors({});
    setEducationTargetingValidationError(null);
  }, [course]);

  const educationTargetingFieldError =
    getEducationTargetingError(settingsFieldErrors);
  const educationTargetingError =
    educationTargetingValidationError ?? educationTargetingFieldError;

  const handleEducationTargetingChange = (
    nextValues: CourseEducationTargetingValues,
  ) => {
    setEducationTargeting(nextValues);
    setEducationTargetingValidationError(null);
    setSettingsFieldErrors((prev) => {
      const next = { ...prev };
      delete next.show_for_all_students;
      delete next.grade_ids;
      delete next.school_ids;
      delete next.college_ids;
      Object.keys(next).forEach((key) => {
        if (isEducationTargetingFieldKey(key)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const handleSettingsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSettingsFieldErrors({});
    setEducationTargetingValidationError(null);

    if (
      !educationTargeting.showForAllStudents &&
      !hasAnyEducationTarget(educationTargeting)
    ) {
      setEducationTargetingValidationError(
        t("pages.centerCourseDetail.errors.targetingRequired"),
      );
      return;
    }

    updateCourse(
      {
        centerId,
        courseId,
        payload: {
          title: settingsForm.title || undefined,
          slug: settingsForm.slug || undefined,
          description: settingsForm.description || undefined,
          category_id:
            settingsForm.category_id !== "none"
              ? settingsForm.category_id
              : undefined,
          ...toCourseEducationTargetingPayload(educationTargeting),
        },
      },
      {
        onError: (mutationError) => {
          const errors = getAdminApiFieldErrors(mutationError) as
            | Record<string, string[] | string>
            | undefined;

          if (!errors) {
            setSettingsFieldErrors({});
            return;
          }

          const normalizedErrors = Object.fromEntries(
            Object.entries(errors).map(([key, value]) => [
              key,
              Array.isArray(value) ? value.map(String) : [String(value)],
            ]),
          );

          setSettingsFieldErrors(normalizedErrors);
        },
      },
    );
  };

  const handleSettingsChange =
    (field: "title" | "slug" | "description") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSettingsForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSettingsReset = () => {
    if (!course) return;

    const record = course as Record<string, unknown>;

    setSettingsForm({
      title: String(record.title ?? record.name ?? ""),
      slug: String(record.slug ?? ""),
      description: String(record.description ?? ""),
      category_id: resolveCategoryId(record),
    });
    setEducationTargeting(getCourseEducationTargetingValues(course));
    setSettingsFieldErrors({});
    setEducationTargetingValidationError(null);
  };

  const handleCategoryChange = (value: string | null) => {
    setSettingsForm((prev) => ({
      ...prev,
      category_id: value ?? "none",
    }));
  };

  return {
    settingsForm,
    settingsFieldErrors,
    educationTargeting,
    educationTargetingError,
    isSavingSettings,
    isSettingsError,
    settingsError,
    categoryOptions,
    categorySearch,
    setCategorySearch,
    isLoadingCategories,
    hasMoreCategories,
    isLoadingMoreCategories,
    loadMoreCategories,
    handleSettingsSubmit,
    handleSettingsChange,
    handleSettingsReset,
    handleEducationTargetingChange,
    handleCategoryChange,
    showToast,
  };
}
