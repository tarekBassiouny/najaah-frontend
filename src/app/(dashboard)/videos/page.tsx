"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { VideosTable } from "@/features/videos/components/VideosTable";
import { VideoFormDialog } from "@/features/videos/components/VideoFormDialog";
import { DeleteVideoDialog } from "@/features/videos/components/DeleteVideoDialog";
import { BulkDeleteVideosDialog } from "@/features/videos/components/BulkDeleteVideosDialog";
import { VideoDetailsDialog } from "@/features/videos/components/VideoDetailsDialog";
import { VideoPreviewDialog } from "@/features/videos/components/VideoPreviewDialog";
import { VideoRetryUploadDialog } from "@/features/videos/components/VideoRetryUploadDialog";
import type { Video } from "@/features/videos/types/video";
import { useTenant } from "@/app/tenant-provider";
import { can } from "@/lib/capabilities";
import { useModal } from "@/components/ui/modal-store";

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function resolveEncodingStatus(video: Video) {
  return (
    normalizeStatus(video.encoding_status_key) ||
    normalizeStatus(video.status_key) ||
    normalizeStatus(video.status)
  );
}

function isUploadSourceVideo(video: Video) {
  const sourceType = String(video.source_type ?? "")
    .trim()
    .toLowerCase();
  return (
    sourceType === "1" || sourceType === "upload" || sourceType === "bunny"
  );
}

function canRetryVideoUpload(video: Video) {
  return (
    resolveEncodingStatus(video) === "failed" && isUploadSourceVideo(video)
  );
}

export default function VideosPage() {
  const { showToast } = useModal();
  const tenant = useTenant();
  const centerId = tenant.centerId ?? null;
  const canManageVideos = can("manage_videos");
  const canUploadVideos = can("upload_videos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [bulkDeletingVideos, setBulkDeletingVideos] = useState<Video[]>([]);
  const [viewingVideo, setViewingVideo] = useState<Video | null>(null);
  const [previewingVideo, setPreviewingVideo] = useState<Video | null>(null);
  const [retryingVideo, setRetryingVideo] = useState<Video | null>(null);
  const [retryQueue, setRetryQueue] = useState<Video[]>([]);
  const [retryQueueIndex, setRetryQueueIndex] = useState(0);
  const [advanceRetryQueueOnClose, setAdvanceRetryQueueOnClose] =
    useState(false);

  const openCreateDialog = () => {
    if (!centerId) {
      return;
    }
    if (!canManageVideos) {
      return;
    }
    setEditingVideo(null);
    setIsFormOpen(true);
  };

  const handleOpenSingleRetry = (video: Video) => {
    setRetryQueue([]);
    setRetryQueueIndex(0);
    setAdvanceRetryQueueOnClose(false);
    setRetryingVideo(video);
  };

  const handleOpenBulkRetry = (videos: Video[]) => {
    const eligibleVideos = videos.filter((video) => canRetryVideoUpload(video));
    if (eligibleVideos.length === 0) {
      showToast("Select failed upload-source videos to retry.", "error");
      return;
    }

    setRetryQueue(eligibleVideos);
    setRetryQueueIndex(0);
    setAdvanceRetryQueueOnClose(false);
    setRetryingVideo(eligibleVideos[0]);
  };

  const closeRetryFlow = () => {
    setRetryingVideo(null);
    setRetryQueue([]);
    setRetryQueueIndex(0);
    setAdvanceRetryQueueOnClose(false);
  };

  const handleRetryDialogOpenChange = (open: boolean) => {
    if (open) return;

    if (!advanceRetryQueueOnClose || retryQueue.length === 0) {
      closeRetryFlow();
      return;
    }

    const nextIndex = retryQueueIndex + 1;
    if (nextIndex >= retryQueue.length) {
      closeRetryFlow();
      return;
    }

    setRetryQueueIndex(nextIndex);
    setRetryingVideo(retryQueue[nextIndex]);
    setAdvanceRetryQueueOnClose(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        description={
          canManageVideos
            ? "Manage video content for your learning center"
            : "View video library. Managing videos requires video.manage permission."
        }
        actions={
          canManageVideos ? (
            <Button
              onClick={openCreateDialog}
              disabled={!centerId}
              title={!centerId ? "Select a center first" : undefined}
            >
              Add Video
            </Button>
          ) : null
        }
      />

      <VideosTable
        onView={canManageVideos ? (video) => setViewingVideo(video) : undefined}
        onPreview={
          canManageVideos ? (video) => setPreviewingVideo(video) : undefined
        }
        onEdit={
          canManageVideos
            ? (video) => {
                if (!centerId) return;
                setEditingVideo(video);
                setIsFormOpen(true);
              }
            : undefined
        }
        onDelete={
          canManageVideos ? (video) => setDeletingVideo(video) : undefined
        }
        onRetryUpload={
          canUploadVideos ? (video) => handleOpenSingleRetry(video) : undefined
        }
        onBulkRetryUpload={
          canUploadVideos ? (videos) => handleOpenBulkRetry(videos) : undefined
        }
        onBulkDelete={
          canManageVideos
            ? (videos) => setBulkDeletingVideos(videos)
            : undefined
        }
      />

      <VideoFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingVideo(null);
        }}
        centerId={centerId}
        video={editingVideo}
        allowUploadMode={canUploadVideos}
      />

      <DeleteVideoDialog
        open={Boolean(deletingVideo)}
        onOpenChange={(open) => {
          if (!open) setDeletingVideo(null);
        }}
        centerId={centerId}
        video={deletingVideo}
      />

      {centerId ? (
        <BulkDeleteVideosDialog
          open={bulkDeletingVideos.length > 0}
          onOpenChange={(open) => {
            if (!open) setBulkDeletingVideos([]);
          }}
          videos={bulkDeletingVideos}
          centerId={centerId}
          onSuccess={(message) => showToast(message, "success")}
        />
      ) : null}

      <VideoDetailsDialog
        open={Boolean(viewingVideo)}
        onOpenChange={(open) => {
          if (!open) setViewingVideo(null);
        }}
        centerId={centerId}
        video={viewingVideo}
      />

      <VideoPreviewDialog
        open={Boolean(previewingVideo)}
        onOpenChange={(open) => {
          if (!open) setPreviewingVideo(null);
        }}
        video={previewingVideo}
        centerId={centerId}
      />

      <VideoRetryUploadDialog
        open={Boolean(retryingVideo)}
        onOpenChange={handleRetryDialogOpenChange}
        video={retryingVideo}
        centerId={centerId}
        onSuccess={() => {
          if (retryQueue.length > 0) {
            setAdvanceRetryQueueOnClose(true);
          }
        }}
      />
    </div>
  );
}
