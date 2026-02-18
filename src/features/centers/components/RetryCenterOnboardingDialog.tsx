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
import { useRetryCenterOnboarding } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";

type RetryCenterOnboardingDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  center?: Center | null;
  onSuccess?: (_message: string) => void;
};

function getCenterName(center?: Center | null) {
  if (!center) return null;
  if (center.name?.trim()) return center.name.trim();
  return `Center #${center.id}`;
}

export function RetryCenterOnboardingDialog({
  open,
  onOpenChange,
  center,
  onSuccess,
}: RetryCenterOnboardingDialogProps) {
  const mutation = useRetryCenterOnboarding();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRetry = () => {
    if (!center) {
      setErrorMessage("Center not found.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(center.id, {
      onSuccess: () => {
        onSuccess?.("Center onboarding retry triggered.");
        onOpenChange(false);
      },
      onError: (error) => {
        setErrorMessage(
          getCenterApiErrorMessage(
            error,
            "Unable to retry center onboarding. Please try again.",
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
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Retry Onboarding</DialogTitle>
          <DialogDescription>
            Retry onboarding workflow for{" "}
            <span className="font-medium">{getCenterName(center)}</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to retry</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300">
          This action re-runs onboarding operations for this center.
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRetry} disabled={mutation.isPending}>
            {mutation.isPending ? "Retrying..." : "Retry Onboarding"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
