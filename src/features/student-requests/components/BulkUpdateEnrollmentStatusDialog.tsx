"use client";

import { useMemo, useState } from "react";
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
import { useBulkUpdateEnrollmentStatus } from "@/features/enrollments/hooks/use-enrollments";
import type {
  BulkEnrollmentResult,
  Enrollment,
  EnrollmentStatus,
} from "@/features/enrollments/types/enrollment";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";

type BulkUpdateEnrollmentStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  enrollments: Enrollment[];
  centerId?: string | number;
  onSuccess?: (_message: string) => void;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCount(result: BulkEnrollmentResult, key: string) {
  const value = result.counts?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readFailedItems(result: BulkEnrollmentResult) {
  return Array.isArray(result.failed) ? result.failed : [];
}

function readSkippedItems(result: BulkEnrollmentResult) {
  return Array.isArray(result.skipped) ? result.skipped : [];
}

function readUpdatedItems(result: BulkEnrollmentResult) {
  if (Array.isArray(result.updated)) return result.updated;
  if (Array.isArray(result.approved)) return result.approved;
  return [];
}

export function BulkUpdateEnrollmentStatusDialog({
  open,
  onOpenChange,
  enrollments,
  centerId,
  onSuccess,
}: BulkUpdateEnrollmentStatusDialogProps) {
  const mutation = useBulkUpdateEnrollmentStatus();
  const [status, setStatus] = useState<EnrollmentStatus>("DEACTIVATED");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkEnrollmentResult | null>(null);

  const ids = useMemo(
    () => enrollments.map((enrollment) => enrollment.id),
    [enrollments],
  );

  const handleSubmit = () => {
    if (ids.length === 0) {
      setErrorMessage("No enrollment requests selected.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        centerId,
        payload: {
          status,
          enrollment_ids: ids,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
          onSuccess?.("Bulk enrollment status update processed.");
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to update status for selected enrollment requests.",
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
          setResult(null);
          setStatus("DEACTIVATED");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Bulk Change Enrollment Status</DialogTitle>
          <DialogDescription>
            Update status for {ids.length} selected enrollment request
            {ids.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {readCount(result, "total") || ids.length}</span>
              <span>Updated: {readCount(result, "updated")}</span>
              <span>Skipped: {readCount(result, "skipped")}</span>
              <span>Failed: {readCount(result, "failed")}</span>
            </div>

            {readUpdatedItems(result).length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                {readUpdatedItems(result).map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const enrollmentId =
                    record.enrollment_id ?? record.id ?? "unknown";
                  return (
                    <p key={`updated-${String(enrollmentId)}-${index}`}>
                      Enrollment #{String(enrollmentId)} updated
                    </p>
                  );
                })}
              </div>
            ) : null}

            {readSkippedItems(result).length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {readSkippedItems(result).map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const enrollmentId =
                    record.enrollment_id ?? record.id ?? "unknown";
                  const reason =
                    (typeof record.reason === "string" && record.reason) ||
                    "Skipped";
                  return (
                    <p key={`skipped-${String(enrollmentId)}-${index}`}>
                      Enrollment #{String(enrollmentId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}

            {readFailedItems(result).length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {readFailedItems(result).map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const enrollmentId =
                    record.enrollment_id ?? record.id ?? "unknown";
                  const reason =
                    (typeof record.reason === "string" && record.reason) ||
                    "Failed";
                  return (
                    <p key={`failed-${String(enrollmentId)}-${index}`}>
                      Enrollment #{String(enrollmentId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose the status to apply.
          </p>
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
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
