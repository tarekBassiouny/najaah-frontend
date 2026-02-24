"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteSystemSetting } from "@/features/system-settings/hooks/use-system-settings";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

type DeleteSystemSettingDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  setting?: SystemSetting | null;
  onSuccess?: (_message: string) => void;
};

function getErrorMessage(error: unknown) {
  return getAdminApiErrorMessage(
    error,
    "Unable to delete setting. Please try again.",
  );
}

export function DeleteSystemSettingDialog({
  open,
  onOpenChange,
  setting,
  onSuccess,
}: DeleteSystemSettingDialogProps) {
  const deleteMutation = useDeleteSystemSetting();
  const errorMessage =
    deleteMutation.isError && deleteMutation.error
      ? getErrorMessage(deleteMutation.error)
      : null;

  const handleDelete = () => {
    if (!setting) return;

    deleteMutation.mutate(setting.id, {
      onSuccess: (response) => {
        if (!isAdminRequestSuccessful(response)) {
          return;
        }
        onOpenChange(false);
        onSuccess?.(
          getAdminResponseMessage(response, "Setting deleted successfully."),
        );
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (deleteMutation.isPending) return;
        if (!nextOpen) {
          deleteMutation.reset();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Delete Setting</DialogTitle>
          <DialogDescription className="sr-only">
            Permanently delete the selected system setting.
          </DialogDescription>
        </DialogHeader>
        <HardDeletePanel
          title="Delete Setting"
          entityName={setting?.key ? String(setting.key) : null}
          entityFallback="this setting"
          confirmButtonLabel="Delete Setting"
          pendingLabel="Deleting..."
          errorTitle="Could not delete setting"
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (setting?.id ?? "setting") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
