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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkUpdateSurveyStatus } from "@/features/surveys/hooks/use-surveys";
import { getSurveyApiErrorMessage } from "@/features/surveys/lib/api-error";
import type {
  BulkUpdateSurveyStatusResult,
  Survey,
} from "@/features/surveys/types/survey";
import { useTranslation } from "@/features/localization";

type BulkUpdateSurveyStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  surveys: Survey[];
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

type SurveyStatusOption = "active" | "inactive";

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCount(result: BulkUpdateSurveyStatusResult, key: string) {
  const value = result.counts?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function readFailedItems(result: BulkUpdateSurveyStatusResult) {
  return Array.isArray(result.failed) ? result.failed : [];
}

export function BulkUpdateSurveyStatusDialog({
  open,
  onOpenChange,
  surveys,
  centerId,
  onSuccess,
}: BulkUpdateSurveyStatusDialogProps) {
  const { t } = useTranslation();

  const mutation = useBulkUpdateSurveyStatus({ centerId });
  const [status, setStatus] = useState<SurveyStatusOption>("active");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUpdateSurveyStatusResult | null>(
    null,
  );

  const handleUpdate = () => {
    if (surveys.length === 0) {
      setErrorMessage("No surveys selected.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        is_active: status === "active",
        survey_ids: surveys.map((survey) => survey.id),
      },
      {
        onSuccess: (data) => {
          setResult(data);

          const skipped = readCount(data, "skipped");
          const failed = readCount(data, "failed");
          if (skipped === 0 && failed === 0) {
            onSuccess?.("Survey statuses updated successfully.");
            onOpenChange(false);
            return;
          }

          onSuccess?.("Bulk status update processed.");
        },
        onError: (error) => {
          setErrorMessage(
            getSurveyApiErrorMessage(
              error,
              "Unable to update status for selected surveys. Please try again.",
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
          <DialogTitle>
            {t(
              "auto.features.surveys.components.bulkupdatesurveystatusdialog.s1",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "auto.features.surveys.components.bulkupdatesurveystatusdialog.s2",
            )}
            {surveys.length}{" "}
            {t(
              "auto.features.surveys.components.bulkupdatesurveystatusdialog.s3",
            )}
            {surveys.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.surveys.components.bulkupdatesurveystatusdialog.s4",
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
                  "auto.features.surveys.components.bulkupdatesurveystatusdialog.s5",
                )}
                {readCount(result, "total") || surveys.length}
              </span>
              <span>
                {t(
                  "auto.features.surveys.components.bulkupdatesurveystatusdialog.s6",
                )}
                {readCount(result, "updated")}
              </span>
              <span>
                {t(
                  "auto.features.surveys.components.bulkupdatesurveystatusdialog.s7",
                )}
                {readCount(result, "skipped")}
              </span>
              <span>
                {t(
                  "auto.features.surveys.components.bulkupdatesurveystatusdialog.s8",
                )}
                {readCount(result, "failed")}
              </span>
            </div>

            {readFailedItems(result).length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {readFailedItems(result).map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const surveyId = record.survey_id ?? record.id ?? "unknown";
                  const reason =
                    (typeof record.reason === "string" && record.reason) ||
                    "Failed";

                  return (
                    <p key={`failed-${surveyId}-${index}`}>
                      {t(
                        "auto.features.surveys.components.bulkupdatesurveystatusdialog.s9",
                      )}
                      {String(surveyId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t(
              "auto.features.surveys.components.bulkupdatesurveystatusdialog.s10",
            )}
          </p>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as SurveyStatusOption)}
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
            {t(
              "auto.features.surveys.components.bulkupdatesurveystatusdialog.s11",
            )}
          </Button>
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
