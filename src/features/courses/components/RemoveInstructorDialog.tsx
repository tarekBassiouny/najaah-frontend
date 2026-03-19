"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/features/localization";
import { getInstructorLabel } from "@/features/courses/utils/course-helpers";
import type { InstructorSummary } from "@/features/courses/types/course";

type RemoveInstructorDialogProps = {
  instructor: InstructorSummary | null;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  isRemoving: boolean;
};

export function RemoveInstructorDialog({
  instructor,
  open,
  onOpenChange,
  onConfirm,
  isPending,
  isRemoving,
}: RemoveInstructorDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {t("pages.centerCourseDetail.removeInstructor.title")}
          </DialogTitle>
          <DialogDescription>
            {instructor
              ? t(
                  "pages.centerCourseDetail.removeInstructor.descriptionWithName",
                  {
                    name: getInstructorLabel(instructor, t),
                  },
                )
              : t("pages.centerCourseDetail.removeInstructor.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.actions.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isRemoving
              ? t("pages.centerCourseDetail.actions.removing")
              : t("pages.centerCourseDetail.actions.remove")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
