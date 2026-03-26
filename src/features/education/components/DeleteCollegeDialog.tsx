"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteCollege } from "@/features/education/hooks/use-colleges";
import type { College } from "@/features/education/types/education";
import { getEducationName } from "@/features/education/types/education";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type DeleteCollegeDialogProps = {
  centerId: string | number;
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  college?: College | null;
  onSuccess?: (_value: string) => void;
};

function getErrorMessage(
  error: unknown,
  t: (_key: string, _params?: Record<string, string | number>) => string,
) {
  const code = getAdminApiErrorCode(error);
  if (code === "COLLEGE_HAS_STUDENTS") {
    return t("pages.education.dialogs.deleteCollege.errors.hasStudents");
  }

  return getAdminApiErrorMessage(
    error,
    t("pages.education.dialogs.deleteCollege.errors.fallback"),
  );
}

export function DeleteCollegeDialog({
  centerId,
  open,
  onOpenChange,
  college,
  onSuccess,
}: DeleteCollegeDialogProps) {
  const { t, locale } = useTranslation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteCollege();

  const handleDelete = () => {
    if (!college) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      {
        centerId,
        collegeId: college.id,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.(t("pages.education.dialogs.deleteCollege.success"));
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, t));
        },
      },
    );
  };

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
            {t("pages.education.dialogs.deleteCollege.title")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.education.dialogs.deleteCollege.title")}
          entityName={
            college
              ? getEducationName(
                  college,
                  t("pages.education.tables.colleges.entityName"),
                  locale,
                )
              : null
          }
          entityFallback={t(
            "pages.education.dialogs.deleteCollege.entityFallback",
          )}
          irreversibleText={t(
            "pages.education.dialogs.deleteCollege.description",
          )}
          warningPrefix={t(
            "pages.education.dialogs.deleteCollege.warningPrefix",
          )}
          confirmLabel={t("pages.education.dialogs.deleteCollege.confirmLabel")}
          cancelButtonLabel={t(
            "pages.education.dialogs.deleteCollege.actions.cancel",
          )}
          confirmButtonLabel={t(
            "pages.education.dialogs.deleteCollege.actions.confirm",
          )}
          pendingLabel={t(
            "pages.education.dialogs.deleteCollege.actions.pending",
          )}
          errorTitle={t("pages.education.dialogs.deleteCollege.errorTitle")}
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (college?.id ?? "college") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
