"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteAdminUser } from "@/features/admin-users/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin-users/types/admin-user";

type DeleteAdminUserDialogProps = {
  user?: AdminUser | null;
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onSuccess?: (_value: string) => void;
  scopeCenterId?: string | number | null;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to delete admin user. Please try again.";
}

export function DeleteAdminUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
  scopeCenterId,
}: DeleteAdminUserDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteAdminUser({
    centerId: scopeCenterId ?? null,
  });
  const handleDelete = () => {
    if (!user) return;
    setErrorMessage(null);

    deleteMutation.mutate(user.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Admin user deleted successfully.");
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
          <DialogTitle className="sr-only">Delete Admin User</DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title="Delete Admin User"
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
