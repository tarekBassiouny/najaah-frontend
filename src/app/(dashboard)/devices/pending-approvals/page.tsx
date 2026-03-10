"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Queue",
    description: "Device fingerprints, submitted by, and requested courses.",
  },
  {
    title: "Decisions",
    description: "Approve, reject, or request info actions.",
  },
  {
    title: "Audit",
    description: "Decision history and notes placeholders.",
  },
];

export default function DevicesPendingApprovalsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.devicesPendingApprovals.title")}
      description={t(
        "pages.placeholderRoutes.devicesPendingApprovals.description",
      )}
      items={items}
    />
  );
}
