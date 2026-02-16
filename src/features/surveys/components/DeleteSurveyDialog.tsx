"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteSurvey } from "@/features/surveys/hooks/use-surveys";
import type { Survey } from "@/features/surveys/types/survey";
import { useModal } from "@/components/ui/modal-store";

type DeleteSurveyDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  survey?: Survey | null;
  onSuccess?: (_value: string) => void;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to delete survey. Please try again.";
}

function getSurveyTitle(survey?: Survey | null) {
  if (!survey) return null;
  if (survey.title_translations?.en) return survey.title_translations.en;
  if (survey.title_translations?.ar) return survey.title_translations.ar;
  if (survey.title) return String(survey.title);
  return null;
}

export function DeleteSurveyDialog({
  open,
  onOpenChange,
  survey,
  onSuccess,
}: DeleteSurveyDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteSurvey();
  const { showToast } = useModal();

  const handleDelete = () => {
    if (!survey) return;
    setErrorMessage(null);

    deleteMutation.mutate(survey.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Survey deleted successfully.");
        showToast("Survey deleted successfully.", "success");
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error));
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Survey</DialogTitle>
        </DialogHeader>

        <HardDeletePanel
          title="Delete Survey"
          entityName={getSurveyTitle(survey)}
          entityFallback="this survey"
          confirmButtonLabel="Delete Survey"
          pendingLabel="Deleting..."
          errorTitle="Could not delete survey"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (survey?.id ?? "survey") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
