"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Device List",
    description: "Device type, last seen, and compliance status placeholders.",
  },
  {
    title: "Limits",
    description: "Per-student device caps and exemptions.",
  },
  {
    title: "Security",
    description: "Trusted vs. risky devices summary.",
  },
];

export default function StudentsDevicesPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.studentDevices.title")}
      description={t("pages.placeholderRoutes.studentDevices.description")}
      items={items}
    />
  );
}
