"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Roster",
    description: "Course, progress, completion, and grade placeholders.",
  },
  {
    title: "Attendance",
    description: "Check-ins and participation signals.",
  },
  {
    title: "Interventions",
    description: "Flags for follow-up and support cases.",
  },
];

export default function StudentsEnrollmentsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.studentEnrollments.title")}
      description={t("pages.placeholderRoutes.studentEnrollments.description")}
      items={items}
    />
  );
}
