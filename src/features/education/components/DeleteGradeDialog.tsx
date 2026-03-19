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

function getErrorMessage(
  error: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const code = getAdminApiErrorCode(error);
  if (code === "GRADE_HAS_STUDENTS") {
    return t("pages.education.dialogs.deleteGrade.errors.hasStudents");
  }

  return getAdminApiErrorMessage(
    error,
    t("pages.education.dialogs.deleteGrade.errors.fallback"),
  );
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
          onSuccess?.(t("pages.education.dialogs.deleteGrade.success"));
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, t));
        },
      },
    );
  };

  const gradeLabel = grade
    ? `${getEducationName(grade, t("pages.education.tables.grades.entityName"))} (${getStageLabel(
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
            {t("pages.education.dialogs.deleteGrade.title")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.education.dialogs.deleteGrade.title")}
          entityName={gradeLabel}
          entityFallback={t(
            "pages.education.dialogs.deleteGrade.entityFallback",
          )}
          irreversibleText={t(
            "pages.education.dialogs.deleteGrade.description",
          )}
          warningPrefix={t("pages.education.dialogs.deleteGrade.warningPrefix")}
          confirmLabel={t("pages.education.dialogs.deleteGrade.confirmLabel")}
          cancelButtonLabel={t(
            "pages.education.dialogs.deleteGrade.actions.cancel",
          )}
          confirmButtonLabel={t(
            "pages.education.dialogs.deleteGrade.actions.confirm",
          )}
          pendingLabel={t(
            "pages.education.dialogs.deleteGrade.actions.pending",
          )}
          errorTitle={t("pages.education.dialogs.deleteGrade.errorTitle")}
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
