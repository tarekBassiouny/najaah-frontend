"use client";

import { useState } from "react";
import { useTenant } from "@/app/tenant-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useModal } from "@/components/ui/modal-store";
import { DeleteSystemSettingDialog } from "@/features/system-settings/components/DeleteSystemSettingDialog";
import { SystemSettingFormDialog } from "@/features/system-settings/components/SystemSettingFormDialog";
import { SystemSettingsPreviewDialog } from "@/features/system-settings/components/SystemSettingsPreviewDialog";
import { SystemSettingsTable } from "@/features/system-settings/components/SystemSettingsTable";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";

export default function SettingsPage() {
  const { centerSlug } = useTenant();
  const { showToast } = useModal();
  const isPlatformAdmin = !centerSlug;
  const [formOpen, setFormOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [deletingSetting, setDeletingSetting] = useState<SystemSetting | null>(null);

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
              For center-specific configuration, use the Center Settings section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage global system settings for all centers."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <Button
              type="button"
              onClick={() => {
                setEditingSetting(null);
                setFormOpen(true);
              }}
            >
              Add Setting
            </Button>
          </>
        }
      />

      <SystemSettingsTable
        onEdit={(setting) => {
          setEditingSetting(setting);
          setFormOpen(true);
        }}
        onDelete={(setting) => setDeletingSetting(setting)}
      />

      <SystemSettingFormDialog
        open={formOpen}
        setting={editingSetting}
        onOpenChange={(nextOpen) => {
          setFormOpen(nextOpen);
          if (!nextOpen) {
            setEditingSetting(null);
          }
        }}
        onSuccess={(message) => showToast(message, "success")}
      />

      <DeleteSystemSettingDialog
        open={Boolean(deletingSetting)}
        setting={deletingSetting}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeletingSetting(null);
          }
        }}
        onSuccess={(message) => showToast(message, "success")}
      />

      <SystemSettingsPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
