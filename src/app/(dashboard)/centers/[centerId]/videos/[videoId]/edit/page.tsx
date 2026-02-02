"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateVideo, useVideo } from "@/features/videos/hooks/use-videos";

type PageProps = {
  params: Promise<{ centerId: string; videoId: string }>;
};

export default function CenterVideoEditPage({ params }: PageProps) {
  const { centerId, videoId } = use(params);
  const router = useRouter();
  const { data: video } = useVideo(centerId, videoId);
  const { mutate: updateVideo, isPending } = useUpdateVideo();

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!video) return;
    setTitle(String(video.title ?? ""));
    setDuration(String(video.duration ?? ""));
    setStatus(String(video.status ?? ""));
  }, [video]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    updateVideo(
      {
        centerId,
        videoId,
        payload: {
          title: title || undefined,
          duration: duration || undefined,
          status: status || undefined,
        },
      },
      {
        onSuccess: () => {
          router.push(`/centers/${centerId}/videos/${videoId}`);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Video"
        description="Update center video details"
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          { label: "Videos", href: `/centers/${centerId}/videos` },
          { label: `Video ${videoId}`, href: `/centers/${centerId}/videos/${videoId}` },
          { label: "Edit" },
        ]}
        actions={
          <Link href={`/centers/${centerId}/videos/${videoId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input id="status" value={status} onChange={(e) => setStatus(e.target.value)} />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
