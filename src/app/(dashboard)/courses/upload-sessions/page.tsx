"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Queue",
    description: "Placeholder rows for queued and completed uploads.",
  },
  {
    title: "Validation",
    description: "Error handling and retry strategies.",
  },
  {
    title: "Ownership",
    description: "Track who initiated each batch.",
  },
];

export default function CoursesUploadSessionsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.courseUploadSessions.title")}
      description={t(
        "pages.placeholderRoutes.courseUploadSessions.description",
      )}
      items={items}
    />
  );
}
