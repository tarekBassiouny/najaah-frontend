"use client";

import { useId, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkUpdateStudentStatus } from "@/features/students/hooks/use-students";
import type { Student } from "@/features/students/types/student";

type BulkUpdateStudentStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  students: Student[];
  onSuccess?: (_message: string) => void;
};

export function BulkUpdateStudentStatusDialog({
  open,
  onOpenChange,
  students,
  onSuccess,
}: BulkUpdateStudentStatusDialogProps) {
  const descriptionId = useId();
  const [status, setStatus] = useState<string>("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    counts?: {
      total?: number;
      updated?: number;
      skipped?: number;
      failed?: number;
    };
    skipped?: Array<string | number>;
    failed?: Array<{ student_id?: string | number; reason?: string }>;
  } | null>(null);

  const mutation = useBulkUpdateStudentStatus();
  const isPending = mutation.isPending;

  const handleUpdate = () => {
    if (students.length === 0) {
      setErrorMessage("No students selected.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        status,
        student_ids: students.map((student) => student.id),
      },
      {
        onSuccess: (data) => {
          setResult({
            counts: data?.counts,
            skipped: data?.skipped,
            failed: data?.failed,
          });
          onSuccess?.("Bulk status update processed.");
        },
        onError: () => {
          setErrorMessage("Unable to update status. Please try again.");
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setErrorMessage(null);
          setResult(null);
          setStatus("1");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-xl" aria-describedby={descriptionId}>
        <DialogHeader className="space-y-2">
          <DialogTitle>Bulk Change Status</DialogTitle>
          <DialogDescription id={descriptionId}>
            Update status for {students.length} selected students.
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Unable to update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {result?.counts ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {result.counts.total ?? students.length}</span>
              <span>Updated: {result.counts.updated ?? 0}</span>
              <span>Skipped: {result.counts.skipped ?? 0}</span>
              <span>Failed: {result.counts.failed ?? 0}</span>
            </div>
            {result.failed && result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs">
                {result.failed.map((item, index) => (
                  <p key={`${item.student_id}-${index}`}>
                    #{item.student_id ?? "?"}: {item.reason ?? "Failed"}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select the new status for selected students.
          </p>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
              <SelectItem value="2">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleUpdate} disabled={isPending}>
            {isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
