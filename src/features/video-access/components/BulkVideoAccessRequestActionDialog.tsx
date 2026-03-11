"use client";

import { useMemo, useState } from "react";
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
  useBulkApproveVideoAccessRequests,
  useBulkRejectVideoAccessRequests,
} from "@/features/video-access/hooks/use-video-access";
import type {
  VideoAccessBulkActionResult,
  VideoAccessRequest,
  VideoAccessWhatsappFormat,
} from "@/features/video-access/types/video-access";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";
import { useTranslation } from "@/features/localization";

type BulkVideoAccessRequestActionDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  action: "approve" | "reject";
  requests: VideoAccessRequest[];
  centerId?: string | number;
  onSuccess?: (_message: string) => void;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCount(result: VideoAccessBulkActionResult, key: string) {
  const value = result.counts?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const fallback = result[key];
  if (typeof fallback === "number" && Number.isFinite(fallback))
    return fallback;

  return 0;
}

export function BulkVideoAccessRequestActionDialog({
  open,
  onOpenChange,
  action,
  requests,
  centerId,
  onSuccess,
}: BulkVideoAccessRequestActionDialogProps) {
  const { t } = useTranslation();

  const bulkApproveMutation = useBulkApproveVideoAccessRequests();
  const bulkRejectMutation = useBulkRejectVideoAccessRequests();
  const activeMutation =
    action === "approve" ? bulkApproveMutation : bulkRejectMutation;

  const [decisionReason, setDecisionReason] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [whatsappFormat, setWhatsappFormat] =
    useState<VideoAccessWhatsappFormat>("text_code");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<VideoAccessBulkActionResult | null>(
    null,
  );

  const ids = useMemo(() => requests.map((item) => item.id), [requests]);

  const handleSubmit = () => {
    if (ids.length === 0) {
      setErrorMessage("No video access requests selected.");
      return;
    }

    setErrorMessage(null);

    if (action === "approve") {
      bulkApproveMutation.mutate(
        {
          centerId,
          payload: {
            request_ids: ids,
            decision_reason: decisionReason || undefined,
            send_whatsapp: sendWhatsapp,
            whatsapp_format: sendWhatsapp ? whatsappFormat : undefined,
          },
        },
        {
          onSuccess: (data) => {
            setResult(data);
            onSuccess?.("Bulk video access approve processed.");
          },
          onError: (error) => {
            setErrorMessage(
              getStudentRequestApiErrorMessage(
                error,
                "Unable to bulk approve video access requests.",
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

    bulkRejectMutation.mutate(
      {
        centerId,
        payload: {
          request_ids: ids,
          decision_reason: decisionReason.trim(),
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
          onSuccess?.("Bulk video access reject processed.");
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to bulk reject video access requests.",
            ),
          );
        },
      },
    );
  };

  const processedKey = action === "approve" ? "approved" : "rejected";
  const processedItems = Array.isArray(result?.results)
    ? (result?.results as Array<Record<string, unknown>>)
    : Array.isArray(result?.[processedKey])
      ? (result?.[processedKey] as Array<Record<string, unknown>>)
      : [];

  const failedItems = Array.isArray(result?.failed)
    ? (result?.failed as Array<Record<string, unknown>>)
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (activeMutation.isPending) return;
        if (!nextOpen) {
          setDecisionReason("");
          setSendWhatsapp(true);
          setWhatsappFormat("text_code");
          setErrorMessage(null);
          setResult(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            Bulk {action === "approve" ? "Approve" : "Reject"}{" "}
            {t(
              "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s1",
            )}
          </DialogTitle>
          <DialogDescription>
            Process {ids.length}{" "}
            {t(
              "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s2",
            )}
            {ids.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s3",
              )}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>
                {t(
                  "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s4",
                )}
                {readCount(result, "total") || ids.length}
              </span>
              <span>
                {action === "approve" ? "Approved" : "Rejected"}:{" "}
                {readCount(result, processedKey)}
              </span>
              <span>
                {t(
                  "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s5",
                )}
                {readCount(result, "failed")}
              </span>
              {action === "approve" ? (
                <span>
                  {t(
                    "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s6",
                  )}
                  {readCount(result, "codes_generated")}
                </span>
              ) : null}
            </div>

            {processedItems.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                {processedItems.map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const requestId = record.request_id ?? record.id ?? "unknown";
                  return (
                    <p key={`processed-${String(requestId)}-${index}`}>
                      {t(
                        "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s7",
                      )}
                      {String(requestId)} processed
                    </p>
                  );
                })}
              </div>
            ) : null}

            {failedItems.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {failedItems.map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const requestId = record.request_id ?? record.id ?? "unknown";
                  const reason =
                    (typeof record.reason === "string" && record.reason) ||
                    (typeof record.error === "string" && record.error) ||
                    "Failed";
                  return (
                    <p key={`failed-${String(requestId)}-${index}`}>
                      {t(
                        "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s7",
                      )}
                      {String(requestId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
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
                "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s8",
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
                    "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s9",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text_code">
                  {t(
                    "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s10",
                  )}
                </SelectItem>
                <SelectItem value="qr_code">
                  {t(
                    "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s11",
                  )}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t(
              "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s12",
            )}
            {action === "reject" ? "(required)" : "(optional)"}
          </p>
          <Input
            value={decisionReason}
            onChange={(event) => setDecisionReason(event.target.value)}
            placeholder={
              action === "approve" ? "Batch approved" : "Batch rejected"
            }
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t(
              "auto.features.video_access.components.bulkvideoaccessrequestactiondialog.s13",
            )}
          </Button>
          <Button onClick={handleSubmit} disabled={activeMutation.isPending}>
            {activeMutation.isPending
              ? "Processing..."
              : action === "approve"
                ? "Approve Selected"
                : "Reject Selected"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
