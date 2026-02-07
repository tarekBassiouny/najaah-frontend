"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteVideo, useVideo } from "@/features/videos/hooks/use-videos";
import { useRouter } from "next/navigation";

type PageProps = {
  params: Promise<{ centerId: string; videoId: string }>;
};

export default function CenterVideoDetailPage({ params }: PageProps) {
  const { centerId, videoId } = use(params);
  const router = useRouter();
  const { data: video, isLoading, isError } = useVideo(centerId, videoId);
  const { mutate: deleteVideo, isPending: isDeleting } = useDeleteVideo();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={video?.title ?? `Video #${videoId}`}
        description="Center video details"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Videos", href: `/centers/${centerId}/videos` },
          { label: `Video ${videoId}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/centers/${centerId}/videos`}>
              <Button variant="outline">Back</Button>
            </Link>
            <Link href={`/centers/${centerId}/videos/${videoId}/edit`}>
              <Button>Edit</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm("Delete this video?")) {
                  deleteVideo(
                    { centerId, videoId },
                    {
                      onSuccess: () => {
                        router.push(`/centers/${centerId}/videos`);
                      },
                    },
                  );
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Video Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isError || !video ? (
            <p className="text-red-600 dark:text-red-400">
              Failed to load video.
            </p>
          ) : (
            <>
              <p>
                <span className="font-medium">ID:</span> {String(video.id)}
              </p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {video.status ?? "—"}
              </p>
              <p>
                <span className="font-medium">Duration:</span>{" "}
                {String(video.duration ?? "—")}
              </p>
              <p>
                <span className="font-medium">Created:</span>{" "}
                {String(video.created_at ?? "—")}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
