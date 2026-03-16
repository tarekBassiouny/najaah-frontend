"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useCloseVideoCodeBatch } from "@/features/video-code-batches/hooks/use-video-code-batches";
import type { VideoCodeBatch } from "@/features/video-code-batches/types/video-code-batch";

type CloseVideoCodeBatchDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId: string | number;
  batch: VideoCodeBatch | null;
  onCompleted?: () => void | Promise<void>;
};

export function CloseVideoCodeBatchDialog({
  open,
  onOpenChange,
  centerId,
  batch,
  onCompleted,
}: CloseVideoCodeBatchDialogProps) {
  const { t } = useTranslation();
  const closeMutation = useCloseVideoCodeBatch();
  const redeemedCount = Number(batch?.redeemed_count ?? 0);
  const quantity = Number(batch?.quantity ?? 0);
  const startingSoldLimit = Number(batch?.sold_limit ?? redeemedCount);
  const [soldLimit, setSoldLimit] = useState(String(startingSoldLimit));
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSoldLimit(
      String(Number(batch?.sold_limit ?? batch?.redeemed_count ?? 0)),
    );
    setIsConfirmed(false);
    setErrorMessage(null);
  }, [batch?.id, batch?.redeemed_count, batch?.sold_limit, open]);

  const parsedSoldLimit = Number(soldLimit);
  const remainingRedemptions =
    Number.isFinite(parsedSoldLimit) && parsedSoldLimit >= redeemedCount
      ? parsedSoldLimit - redeemedCount
      : 0;
  const invalidatedCodes =
    Number.isFinite(parsedSoldLimit) && quantity >= parsedSoldLimit
      ? quantity - parsedSoldLimit
      : 0;
  const isClosedBatch =
    String(batch?.status ?? "")
      .trim()
      .toLowerCase() === "closed";

  const actionLabel = useMemo(() => {
    if (isClosedBatch) return "Update Sold Limit";
    return "Close Batch";
  }, [isClosedBatch]);

  const handleSubmit = () => {
    if (!batch?.id) return;

    if (!Number.isFinite(parsedSoldLimit)) {
      setErrorMessage("Sold limit must be a valid number.");
      return;
    }

    if (parsedSoldLimit < redeemedCount) {
      setErrorMessage(
        `Sold limit cannot be lower than the redeemed count (${redeemedCount}).`,
      );
      return;
    }

    if (parsedSoldLimit > quantity) {
      setErrorMessage(
        `Sold limit cannot exceed the batch quantity (${quantity}).`,
      );
      return;
    }

    if (!isConfirmed) {
      setErrorMessage("Confirm the sold count before saving.");
      return;
    }

    setErrorMessage(null);

    closeMutation.mutate(
      {
        centerId,
        batchId: batch.id,
        payload: {
          sold_limit: parsedSoldLimit,
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
              : "Failed to update the sold limit.",
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {actionLabel} {batch?.batch_code ?? ""}
          </DialogTitle>
          <DialogDescription>
            {t(
              "auto.features.video_code_batches.components.closevideocodebatchdialog.description",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t(
                  "auto.features.video_code_batches.components.closevideocodebatchdialog.errorTitle",
                )}
              </AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <Alert>
            <AlertTitle>
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.currentStatus",
              )}
            </AlertTitle>
            <AlertDescription>
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.totalCodes",
              )}{" "}
              {quantity}
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.alreadyRedeemed",
              )}{" "}
              {redeemedCount}
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.currentSoldLimit",
              )}{" "}
              {batch?.sold_limit ?? "Not set"}.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="close-batch-sold-limit">
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.soldCount",
              )}
            </Label>
            <Input
              id="close-batch-sold-limit"
              type="number"
              min={redeemedCount}
              max={quantity}
              value={soldLimit}
              onChange={(event) => setSoldLimit(event.target.value)}
              disabled={closeMutation.isPending}
            />
          </div>

          <Alert>
            <AlertTitle>
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.resultPreview",
              )}
            </AlertTitle>
            <AlertDescription>
              {redeemedCount}{" "}
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.redeemedCodesValid",
              )}{" "}
              {remainingRedemptions}{" "}
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.moreCodesRedeemable",
              )}{" "}
              {invalidatedCodes}{" "}
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.codesInvalid",
              )}
            </AlertDescription>
          </Alert>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setIsConfirmed(event.target.checked)}
              disabled={closeMutation.isPending}
            />
            <span>
              {t(
                "auto.features.video_code_batches.components.closevideocodebatchdialog.confirmSoldCount",
              )}
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={closeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={closeMutation.isPending || !batch}
          >
            {closeMutation.isPending ? "Saving..." : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
