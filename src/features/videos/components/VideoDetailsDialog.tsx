"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Video } from "@/features/videos/types/video";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format-date-time";

type VideoDetailsDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  video?: Video | null;
};

export function VideoDetailsDialog({
  open,
  onOpenChange,
  video,
}: VideoDetailsDialogProps) {
  const title =
    video?.title ??
    video?.title_translations?.en ??
    video?.title_translations?.ar ??
    "Video details";
  const description =
    video?.description ??
    video?.description_translations?.en ??
    video?.description_translations?.ar ??
    "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/40">
            <span className="text-gray-500">Status</span>
            {video?.status ? (
              <Badge variant="secondary">{String(video.status)}</Badge>
            ) : (
              <span className="text-gray-700 dark:text-gray-300">—</span>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-gray-500">Duration</span>
            <span className="text-gray-700 dark:text-gray-300">
              {video?.duration ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-gray-500">Created</span>
            <span className="text-gray-700 dark:text-gray-300">
              {video?.created_at ? formatDateTime(video.created_at) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-gray-500">Updated</span>
            <span className="text-gray-700 dark:text-gray-300">
              {video?.updated_at ? formatDateTime(video.updated_at) : "—"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
