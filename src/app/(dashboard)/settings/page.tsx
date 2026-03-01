"use client";

import { useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteSystemSettingDialog } from "@/features/system-settings/components/DeleteSystemSettingDialog";
import { SystemDefaultsPanel } from "@/features/system-settings/components/SystemDefaultsPanel";
import { SystemSettingFormDialog } from "@/features/system-settings/components/SystemSettingFormDialog";
import { SystemSettingsTable } from "@/features/system-settings/components/SystemSettingsTable";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";

export default function SettingsPage() {
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
          title="Settings"
          description="Global LMS configuration is managed at platform level."
        />
        <Card>
          <CardHeader>
            <CardTitle>Platform Scope Required</CardTitle>
            <CardDescription>
              System settings are only editable in the platform-admin workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              For center-specific configuration, use the Center Settings
              section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Registry"
        description="Control the global defaults that power fallback behavior across every center."
      />

      <Card className="overflow-hidden border-gray-200 bg-[linear-gradient(135deg,#f8fafc_0%,#fff7ed_45%,#ffffff_100%)] shadow-sm dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(28,25,23,0.92)_45%,rgba(15,23,42,0.96)_100%)]">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-amber-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 shadow-sm dark:border-amber-900/70 dark:bg-gray-900/70 dark:text-amber-300">
              Platform Scope
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                One registry for defaults, fallbacks, and platform-wide policy.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                These values are consumed by center policy resolution. Changes
                to keys like <span className="font-mono">timezone</span> or{" "}
                <span className="font-mono">support_email</span> affect every
                center that inherits the global default.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-gray-200/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                System Keys
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Store normalized JSON objects for fallback-aware settings.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Safe Editing
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Update existing keys in place. Create only when no exact key
                exists.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200/80 bg-white/85 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Visibility
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Mark public values intentionally. Visibility is now surfaced in
                the registry itself.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <SystemDefaultsPanel />

      {feedbackMessage ? (
        <Alert>
          <AlertTitle>Registry updated</AlertTitle>
          <AlertDescription>{feedbackMessage}</AlertDescription>
        </Alert>
      ) : null}

      <SystemSettingsTable
        onCreateSetting={() => setIsCreateDialogOpen(true)}
        onEditSetting={(setting) => setEditingSetting(setting)}
        onDeleteSetting={(setting) => setDeletingSetting(setting)}
      />

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
