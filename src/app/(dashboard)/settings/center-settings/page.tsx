"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

export default function SettingsCenterSettingsPage() {
  const { t } = useTranslation();

  const items = [
    {
      title: t("pages.settingsPlaceholders.center.items.defaults.title"),
      description: t(
        "pages.settingsPlaceholders.center.items.defaults.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.center.items.escalations.title"),
      description: t(
        "pages.settingsPlaceholders.center.items.escalations.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.center.items.automation.title"),
      description: t(
        "pages.settingsPlaceholders.center.items.automation.description",
      ),
    },
  ];

  return (
    <PlaceholderPage
      title={t("pages.settingsPlaceholders.center.title")}
      description={t("pages.settingsPlaceholders.center.description")}
      items={items}
    />
  );
}
