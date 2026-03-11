"use client";

import { AppNotFoundState } from "@/components/ui/app-not-found-state";
import { useTranslation } from "@/features/localization";

export default function GlobalNotFoundPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppNotFoundState
        title={t("pages.globalNotFound.title")}
        description={t("pages.globalNotFound.description")}
        primaryAction={{
          href: "/dashboard",
          label: t("pages.globalNotFound.goToDashboard"),
        }}
        secondaryAction={{
          href: "/login",
          label: t("pages.globalNotFound.goToLogin"),
          variant: "outline",
        }}
      />
    </main>
  );
}
