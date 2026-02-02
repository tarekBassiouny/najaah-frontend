"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/app/tenant-provider";
import { useCenterSettings, useUpdateCenterSettings } from "@/features/centers/hooks/use-center-settings";
import { useUploadCenterLogo } from "@/features/centers/hooks/use-centers";
import type { CenterSetting } from "@/features/centers/types/center";

const getSettingValue = (settings: CenterSetting[] | undefined, key: string) => {
  if (!settings) return undefined;
  const entry = settings.find((item) => item.key === key);
  return entry?.value ?? entry?.settings ?? undefined;
};

export default function CentersSettingsPage() {
  const tenant = useTenant();
  const centerId = tenant.centerId;
  const { data, isLoading, isError } = useCenterSettings(centerId ?? undefined);
  const { mutate: updateSettings, isPending: isSaving } = useUpdateCenterSettings();
  const { mutate: uploadLogo, isPending: isUploading } = useUploadCenterLogo();

  const [deviceLimit, setDeviceLimit] = useState("");
  const [requireDeviceApproval, setRequireDeviceApproval] = useState(false);
  const [attendanceRequired, setAttendanceRequired] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const settingsArray = useMemo(() => data?.settings ?? [], [data?.settings]);

  useEffect(() => {
    if (!settingsArray.length) return;

    const deviceLimitValue = getSettingValue(settingsArray, "device_limit");
    const approvalValue = getSettingValue(settingsArray, "require_device_approval");
    const attendanceValue = getSettingValue(settingsArray, "attendance_required");
    const supportEmailValue = getSettingValue(settingsArray, "support_email");
    const timezoneValue = getSettingValue(settingsArray, "timezone");

    if (deviceLimitValue != null) setDeviceLimit(String(deviceLimitValue));
    if (approvalValue != null) setRequireDeviceApproval(Boolean(approvalValue));
    if (attendanceValue != null) setAttendanceRequired(Boolean(attendanceValue));
    if (supportEmailValue != null) setSupportEmail(String(supportEmailValue));
    if (timezoneValue != null) setTimezone(String(timezoneValue));
  }, [settingsArray]);

  if (!centerId) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Center context is required to manage settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = () => {
    setFormError(null);
    const parsedDeviceLimit = deviceLimit.trim()
      ? Number(deviceLimit)
      : undefined;

    if (deviceLimit.trim() && Number.isNaN(parsedDeviceLimit)) {
      setFormError("Device limit must be a number.");
      return;
    }

    updateSettings({
      centerId,
      payload: {
        settings: {
          device_limit: parsedDeviceLimit,
          require_device_approval: requireDeviceApproval,
          attendance_required: attendanceRequired,
          support_email: supportEmail.trim() || undefined,
          timezone: timezone.trim() || undefined,
        },
      },
    });
  };

  const handleUpload = () => {
    if (!logoFile) return;
    uploadLogo({ id: centerId, payload: { file: logoFile, filename: logoFile.name } });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Center Settings"
        description="Per-center defaults and operational preferences"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Settings</CardTitle>
              <CardDescription>Update core center policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="device-limit">Device Limit</Label>
                  <Input
                    id="device-limit"
                    value={deviceLimit}
                    onChange={(event) => setDeviceLimit(event.target.value)}
                    placeholder="e.g., 2"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    placeholder="e.g., UTC"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={requireDeviceApproval}
                    onChange={(event) => setRequireDeviceApproval(event.target.checked)}
                  />
                  Require device approval
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={attendanceRequired}
                    onChange={(event) => setAttendanceRequired(event.target.checked)}
                  />
                  Attendance required
                </label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(event) => setSupportEmail(event.target.value)}
                  placeholder="support@example.com"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              )}

              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>

              {isError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Failed to load settings.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding Logo</CardTitle>
              <CardDescription>Upload a new center logo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="center-logo">Logo File</Label>
                <Input
                  id="center-logo"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setLogoFile(file);
                  }}
                />
              </div>
              <Button onClick={handleUpload} disabled={!logoFile || isUploading}>
                {isUploading ? "Uploading..." : "Upload Logo"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
