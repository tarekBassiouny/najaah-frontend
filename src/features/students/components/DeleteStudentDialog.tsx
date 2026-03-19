"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteStudent } from "@/features/students/hooks/use-students";
import type { Student } from "@/features/students/types/student";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

type DeleteStudentDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  student?: Student | null;
  onSuccess?: (_value: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown, t: TranslateFunction) {
  return getAdminApiErrorMessage(
    error,
    t("pages.students.dialogs.delete.errors.deleteFailed"),
  );
}

export function DeleteStudentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
  scopeCenterId,
}: DeleteStudentDialogProps) {
  const { t } = useTranslation();
  const deletedMessage = t("pages.students.dialogs.delete.messages.deleted");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteStudent({ centerId: scopeCenterId ?? null });

  const handleDelete = () => {
    if (!student) return;
    setErrorMessage(null);

    deleteMutation.mutate(student.id, {
      onSuccess: (response) => {
        if (!isAdminRequestSuccessful(response)) {
          setErrorMessage(
            getAdminResponseMessage(
              response,
              t("pages.students.dialogs.delete.errors.deleteFailed"),
            ),
          );
          return;
        }
        onOpenChange(false);
        onSuccess?.(getAdminResponseMessage(response, deletedMessage));
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error, t));
      },
    });
  };

  const studentName = student?.name ? String(student.name) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t("pages.students.dialogs.delete.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("pages.students.dialogs.delete.description")}
          </DialogDescription>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.students.dialogs.delete.title")}
          entityName={studentName}
          entityFallback={t("pages.students.dialogs.delete.entityFallback")}
          confirmText={t("pages.students.dialogs.delete.confirmText")}
          confirmLabel={t("pages.students.dialogs.delete.confirmLabel", {
            confirmText: t("pages.students.dialogs.delete.confirmText"),
          })}
          confirmButtonLabel={t(
            "pages.students.dialogs.delete.confirmButtonLabel",
          )}
          pendingLabel={t("pages.students.dialogs.delete.pendingLabel")}
          errorTitle={t("pages.students.dialogs.delete.errors.errorTitle")}
          irreversibleText={t("pages.students.dialogs.delete.irreversible")}
          warningPrefix={t("pages.students.dialogs.delete.warningPrefix")}
          cancelButtonLabel={t("common.actions.cancel")}
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (student?.id ?? "student") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
