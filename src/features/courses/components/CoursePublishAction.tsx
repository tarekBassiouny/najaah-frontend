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
import { useTranslation } from "@/features/localization";
import type { Course } from "../types/course";

type CoursePublishActionProps = {
  course: Course;
};

const COURSE_PUBLISH_ERROR_CODE_TO_KEY: Record<string, string> = {
  PERMISSION_DENIED: "pages.coursePublishAction.errors.code.permissionDenied",
  NOT_FOUND: "pages.coursePublishAction.errors.code.notFound",
  VALIDATION_ERROR: "pages.coursePublishAction.errors.code.validationError",
};

export function CoursePublishAction({ course }: CoursePublishActionProps) {
  const { t } = useTranslation();
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
      ? t("pages.coursePublishAction.messages.unpublished")
      : t("pages.coursePublishAction.messages.published");
    const fallbackError = isPublished
      ? t("pages.coursePublishAction.errors.unpublishFailed")
      : t("pages.coursePublishAction.errors.publishFailed");

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
          const codeKey = code ? COURSE_PUBLISH_ERROR_CODE_TO_KEY[code] : null;
          const codeMessage = codeKey ? t(codeKey) : null;
          const message = getAdminApiErrorMessage(
            error,
            codeMessage ?? fallbackError,
          );
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
        {isPublished
          ? t("pages.coursePublishAction.actions.unpublish")
          : t("pages.coursePublishAction.actions.publish")}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPublished
                ? t("pages.coursePublishAction.dialog.unpublishTitle")
                : t("pages.coursePublishAction.dialog.publishTitle")}
            </DialogTitle>
            <DialogDescription>
              {isPublished
                ? t("pages.coursePublishAction.dialog.unpublishDescription")
                : t("pages.coursePublishAction.dialog.publishDescription")}
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)}>
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleConfirmPublish} disabled={isSubmitting}>
              {isSubmitting
                ? isPublished
                  ? t("pages.coursePublishAction.actions.unpublishing")
                  : t("pages.coursePublishAction.actions.publishing")
                : isPublished
                  ? t("pages.coursePublishAction.actions.confirmUnpublish")
                  : t("pages.coursePublishAction.actions.confirmPublish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
