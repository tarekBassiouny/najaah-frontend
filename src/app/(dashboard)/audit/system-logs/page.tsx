"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Events",
    description: "Admin actions, config updates, and releases.",
  },
  {
    title: "Retention",
    description: "Export, purge, and retention controls.",
  },
  {
    title: "Notifications",
    description: "Who is alerted for critical changes.",
  },
];

export default function AuditSystemLogsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.auditSystemLogs.title")}
      description={t("pages.placeholderRoutes.auditSystemLogs.description")}
      items={items}
    />
  );
}
