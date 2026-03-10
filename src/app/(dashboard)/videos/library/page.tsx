"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Search & Filters",
    description: "Status, duration, and tag filters to be added.",
  },
  {
    title: "Video Table",
    description:
      "Placeholder for title, course, encoding status, and last played.",
  },
  {
    title: "Bulk Actions",
    description: "Retire, archive, or reprocess videos.",
  },
];

export default function VideosLibraryPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.videoLibrary.title")}
      description={t("pages.placeholderRoutes.videoLibrary.description")}
      items={items}
    />
  );
}
