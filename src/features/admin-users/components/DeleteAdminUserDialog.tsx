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
import { useTranslation } from "@/features/localization";

type DeleteAdminUserDialogProps = {
  user?: AdminUser | null;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onSuccess?: (_value: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown) {
  return getAdminApiErrorMessage(
    error,
    "Unable to delete admin user. Please try again.",
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
              "Unable to delete admin user. Please try again.",
            ),
          );
          return;
        }
        onOpenChange(false);
        onSuccess?.(
          getAdminResponseMessage(response, "Admin user deleted successfully."),
        );
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error));
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
            {t("auto.features.admin_users.components.deleteadminuserdialog.s1")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t(
            "auto.features.admin_users.components.deleteadminuserdialog.s1",
          )}
          entityName={userName}
          entityFallback="this admin user"
          confirmButtonLabel="Delete User"
          pendingLabel="Deleting..."
          errorTitle="Could not delete admin user"
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
