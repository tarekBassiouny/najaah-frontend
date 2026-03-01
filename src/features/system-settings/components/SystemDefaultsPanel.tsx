"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateSystemSetting,
  useSystemSettingsByKeys,
  useUpdateSystemSetting,
} from "@/features/system-settings/hooks/use-system-settings";
import type {
  CreateSystemSettingPayload,
  UpdateSystemSettingPayload,
} from "@/features/system-settings/services/system-settings.service";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

type DefaultsFormValues = {
  timezone: string;
  support_email: string;
  require_device_approval: boolean;
  attendance_required: boolean;
};

type DefaultKey = keyof DefaultsFormValues;

const DEFAULT_KEYS: DefaultKey[] = [
  "timezone",
  "support_email",
  "require_device_approval",
  "attendance_required",
];

const EMPTY_VALUES: DefaultsFormValues = {
  timezone: "",
  support_email: "",
  require_device_approval: false,
  attendance_required: false,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function normalizeByKey(
  key: DefaultKey,
  formValues: DefaultsFormValues,
): Record<string, unknown> {
  switch (key) {
    case "timezone":
      return { timezone: formValues.timezone.trim() };
    case "support_email":
      return { email: formValues.support_email.trim() };
    case "require_device_approval":
      return { enabled: formValues.require_device_approval };
    case "attendance_required":
      return { enabled: formValues.attendance_required };
  }
}

function toFormValues(
  systemSettingsByKey: Record<string, unknown> | undefined,
): DefaultsFormValues {
  const timezoneValue = asRecord(
    asRecord(systemSettingsByKey?.timezone)?.value,
  )?.timezone;
  const supportEmailValue = asRecord(
    asRecord(systemSettingsByKey?.support_email)?.value,
  )?.email;
  const requireApprovalValue = asRecord(
    asRecord(systemSettingsByKey?.require_device_approval)?.value,
  )?.enabled;
  const attendanceRequiredValue = asRecord(
    asRecord(systemSettingsByKey?.attendance_required)?.value,
  )?.enabled;

  return {
    timezone: readString(timezoneValue),
    support_email: readString(supportEmailValue),
    require_device_approval: readBoolean(requireApprovalValue),
    attendance_required: readBoolean(attendanceRequiredValue),
  };
}

function normalizeForComparison(
  values: DefaultsFormValues,
): DefaultsFormValues {
  return {
    ...values,
    timezone: values.timezone.trim(),
    support_email: values.support_email.trim(),
  };
}

const FIELD_META: Array<{
  key: DefaultKey;
  label: string;
  description: string;
}> = [
  {
    key: "timezone",
    label: "Timezone",
    description: "Fallback timezone used by centers without a custom override.",
  },
  {
    key: "support_email",
    label: "Support Email",
    description:
      "Global support contact shown anywhere a center inherits email.",
  },
  {
    key: "require_device_approval",
    label: "Require Device Approval",
    description:
      "Default approval workflow for new centers and inherited policy.",
  },
  {
    key: "attendance_required",
    label: "Attendance Required",
    description:
      "Default attendance requirement across centers without overrides.",
  },
];

export function SystemDefaultsPanel() {
  const { data, isLoading, refetch } = useSystemSettingsByKeys(DEFAULT_KEYS);
  const { mutateAsync: createSystemSetting, isPending: isCreating } =
    useCreateSystemSetting();
  const { mutateAsync: updateSystemSetting, isPending: isUpdating } =
    useUpdateSystemSetting();

  const [formValues, setFormValues] =
    useState<DefaultsFormValues>(EMPTY_VALUES);
  const [initialValues, setInitialValues] =
    useState<DefaultsFormValues>(EMPTY_VALUES);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!data) return;

    const nextValues = toFormValues(data);
    setFormValues(nextValues);
    setInitialValues(nextValues);
  }, [data]);

  const isSaving = isCreating || isUpdating;
  const normalizedCurrent = useMemo(
    () => normalizeForComparison(formValues),
    [formValues],
  );
  const normalizedInitial = useMemo(
    () => normalizeForComparison(initialValues),
    [initialValues],
  );

  const handleSave = async () => {
    setFormError(null);
    setSaveSuccess(false);

    const changedKeys = DEFAULT_KEYS.filter(
      (key) => normalizedCurrent[key] !== normalizedInitial[key],
    );

    if (changedKeys.length === 0) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      return;
    }

    try {
      for (const key of changedKeys) {
        const payloadValue = normalizeByKey(key, formValues);
        const existing = data?.[key];

        if (existing && typeof existing === "object" && "id" in existing) {
          const response = await updateSystemSetting({
            id: (existing as { id: string | number }).id,
            payload: {
              value: payloadValue,
              is_public: true,
            } satisfies UpdateSystemSettingPayload,
          });

          if (!isAdminRequestSuccessful(response)) {
            setFormError(
              getAdminResponseMessage(
                response,
                "Unable to save global defaults. Please try again.",
              ),
            );
            return;
          }

          continue;
        }

        const response = await createSystemSetting({
          key,
          value: payloadValue,
          is_public: true,
        } satisfies CreateSystemSettingPayload);

        if (!isAdminRequestSuccessful(response)) {
          setFormError(
            getAdminResponseMessage(
              response,
              "Unable to save global defaults. Please try again.",
            ),
          );
          return;
        }
      }

      await refetch();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      setFormError(
        getAdminApiErrorMessage(
          error,
          "Unable to save global defaults. Please try again.",
        ),
      );
    }
  };

  return (
    <Card className="overflow-hidden border-gray-200/80 shadow-sm dark:border-gray-800">
      <CardHeader className="border-b border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#fff7ed_100%)] dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(17,24,39,0.96)_48%,rgba(41,37,36,0.92)_100%)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300">
              Global Defaults
            </div>
            <CardTitle>Canonical System Settings</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Edit the platform-wide defaults here. Centers inherit these values
              unless they have a center-scoped override.
            </p>
          </div>
          <Badge variant="outline">Registry-backed</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save defaults</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {saveSuccess ? (
          <Alert>
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>
              Global defaults updated successfully.
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-10 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {FIELD_META.map((field) => (
              <div
                key={field.key}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">{field.label}</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {field.description}
                  </p>
                </div>

                {field.key === "timezone" ? (
                  <Input
                    className="mt-4 h-11 rounded-xl"
                    value={formValues.timezone}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        timezone: event.target.value,
                      }))
                    }
                    placeholder="UTC"
                    disabled={isSaving}
                  />
                ) : null}

                {field.key === "support_email" ? (
                  <Input
                    className="mt-4 h-11 rounded-xl"
                    type="email"
                    value={formValues.support_email}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        support_email: event.target.value,
                      }))
                    }
                    placeholder="support@example.com"
                    disabled={isSaving}
                  />
                ) : null}

                {field.key === "require_device_approval" ? (
                  <label className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Device approval required by default
                    </span>
                    <input
                      type="checkbox"
                      checked={formValues.require_device_approval}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          require_device_approval: event.target.checked,
                        }))
                      }
                      disabled={isSaving}
                    />
                  </label>
                ) : null}

                {field.key === "attendance_required" ? (
                  <label className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950/60">
                    <span className="text-sm text-gray-700 dark:text-gray-200">
                      Attendance required by default
                    </span>
                    <input
                      type="checkbox"
                      checked={formValues.attendance_required}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          attendance_required: event.target.checked,
                        }))
                      }
                      disabled={isSaving}
                    />
                  </label>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving..." : "Save Global Defaults"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
