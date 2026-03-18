"use client";

import { useEffect, useMemo, useState } from "react";
import { useModal } from "@/components/ui/modal-store";
import {
  useAssignCourseInstructor,
  useRemoveCourseInstructor,
} from "@/features/courses/hooks/use-courses";
import { useInstructorOptions } from "@/features/instructors/hooks/use-instructor-options";
import {
  getInstructorLabel,
  normalizeEntityId,
} from "@/features/courses/utils/course-helpers";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";
import type {
  Course,
  InstructorSummary,
} from "@/features/courses/types/course";

export function useCourseInstructors({
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

  const [selectedInstructorId, setSelectedInstructorId] = useState<
    string | null
  >(null);
  const [instructorActionError, setInstructorActionError] = useState<
    string | null
  >(null);
  const [pendingRemoveInstructor, setPendingRemoveInstructor] =
    useState<InstructorSummary | null>(null);

  const { mutate: assignInstructor, isPending: isAssigningInstructor } =
    useAssignCourseInstructor();
  const { mutate: removeInstructor, isPending: isRemovingInstructor } =
    useRemoveCourseInstructor();

  const {
    options: instructorOptionItems,
    search: instructorSearch,
    setSearch: setInstructorSearch,
    isLoading: isInstructorsLoading,
    hasMore: hasMoreInstructors,
    isLoadingMore: isLoadingMoreInstructors,
    onReachEnd: loadMoreInstructors,
  } = useInstructorOptions({
    centerId,
    selectedValue: selectedInstructorId,
    enabled: Boolean(centerId),
  });

  useEffect(() => {
    setInstructorActionError(null);
    setSelectedInstructorId(null);
    setPendingRemoveInstructor(null);
    setInstructorSearch("");
  }, [courseId, setInstructorSearch]);

  const primaryInstructorId = useMemo(() => {
    const primaryId =
      course?.primary_instructor?.id ?? course?.primary_instructor_id;
    if (primaryId == null || primaryId === "") return null;
    return String(primaryId);
  }, [course?.primary_instructor?.id, course?.primary_instructor_id]);

  const assignedInstructors = useMemo(() => {
    const dedupe = new Map<string, InstructorSummary>();
    const addInstructor = (
      instructor: InstructorSummary | null | undefined,
    ) => {
      if (!instructor?.id) return;
      dedupe.set(String(instructor.id), instructor);
    };

    if (Array.isArray(course?.instructors)) {
      course.instructors.forEach((instructor) => addInstructor(instructor));
    }

    addInstructor(course?.primary_instructor ?? null);
    const list = Array.from(dedupe.values());

    if (!primaryInstructorId) {
      return list;
    }

    return list.sort((a, b) => {
      const aPrimary = String(a.id) === primaryInstructorId;
      const bPrimary = String(b.id) === primaryInstructorId;
      if (aPrimary && !bPrimary) return -1;
      if (!aPrimary && bPrimary) return 1;
      return getInstructorLabel(a, t).localeCompare(getInstructorLabel(b, t));
    });
  }, [course?.instructors, course?.primary_instructor, primaryInstructorId, t]);

  const instructorOptions = useMemo(() => {
    const assignedIds = new Set(
      assignedInstructors.map((item) => String(item.id)),
    );
    return instructorOptionItems.map((option) => ({
      ...option,
      disabled: assignedIds.has(String(option.value)),
    }));
  }, [assignedInstructors, instructorOptionItems]);

  const isInstructorActionPending =
    isAssigningInstructor || isRemovingInstructor;

  const handleAssignInstructor = () => {
    if (!selectedInstructorId) {
      setInstructorActionError(
        t("pages.centerCourseDetail.errors.selectInstructor"),
      );
      return;
    }

    setInstructorActionError(null);

    assignInstructor(
      {
        centerId,
        courseId,
        payload: { instructor_id: normalizeEntityId(selectedInstructorId) },
      },
      {
        onSuccess: (updatedCourse) => {
          showToast(
            getAdminResponseMessage(
              updatedCourse,
              t("pages.centerCourseDetail.toasts.instructorAssigned"),
            ),
            "success",
          );
          setSelectedInstructorId(null);
        },
        onError: (err) => {
          const message = getAdminApiErrorMessage(
            err,
            t("pages.centerCourseDetail.errors.assignInstructorFailed"),
          );
          setInstructorActionError(message);
          showToast(message, "error");
        },
      },
    );
  };

  const handleConfirmRemoveInstructor = () => {
    if (!pendingRemoveInstructor?.id) return;
    setInstructorActionError(null);

    removeInstructor(
      {
        centerId,
        courseId,
        instructorId: pendingRemoveInstructor.id,
      },
      {
        onSuccess: (updatedCourse) => {
          showToast(
            getAdminResponseMessage(
              updatedCourse,
              t("pages.centerCourseDetail.toasts.instructorRemoved"),
            ),
            "success",
          );
          setPendingRemoveInstructor(null);
        },
        onError: (err) => {
          const message = getAdminApiErrorMessage(
            err,
            t("pages.centerCourseDetail.errors.removeInstructorFailed"),
          );
          setInstructorActionError(message);
          showToast(message, "error");
        },
      },
    );
  };

  return {
    selectedInstructorId,
    setSelectedInstructorId,
    instructorActionError,
    pendingRemoveInstructor,
    setPendingRemoveInstructor,
    primaryInstructorId,
    assignedInstructors,
    instructorOptions,
    instructorSearch,
    setInstructorSearch,
    isInstructorsLoading,
    hasMoreInstructors,
    isLoadingMoreInstructors,
    loadMoreInstructors,
    isAssigningInstructor,
    isRemovingInstructor,
    isInstructorActionPending,
    handleAssignInstructor,
    handleConfirmRemoveInstructor,
  };
}
