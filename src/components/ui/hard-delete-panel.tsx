"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type HardDeletePanelProps = {
  title: string;
  entityName?: string | null;
  entityFallback?: string;
  confirmText?: string;
  confirmLabel?: string;
  confirmButtonLabel?: string;
  pendingLabel?: string;
  errorTitle?: string;
  errorMessage?: string | null;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  resetKey?: string | number | boolean | null;
};

const DEFAULT_CONFIRM_TEXT = "DELETE";

export function HardDeletePanel({
  title,
  entityName,
  entityFallback = "this item",
  confirmText = DEFAULT_CONFIRM_TEXT,
  confirmLabel,
  confirmButtonLabel = "Delete",
  pendingLabel = "Deleting...",
  errorTitle = "Could not delete item",
  errorMessage,
  isPending = false,
  onCancel,
  onConfirm,
  resetKey,
}: HardDeletePanelProps) {
  const [confirmationText, setConfirmationText] = useState("");

  useEffect(() => {
    setConfirmationText("");
  }, [resetKey]);

  const isConfirmMatch = confirmationText === confirmText;
  const resolvedLabel = confirmLabel ?? `Type ${confirmText} to confirm`;
  const resolvedName = entityName?.trim() ? entityName : entityFallback;

  return (
    <>
      <DialogHeader className="space-y-3">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.8A1.75 1.75 0 004.4 19h15.2a1.75 1.75 0 001.51-2.34l-7.4-12.8a1.75 1.75 0 00-3.02 0z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>
        </div>
      </DialogHeader>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>{errorTitle}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-200">
        You are about to permanently delete{" "}
        <span className="font-semibold text-red-900 dark:text-red-100">
          {resolvedName}
        </span>
        .
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {resolvedLabel}
        </label>
        <Input
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          disabled={isPending}
        />
      </div>

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isPending || !isConfirmMatch}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          {isPending ? pendingLabel : confirmButtonLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
