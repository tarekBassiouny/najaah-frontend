"use client";

import { useState } from "react";
import Link from "next/link";
import { useTenant } from "@/app/tenant-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteSystemSettingDialog } from "@/features/system-settings/components/DeleteSystemSettingDialog";
import { SystemSettingFormDialog } from "@/features/system-settings/components/SystemSettingFormDialog";
import { SystemSettingsTable } from "@/features/system-settings/components/SystemSettingsTable";
import { SystemSettingsCatalogEditor } from "@/features/settings/components";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";
import { useTranslation } from "@/features/localization";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { centerSlug } = useTenant();
  const isPlatformAdmin = !centerSlug;
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(
    null,
  );
  const [deletingSetting, setDeletingSetting] = useState<SystemSetting | null>(
    null,
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSuccess = (message: string) => {
    setFeedbackMessage(message);
    setEditingSetting(null);
    setDeletingSetting(null);
    setIsCreateDialogOpen(false);
    window.setTimeout(() => setFeedbackMessage(null), 3000);
  };

  if (!isPlatformAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("pages.settingsPage.title")}
          description={t("pages.settingsPage.descriptionPlatformLevel")}
        />
        <Card>
          <CardHeader>
            <CardTitle>
              {t("pages.settingsPage.platformScopeRequiredTitle")}
            </CardTitle>
            <CardDescription>
              {t("pages.settingsPage.platformScopeRequiredDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("pages.settingsPage.platformScopeRequiredHint")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Backend metadata drives the editable settings sections below. The raw registry remains available for advanced CRUD."
        actions={
          <Link href="/settings/ai-providers">
            <Button variant="outline">
              {t("pages.aiSystemProviders.title")}
            </Button>
          </Link>
        }
      />

      <Card className="overflow-hidden border-gray-200 bg-[linear-gradient(135deg,#f8fafc_0%,#fff7ed_45%,#ffffff_100%)] shadow-sm dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(28,25,23,0.92)_45%,rgba(15,23,42,0.96)_100%)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-amber-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 shadow-sm dark:border-amber-900/70 dark:bg-gray-900/70 dark:text-amber-300">
              {t("pages.settingsPage.platformScopeBadge")}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                Metadata-driven system controls
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                The frontend now renders system setting groups from the backend
                catalog and defaults. Use the advanced registry only when you
                need raw row editing or visibility control.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-gray-200/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Dynamic groups
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Sections and setting keys come from `meta.catalog_groups`.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Default fallback
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Missing stored rows fall back to backend defaults without hiding
                the setting.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Advanced registry
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Raw CRUD is still available below for JSON payloads and
                visibility flags.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SystemSettingsCatalogEditor />

      {feedbackMessage ? (
        <Alert>
          <AlertTitle>{t("pages.settingsPage.registryUpdated")}</AlertTitle>
          <AlertDescription>{feedbackMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-gray-950 dark:text-white">
            Advanced Registry
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Use the raw registry when you need JSON-level control over stored
            rows.
          </p>
        </div>

        <SystemSettingsTable
          onCreateSetting={() => setIsCreateDialogOpen(true)}
          onEditSetting={(setting) => setEditingSetting(setting)}
          onDeleteSetting={(setting) => setDeletingSetting(setting)}
        />
      </div>

      <SystemSettingFormDialog
        open={isCreateDialogOpen || Boolean(editingSetting)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIsCreateDialogOpen(false);
            setEditingSetting(null);
          }
        }}
        setting={editingSetting}
        onSuccess={handleSuccess}
      />

      <DeleteSystemSettingDialog
        open={Boolean(deletingSetting)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeletingSetting(null);
          }
        }}
        setting={deletingSetting}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
