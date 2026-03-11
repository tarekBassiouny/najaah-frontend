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
import { useTranslation } from "@/features/localization";

type DeleteStudentDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  student?: Student | null;
  onSuccess?: (_value: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown) {
  return getAdminApiErrorMessage(
    error,
    "Unable to delete student. Please try again.",
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
              "Unable to delete student. Please try again.",
            ),
          );
          return;
        }
        onOpenChange(false);
        onSuccess?.(
          getAdminResponseMessage(response, "Student deleted successfully."),
        );
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error));
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
            {t("auto.features.students.components.deletestudentdialog.s1")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("auto.features.students.components.deletestudentdialog.s2")}
          </DialogDescription>
        </DialogHeader>
        <HardDeletePanel
          title={t("auto.features.students.components.deletestudentdialog.s1")}
          entityName={studentName}
          entityFallback="this student"
          confirmButtonLabel="Delete Student"
          pendingLabel="Deleting..."
          errorTitle="Could not delete student"
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
