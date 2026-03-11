"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteGrade } from "@/features/education/hooks/use-grades";
import type { Grade } from "@/features/education/types/education";
import {
  getEducationName,
  getStageLabel,
} from "@/features/education/types/education";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type DeleteGradeDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  grade?: Grade | null;
  onSuccess?: (_value: string) => void;
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  GRADE_HAS_STUDENTS:
    "This grade is currently assigned to students and cannot be deleted.",
};

function getErrorMessage(error: unknown) {
  const code = getAdminApiErrorCode(error);
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code];
  }

  return getAdminApiErrorMessage(error, "Unable to delete grade.");
}

export function DeleteGradeDialog({
  centerId,
  open,
  onOpenChange,
  grade,
  onSuccess,
}: DeleteGradeDialogProps) {
  const { t } = useTranslation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteGrade();

  const handleDelete = () => {
    if (!grade) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      {
        centerId,
        gradeId: grade.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("Grade deleted successfully.");
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  };

  const gradeLabel = grade
    ? `${getEducationName(grade, "Grade")} (${getStageLabel(
        grade.stage,
        grade.stage_label,
      )})`
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t("auto.features.education.components.deletegradedialog.s1")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("auto.features.education.components.deletegradedialog.s1")}
          entityName={gradeLabel}
          entityFallback="this grade"
          confirmButtonLabel="Delete Grade"
          pendingLabel="Deleting..."
          errorTitle="Could not delete grade"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (grade?.id ?? "grade") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
