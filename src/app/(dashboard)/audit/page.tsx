"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "System",
    description: "Config changes, deployments, and admin actions.",
  },
  {
    title: "Playback",
    description: "Playback-specific logs and violations.",
  },
  {
    title: "Devices",
    description: "Device approvals, bindings, and revocations.",
  },
];

export default function AuditPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.auditLogs.title")}
      description={t("pages.placeholderRoutes.auditLogs.description")}
      items={items}
    />
  );
}
