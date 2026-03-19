"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/features/localization";
import { useExpandVideoCodeBatch } from "@/features/video-code-batches/hooks/use-video-code-batches";
import type { VideoCodeBatch } from "@/features/video-code-batches/types/video-code-batch";

type ExpandVideoCodeBatchDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId: string | number;
  batch: VideoCodeBatch | null;
  onCompleted?: () => void | Promise<void>;
};

export function ExpandVideoCodeBatchDialog({
  open,
  onOpenChange,
  centerId,
  batch,
  onCompleted,
}: ExpandVideoCodeBatchDialogProps) {
  const { t } = useTranslation();
  const dialogT = (key: string, params?: Record<string, string | number>) =>
    t(
      `auto.features.video_code_batches.components.expandvideocodebatchdialog.${key}`,
      params,
    );
  const expandMutation = useExpandVideoCodeBatch();
  const [additionalQuantity, setAdditionalQuantity] = useState("50");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAdditionalQuantity("50");
    setErrorMessage(null);
  }, [open, batch?.id]);

  const handleSubmit = () => {
    if (!batch?.id) return;

    const parsedQuantity = Number(additionalQuantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      setErrorMessage(dialogT("errors.invalidAdditionalQuantity"));
      return;
    }

    setErrorMessage(null);

    expandMutation.mutate(
      {
        centerId,
        batchId: batch.id,
        payload: {
          additional_quantity: parsedQuantity,
        },
      },
      {
        onSuccess: () => {
          void onCompleted?.();
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : dialogT("errors.expandFailed"),
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              "auto.features.video_code_batches.components.expandvideocodebatchdialog.title",
            )}{" "}
            {batch?.batch_code ?? ""}
          </DialogTitle>
          <DialogDescription>
            {t(
              "auto.features.video_code_batches.components.expandvideocodebatchdialog.description",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t(
                  "auto.features.video_code_batches.components.expandvideocodebatchdialog.errorTitle",
                )}
              </AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="expand-batch-quantity">
              {t(
                "auto.features.video_code_batches.components.expandvideocodebatchdialog.additionalQuantity",
              )}
            </Label>
            <Input
              id="expand-batch-quantity"
              type="number"
              min="1"
              value={additionalQuantity}
              onChange={(event) => setAdditionalQuantity(event.target.value)}
              disabled={expandMutation.isPending}
            />
          </div>

          <Alert>
            <AlertTitle>
              {t(
                "auto.features.video_code_batches.components.expandvideocodebatchdialog.currentBatch",
              )}
            </AlertTitle>
            <AlertDescription>
              {t(
                "auto.features.video_code_batches.components.expandvideocodebatchdialog.existingQuantity",
              )}{" "}
              {batch?.quantity ?? 0}
              {t(
                "auto.features.video_code_batches.components.expandvideocodebatchdialog.newCodesNote",
              )}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={expandMutation.isPending}
          >
            {t("common.actions.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={expandMutation.isPending || !batch}
          >
            {expandMutation.isPending
              ? dialogT("expanding")
              : dialogT("expandBatch")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
