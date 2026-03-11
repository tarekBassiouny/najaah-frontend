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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApproveVideoAccessRequest,
  useRejectVideoAccessRequest,
} from "@/features/video-access/hooks/use-video-access";
import type {
  VideoAccessRequest,
  VideoAccessWhatsappFormat,
} from "@/features/video-access/types/video-access";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";
import { useTranslation } from "@/features/localization";

type VideoAccessRequestActionDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  action: "approve" | "reject";
  request: VideoAccessRequest | null;
  centerId?: string | number | null;
  onSuccess?: () => void;
};

export function VideoAccessRequestActionDialog({
  open,
  onOpenChange,
  action,
  request,
  centerId,
  onSuccess,
}: VideoAccessRequestActionDialogProps) {
  const { t } = useTranslation();

  const approveMutation = useApproveVideoAccessRequest();
  const rejectMutation = useRejectVideoAccessRequest();
  const activeMutation =
    action === "approve" ? approveMutation : rejectMutation;

  const [decisionReason, setDecisionReason] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [whatsappFormat, setWhatsappFormat] =
    useState<VideoAccessWhatsappFormat>("text_code");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDecisionReason("");
    setSendWhatsapp(true);
    setWhatsappFormat("text_code");
    setErrorMessage(null);
  }, [action, open, request?.id]);

  const handleSubmit = () => {
    if (!request) {
      setErrorMessage("Request is not available.");
      return;
    }

    setErrorMessage(null);

    if (action === "approve") {
      approveMutation.mutate(
        {
          requestId: request.id,
          centerId,
          payload: {
            decision_reason: decisionReason || undefined,
            send_whatsapp: sendWhatsapp,
            whatsapp_format: sendWhatsapp ? whatsappFormat : undefined,
          },
        },
        {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
          },
          onError: (error) => {
            setErrorMessage(
              getStudentRequestApiErrorMessage(
                error,
                "Unable to approve this video access request.",
              ),
            );
          },
        },
      );
      return;
    }

    if (!decisionReason.trim()) {
      setErrorMessage("Decision reason is required.");
      return;
    }

    rejectMutation.mutate(
      {
        requestId: request.id,
        centerId,
        payload: {
          decision_reason: decisionReason.trim(),
        },
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to reject this video access request.",
            ),
          );
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (activeMutation.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {action === "approve"
              ? "Approve Video Access Request"
              : "Reject Video Access Request"}
          </DialogTitle>
          <DialogDescription>
            {request ? `Request #${request.id}` : "Selected request"}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.video_access.components.videoaccessrequestactiondialog.s1",
              )}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {action === "approve" ? (
          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={sendWhatsapp}
                onChange={(event) => setSendWhatsapp(event.target.checked)}
              />
              {t(
                "auto.features.video_access.components.videoaccessrequestactiondialog.s2",
              )}
            </label>

            <Select
              value={whatsappFormat}
              onValueChange={(value) =>
                setWhatsappFormat(value as VideoAccessWhatsappFormat)
              }
              disabled={!sendWhatsapp}
            >
              <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
                <SelectValue
                  placeholder={t(
                    "auto.features.video_access.components.videoaccessrequestactiondialog.s3",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text_code">
                  {t(
                    "auto.features.video_access.components.videoaccessrequestactiondialog.s4",
                  )}
                </SelectItem>
                <SelectItem value="qr_code">
                  {t(
                    "auto.features.video_access.components.videoaccessrequestactiondialog.s5",
                  )}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t(
              "auto.features.video_access.components.videoaccessrequestactiondialog.s6",
            )}
            {action === "reject" ? "(required)" : "(optional)"}
          </p>
          <Input
            value={decisionReason}
            onChange={(event) => setDecisionReason(event.target.value)}
            placeholder={
              action === "approve"
                ? "Approved for assignment completion"
                : "Rejected after review"
            }
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t(
              "auto.features.video_access.components.videoaccessrequestactiondialog.s7",
            )}
          </Button>
          <Button onClick={handleSubmit} disabled={activeMutation.isPending}>
            {activeMutation.isPending
              ? "Processing..."
              : action === "approve"
                ? "Approve"
                : "Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
