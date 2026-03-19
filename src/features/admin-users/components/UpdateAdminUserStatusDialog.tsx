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
import { useUpdateAdminUserStatus } from "@/features/admin-users/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin-users/types/admin-user";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

type UpdateAdminUserStatusDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  user?: AdminUser | null;
  onSuccess?: (_message: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown, t: TranslateFunction): string {
  return getAdminApiErrorMessage(
    error,
    t("pages.admins.dialogs.status.errors.updateFailed"),
  );
}

function getInitialStatus(user?: AdminUser | null): "0" | "1" | "2" {
  if (user?.status != null) {
    const value = String(user.status).trim();
    if (value === "0" || value === "1" || value === "2") {
      return value;
    }
  }

  const statusKey = String(user?.status_key ?? "")
    .trim()
    .toLowerCase();

  if (statusKey === "inactive") return "0";
  if (statusKey === "banned") return "2";

  return "1";
}

export function UpdateAdminUserStatusDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  scopeCenterId,
}: UpdateAdminUserStatusDialogProps) {
  const { t } = useTranslation();

  const mutation = useUpdateAdminUserStatus({
    centerId: scopeCenterId ?? null,
  });
  const [status, setStatus] = useState<"0" | "1" | "2">("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setErrorMessage(null);
      return;
    }

    setErrorMessage(null);
    setStatus(getInitialStatus(user));
  }, [open, user]);

  const handleUpdate = () => {
    if (!user) {
      setErrorMessage(t("pages.admins.dialogs.status.errors.notFound"));
      return;
    }

    setErrorMessage(null);
    mutation.mutate(
      {
        userId: user.id,
        payload: { status: Number(status) },
      },
      {
        onSuccess: (response) => {
          if (!isAdminRequestSuccessful(response)) {
            setErrorMessage(
              getAdminResponseMessage(
                response,
                t("pages.admins.dialogs.status.errors.updateFailed"),
              ),
            );
            return;
          }
          onSuccess?.(
            getAdminResponseMessage(
              response,
              t("pages.admins.dialogs.status.messages.updated"),
            ),
          );
          onOpenChange(false);
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, t));
        },
      },
    );
  };

  const userName =
    user?.name ??
    user?.email ??
    t("pages.admins.fallbacks.userById", { id: user?.id ?? "" });

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
          <DialogTitle>{t("pages.admins.dialogs.status.title")}</DialogTitle>
          <DialogDescription>
            {t("pages.admins.dialogs.status.description", {
              name: userName,
            })}
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.admins.dialogs.status.errors.errorTitle")}
            </AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("pages.admins.dialogs.status.help")}
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
            {t("common.actions.cancel")}
          </Button>
          <Button onClick={handleUpdate} disabled={mutation.isPending}>
            {mutation.isPending
              ? t("pages.admins.dialogs.status.actions.updating")
              : t("pages.admins.dialogs.status.actions.update")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
