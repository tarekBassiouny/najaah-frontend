"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

export default function SettingsCourseSettingsPage() {
  const { t } = useTranslation();

  const items = [
    {
      title: t("pages.settingsPlaceholders.course.items.templates.title"),
      description: t(
        "pages.settingsPlaceholders.course.items.templates.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.course.items.publishing.title"),
      description: t(
        "pages.settingsPlaceholders.course.items.publishing.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.course.items.access.title"),
      description: t(
        "pages.settingsPlaceholders.course.items.access.description",
      ),
    },
  ];

  return (
    <PlaceholderPage
      title={t("pages.settingsPlaceholders.course.title")}
      description={t("pages.settingsPlaceholders.course.description")}
      items={items}
    />
  );
}
