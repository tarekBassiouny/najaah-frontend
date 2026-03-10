"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Events",
    description: "Session starts, stops, and violations.",
  },
  {
    title: "Correlations",
    description: "Link to device, student, and course context.",
  },
  {
    title: "Exports",
    description: "Batch exports for investigations.",
  },
];

export default function AuditPlaybackLogsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.auditPlaybackLogs.title")}
      description={t("pages.placeholderRoutes.auditPlaybackLogs.description")}
      items={items}
    />
  );
}
