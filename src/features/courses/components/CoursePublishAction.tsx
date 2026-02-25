"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/components/ui/modal-store";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import {
  usePublishCourse,
  useUnpublishCourse,
} from "@/features/courses/hooks/use-courses";
import type { Course } from "../types/course";

type CoursePublishActionProps = {
  course: Course;
};

const COURSE_PUBLISH_ERROR_CODE_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED:
    "You do not have permission to change publish state for this course.",
  NOT_FOUND: "Course not found in this center scope.",
  VALIDATION_ERROR: "Course publish state could not be changed.",
};

export function CoursePublishAction({ course }: CoursePublishActionProps) {
  const { showToast } = useModal();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishStateOverride, setPublishStateOverride] = useState<
    boolean | null
  >(null);
  const centerId =
    course.center?.id ?? (course as { center_id?: string | number }).center_id;
  const hasCenterScope = centerId != null && String(centerId).trim().length > 0;

  const { mutate: publishCourse, isPending: isPublishing } = usePublishCourse();
  const { mutate: unpublishCourse, isPending: isUnpublishing } =
    useUnpublishCourse();
  const isPublished = publishStateOverride ?? Boolean(course?.is_published);
  const isSubmitting = isPublishing || isUnpublishing;

  useEffect(() => {
    setPublishStateOverride(null);
  }, [course.id, course.is_published]);

  const handlePublish = () => {
    if (!hasCenterScope) return;
    setErrorMessage(null);
    setIsDialogOpen(true);
  };

  const handleConfirmPublish = () => {
    if (!hasCenterScope || centerId == null) return;

    setErrorMessage(null);
    const action = isPublished ? unpublishCourse : publishCourse;
    const fallbackSuccess = isPublished
      ? "Course unpublished successfully"
      : "Course published successfully";
    const fallbackError = isPublished
      ? "An error occurred while unpublishing the course."
      : "An error occurred while publishing the course.";

    action(
      { centerId, courseId: course.id },
      {
        onSuccess: (updatedCourse) => {
          setPublishStateOverride(Boolean(updatedCourse?.is_published));
          setIsDialogOpen(false);
          setErrorMessage(null);
          showToast(
            getAdminResponseMessage(updatedCourse, fallbackSuccess),
            "success",
          );
        },
        onError: (error) => {
          const code = getAdminApiErrorCode(error);
          const message =
            (code ? COURSE_PUBLISH_ERROR_CODE_MESSAGES[code] : null) ??
            getAdminApiErrorMessage(error, fallbackError);
          setErrorMessage(message);
          showToast(message, "error");
        },
      },
    );
  };

  const handleClose = (nextOpen = false) => {
    if (isSubmitting) return;
    setIsDialogOpen(nextOpen);
    if (!nextOpen) {
      setErrorMessage(null);
    }
  };

  return (
    <>
      <Button
        onClick={handlePublish}
        disabled={!hasCenterScope || isSubmitting}
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {isPublished ? "Unpublish" : "Publish"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPublished ? "Unpublish Course" : "Publish Course"}
            </DialogTitle>
            <DialogDescription>
              {isPublished
                ? "This will unpublish the course and hide it from students."
                : "This will publish the course, making it available to students."}
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmPublish} disabled={isSubmitting}>
              {isSubmitting
                ? isPublished
                  ? "Unpublishing..."
                  : "Publishing..."
                : isPublished
                  ? "Confirm Unpublish"
                  : "Confirm Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
