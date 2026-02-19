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
  useBulkApproveDeviceChangeRequests,
  useBulkPreApproveDeviceChangeRequests,
  useBulkRejectDeviceChangeRequests,
} from "@/features/device-change-requests/hooks/use-device-change-requests";
import type {
  DeviceChangeBulkActionResult,
  DeviceChangeRequest,
} from "@/features/device-change-requests/types/device-change-request";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";

type BulkDeviceChangeActionDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  action: "approve" | "reject" | "pre-approve";
  requests: DeviceChangeRequest[];
  centerId?: string | number;
  onSuccess?: (_message: string) => void;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readCount(result: DeviceChangeBulkActionResult, key: string) {
  const value = result.counts?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function BulkDeviceChangeActionDialog({
  open,
  onOpenChange,
  action,
  requests,
  centerId,
  onSuccess,
}: BulkDeviceChangeActionDialogProps) {
  const bulkApproveMutation = useBulkApproveDeviceChangeRequests();
  const bulkRejectMutation = useBulkRejectDeviceChangeRequests();
  const bulkPreApproveMutation = useBulkPreApproveDeviceChangeRequests();

  const activeMutation =
    action === "approve"
      ? bulkApproveMutation
      : action === "reject"
        ? bulkRejectMutation
        : bulkPreApproveMutation;

  const [newDeviceId, setNewDeviceId] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newOsVersion, setNewOsVersion] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DeviceChangeBulkActionResult | null>(
    null,
  );

  const ids = useMemo(() => requests.map((item) => item.id), [requests]);

  const handleSubmit = () => {
    if (ids.length === 0) {
      setErrorMessage("No device change requests selected.");
      return;
    }

    setErrorMessage(null);

    if (action === "approve") {
      bulkApproveMutation.mutate(
        {
          centerId,
          payload: {
            request_ids: ids,
            new_device_id: newDeviceId || undefined,
            new_model: newModel || undefined,
            new_os_version: newOsVersion || undefined,
          },
        },
        {
          onSuccess: (data) => {
            setResult(data);
            onSuccess?.("Bulk device approve processed.");
          },
          onError: (error) => {
            setErrorMessage(
              getStudentRequestApiErrorMessage(
                error,
                "Unable to bulk approve device change requests.",
              ),
            );
          },
        },
      );
      return;
    }

    if (action === "reject") {
      bulkRejectMutation.mutate(
        {
          centerId,
          payload: {
            request_ids: ids,
            decision_reason: decisionReason || "Bulk rejected",
          },
        },
        {
          onSuccess: (data) => {
            setResult(data);
            onSuccess?.("Bulk device reject processed.");
          },
          onError: (error) => {
            setErrorMessage(
              getStudentRequestApiErrorMessage(
                error,
                "Unable to bulk reject device change requests.",
              ),
            );
          },
        },
      );
      return;
    }

    bulkPreApproveMutation.mutate(
      {
        centerId,
        payload: {
          request_ids: ids,
          decision_reason: decisionReason || undefined,
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
          onSuccess?.("Bulk device pre-approve processed.");
        },
        onError: (error) => {
          setErrorMessage(
            getStudentRequestApiErrorMessage(
              error,
              "Unable to bulk pre-approve device change requests.",
            ),
          );
        },
      },
    );
  };

  const processedKey =
    action === "approve"
      ? "approved"
      : action === "reject"
        ? "rejected"
        : "pre_approved";
  const processedItems = Array.isArray(result?.[processedKey])
    ? (result?.[processedKey] as Array<Record<string, unknown>>)
    : [];
  const skippedItems = Array.isArray(result?.skipped)
    ? (result?.skipped as Array<Record<string, unknown>>)
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
          setNewDeviceId("");
          setNewModel("");
          setNewOsVersion("");
          setDecisionReason("");
          setErrorMessage(null);
          setResult(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            Bulk {action === "pre-approve" ? "Pre-Approve" : action} Devices
          </DialogTitle>
          <DialogDescription>
            Process {ids.length} selected device change request
            {ids.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {readCount(result, "total") || ids.length}</span>
              <span>
                {processedKey === "pre_approved"
                  ? "Pre-Approved"
                  : processedKey === "approved"
                    ? "Approved"
                    : "Rejected"}
                : {readCount(result, processedKey)}
              </span>
              <span>Skipped: {readCount(result, "skipped")}</span>
              <span>Failed: {readCount(result, "failed")}</span>
            </div>

            {processedItems.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-emerald-700 dark:text-emerald-300">
                {processedItems.map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const requestId = record.request_id ?? record.id ?? "unknown";
                  return (
                    <p key={`processed-${String(requestId)}-${index}`}>
                      Request #{String(requestId)} processed
                    </p>
                  );
                })}
              </div>
            ) : null}

            {skippedItems.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {skippedItems.map((item, index) => {
                  const record = toRecord(item) ?? {};
                  const requestId = record.request_id ?? record.id ?? "unknown";
                  const reason =
                    (typeof record.reason === "string" && record.reason) ||
                    "Skipped";
                  return (
                    <p key={`skipped-${String(requestId)}-${index}`}>
                      Request #{String(requestId)}: {reason}
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
                    "Failed";
                  return (
                    <p key={`failed-${String(requestId)}-${index}`}>
                      Request #{String(requestId)}: {reason}
                    </p>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {action === "approve" ? (
          <>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New Device ID (optional)
              </p>
              <Input
                value={newDeviceId}
                onChange={(event) => setNewDeviceId(event.target.value)}
                placeholder="new-device-uuid"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New Model (optional)
              </p>
              <Input
                value={newModel}
                onChange={(event) => setNewModel(event.target.value)}
                placeholder="iPhone 15"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                New OS Version (optional)
              </p>
              <Input
                value={newOsVersion}
                onChange={(event) => setNewOsVersion(event.target.value)}
                placeholder="iOS 17.2"
              />
            </div>
          </>
        ) : null}

        {action !== "approve" ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Decision reason{" "}
              {action === "reject" ? "(required)" : "(optional)"}
            </p>
            <Input
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
              placeholder={
                action === "reject" ? "Bulk rejected" : "Bulk pre-approved"
              }
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSubmit} disabled={activeMutation.isPending}>
            {activeMutation.isPending
              ? "Processing..."
              : action === "pre-approve"
                ? "Pre-Approve"
                : action === "approve"
                  ? "Approve"
                  : "Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
