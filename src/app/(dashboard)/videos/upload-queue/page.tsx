"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Pending Uploads",
    description: "Filename, owner, size, and remaining time placeholders.",
  },
  {
    title: "Errors",
    description: "Retry guidance and failure reasons.",
  },
  {
    title: "Recent Completions",
    description: "Successful ingests with timestamps.",
  },
];

export default function VideosUploadQueuePage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.videoUploadQueue.title")}
      description={t("pages.placeholderRoutes.videoUploadQueue.description")}
      items={items}
    />
  );
}
