"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

export default function SettingsVideoSettingsPage() {
  const { t } = useTranslation();

  const items = [
    {
      title: t("pages.settingsPlaceholders.video.items.encoding.title"),
      description: t(
        "pages.settingsPlaceholders.video.items.encoding.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.video.items.captions.title"),
      description: t(
        "pages.settingsPlaceholders.video.items.captions.description",
      ),
    },
    {
      title: t("pages.settingsPlaceholders.video.items.drm.title"),
      description: t("pages.settingsPlaceholders.video.items.drm.description"),
    },
  ];

  return (
    <PlaceholderPage
      title={t("pages.settingsPlaceholders.video.title")}
      description={t("pages.settingsPlaceholders.video.description")}
      items={items}
    />
  );
}
