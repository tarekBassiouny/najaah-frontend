"use client";

import { useMemo, useState } from "react";
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
  useBulkPublishSections,
  useBulkUnpublishSections,
} from "@/features/sections/hooks/use-sections";
import type { Section } from "@/features/sections/types/section";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

type BulkSectionPublishDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  mode: "publish" | "unpublish";
  sections: Section[];
  centerId: string | number;
  courseId: string | number;
  onProcessed?: (_args: {
    success: boolean;
    message: string;
    shouldClearSelection: boolean;
  }) => void;
};

type BulkResult = {
  counts?: {
    total?: number;
    updated?: number;
    skipped?: number;
    failed?: number;
  };
  failed?: Array<{ section_id?: string | number; reason?: string }>;
  skipped?: Array<{ section_id?: string | number; reason?: string }>;
};

function actionLabel(mode: "publish" | "unpublish") {
  return mode === "publish" ? "Publish" : "Unpublish";
}

function getErrorMessage(error: unknown, mode: "publish" | "unpublish") {
  return getAdminApiErrorMessage(
    error,
    mode === "publish"
      ? "Unable to publish selected sections. Please try again."
      : "Unable to unpublish selected sections. Please try again.",
  );
}

export function BulkSectionPublishDialog({
  open,
  onOpenChange,
  mode,
  sections,
  centerId,
  courseId,
  onProcessed,
}: BulkSectionPublishDialogProps) {
  const bulkPublishMutation = useBulkPublishSections();
  const bulkUnpublishMutation = useBulkUnpublishSections();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);

  const mutation =
    mode === "publish" ? bulkPublishMutation : bulkUnpublishMutation;
  const isPending = mutation.isPending;

  const sectionIds = useMemo(
    () =>
      sections
        .map((section) => section.id)
        .filter((id): id is string | number => id != null),
    [sections],
  );

  const handleConfirm = () => {
    if (sectionIds.length === 0) {
      const message = "No sections selected.";
      setErrorMessage(message);
      onProcessed?.({
        success: false,
        message,
        shouldClearSelection: false,
      });
      return;
    }

    setErrorMessage(null);

    mutation.mutate(
      {
        centerId,
        courseId,
        sectionIds,
      },
      {
        onSuccess: (response) => {
          if (!isAdminRequestSuccessful(response)) {
            const message = getAdminResponseMessage(
              response,
              mode === "publish"
                ? "Unable to publish selected sections."
                : "Unable to unpublish selected sections.",
            );
            setErrorMessage(message);
            onProcessed?.({
              success: false,
              message,
              shouldClearSelection: false,
            });
            return;
          }

          const responseData = (response.data ?? null) as BulkResult | null;
          const nextResult: BulkResult = {
            counts: responseData?.counts,
            failed: responseData?.failed ?? [],
            skipped: responseData?.skipped ?? [],
          };
          setResult(nextResult);

          const message = getAdminResponseMessage(
            response,
            mode === "publish"
              ? "Bulk section publish processed."
              : "Bulk section unpublish processed.",
          );
          const failedCount = nextResult.counts?.failed ?? 0;
          const shouldClearSelection = failedCount === 0;

          onProcessed?.({
            success: true,
            message,
            shouldClearSelection,
          });
        },
        onError: (error) => {
          const message = getErrorMessage(error, mode);
          setErrorMessage(message);
          onProcessed?.({
            success: false,
            message,
            shouldClearSelection: false,
          });
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;
        if (!nextOpen) {
          setErrorMessage(null);
          setResult(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>{actionLabel(mode)} Sections</DialogTitle>
          <DialogDescription>
            {actionLabel(mode)} {sectionIds.length} selected section
            {sectionIds.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Could not process bulk action</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result?.counts ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {result.counts.total ?? sectionIds.length}</span>
              <span>Updated: {result.counts.updated ?? 0}</span>
              <span>Skipped: {result.counts.skipped ?? 0}</span>
              <span>Failed: {result.counts.failed ?? 0}</span>
            </div>

            {result.failed && result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {result.failed.map((item, index) => (
                  <p key={`failed-${item.section_id ?? "unknown"}-${index}`}>
                    Section #{item.section_id ?? "?"}: {item.reason ?? "Failed"}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Confirm to {mode} the selected sections.
          </p>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result ? (
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Processing..." : actionLabel(mode)}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
