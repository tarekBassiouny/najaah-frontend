"use client";

import { useCallback, useRef } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsFeatureGroupGrid } from "@/features/settings/components";
import { SystemSettingsCatalogEditor } from "@/features/settings/components";
import { useTranslation } from "@/features/localization";

export default function SettingsCenterSettingsPage() {
  const { t } = useTranslation();
  const catalogRef = useRef<HTMLDivElement>(null);

  const handleGroupSelect = useCallback((group: string) => {
    if (!catalogRef.current) return;

    const heading = catalogRef.current.querySelector(
      `[data-settings-group="${group}"]`,
    );
    if (heading) {
      heading.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("pages.settingsFeatureGroups.pageTitle")}
        description={t("pages.settingsFeatureGroups.pageDescription")}
      />

      <SettingsFeatureGroupGrid onGroupSelect={handleGroupSelect} />

      <div ref={catalogRef}>
        <SystemSettingsCatalogEditor />
      </div>
    </div>
  );
}
