"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Filters",
    description: "Center, enrollment, device status, and risk filters.",
  },
  {
    title: "Data Table",
    description: "Placeholder columns for name, email, center, and status.",
  },
  {
    title: "Actions",
    description: "Suspend, reset, or export actions to wire later.",
  },
];

export default function StudentsListPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.studentList.title")}
      description={t("pages.placeholderRoutes.studentList.description")}
      items={items}
    />
  );
}
