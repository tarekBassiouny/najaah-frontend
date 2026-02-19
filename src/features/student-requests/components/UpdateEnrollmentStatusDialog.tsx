"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateEnrollment } from "@/features/enrollments/hooks/use-enrollments";
import type {
  EnrollmentStatus,
  Enrollment,
} from "@/features/enrollments/types/enrollment";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";

type UpdateEnrollmentStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  enrollment: Enrollment | null;
  centerId?: string | number;
  onSuccess?: (_message: string) => void;
};

function resolveInitialStatus(enrollment: Enrollment | null): EnrollmentStatus {
  const raw = String(
    enrollment?.status ??
      enrollment?.status_key ??
      enrollment?.status_label ??
      "",
  )
    .trim()
    .toUpperCase();

  if (raw === "PENDING") return "PENDING";
  if (raw === "ACTIVE") return "ACTIVE";
  if (raw === "DEACTIVATED") return "DEACTIVATED";
  if (raw === "CANCELLED") return "CANCELLED";
  return "DEACTIVATED";
}

export function UpdateEnrollmentStatusDialog({
  open,
  onOpenChange,
  enrollment,
  centerId,
  onSuccess,
}: UpdateEnrollmentStatusDialogProps) {
  const mutation = useUpdateEnrollment();
  const [status, setStatus] = useState<EnrollmentStatus>("DEACTIVATED");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStatus(resolveInitialStatus(enrollment));
      setErrorMessage(null);
    }
  }, [enrollment, open]);

  const handleSubmit = () => {
    if (!enrollment?.id) return;

    mutation.mutate(
      {
        enrollmentId: enrollment.id,
        centerId,
        payload: { status },
      },
      {
        onSuccess: () => {
          onSuccess?.("Enrollment status updated.");
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to update enrollment status.",
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
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Change Enrollment Status</DialogTitle>
          <DialogDescription>
            Update status for enrollment #{String(enrollment?.id ?? "—")}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Update failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as EnrollmentStatus)}
          >
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DEACTIVATED">Deactivated</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
