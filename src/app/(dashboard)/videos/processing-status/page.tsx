"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Pipelines",
    description: "Stages for encoding, transcription, and packaging.",
  },
  {
    title: "Health",
    description: "Error rates and retry queues.",
  },
  {
    title: "SLAs",
    description: "Processing time targets and alerts.",
  },
];

export default function VideosProcessingStatusPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.videoProcessingStatus.title")}
      description={t(
        "pages.placeholderRoutes.videoProcessingStatus.description",
      )}
      items={items}
    />
  );
}
