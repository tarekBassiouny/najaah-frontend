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
import { useDeleteVideo } from "@/features/videos/hooks/use-videos";
import type { Video } from "@/features/videos/types/video";
import { useModal } from "@/components/ui/modal-store";

type DeleteVideoDialogProps = {
  open: boolean;
  onOpenChange: (_isOpen: boolean) => void;
  centerId?: string | number | null;
  video?: Video | null;
  onSuccess?: (_value: string) => void;
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }

  return "Unable to delete video. Please try again.";
}

export function DeleteVideoDialog({
  open,
  onOpenChange,
  centerId,
  video,
  onSuccess,
}: DeleteVideoDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteVideo();
  const { showToast } = useModal();

  const handleDelete = () => {
    if (!video || !centerId) return;
    setErrorMessage(null);

    deleteMutation.mutate(
      { centerId, videoId: video.id },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("Video deleted successfully.");
          showToast("Video deleted successfully.", "success");
        },
        onError: (error) => {
          setErrorMessage(getErrorMessage(error));
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
          <DialogTitle className="sr-only">Delete Video</DialogTitle>
        </DialogHeader>
        <HardDeletePanel
          title="Delete Video"
          entityName={videoTitle ? String(videoTitle) : null}
          entityFallback="this video"
          confirmButtonLabel="Delete Video"
          pendingLabel="Deleting..."
          errorTitle="Could not delete video"
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
