"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkUpdateCenterStatus } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { BulkCentersActionResult } from "@/features/centers/services/centers.service";
import type { Center } from "@/features/centers/types/center";

type BulkUpdateCenterStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centers: Center[];
  onSuccess?: (_message: string) => void;
};

type CenterStatusOption = "active" | "inactive";

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCount(result: BulkCentersActionResult, key: string) {
  const value = result.counts?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function BulkUpdateCenterStatusDialog({
  open,
  onOpenChange,
  centers,
  onSuccess,
}: BulkUpdateCenterStatusDialogProps) {
  const mutation = useBulkUpdateCenterStatus();
  const [status, setStatus] = useState<CenterStatusOption>("active");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkCentersActionResult | null>(null);

  const handleUpdate = () => {
    if (centers.length === 0) {
      setErrorMessage("No centers selected.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        status: status === "active" ? 1 : 0,
        center_ids: centers.map((center) => center.id),
      },
      {
        onSuccess: (data) => {
          setResult(data);

          const skipped = readCount(data, "skipped");
          const failed = readCount(data, "failed");
          if (skipped === 0 && failed === 0) {
            onSuccess?.("Centers status updated successfully.");
            onOpenChange(false);
            return;
          }

          onSuccess?.("Bulk status update processed.");
        },
        onError: (error) => {
          setErrorMessage(
            getCenterApiErrorMessage(
              error,
              "Unable to update status for selected centers. Please try again.",
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
          setStatus("active");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Bulk Change Status</DialogTitle>
          <DialogDescription>
            Update status for {centers.length} selected center
            {centers.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result?.counts ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {readCount(result, "total") || centers.length}</span>
              <span>Updated: {readCount(result, "updated")}</span>
              <span>Skipped: {readCount(result, "skipped")}</span>
              <span>Failed: {readCount(result, "failed")}</span>
            </div>

            {Array.isArray(result.failed) && result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {result.failed.map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const centerId = record.center_id ?? record.id ?? "unknown";
                  const reason =
                    (typeof record.reason === "string" && record.reason) ||
                    "Failed";
                  return (
                    <p key={`failed-${String(centerId)}-${index}`}>
                      Center #{String(centerId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select the new status for selected centers.
          </p>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as CenterStatusOption)}
          >
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
