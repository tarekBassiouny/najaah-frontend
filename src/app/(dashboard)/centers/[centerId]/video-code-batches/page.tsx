"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/features/localization";
import { VideoCodeBatchesTable } from "@/features/video-code-batches/components/VideoCodeBatchesTable";
import { CreateVideoCodeBatchDialog } from "@/features/video-code-batches/components/CreateVideoCodeBatchDialog";

type PageProps = {
  params: Promise<{ centerId: string }>;
};

export default function CenterVideoCodeBatchesPage({ params }: PageProps) {
  const { t } = useTranslation();
  const { centerId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(
          "auto.features.video_code_batches.pages.videocodebatches.title",
        )}
        description={t(
          "auto.features.video_code_batches.pages.videocodebatches.description",
        )}
        breadcrumbs={[
          { label: "Centers", href: "/centers" },
          { label: `Center ${centerId}`, href: `/centers/${centerId}` },
          {
            label: t(
              "auto.features.video_code_batches.pages.videocodebatches.title",
            ),
          },
        ]}
        actions={
          <>
            <Button onClick={() => setIsCreateOpen(true)}>
              {t(
                "auto.features.video_code_batches.pages.videocodebatches.createBatch",
              )}
            </Button>
            <Link href={`/centers/${centerId}`}>
              <Button variant="outline">
                {t(
                  "auto.features.video_code_batches.pages.videocodebatches.backToCenter",
                )}
              </Button>
            </Link>
          </>
        }
      />

      <VideoCodeBatchesTable
        centerId={centerId}
        hideHeader
        fixedCourseId={courseId}
      />

      <CreateVideoCodeBatchDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        centerId={centerId}
        coursePreset={
          courseId
            ? {
                id: courseId,
                label: `Course ${courseId}`,
              }
            : null
        }
        onCompleted={() => router.refresh()}
      />
    </div>
  );
}
