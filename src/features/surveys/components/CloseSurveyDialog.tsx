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
import { useCloseSurvey } from "@/features/surveys/hooks/use-surveys";
import { getSurveyApiErrorMessage } from "@/features/surveys/lib/api-error";
import type { Survey } from "@/features/surveys/types/survey";
import { useTranslation } from "@/features/localization";

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
  const { t } = useTranslation();

  const mutation = useCloseSurvey({ centerId });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const resetLocalState = () => {
    setErrorMessage(null);
    setConfirmationText("");
  };

  useEffect(() => {
    if (!open) {
      resetLocalState();
    }
  }, [open]);

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
        resetLocalState();
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
          resetLocalState();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {t("auto.features.surveys.components.closesurveydialog.s1")}
          </DialogTitle>
          <DialogDescription>
            {t("auto.features.surveys.components.closesurveydialog.s2")}
            <span className="font-medium">{getSurveyTitle(survey)}</span>{" "}
            {t("auto.features.surveys.components.closesurveydialog.s3")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">
          {t("auto.features.surveys.components.closesurveydialog.s4")}
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("auto.features.surveys.components.closesurveydialog.s5")}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Type {CLOSE_CONFIRM_TEXT}{" "}
            {t("auto.features.surveys.components.closesurveydialog.s6")}
          </label>
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
            disabled={mutation.isPending}
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button
            variant="outline"
            onClick={() => {
              resetLocalState();
              onOpenChange(false);
            }}
          >
            {t("auto.features.surveys.components.closesurveydialog.s7")}
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
