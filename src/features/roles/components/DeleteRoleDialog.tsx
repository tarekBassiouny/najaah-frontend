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
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";
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

function getErrorCodeMessage(
  code: string | undefined,
  t: TranslateFunction,
): string | null {
  if (!code) return null;

  const messages: Record<string, string> = {
    PERMISSION_DENIED: t("pages.roles.dialogs.delete.errors.permissionDenied"),
    SYSTEM_SCOPE_REQUIRED: t(
      "pages.roles.dialogs.delete.errors.systemScopeRequired",
    ),
    SYSTEM_API_KEY_REQUIRED: t(
      "pages.roles.dialogs.delete.errors.systemApiKeyRequired",
    ),
    API_KEY_CENTER_MISMATCH: t(
      "pages.roles.dialogs.delete.errors.apiKeyCenterMismatch",
    ),
    CENTER_MISMATCH: t("pages.roles.dialogs.delete.errors.centerMismatch"),
    NOT_FOUND: t("pages.roles.dialogs.delete.errors.notFound"),
    VALIDATION_ERROR: t("pages.roles.dialogs.delete.errors.validation"),
  };

  return messages[code] ?? null;
}

function getErrorMessage(error: unknown, t: TranslateFunction) {
  const codeMessage = getErrorCodeMessage(getAdminApiErrorCode(error), t);
  if (codeMessage) {
    return codeMessage;
  }

  return getAdminApiErrorMessage(
    error,
    t("pages.roles.dialogs.delete.errors.deleteFailed"),
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
  const deletedMessage = t("pages.roles.dialogs.delete.messages.deleted");
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
              t("pages.roles.dialogs.delete.errors.deleteFailed"),
            ),
          );
          return;
        }
        const message = getAdminResponseMessage(response, deletedMessage);
        onOpenChange(false);
        onSuccess?.(message);
        showToast(message, "success");
      },
      onError: (error) => {
        setErrorMessage(getErrorMessage(error, t));
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
            {t("pages.roles.dialogs.delete.title")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.roles.dialogs.delete.title")}
          entityName={roleName}
          entityFallback={t("pages.roles.dialogs.delete.entityFallback")}
          confirmText={t("pages.roles.dialogs.delete.confirmText")}
          confirmLabel={t("pages.roles.dialogs.delete.confirmLabel", {
            confirmText: t("pages.roles.dialogs.delete.confirmText"),
          })}
          confirmButtonLabel={t(
            "pages.roles.dialogs.delete.confirmButtonLabel",
          )}
          pendingLabel={t("pages.roles.dialogs.delete.pendingLabel")}
          errorTitle={t("pages.roles.dialogs.delete.errors.errorTitle")}
          irreversibleText={t("pages.roles.dialogs.delete.irreversible")}
          warningPrefix={t("pages.roles.dialogs.delete.warningPrefix")}
          cancelButtonLabel={t("common.actions.cancel")}
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
