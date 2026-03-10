"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Session Table",
    description: "Course, student, device, and duration columns.",
  },
  {
    title: "Geo & Network",
    description: "IP, region, and network quality placeholders.",
  },
  {
    title: "Interventions",
    description: "Pause, revoke, or flag actions.",
  },
];

export default function PlaybackPlaybackSessionsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.playbackSessions.title")}
      description={t("pages.placeholderRoutes.playbackSessions.description")}
      items={items}
    />
  );
}
