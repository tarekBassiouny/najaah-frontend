"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideosTable } from "@/features/videos/components/VideosTable";
import { VideoFormDialog } from "@/features/videos/components/VideoFormDialog";
import { DeleteVideoDialog } from "@/features/videos/components/DeleteVideoDialog";
import { VideoDetailsDialog } from "@/features/videos/components/VideoDetailsDialog";
import type { Video } from "@/features/videos/types/video";
import { useTenant } from "@/app/tenant-provider";

export default function VideosPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId ?? null;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [viewingVideo, setViewingVideo] = useState<Video | null>(null);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const openCreateDialog = () => {
    if (!centerId) {
      setInfoModal({
        title: "Select a center",
        description: "Choose a center to add new videos.",
      });
      return;
    }
    setEditingVideo(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Videos"
        description="Manage video content for your learning center"
        actions={<Button onClick={openCreateDialog}>Add Video</Button>}
      />

      <VideosTable
        onView={(video) => setViewingVideo(video)}
        onEdit={(video) => {
          if (!centerId) {
            setInfoModal({
              title: "Select a center",
              description: "Choose a center to edit videos.",
            });
            return;
          }
          setEditingVideo(video);
          setIsFormOpen(true);
        }}
        onDelete={(video) => setDeletingVideo(video)}
        onToggleStatus={() =>
          setInfoModal({
            title: "Change Status",
            description: "Status updates are not implemented yet.",
          })
        }
        onBulkChangeStatus={() =>
          setInfoModal({
            title: "Change Status",
            description: "Bulk status updates are not implemented yet.",
          })
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
      />

      <DeleteVideoDialog
        open={Boolean(deletingVideo)}
        onOpenChange={(open) => {
          if (!open) setDeletingVideo(null);
        }}
        centerId={centerId}
        video={deletingVideo}
      />

      <VideoDetailsDialog
        open={Boolean(viewingVideo)}
        onOpenChange={(open) => {
          if (!open) setViewingVideo(null);
        }}
        video={viewingVideo}
      />

      <Dialog
        open={Boolean(infoModal)}
        onOpenChange={(open) => {
          if (!open) setInfoModal(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{infoModal?.title ?? "Action"}</DialogTitle>
            <DialogDescription>
              {infoModal?.description ?? "This action is not available yet."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
