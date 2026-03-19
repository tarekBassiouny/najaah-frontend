"use client";

import { useState } from "react";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteAdminUser } from "@/features/admin-users/hooks/use-admin-users";
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

type DeleteAdminUserDialogProps = {
  user?: AdminUser | null;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onSuccess?: (_value: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown, t: TranslateFunction) {
  return getAdminApiErrorMessage(
    error,
    t("pages.admins.dialogs.delete.errors.deleteFailed"),
  );
}

export function DeleteAdminUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  scopeCenterId,
}: DeleteAdminUserDialogProps) {
  const { t } = useTranslation();
  const deletedMessage = t("pages.admins.dialogs.delete.messages.deleted");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteAdminUser({
    centerId: scopeCenterId ?? null,
  });
  const handleDelete = () => {
    if (!user) return;
    setErrorMessage(null);

    deleteMutation.mutate(user.id, {
      onSuccess: (response) => {
        if (!isAdminRequestSuccessful(response)) {
          setErrorMessage(
            getAdminResponseMessage(
              response,
              t("pages.admins.dialogs.delete.errors.deleteFailed"),
            ),
          );
          return;
        }
        onOpenChange(false);
        onSuccess?.(getAdminResponseMessage(response, deletedMessage));
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error, t));
      },
    });
  };

  const userName = user?.name ? String(user.name) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">
            {t("pages.admins.dialogs.delete.title")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.admins.dialogs.delete.title")}
          entityName={userName}
          entityFallback={t("pages.admins.dialogs.delete.entityFallback")}
          confirmText={t("pages.admins.dialogs.delete.confirmText")}
          confirmLabel={t("pages.admins.dialogs.delete.confirmLabel", {
            confirmText: t("pages.admins.dialogs.delete.confirmText"),
          })}
          confirmButtonLabel={t(
            "pages.admins.dialogs.delete.confirmButtonLabel",
          )}
          pendingLabel={t("pages.admins.dialogs.delete.pendingLabel")}
          errorTitle={t("pages.admins.dialogs.delete.errors.errorTitle")}
          irreversibleText={t("pages.admins.dialogs.delete.irreversible")}
          warningPrefix={t("pages.admins.dialogs.delete.warningPrefix")}
          cancelButtonLabel={t("common.actions.cancel")}
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (user?.id ?? "admin-user") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
