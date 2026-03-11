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
import { useBulkRestoreCenters } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { BulkCentersActionResult } from "@/features/centers/services/centers.service";
import type { Center } from "@/features/centers/types/center";
import {
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type BulkRestoreCentersDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centers: Center[];
  onSuccess?: (_message: string) => void;
};

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

export function BulkRestoreCentersDialog({
  open,
  onOpenChange,
  centers,
  onSuccess,
}: BulkRestoreCentersDialogProps) {
  const { t } = useTranslation();

  const mutation = useBulkRestoreCenters();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkCentersActionResult | null>(null);

  const handleRestoreCenters = () => {
    if (centers.length === 0) {
      setErrorMessage("No centers selected.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        center_ids: centers.map((center) => center.id),
      },
      {
        onSuccess: (data) => {
          if (!isAdminRequestSuccessful(data)) {
            setErrorMessage(
              getAdminResponseMessage(
                data,
                "Unable to restore selected centers. Please try again.",
              ),
            );
            return;
          }
          setResult(data);

          const skipped = readCount(data, "skipped");
          const failed = readCount(data, "failed");
          if (skipped === 0 && failed === 0) {
            onSuccess?.(
              getAdminResponseMessage(
                data,
                "Selected centers were restored successfully.",
              ),
            );
            onOpenChange(false);
            return;
          }

          onSuccess?.(
            getAdminResponseMessage(data, "Bulk restore action processed."),
          );
        },
        onError: (error) => {
          setErrorMessage(
            getCenterApiErrorMessage(
              error,
              "Unable to restore selected centers. Please try again.",
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
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {t("auto.features.centers.components.bulkrestorecentersdialog.s1")}
          </DialogTitle>
          <DialogDescription>
            Restore {centers.length}{" "}
            {t("auto.features.centers.components.bulkrestorecentersdialog.s2")}
            {centers.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
          {t("auto.features.centers.components.bulkrestorecentersdialog.s3")}
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.centers.components.bulkrestorecentersdialog.s4",
              )}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>
                {t(
                  "auto.features.centers.components.bulkrestorecentersdialog.s5",
                )}
                {readCount(result, "total") || centers.length}
              </span>
              <span>
                {t(
                  "auto.features.centers.components.bulkrestorecentersdialog.s6",
                )}
                {readCount(result, "restored")}
              </span>
              <span>
                {t(
                  "auto.features.centers.components.bulkrestorecentersdialog.s7",
                )}
                {readCount(result, "skipped")}
              </span>
              <span>
                {t(
                  "auto.features.centers.components.bulkrestorecentersdialog.s8",
                )}
                {readCount(result, "failed")}
              </span>
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
                      {t(
                        "auto.features.centers.components.bulkrestorecentersdialog.s9",
                      )}
                      {String(centerId)}: {reason}
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
                      {t(
                        "auto.features.centers.components.bulkrestorecentersdialog.s9",
                      )}
                      {String(centerId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.features.centers.components.bulkrestorecentersdialog.s10")}
          </Button>
          <Button onClick={handleRestoreCenters} disabled={mutation.isPending}>
            {mutation.isPending ? "Restoring..." : "Restore Centers"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
