"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Limits",
    description: "Placeholder for per-course and per-student rules.",
  },
  {
    title: "Usage",
    description: "Consumption vs. allowance overview.",
  },
  {
    title: "Overrides",
    description: "Temporary boosts and exemptions.",
  },
];

export default function PlaybackViewLimitsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.playbackViewLimits.title")}
      description={t("pages.placeholderRoutes.playbackViewLimits.description")}
      items={items}
    />
  );
}
