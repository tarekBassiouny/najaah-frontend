"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

export default function SettingsStudentSettingsPage() {
  const { t } = useTranslation();

  const items = [
    {
      title: t("pages.settingsPlaceholders.student.items.authentication.title"),
      description: t(
        "pages.settingsPlaceholders.student.items.authentication.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.student.items.privacy.title"),
      description: t(
        "pages.settingsPlaceholders.student.items.privacy.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.student.items.engagement.title"),
      description: t(
        "pages.settingsPlaceholders.student.items.engagement.description",
      ),
    },
  ];

  return (
    <PlaceholderPage
      title={t("pages.settingsPlaceholders.student.title")}
      description={t("pages.settingsPlaceholders.student.description")}
      items={items}
    />
  );
}
