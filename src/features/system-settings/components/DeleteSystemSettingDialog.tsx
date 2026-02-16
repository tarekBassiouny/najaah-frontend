"use client";

import { isAxiosError } from "axios";
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

type DeleteSystemSettingDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  setting?: SystemSetting | null;
  onSuccess?: (_message: string) => void;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return "Unable to delete setting. Please try again.";
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
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Setting deleted successfully.");
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
