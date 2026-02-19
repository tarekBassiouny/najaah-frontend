"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCenterSettings,
  useUpdateCenterSettings,
} from "@/features/centers/hooks/use-center-settings";
import type { CenterSetting } from "@/features/centers/types/center";

type CenterPolicyFormProps = {
  centerId: string | number;
};

const getSettingValue = (
  settings: CenterSetting[] | undefined,
  key: string,
) => {
  if (!settings) return undefined;
  const entry = settings.find((item) => item.key === key);
  return entry?.value ?? entry?.settings ?? undefined;
};

export function CenterPolicyForm({ centerId }: CenterPolicyFormProps) {
  const { data, isLoading, isError, refetch } = useCenterSettings(centerId);
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateCenterSettings();

  const [deviceLimit, setDeviceLimit] = useState("");
  const [requireDeviceApproval, setRequireDeviceApproval] = useState(false);
  const [attendanceRequired, setAttendanceRequired] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const settingsArray = useMemo(() => data?.settings ?? [], [data?.settings]);

  useEffect(() => {
    if (!settingsArray.length) return;

    const deviceLimitValue = getSettingValue(settingsArray, "device_limit");
    const approvalValue = getSettingValue(
      settingsArray,
      "require_device_approval",
    );
    const attendanceValue = getSettingValue(
      settingsArray,
      "attendance_required",
    );
    const supportEmailValue = getSettingValue(settingsArray, "support_email");
    const timezoneValue = getSettingValue(settingsArray, "timezone");

    if (deviceLimitValue != null) setDeviceLimit(String(deviceLimitValue));
    if (approvalValue != null) setRequireDeviceApproval(Boolean(approvalValue));
    if (attendanceValue != null)
      setAttendanceRequired(Boolean(attendanceValue));
    if (supportEmailValue != null) setSupportEmail(String(supportEmailValue));
    if (timezoneValue != null) setTimezone(String(timezoneValue));
  }, [settingsArray]);

  const handleSave = () => {
    setFormError(null);
    setSaveSuccess(false);

    const parsedDeviceLimit = deviceLimit.trim()
      ? Number(deviceLimit)
      : undefined;

    if (deviceLimit.trim() && Number.isNaN(parsedDeviceLimit)) {
      setFormError("Device limit must be a number.");
      return;
    }

    updateSettings(
      {
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
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
        onError: () => {
          setFormError("Failed to save settings. Please try again.");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Policy Settings</CardTitle>
          <CardDescription>Loading center policies...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy Settings</CardTitle>
        <CardDescription>
          Configure device limits, approval workflows, and operational defaults.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {saveSuccess ? (
          <Alert>
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>
              Policy settings updated successfully.
            </AlertDescription>
          </Alert>
        ) : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Failed to load settings</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Could not fetch policy settings.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="device-limit">Device Limit</Label>
            <Input
              id="device-limit"
              value={deviceLimit}
              onChange={(event) => setDeviceLimit(event.target.value)}
              placeholder="e.g., 2"
              inputMode="numeric"
              className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="e.g., UTC"
              className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
            <input
              type="checkbox"
              checked={requireDeviceApproval}
              onChange={(event) =>
                setRequireDeviceApproval(event.target.checked)
              }
            />
            Require device approval
          </label>
          <label className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
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
            className="h-10 bg-white shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 dark:bg-gray-900"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
