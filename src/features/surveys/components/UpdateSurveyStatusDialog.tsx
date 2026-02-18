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
import { useUpdateSurveyStatus } from "@/features/surveys/hooks/use-surveys";
import { getSurveyApiErrorMessage } from "@/features/surveys/lib/api-error";
import type { Survey } from "@/features/surveys/types/survey";

type UpdateSurveyStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  survey?: Survey | null;
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

type SurveyStatusOption = "active" | "inactive";

function getSurveyTitle(survey?: Survey | null) {
  if (!survey) return null;
  if (survey.title_translations?.en) return survey.title_translations.en;
  if (survey.title_translations?.ar) return survey.title_translations.ar;
  if (survey.title) return String(survey.title);
  return `Survey #${survey.id}`;
}

function getInitialStatus(survey?: Survey | null): SurveyStatusOption {
  return survey?.is_active ? "active" : "inactive";
}

export function UpdateSurveyStatusDialog({
  open,
  onOpenChange,
  survey,
  centerId,
  onSuccess,
}: UpdateSurveyStatusDialogProps) {
  const mutation = useUpdateSurveyStatus({ centerId });
  const [status, setStatus] = useState<SurveyStatusOption>("active");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      return;
    }

    setErrorMessage(null);
    setStatus(getInitialStatus(survey));
  }, [open, survey]);

  const handleUpdate = () => {
    if (!survey) {
      setErrorMessage("Survey not found.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        surveyId: survey.id,
        payload: { is_active: status === "active" },
      },
      {
        onSuccess: () => {
          onSuccess?.("Survey status updated successfully.");
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(
            getSurveyApiErrorMessage(
              error,
              "Unable to update survey status. Please try again.",
            ),
          );
        },
      },
    );
  };

  const surveyName = getSurveyTitle(survey);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Change Status</DialogTitle>
          <DialogDescription>
            Update status for <span className="font-medium">{surveyName}</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select the new status for this survey.
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
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
