"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteEnrollment } from "@/features/enrollments/hooks/use-enrollments";
import type { Enrollment } from "@/features/enrollments/types/enrollment";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";
import { useState } from "react";

type DeleteEnrollmentDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  enrollment: Enrollment | null;
  centerId?: string | number;
  onSuccess?: (_message: string) => void;
};

export function DeleteEnrollmentDialog({
  open,
  onOpenChange,
  enrollment,
  centerId,
  onSuccess,
}: DeleteEnrollmentDialogProps) {
  const mutation = useDeleteEnrollment();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = () => {
    if (!enrollment?.id) return;

    setErrorMessage(null);
    mutation.mutate(
      {
        enrollmentId: enrollment.id,
        centerId,
      },
      {
        onSuccess: () => {
          onSuccess?.("Enrollment deleted.");
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to delete enrollment.",
            ),
          );
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return;
        if (!nextOpen) {
          setErrorMessage(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Delete Enrollment</DialogTitle>
          <DialogDescription>
            This action will permanently remove enrollment #
            {String(enrollment?.id ?? "—")}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Delete failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
