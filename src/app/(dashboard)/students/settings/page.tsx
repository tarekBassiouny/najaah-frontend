"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { useTranslation } from "@/features/localization";

const items = [
  {
    title: "Notifications",
    description: "Email, SMS, and push toggles.",
  },
  {
    title: "Access",
    description: "Login restrictions and MFA placeholders.",
  },
  {
    title: "Privacy",
    description: "Data export and retention policies.",
  },
];

export default function StudentsSettingsPage() {
  const { t } = useTranslation();

  return (
    <PlaceholderPage
      title={t("pages.placeholderRoutes.studentSettings.title")}
      description={t("pages.placeholderRoutes.studentSettings.description")}
      items={items}
    />
  );
}
