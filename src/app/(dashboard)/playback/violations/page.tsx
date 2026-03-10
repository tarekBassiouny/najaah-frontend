"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Alerts",
    description: "Concurrent sessions, VPN, and device mismatch signals.",
  },
  {
    title: "Resolution",
    description: "Workflows for reviewing and clearing incidents.",
  },
  {
    title: "Trends",
    description: "Patterns by center, course, or device type.",
  },
];

export default function PlaybackViolationsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.playbackViolations.title")}
      description={t("pages.placeholderRoutes.playbackViolations.description")}
      items={items}
    />
  );
}
