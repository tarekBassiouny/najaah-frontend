"use client";

import { useState } from "react";
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
import { useTranslation } from "@/features/localization";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

type DeleteRoleDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  role?: Role | null;
  onSuccess?: (_message: string) => void;
  scopeCenterId?: string | number | null;
};

const ERROR_CODE_MESSAGES: Record<string, string> = {
  PERMISSION_DENIED: "You do not have permission to delete this role.",
  SYSTEM_SCOPE_REQUIRED:
    "This action requires system scope. Please use the platform admin panel.",
  SYSTEM_API_KEY_REQUIRED:
    "This action requires a system API key. Please contact your administrator.",
  API_KEY_CENTER_MISMATCH:
    "The API key does not match this center. Please refresh and try again.",
  CENTER_MISMATCH:
    "This role belongs to a different center and cannot be deleted here.",
  NOT_FOUND:
    "The requested role was not found. It may have already been deleted.",
  VALIDATION_ERROR: "Unable to delete role due to validation constraints.",
};

function getErrorCodeMessage(code: string | undefined): string | null {
  if (!code) return null;
  return ERROR_CODE_MESSAGES[code] ?? null;
}

function getErrorMessage(error: unknown) {
  const codeMessage = getErrorCodeMessage(getAdminApiErrorCode(error));
  if (codeMessage) {
    return codeMessage;
  }

  return getAdminApiErrorMessage(
    error,
    "Unable to delete role. Please try again.",
  );
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
  scopeCenterId,
}: DeleteRoleDialogProps) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutate: deleteRole, isPending } = useDeleteRole({
    centerId: scopeCenterId ?? null,
  });
  const { showToast } = useModal();

  const handleDelete = () => {
    if (!role) return;
    setErrorMessage(null);

    deleteRole(role.id, {
      onSuccess: (response) => {
        if (!isAdminRequestSuccessful(response)) {
          setErrorMessage(
            getAdminResponseMessage(
              response,
              "Unable to delete role. Please try again.",
            ),
          );
          return;
        }
        const message = getAdminResponseMessage(
          response,
          "Role deleted successfully.",
        );
        onOpenChange(false);
        onSuccess?.(message);
        showToast(message, "success");
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
          <DialogTitle className="sr-only">
            {t("auto.features.roles.components.deleteroledialog.s1")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("auto.features.roles.components.deleteroledialog.s1")}
          entityName={roleName}
          entityFallback={t(
            "auto.features.roles.components.deleteroledialog.s2",
          )}
          confirmButtonLabel={t(
            "auto.features.roles.components.deleteroledialog.s1",
          )}
          pendingLabel={t("auto.features.roles.components.deleteroledialog.s3")}
          errorTitle={t("auto.features.roles.components.deleteroledialog.s4")}
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
