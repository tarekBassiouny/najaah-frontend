"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Roster",
    description: "Placeholder for section name, instructor, and capacity.",
  },
  {
    title: "Schedule",
    description: "Meeting patterns and time zones.",
  },
  {
    title: "Status",
    description: "Enrollment windows and section health.",
  },
];

export default function CoursesSectionsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.courseSections.title")}
      description={t("pages.placeholderRoutes.courseSections.description")}
      items={items}
    />
  );
}
