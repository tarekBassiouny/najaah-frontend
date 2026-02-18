"use client";

import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBulkDeleteCenters } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { BulkCentersActionResult } from "@/features/centers/services/centers.service";
import type { Center } from "@/features/centers/types/center";

type BulkDeleteCentersDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centers: Center[];
  onSuccess?: (_message: string) => void;
};

const DELETE_CONFIRM_TEXT = "DELETE";

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractFirstMessage(node: unknown): string | null {
  if (typeof node === "string" && node.trim()) return node.trim();

  if (Array.isArray(node)) {
    for (const item of node) {
      const message = extractFirstMessage(item);
      if (message) return message;
    }
    return null;
  }

  const record = toRecord(node);
  if (!record) return null;

  for (const value of Object.values(record)) {
    const message = extractFirstMessage(value);
    if (message) return message;
  }

  return null;
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

function readActionItems(
  result: BulkCentersActionResult,
  key: "failed" | "skipped",
) {
  const value = result[key];
  return Array.isArray(value) ? value : [];
}

function getCenterName(center: Center) {
  if (center.name?.trim()) return center.name.trim();
  return `Center #${center.id}`;
}

export function BulkDeleteCentersDialog({
  open,
  onOpenChange,
  centers,
  onSuccess,
}: BulkDeleteCentersDialogProps) {
  const mutation = useBulkDeleteCenters();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkCentersActionResult | null>(null);
  const [confirmationText, setConfirmationText] = useState("");

  const handleDeleteCenters = () => {
    if (centers.length === 0) {
      setErrorMessage("No centers selected.");
      return;
    }

    if (confirmationText !== DELETE_CONFIRM_TEXT) {
      setErrorMessage(`Type ${DELETE_CONFIRM_TEXT} to confirm.`);
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        center_ids: centers.map((center) => center.id),
      },
      {
        onSuccess: (data) => {
          setResult(data);

          const skipped = readCount(data, "skipped");
          const failed = readCount(data, "failed");
          if (skipped === 0 && failed === 0) {
            onSuccess?.("Selected centers were deleted successfully.");
            onOpenChange(false);
            return;
          }

          onSuccess?.("Bulk delete action processed.");
        },
        onError: (error) => {
          setErrorMessage(
            getCenterApiErrorMessage(
              error,
              "Unable to delete selected centers. Please try again.",
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
          setConfirmationText("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Bulk Delete Centers</DialogTitle>
          <DialogDescription>
            Delete {centers.length} selected center
            {centers.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          This action is destructive and should only be used for invalid or
          duplicate centers.
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Selected Centers
          </p>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {centers.slice(0, 5).map((center) => (
              <p key={String(center.id)}>• {getCenterName(center)}</p>
            ))}
            {centers.length > 5 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +{centers.length - 5} more centers
              </p>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to delete</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {readCount(result, "total") || centers.length}</span>
              <span>Deleted: {readCount(result, "deleted")}</span>
              <span>Skipped: {readCount(result, "skipped")}</span>
              <span>Failed: {readCount(result, "failed")}</span>
            </div>

            {readActionItems(result, "failed").length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {readActionItems(result, "failed").map((item, index) => {
                  const record = toRecord(item);
                  const centerId = record?.center_id ?? record?.id ?? item;
                  const reason =
                    extractFirstMessage(record?.reason) ??
                    extractFirstMessage(record?.error) ??
                    extractFirstMessage(record?.message) ??
                    "Failed";
                  return (
                    <p key={`failed-${String(centerId)}-${index}`}>
                      Center #{String(centerId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}

            {readActionItems(result, "skipped").length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {readActionItems(result, "skipped").map((item, index) => {
                  const record = toRecord(item);
                  const centerId = record?.center_id ?? record?.id ?? item;
                  const reason =
                    extractFirstMessage(record?.reason) ??
                    extractFirstMessage(record?.error) ??
                    extractFirstMessage(record?.message) ??
                    "Skipped";
                  return (
                    <p key={`skipped-${String(centerId)}-${index}`}>
                      Center #{String(centerId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Type {DELETE_CONFIRM_TEXT} to confirm
          </label>
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
            disabled={mutation.isPending}
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteCenters}
            disabled={
              mutation.isPending || confirmationText !== DELETE_CONFIRM_TEXT
            }
          >
            {mutation.isPending ? "Deleting..." : "Delete Centers"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
