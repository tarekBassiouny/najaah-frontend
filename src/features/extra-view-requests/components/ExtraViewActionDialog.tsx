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
  useApproveExtraViewRequest,
  useRejectExtraViewRequest,
} from "@/features/extra-view-requests/hooks/use-extra-view-requests";
import type { ExtraViewRequest } from "@/features/extra-view-requests/types/extra-view-request";
import { getStudentRequestApiErrorMessage } from "@/features/student-requests/lib/api-error";

type ExtraViewActionDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  action: "approve" | "reject";
  request: ExtraViewRequest | null;
  centerId?: string | number | null;
  onSuccess?: () => void;
};

export function ExtraViewActionDialog({
  open,
  onOpenChange,
  action,
  request,
  centerId,
  onSuccess,
}: ExtraViewActionDialogProps) {
  const approveMutation = useApproveExtraViewRequest();
  const rejectMutation = useRejectExtraViewRequest();
  const activeMutation =
    action === "approve" ? approveMutation : rejectMutation;

  const [grantedViews, setGrantedViews] = useState("1");
  const [decisionReason, setDecisionReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setGrantedViews("1");
    setDecisionReason("");
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
            granted_views: Number(grantedViews) > 0 ? Number(grantedViews) : 1,
            decision_reason: decisionReason || undefined,
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
                "Unable to approve this extra view request.",
              ),
            );
          },
        },
      );
      return;
    }

    rejectMutation.mutate(
      {
        requestId: request.id,
        centerId,
        payload: {
          decision_reason: decisionReason || undefined,
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
              "Unable to reject this extra view request.",
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
              ? "Approve Extra View Request"
              : "Reject Extra View Request"}
          </DialogTitle>
          <DialogDescription>
            {request ? `Request #${request.id}` : "Selected request"}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {action === "approve" ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Granted views
            </p>
            <Input
              type="number"
              min={1}
              value={grantedViews}
              onChange={(event) => setGrantedViews(event.target.value)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Decision reason (optional)
          </p>
          <Input
            value={decisionReason}
            onChange={(event) => setDecisionReason(event.target.value)}
            placeholder={
              action === "approve"
                ? "Approved after review"
                : "Rejected after review"
            }
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
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
