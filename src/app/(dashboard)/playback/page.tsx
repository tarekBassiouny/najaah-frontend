"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Sessions",
    description: "Active and historical playback counts.",
  },
  {
    title: "Policies",
    description: "View limits, geo rules, and DRM controls.",
  },
  {
    title: "Alerts",
    description: "Recent violations and throttling actions.",
  },
];

export default function PlaybackPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.playback.title")}
      description={t("pages.placeholderRoutes.playback.description")}
      items={items}
    />
  );
}
