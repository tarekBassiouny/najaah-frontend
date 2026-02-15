"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteRole } from "@/features/roles/hooks/use-roles";
import type { Role } from "@/features/roles/types/role";
import { useModal } from "@/components/ui/modal-store";

type DeleteRoleDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  role?: Role | null;
  onSuccess?: (_message: string) => void;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to delete role. Please try again.";
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: DeleteRoleDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: deleteRole, isPending } = useDeleteRole();
  const { showToast } = useModal();

  const handleDelete = () => {
    if (!role) return;
    setErrorMessage(null);

    deleteRole(role.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Role deleted successfully.");
        showToast("Role deleted successfully.", "success");
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error));
      },
    });
  };

  const roleName = role?.name ? String(role.name) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;
        if (!nextOpen) setErrorMessage(null);
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Role</DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title="Delete Role"
          entityName={roleName}
          entityFallback="this role"
          confirmButtonLabel="Delete Role"
          pendingLabel="Deleting..."
          errorTitle="Could not delete role"
          errorMessage={errorMessage}
          isPending={isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (role?.id ?? "role") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
