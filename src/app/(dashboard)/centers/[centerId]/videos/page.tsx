"use client";

import { use } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { VideosTable } from "@/features/videos/components/VideosTable";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterVideosPage({ params }: PageProps) {
  const { centerId } = use(params);

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
          <Link href={`/centers/${centerId}`}>
            <Button variant="outline">Back to Center</Button>
          </Link>
        }
      />
      <VideosTable centerId={centerId} />
    </div>
  );
}
