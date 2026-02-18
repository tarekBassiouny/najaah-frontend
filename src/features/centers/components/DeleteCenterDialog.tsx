"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteCenter } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";

type DeleteCenterDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  center?: Center | null;
  onSuccess?: (_value: string) => void;
};

function getCenterName(center?: Center | null) {
  if (!center) return null;
  if (center.name?.trim()) return center.name.trim();
  return `Center #${center.id}`;
}

export function DeleteCenterDialog({
  open,
  onOpenChange,
  center,
  onSuccess,
}: DeleteCenterDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteCenter();

  const handleDelete = () => {
    if (!center) return;
    setErrorMessage(null);

    deleteMutation.mutate(center.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Center deleted successfully.");
      },
      onError: (error) => {
        setErrorMessage(
          getCenterApiErrorMessage(
            error,
            "Unable to delete center. Please try again.",
          ),
        );
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
          <DialogTitle className="sr-only">Delete Center</DialogTitle>
        </DialogHeader>

        <HardDeletePanel
          title="Delete Center"
          entityName={getCenterName(center)}
          entityFallback="this center"
          confirmButtonLabel="Delete Center"
          pendingLabel="Deleting..."
          errorTitle="Could not delete center"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (center?.id ?? "center") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
