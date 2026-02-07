"use client";

import { use } from "react";
import { useState } from "react";
import Link from "next/link";
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

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterVideosPage({ params }: PageProps) {
  const { centerId } = use(params);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);
  const [viewingVideo, setViewingVideo] = useState<Video | null>(null);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const openCreateDialog = () => {
    setEditingVideo(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Videos"
        description="Manage videos for this center"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Videos" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">Back to Center</Button>
            </Link>
            <Button onClick={openCreateDialog}>Add Video</Button>
          </div>
        }
      />
      <VideosTable
        centerId={centerId}
        onView={(video) => setViewingVideo(video)}
        onEdit={(video) => {
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
