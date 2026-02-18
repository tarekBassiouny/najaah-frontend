"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateCenter } from "@/features/centers/hooks/use-centers";
import type { Center } from "@/features/centers/types/center";

type UpdateCenterStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  center?: Center | null;
  onSuccess?: (_message: string) => void;
};

type CenterStatusOption = "active" | "inactive" | "pending";

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, string[]>;
        }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length > 0) {
        return first[0];
      }
    }
  }

  return "Unable to update center status. Please try again.";
}

function getInitialStatus(center?: Center | null): CenterStatusOption {
  const raw = String(center?.status ?? "")
    .trim()
    .toLowerCase();

  if (["active", "enabled", "approved"].includes(raw)) return "active";
  if (["inactive", "disabled"].includes(raw)) return "inactive";
  if (["pending", "processing"].includes(raw)) return "pending";
  return "active";
}

export function UpdateCenterStatusDialog({
  open,
  onOpenChange,
  center,
  onSuccess,
}: UpdateCenterStatusDialogProps) {
  const mutation = useUpdateCenter();
  const [status, setStatus] = useState<CenterStatusOption>("active");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      return;
    }

    setErrorMessage(null);
    setStatus(getInitialStatus(center));
  }, [open, center]);

  const handleUpdate = () => {
    if (!center) {
      setErrorMessage("Center not found.");
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        id: center.id,
        payload: { status },
      },
      {
        onSuccess: () => {
          onSuccess?.("Center status updated successfully.");
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
        },
      },
    );
  };

  const centerName = center?.name ?? `Center #${center?.id ?? ""}`;

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
            Update status for <span className="font-medium">{centerName}</span>.
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
            Select the new status for this center.
          </p>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as CenterStatusOption)}
          >
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
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
