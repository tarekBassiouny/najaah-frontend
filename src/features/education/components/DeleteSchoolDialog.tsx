"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteSchool } from "@/features/education/hooks/use-schools";
import type { School } from "@/features/education/types/education";
import {
  getEducationName,
  getSchoolTypeLabel,
} from "@/features/education/types/education";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type DeleteSchoolDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  school?: School | null;
  onSuccess?: (_value: string) => void;
};

function getErrorMessage(
  error: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const code = getAdminApiErrorCode(error);
  if (code === "SCHOOL_HAS_STUDENTS") {
    return t("pages.education.dialogs.deleteSchool.errors.hasStudents");
  }

  return getAdminApiErrorMessage(
    error,
    t("pages.education.dialogs.deleteSchool.errors.fallback"),
  );
}

export function DeleteSchoolDialog({
  centerId,
  open,
  onOpenChange,
  school,
  onSuccess,
}: DeleteSchoolDialogProps) {
  const { t } = useTranslation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteSchool();

  const handleDelete = () => {
    if (!school) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      {
        centerId,
        schoolId: school.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.(t("pages.education.dialogs.deleteSchool.success"));
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, t));
        },
      },
    );
  };

  const schoolLabel = school
    ? `${getEducationName(school, t("pages.education.tables.schools.entityName"))} (${getSchoolTypeLabel(
        school.type,
        school.type_label,
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
            {t("pages.education.dialogs.deleteSchool.title")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.education.dialogs.deleteSchool.title")}
          entityName={schoolLabel}
          entityFallback={t(
            "pages.education.dialogs.deleteSchool.entityFallback",
          )}
          irreversibleText={t(
            "pages.education.dialogs.deleteSchool.description",
          )}
          warningPrefix={t(
            "pages.education.dialogs.deleteSchool.warningPrefix",
          )}
          confirmLabel={t("pages.education.dialogs.deleteSchool.confirmLabel")}
          cancelButtonLabel={t(
            "pages.education.dialogs.deleteSchool.actions.cancel",
          )}
          confirmButtonLabel={t(
            "pages.education.dialogs.deleteSchool.actions.confirm",
          )}
          pendingLabel={t(
            "pages.education.dialogs.deleteSchool.actions.pending",
          )}
          errorTitle={t("pages.education.dialogs.deleteSchool.errorTitle")}
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (school?.id ?? "school") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
