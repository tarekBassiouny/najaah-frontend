"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteInstructor } from "@/features/instructors/hooks/use-instructors";
import type { Instructor } from "@/features/instructors/types/instructor";
import { useModal } from "@/components/ui/modal-store";

type DeleteInstructorDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  instructor?: Instructor | null;
  onSuccess?: (_value: string) => void;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to delete instructor. Please try again.";
}

export function DeleteInstructorDialog({
  open,
  onOpenChange,
  instructor,
  onSuccess,
}: DeleteInstructorDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteInstructor();
  const { showToast } = useModal();

  const handleDelete = () => {
    if (!instructor) return;
    setErrorMessage(null);

    deleteMutation.mutate(instructor.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Instructor deleted successfully.");
        showToast("Instructor deleted successfully.", "success");
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error));
      },
    });
  };

  const instructorName = instructor?.name ? String(instructor.name) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Instructor</DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title="Delete Instructor"
          entityName={instructorName}
          entityFallback="this instructor"
          confirmButtonLabel="Delete Instructor"
          pendingLabel="Deleting..."
          errorTitle="Could not delete instructor"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (instructor?.id ?? "instructor") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
