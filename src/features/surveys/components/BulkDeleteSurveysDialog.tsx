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
import { useBulkDeleteSurveys } from "@/features/surveys/hooks/use-surveys";
import { getSurveyApiErrorMessage } from "@/features/surveys/lib/api-error";
import type {
  BulkSurveyActionResult,
  Survey,
} from "@/features/surveys/types/survey";

type BulkDeleteSurveysDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  surveys: Survey[];
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

const DELETE_CONFIRM_TEXT = "DELETE";

function readCount(result: BulkSurveyActionResult, key: string) {
  const value = result.counts?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

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

function readActionItems(
  result: BulkSurveyActionResult,
  key: "failed" | "skipped",
) {
  const value = result[key];
  return Array.isArray(value) ? value : [];
}

function getSurveyTitle(survey: Survey) {
  if (survey.title_translations?.en) return survey.title_translations.en;
  if (survey.title_translations?.ar) return survey.title_translations.ar;
  if (survey.title) return String(survey.title);
  return `Survey #${survey.id}`;
}

export function BulkDeleteSurveysDialog({
  open,
  onOpenChange,
  surveys,
  centerId,
  onSuccess,
}: BulkDeleteSurveysDialogProps) {
  const mutation = useBulkDeleteSurveys({ centerId });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkSurveyActionResult | null>(null);
  const [confirmationText, setConfirmationText] = useState("");

  const handleDeleteSurveys = () => {
    if (surveys.length === 0) {
      setErrorMessage("No surveys selected.");
      return;
    }
    if (confirmationText !== DELETE_CONFIRM_TEXT) {
      setErrorMessage(`Type ${DELETE_CONFIRM_TEXT} to confirm.`);
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        survey_ids: surveys.map((survey) => survey.id),
      },
      {
        onSuccess: (data) => {
          setResult(data);

          const skipped = readCount(data, "skipped");
          const failed = readCount(data, "failed");
          if (skipped === 0 && failed === 0) {
            onSuccess?.("Selected surveys were deleted successfully.");
            onOpenChange(false);
            return;
          }

          onSuccess?.("Bulk delete action processed.");
        },
        onError: (error) => {
          setErrorMessage(
            getSurveyApiErrorMessage(
              error,
              "Unable to delete selected surveys. Please try again.",
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
          <DialogTitle>Bulk Delete Surveys</DialogTitle>
          <DialogDescription>
            Permanently delete {surveys.length} selected survey
            {surveys.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          This action cannot be undone.
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Selected Surveys
          </p>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {surveys.slice(0, 5).map((survey) => (
              <p key={String(survey.id)}>• {getSurveyTitle(survey)}</p>
            ))}
            {surveys.length > 5 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +{surveys.length - 5} more surveys
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
              <span>Total: {readCount(result, "total") || surveys.length}</span>
              <span>Updated: {readCount(result, "updated")}</span>
              <span>Skipped: {readCount(result, "skipped")}</span>
              <span>Failed: {readCount(result, "failed")}</span>
            </div>

            {readActionItems(result, "failed").length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {readActionItems(result, "failed").map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const surveyId = record.survey_id ?? record.id ?? "unknown";
                  const reason =
                    extractFirstMessage(record.reason) ??
                    extractFirstMessage(record.error) ??
                    extractFirstMessage(record.message) ??
                    "Failed";
                  return (
                    <p key={`failed-${surveyId}-${index}`}>
                      Survey #{String(surveyId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}

            {readActionItems(result, "skipped").length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {readActionItems(result, "skipped").map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const surveyId = record.survey_id ?? record.id ?? "unknown";
                  const reason =
                    extractFirstMessage(record.reason) ??
                    extractFirstMessage(record.error) ??
                    extractFirstMessage(record.message) ??
                    "Skipped";
                  return (
                    <p key={`skipped-${surveyId}-${index}`}>
                      Survey #{String(surveyId)}: {reason}
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
            onClick={handleDeleteSurveys}
            disabled={
              mutation.isPending || confirmationText !== DELETE_CONFIRM_TEXT
            }
          >
            {mutation.isPending ? "Deleting..." : "Delete Surveys"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
