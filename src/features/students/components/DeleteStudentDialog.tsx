"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
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

type DeleteStudentDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  student?: Student | null;
  onSuccess?: (_value: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to delete student. Please try again.";
}

export function DeleteStudentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
  scopeCenterId,
}: DeleteStudentDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteStudent({ centerId: scopeCenterId ?? null });

  const handleDelete = () => {
    if (!student) return;
    setErrorMessage(null);

    deleteMutation.mutate(student.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Student deleted successfully.");
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
          <DialogTitle className="sr-only">Delete Student</DialogTitle>
          <DialogDescription className="sr-only">
            Permanently delete the selected student.
          </DialogDescription>
        </DialogHeader>
        <HardDeletePanel
          title="Delete Student"
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
