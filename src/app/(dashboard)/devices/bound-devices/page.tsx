"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Bindings",
    description: "Student, device ID, last seen, and expiry.",
  },
  {
    title: "Compliance",
    description: "OS version, jailbreak/root signals, and health.",
  },
  {
    title: "Overrides",
    description: "Temporary exemptions and expiry timers.",
  },
];

export default function DevicesBoundDevicesPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.devicesBound.title")}
      description={t("pages.placeholderRoutes.devicesBound.description")}
      items={items}
    />
  );
}
