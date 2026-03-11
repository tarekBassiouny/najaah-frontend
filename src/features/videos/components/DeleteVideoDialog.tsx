"use client";

import { useState } from "react";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
} from "@/lib/admin-response";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HardDeletePanel } from "@/components/ui/hard-delete-panel";
import { useDeleteVideo } from "@/features/videos/hooks/use-videos";
import type { Video } from "@/features/videos/types/video";
import { useModal } from "@/components/ui/modal-store";
import { useTranslation } from "@/features/localization";

type DeleteVideoDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  centerId?: string | number | null;
  video?: Video | null;
  onSuccess?: (_value: string) => void;
};

function getErrorMessage(error: unknown, fallbackMessage: string) {
  return getAdminApiErrorMessage(error, fallbackMessage);
}

export function DeleteVideoDialog({
  open,
  onOpenChange,
  centerId,
  video,
  onSuccess,
}: DeleteVideoDialogProps) {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteVideo();
  const { showToast } = useModal();

  const handleDelete = () => {
    if (!video || !centerId) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      { centerId, videoId: video.id },
      {
        onSuccess: (response) => {
          onOpenChange(false);
          const successMessage = getAdminResponseMessage(
            response,
            t("pages.videos.dialogs.delete.messages.deleted"),
          );
          onSuccess?.(successMessage);
          showToast(successMessage, "success");
        },
        onError: (error) => {
          setErrorMessage(
            getErrorMessage(
              error,
              t("pages.videos.dialogs.delete.errors.deleteFailed"),
            ),
          );
        },
      },
    );
  };

  const videoTitle =
    video?.title ??
    video?.title_translations?.en ??
    video?.title_translations?.ar ??
    null;

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
            {t("pages.videos.dialogs.delete.title")}
          </DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title={t("pages.videos.dialogs.delete.title")}
          entityName={videoTitle ? String(videoTitle) : null}
          entityFallback={t("pages.videos.dialogs.delete.entityFallback")}
          confirmButtonLabel={t(
            "pages.videos.dialogs.delete.actions.confirmDelete",
          )}
          pendingLabel={t("common.actions.deleting")}
          errorTitle={t("pages.videos.dialogs.delete.errors.couldNotDelete")}
          confirmLabel={t("pages.videos.dialogs.delete.confirmLabel", {
            value: "DELETE",
          })}
          irreversibleText={t("pages.videos.dialogs.delete.irreversible")}
          warningPrefix={t("pages.videos.dialogs.delete.warningPrefix")}
          cancelButtonLabel={t("common.actions.cancel")}
          errorMessage={errorMessage}
          isPending={deleteMutation.isPending}
          onCancel={() => onOpenChange(false)}
          onConfirm={handleDelete}
          resetKey={open ? (video?.id ?? "video") : null}
        />
      </DialogContent>
    </Dialog>
  );
}
