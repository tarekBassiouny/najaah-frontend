"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteVideo } from "@/features/videos/services/videos.service";
import type { Video } from "@/features/videos/types/video";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

type BulkDeleteVideosDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  videos: Video[];
  centerId: string | number;
  onSuccess?: (_message: string) => void;
};

const DELETE_CONFIRM_TEXT = "DELETE";

type DeleteResult = {
  total: number;
  deleted: number;
  failed: Array<{ id: string | number; title: string; reason: string }>;
};

function resolveVideoTitle(video: Video) {
  if (video.title_translations?.en) return video.title_translations.en;
  if (video.title_translations?.ar) return video.title_translations.ar;
  if (video.title) return String(video.title);
  return `Video #${video.id}`;
}

export function BulkDeleteVideosDialog({
  open,
  onOpenChange,
  videos,
  centerId,
  onSuccess,
}: BulkDeleteVideosDialogProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DeleteResult | null>(null);
  const [confirmationText, setConfirmationText] = useState("");

  const handleDeleteVideos = async () => {
    if (videos.length === 0) {
      setErrorMessage("No videos selected.");
      return;
    }
    if (confirmationText !== DELETE_CONFIRM_TEXT) {
      setErrorMessage(`Type ${DELETE_CONFIRM_TEXT} to confirm.`);
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    const deleteResult: DeleteResult = {
      total: videos.length,
      deleted: 0,
      failed: [],
    };

    for (const video of videos) {
      try {
        const response = await deleteVideo(centerId, video.id);
        if (!isAdminRequestSuccessful(response)) {
          deleteResult.failed.push({
            id: video.id,
            title: resolveVideoTitle(video),
            reason: getAdminResponseMessage(
              response,
              "Failed to delete this video.",
            ),
          });
          continue;
        }

        deleteResult.deleted += 1;
      } catch (error) {
        deleteResult.failed.push({
          id: video.id,
          title: resolveVideoTitle(video),
          reason: getAdminApiErrorMessage(
            error,
            "Failed to delete this video.",
          ),
        });
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["videos", centerId] });
    setIsDeleting(false);
    setResult(deleteResult);

    if (deleteResult.failed.length === 0) {
      const message = `${deleteResult.deleted} video${deleteResult.deleted === 1 ? "" : "s"} deleted successfully.`;
      onSuccess?.(message);
      onOpenChange(false);
      return;
    }

    if (deleteResult.deleted > 0) {
      setErrorMessage(
        `Deleted ${deleteResult.deleted} of ${deleteResult.total} videos. Review failed items below and retry if needed.`,
      );
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setErrorMessage(null);
    setResult(null);
    setConfirmationText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Bulk Delete Videos</DialogTitle>
          <DialogDescription>
            Permanently delete {videos.length} selected video
            {videos.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          This action cannot be undone.
        </div>

        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Selected Videos
          </p>
          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            {videos.slice(0, 5).map((video) => (
              <p key={String(video.id)}>• {resolveVideoTitle(video)}</p>
            ))}
            {videos.length > 5 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +{videos.length - 5} more videos
              </p>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to delete</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-300">
            <div className="flex flex-wrap gap-3">
              <span>Total: {result.total}</span>
              <span>Deleted: {result.deleted}</span>
              <span>Failed: {result.failed.length}</span>
            </div>

            {result.failed.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-red-700 dark:text-red-300">
                {result.failed.map((item) => (
                  <p key={String(item.id)}>
                    {item.title}: {item.reason}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Type {DELETE_CONFIRM_TEXT} to confirm
          </label>
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-gray-700 dark:bg-gray-900"
            disabled={isDeleting}
          />
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteVideos}
            disabled={isDeleting || confirmationText !== DELETE_CONFIRM_TEXT}
          >
            {isDeleting ? "Deleting..." : "Delete Videos"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
