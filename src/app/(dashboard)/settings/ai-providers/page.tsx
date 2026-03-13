"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { AISystemProvidersPanel } from "@/features/ai/components";
import { useTranslation } from "@/features/localization";

export default function SettingsAIProvidersPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pages.aiSystemProviders.title")}
        description={t("pages.aiSystemProviders.description")}
        actions={
          <Link href="/settings">
            <Button variant="outline">
              {t("pages.aiSystemProviders.backToSettings")}
            </Button>
          </Link>
        }
      />

      <AISystemProvidersPanel />
    </div>
  );
}
