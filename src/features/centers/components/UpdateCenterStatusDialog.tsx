"use client";

import { useEffect, useState } from "react";
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
import { useUpdateCenterStatus } from "@/features/centers/hooks/use-centers";
import { getCenterApiErrorMessage } from "@/features/centers/lib/api-error";
import type { Center } from "@/features/centers/types/center";
import {
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type UpdateCenterStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  center?: Center | null;
  onSuccess?: (_message: string) => void;
};

type CenterStatusOption = "active" | "inactive";

function getInitialStatus(center?: Center | null): CenterStatusOption {
  if (Number(center?.status) === 0) return "inactive";

  const label = String(center?.status_label ?? "")
    .trim()
    .toLowerCase();
  if (label === "inactive") return "inactive";

  return "active";
}

export function UpdateCenterStatusDialog({
  open,
  onOpenChange,
  center,
  onSuccess,
}: UpdateCenterStatusDialogProps) {
  const { t } = useTranslation();

  const mutation = useUpdateCenterStatus();
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
        payload: { status: status === "active" ? 1 : 0 },
      },
      {
        onSuccess: (response) => {
          if (!isAdminRequestSuccessful(response)) {
            setErrorMessage(
              getAdminResponseMessage(
                response,
                "Unable to update center status. Please try again.",
              ),
            );
            return;
          }
          onSuccess?.(
            getAdminResponseMessage(
              response,
              "Center status updated successfully.",
            ),
          );
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(
            getCenterApiErrorMessage(
              error,
              "Unable to update center status. Please try again.",
            ),
          );
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
          <DialogTitle>
            {t("auto.features.centers.components.updatecenterstatusdialog.s1")}
          </DialogTitle>
          <DialogDescription>
            {t("auto.features.centers.components.updatecenterstatusdialog.s2")}
            <span className="font-medium">{centerName}</span>.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.centers.components.updatecenterstatusdialog.s3",
              )}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("auto.features.centers.components.updatecenterstatusdialog.s4")}
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
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("auto.features.centers.components.updatecenterstatusdialog.s5")}
          </Button>
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
