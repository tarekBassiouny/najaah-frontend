"use client";

import { useState } from "react";
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
import { useBulkUpdateAdminUserStatus } from "@/features/admin-users/hooks/use-admin-users";
import type {
  AdminUser,
  BulkUpdateAdminUserStatusResult,
} from "@/features/admin-users/types/admin-user";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

type BulkUpdateAdminUserStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  users: AdminUser[];
  onSuccess?: (_message: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown, t: TranslateFunction): string {
  return getAdminApiErrorMessage(
    error,
    t("pages.admins.dialogs.bulkStatus.errors.updateFailed"),
  );
}

export function BulkUpdateAdminUserStatusDialog({
  open,
  onOpenChange,
  users,
  onSuccess,
  scopeCenterId,
}: BulkUpdateAdminUserStatusDialogProps) {
  const { t } = useTranslation();

  const mutation = useBulkUpdateAdminUserStatus({
    centerId: scopeCenterId ?? null,
  });
  const [status, setStatus] = useState<"0" | "1" | "2">("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BulkUpdateAdminUserStatusResult | null>(
    null,
  );

  const handleUpdate = () => {
    if (users.length === 0) {
      setErrorMessage(t("pages.admins.dialogs.bulkStatus.errors.noUsers"));
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        status: Number(status),
        user_ids: users.map((user) => user.id),
      },
      {
        onSuccess: (data) => {
          if (!isAdminRequestSuccessful(data)) {
            setErrorMessage(
              getAdminResponseMessage(
                data,
                t("pages.admins.dialogs.bulkStatus.errors.processFailed"),
              ),
            );
            return;
          }
          setResult(data);

          const skipped = data?.counts?.skipped ?? 0;
          const failed = data?.counts?.failed ?? 0;
          if (skipped === 0 && failed === 0) {
            onSuccess?.(
              getAdminResponseMessage(
                data,
                t("pages.admins.dialogs.bulkStatus.messages.updated"),
              ),
            );
            onOpenChange(false);
            return;
          }

          onSuccess?.(
            getAdminResponseMessage(
              data,
              t("pages.admins.dialogs.bulkStatus.messages.processed"),
            ),
          );
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, t));
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return;
        if (!nextOpen) {
          setErrorMessage(null);
          setResult(null);
          setStatus("1");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>
            {t("pages.admins.dialogs.bulkStatus.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.admins.dialogs.bulkStatus.description", {
              count: users.length,
            })}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.admins.dialogs.bulkStatus.errors.errorTitle")}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result?.counts ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>
                {t("pages.admins.dialogs.bulkStatus.summary.total")}
                {result.counts.total ?? users.length}
              </span>
              <span>
                {t("pages.admins.dialogs.bulkStatus.summary.updated")}
                {result.counts.updated ?? 0}
              </span>
              <span>
                {t("pages.admins.dialogs.bulkStatus.summary.skipped")}
                {result.counts.skipped ?? 0}
              </span>
              <span>
                {t("pages.admins.dialogs.bulkStatus.summary.failed")}
                {result.counts.failed ?? 0}
              </span>
            </div>

            {result.failed && result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {result.failed.map((item, index) => (
                  <p key={`failed-${item.user_id}-${index}`}>
                    {t("pages.admins.dialogs.bulkStatus.summary.userPrefix")}
                    {item.user_id}:{" "}
                    {item.reason ??
                      t(
                        "pages.admins.dialogs.bulkStatus.summary.failedFallback",
                      )}
                  </p>
                ))}
              </div>
            ) : null}

            {result.skipped && result.skipped.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {result.skipped.map((item, index) => (
                  <p key={`skipped-${item.user_id}-${index}`}>
                    {t("pages.admins.dialogs.bulkStatus.summary.userPrefix")}
                    {item.user_id}:{" "}
                    {item.reason ??
                      t(
                        "pages.admins.dialogs.bulkStatus.summary.skippedFallback",
                      )}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.admins.dialogs.bulkStatus.help")}
          </p>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as "0" | "1" | "2")}
          >
            <SelectTrigger className="h-10 w-full bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                {t("pages.admins.table.status.active")}
              </SelectItem>
              <SelectItem value="0">
                {t("pages.admins.table.status.inactive")}
              </SelectItem>
              <SelectItem value="2">
                {t("pages.admins.table.status.banned")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.actions.close")}
          </Button>
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending
              ? t("pages.admins.dialogs.bulkStatus.actions.updating")
              : t("pages.admins.dialogs.bulkStatus.actions.update")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
