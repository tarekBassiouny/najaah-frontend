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
import { buildVideoCodeBatchExportFilename } from "@/features/video-code-batches/lib/export-filename";
import { useSendVideoCodeBatchWhatsappCsv } from "@/features/video-code-batches/hooks/use-video-code-batches";
import type {
  VideoCodeBatch,
  VideoCodeBatchExportRecord,
} from "@/features/video-code-batches/types/video-code-batch";

const COUNTRY_CODE_REGEX = /^\+[1-9]\d{0,3}$/;
const EGYPT_MOBILE_REGEX = /^01\d{9}$/;
const GENERIC_MOBILE_REGEX = /^[1-9]\d{5,14}$/;

type SendVideoCodeBatchWhatsappCsvDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  centerId: string | number;
  batch: VideoCodeBatch | null;
  onSent?: (_record: VideoCodeBatchExportRecord) => void;
  onCompleted?: () => void | Promise<void>;
};

function normalizeCountryCode(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function normalizePhoneNumber(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

function formatPhoneNumberForPayload(countryCode: string, phoneNumber: string) {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (
    normalizedCountryCode === "+20" &&
    normalizedPhoneNumber.startsWith("0")
  ) {
    return `${normalizedCountryCode}${normalizedPhoneNumber.slice(1)}`;
  }

  return `${normalizedCountryCode}${normalizedPhoneNumber}`;
}

export function SendVideoCodeBatchWhatsappCsvDialog({
  open,
  onOpenChange,
  centerId,
  batch,
  onSent,
  onCompleted,
}: SendVideoCodeBatchWhatsappCsvDialogProps) {
  const { t } = useTranslation();
  const sendMutation = useSendVideoCodeBatchWhatsappCsv();
  const batchQuantity = Number(batch?.quantity ?? 0);
  const [countryCode, setCountryCode] = useState("+20");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startSequence, setStartSequence] = useState("1");
  const [endSequence, setEndSequence] = useState(
    batchQuantity > 0 ? String(batchQuantity) : "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCountryCode("+20");
    setPhoneNumber("");
    setStartSequence("1");
    setEndSequence(batchQuantity > 0 ? String(batchQuantity) : "");
    setErrorMessage(null);
  }, [batchQuantity, open, batch?.id]);

  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
  const formattedPhoneNumber = useMemo(
    () =>
      formatPhoneNumberForPayload(normalizedCountryCode, normalizedPhoneNumber),
    [normalizedCountryCode, normalizedPhoneNumber],
  );
  const start = Number(startSequence);
  const end = Number(endSequence);
  const sequenceCount =
    Number.isFinite(start) && Number.isFinite(end) && end >= start
      ? end - start + 1
      : 0;
  const filename = batch
    ? buildVideoCodeBatchExportFilename(batch, "csv")
    : "video-batch.csv";

  const handleSubmit = () => {
    if (!batch?.id) return;

    if (!COUNTRY_CODE_REGEX.test(normalizedCountryCode)) {
      setErrorMessage("Enter a valid country code such as +20.");
      return;
    }

    if (normalizedCountryCode === "+20") {
      if (!EGYPT_MOBILE_REGEX.test(normalizedPhoneNumber)) {
        setErrorMessage(
          "Enter an Egyptian mobile number in 11-digit local format, for example 01001234567.",
        );
        return;
      }
    } else if (!GENERIC_MOBILE_REGEX.test(normalizedPhoneNumber)) {
      setErrorMessage("Enter a valid mobile number.");
      return;
    }

    if (!Number.isFinite(start) || start < 1) {
      setErrorMessage("Start sequence must be at least 1.");
      return;
    }

    if (!Number.isFinite(end) || end < start) {
      setErrorMessage(
        "End sequence must be greater than or equal to start sequence.",
      );
      return;
    }

    if (batchQuantity > 0 && end > batchQuantity) {
      setErrorMessage(
        `End sequence cannot exceed the batch quantity (${batchQuantity}).`,
      );
      return;
    }

    setErrorMessage(null);

    sendMutation.mutate(
      {
        centerId,
        batchId: batch.id,
        payload: {
          phone_number: formattedPhoneNumber,
          start_sequence: start,
          end_sequence: end,
        },
      },
      {
        onSuccess: (record) => {
          onSent?.(record);
          void onCompleted?.();
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to send WhatsApp CSV.",
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
            {t(
              "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.title",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.description",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>
                {t(
                  "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.errorTitle",
                )}
              </AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="send-whatsapp-country-code">
                {t(
                  "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.countryCode",
                )}
              </Label>
              <Input
                id="send-whatsapp-country-code"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                placeholder="+20"
                disabled={sendMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="send-whatsapp-phone-number">
                {t(
                  "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.phoneNumber",
                )}
              </Label>
              <Input
                id="send-whatsapp-phone-number"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="01001234567"
                disabled={sendMutation.isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="send-whatsapp-start-sequence">
                {t(
                  "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.startSequence",
                )}
              </Label>
              <Input
                id="send-whatsapp-start-sequence"
                type="number"
                min="1"
                value={startSequence}
                onChange={(event) => setStartSequence(event.target.value)}
                disabled={sendMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="send-whatsapp-end-sequence">
                {t(
                  "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.endSequence",
                )}
              </Label>
              <Input
                id="send-whatsapp-end-sequence"
                type="number"
                min="1"
                max={batchQuantity > 0 ? String(batchQuantity) : undefined}
                value={endSequence}
                onChange={(event) => setEndSequence(event.target.value)}
                disabled={sendMutation.isPending}
              />
            </div>
          </div>

          <Alert>
            <AlertTitle>
              {t(
                "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.deliveryPreview",
              )}
            </AlertTitle>
            <AlertDescription>
              {t(
                "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.destination",
              )}{" "}
              {formattedPhoneNumber || "—"}
              {t(
                "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.range",
              )}{" "}
              {startSequence || "—"}-{endSequence || "—"}
              {t(
                "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.count",
              )}{" "}
              {sequenceCount > 0 ? sequenceCount : "—"}
              {t(
                "auto.features.video_code_batches.components.sendvideocodebatchwhatsappcsvdialog.file",
              )}{" "}
              {filename}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={sendMutation.isPending || !batch}
          >
            {sendMutation.isPending ? "Sending..." : "Send CSV to WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
