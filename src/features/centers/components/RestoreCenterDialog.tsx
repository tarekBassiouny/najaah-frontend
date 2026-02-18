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
import { useRestoreCenter } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";

type RestoreCenterDialogProps = {
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

export function RestoreCenterDialog({
  open,
  onOpenChange,
  center,
  onSuccess,
}: RestoreCenterDialogProps) {
  const mutation = useRestoreCenter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRestore = () => {
    if (!center) {
      setErrorMessage("Center not found.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(center.id, {
      onSuccess: () => {
        onSuccess?.("Center restored successfully.");
        onOpenChange(false);
      },
      onError: (error) => {
        setErrorMessage(
          getCenterApiErrorMessage(
            error,
            "Unable to restore center. Please try again.",
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
          <DialogTitle>Restore Center</DialogTitle>
          <DialogDescription>
            Restore <span className="font-medium">{getCenterName(center)}</span>{" "}
            and make it accessible again.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to restore</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
          This will restore the center and keep all existing data intact.
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRestore} disabled={mutation.isPending}>
            {mutation.isPending ? "Restoring..." : "Restore Center"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
