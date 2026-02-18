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
import { useCloseSurvey } from "@/features/surveys/hooks/use-surveys";
import { getSurveyApiErrorMessage } from "@/features/surveys/lib/api-error";
import type { Survey } from "@/features/surveys/types/survey";

type CloseSurveyDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  survey?: Survey | null;
  centerId?: string | number | null;
  onSuccess?: (_message: string) => void;
};

const CLOSE_CONFIRM_TEXT = "CLOSE";

function getSurveyTitle(survey?: Survey | null) {
  if (!survey) return null;
  if (survey.title_translations?.en) return survey.title_translations.en;
  if (survey.title_translations?.ar) return survey.title_translations.ar;
  if (survey.title) return String(survey.title);
  return `Survey #${survey.id}`;
}

export function CloseSurveyDialog({
  open,
  onOpenChange,
  survey,
  centerId,
  onSuccess,
}: CloseSurveyDialogProps) {
  const mutation = useCloseSurvey({ centerId });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState("");

  const handleCloseSurvey = () => {
    if (!survey) {
      setErrorMessage("Survey not found.");
      return;
    }
    if (confirmationText !== CLOSE_CONFIRM_TEXT) {
      setErrorMessage(`Type ${CLOSE_CONFIRM_TEXT} to confirm.`);
      return;
    }

    setErrorMessage(null);
    mutation.mutate(survey.id, {
      onSuccess: () => {
        onSuccess?.("Survey closed successfully.");
        onOpenChange(false);
      },
      onError: (error) => {
        setErrorMessage(
          getSurveyApiErrorMessage(
            error,
            "Unable to close survey. Please try again.",
          ),
        );
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return;
        if (!nextOpen) {
          setErrorMessage(null);
          setConfirmationText("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Close Survey</DialogTitle>
          <DialogDescription>
            Close <span className="font-medium">{getSurveyTitle(survey)}</span>{" "}
            to stop accepting new responses.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
          Existing responses will be kept, but students will not be able to
          submit new responses after closing.
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to close</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Type {CLOSE_CONFIRM_TEXT} to confirm
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
            onClick={handleCloseSurvey}
            disabled={
              mutation.isPending || confirmationText !== CLOSE_CONFIRM_TEXT
            }
          >
            {mutation.isPending ? "Closing..." : "Close Survey"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
