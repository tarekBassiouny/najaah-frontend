"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Search & Filters",
    description: "Course, owner, and status filters.",
  },
  {
    title: "Document Table",
    description: "Placeholder for filename, course link, and last updated.",
  },
  {
    title: "Bulk Actions",
    description: "Archive, replace, or export selections.",
  },
];

export default function PdfsLibraryPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.pdfLibrary.title")}
      description={t("pages.placeholderRoutes.pdfLibrary.description")}
      items={items}
    />
  );
}
