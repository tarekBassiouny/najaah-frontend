"use client";

import { use } from "react";
import { VideoCodeBatchDetailsPage } from "@/features/video-code-batches/components/VideoCodeBatchDetailsPage";

type PageProps = {
  params: Promise<{ centerId: string; batchId: string }>;
};

export default function CenterVideoCodeBatchDetailRoute({ params }: PageProps) {
  const { centerId, batchId } = use(params);

  return <VideoCodeBatchDetailsPage centerId={centerId} batchId={batchId} />;
}
