"use client";

import { useState } from "react";
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
import { getInstructorApiErrorMessage } from "@/features/instructors/lib/api-error";

type DeleteInstructorDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  instructor?: Instructor | null;
  scopeCenterId?: string | number | null;
  onSuccess?: (_value: string) => void;
};

export function DeleteInstructorDialog({
  open,
  onOpenChange,
  instructor,
  scopeCenterId,
  onSuccess,
}: DeleteInstructorDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteInstructor({
    centerId: scopeCenterId ?? null,
  });
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
        setErrorMessage(
          getInstructorApiErrorMessage(
            error,
            "Unable to delete instructor. Please try again.",
          ),
        );
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
      <DialogContent aria-describedby={undefined}>
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
