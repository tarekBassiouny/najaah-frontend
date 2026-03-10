"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Filters",
    description: "Status, modality, and center filters to be wired later.",
  },
  {
    title: "Course Grid",
    description:
      "Placeholder rows for code, title, owner, and enrollment stats.",
  },
  {
    title: "Quick Actions",
    description: "Archive, duplicate, publish, or assign reviewers.",
  },
];

export default function CoursesListPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.coursesList.title")}
      description={t("pages.placeholderRoutes.coursesList.description")}
      items={items}
    />
  );
}
