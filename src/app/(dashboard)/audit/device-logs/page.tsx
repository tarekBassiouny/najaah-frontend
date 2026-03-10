"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Approvals",
    description: "Submitted by, decision, and reviewer.",
  },
  {
    title: "Bindings",
    description: "Binding, unbinding, and expiry events.",
  },
  {
    title: "Violations",
    description: "Security and compliance incidents.",
  },
];

export default function AuditDeviceLogsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.auditDeviceLogs.title")}
      description={t("pages.placeholderRoutes.auditDeviceLogs.description")}
      items={items}
    />
  );
}
