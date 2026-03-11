"use client";

import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { useTranslation } from "@/features/localization";

export default function DashboardNotFoundPage() {
  const { t } = useTranslation();

  return (
    <AppNotFoundState
      scopeLabel={t("pages.dashboardNotFound.scopeLabel")}
      title={t("pages.dashboardNotFound.title")}
      description={t("pages.dashboardNotFound.description")}
      primaryAction={{
        href: "/dashboard",
        label: t("pages.dashboardNotFound.goToDashboard"),
      }}
      secondaryAction={{
        href: "/centers",
        label: t("pages.dashboardNotFound.goToCenters"),
        variant: "outline",
      }}
    />
  );
}
