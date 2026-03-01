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
import type {
  CenterResolvedSettings,
  CenterSettingsMap,
} from "@/features/centers/types/center";
import { getAdminApiErrorMessage } from "@/lib/admin-response";

type CenterPolicyFormProps = {
  centerId: string | number;
};

type EditablePolicyValues = {
  default_view_limit: string;
  allow_extra_view_requests: boolean;
  pdf_download_permission: boolean;
  device_limit: string;
};

type EditablePolicyKey = keyof EditablePolicyValues;

const CENTER_POLICY_KEYS: EditablePolicyKey[] = [
  "default_view_limit",
  "allow_extra_view_requests",
  "pdf_download_permission",
  "device_limit",
];

const EMPTY_EDITABLE_VALUES: EditablePolicyValues = {
  default_view_limit: "",
  allow_extra_view_requests: false,
  pdf_download_permission: false,
  device_limit: "",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function hasOwnKey(
  record: Record<string, unknown> | null,
  key: string,
): boolean {
  return Boolean(record && Object.prototype.hasOwnProperty.call(record, key));
}

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readIntegerInput(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

function mapResolvedSettingsToEditableValues(
  resolvedSettings: CenterResolvedSettings,
): EditablePolicyValues {
  return {
    default_view_limit: readIntegerInput(resolvedSettings.default_view_limit),
    allow_extra_view_requests: readBoolean(
      resolvedSettings.allow_extra_view_requests,
    ),
    pdf_download_permission: readBoolean(
      resolvedSettings.pdf_download_permission,
    ),
    device_limit: readIntegerInput(resolvedSettings.device_limit),
  };
}

function normalizeEditableValuesForComparison(
  values: EditablePolicyValues,
): EditablePolicyValues {
  return {
    ...values,
    default_view_limit: values.default_view_limit.trim(),
    device_limit: values.device_limit.trim(),
  };
}

function parseOptionalInteger(
  value: string,
  label: string,
): { ok: true; value: number | undefined } | { ok: false; message: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: true, value: undefined };
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return { ok: false, message: `${label} must be a whole number.` };
  }

  return { ok: true, value: parsed };
}

function getCenterSettingSourceLabel(
  key: EditablePolicyKey,
  persistedSettings: CenterSettingsMap,
): string {
  return hasOwnKey(asRecord(persistedSettings), key)
    ? "Custom for this center"
    : "Using inherited default";
}

export function CenterPolicyForm({ centerId }: CenterPolicyFormProps) {
  const {
    data,
    isLoading,
    isError,
    refetch: refetchCenterSettings,
  } = useCenterSettings(centerId);
  const { mutateAsync: updateCenterSettings, isPending: isSaving } =
    useUpdateCenterSettings();

  const [formValues, setFormValues] = useState<EditablePolicyValues>(
    EMPTY_EDITABLE_VALUES,
  );
  const [initialValues, setInitialValues] = useState<EditablePolicyValues>(
    EMPTY_EDITABLE_VALUES,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const persistedSettings = useMemo(
    () => data?.settings ?? {},
    [data?.settings],
  );
  const catalog = useMemo(() => data?.catalog ?? {}, [data?.catalog]);

  useEffect(() => {
    if (!data) return;

    const nextValues = mapResolvedSettingsToEditableValues(
      data.resolved_settings,
    );
    setFormValues(nextValues);
    setInitialValues(nextValues);
  }, [data]);

  const handleInputChange = <K extends EditablePolicyKey>(
    key: K,
    value: EditablePolicyValues[K],
  ) => {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setFormError(null);
    setSaveSuccess(false);

    const defaultViewLimit = parseOptionalInteger(
      formValues.default_view_limit,
      "Default view limit",
    );
    if (!defaultViewLimit.ok) {
      setFormError(defaultViewLimit.message);
      return;
    }

    const deviceLimit = parseOptionalInteger(
      formValues.device_limit,
      "Device limit",
    );
    if (!deviceLimit.ok) {
      setFormError(deviceLimit.message);
      return;
    }

    const normalizedCurrent = normalizeEditableValuesForComparison(formValues);
    const normalizedInitial =
      normalizeEditableValuesForComparison(initialValues);

    const changedKeys = CENTER_POLICY_KEYS.filter(
      (key) => normalizedCurrent[key] !== normalizedInitial[key],
    );

    if (changedKeys.length === 0) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return;
    }

    const centerPayloadSettings: Record<string, unknown> = {};

    for (const key of changedKeys) {
      if (catalog[key]?.scope !== "center") {
        continue;
      }

      switch (key) {
        case "default_view_limit":
          centerPayloadSettings.default_view_limit = defaultViewLimit.value;
          break;
        case "allow_extra_view_requests":
          centerPayloadSettings.allow_extra_view_requests =
            formValues.allow_extra_view_requests;
          break;
        case "pdf_download_permission":
          centerPayloadSettings.pdf_download_permission =
            formValues.pdf_download_permission;
          break;
        case "device_limit":
          centerPayloadSettings.device_limit = deviceLimit.value;
          break;
        default:
          break;
      }
    }

    if (Object.keys(centerPayloadSettings).length === 0) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return;
    }

    try {
      await updateCenterSettings({
        centerId,
        payload: {
          settings: centerPayloadSettings,
        },
      });

      await refetchCenterSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setFormError(
        getAdminApiErrorMessage(
          error,
          "Failed to save settings. Please try again.",
        ),
      );
    }
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
    <Card className="overflow-hidden border-gray-200/80 shadow-sm dark:border-gray-800">
      <CardHeader className="border-b border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#fff7ed_100%)] dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(17,24,39,0.96)_48%,rgba(41,37,36,0.92)_100%)]">
        <CardTitle>Policy Settings</CardTitle>
        <CardDescription>
          Edit center-specific policy controls here. Inherited values continue
          to follow the platform fallback chain automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
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
              Center policy settings updated successfully.
            </AlertDescription>
          </Alert>
        ) : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>Failed to load settings</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Could not fetch policy settings.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchCenterSettings()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-400">
              Center Overrides
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              These fields are center-scoped and can override the platform
              fallback.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="default-view-limit">Default View Limit</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getCenterSettingSourceLabel(
                    "default_view_limit",
                    persistedSettings,
                  )}
                </p>
              </div>
              <Input
                id="default-view-limit"
                value={formValues.default_view_limit}
                onChange={(event) =>
                  handleInputChange("default_view_limit", event.target.value)
                }
                placeholder="e.g., 2"
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="device-limit">Device Limit</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getCenterSettingSourceLabel(
                    "device_limit",
                    persistedSettings,
                  )}
                </p>
              </div>
              <Input
                id="device-limit"
                value={formValues.device_limit}
                onChange={(event) =>
                  handleInputChange("device_limit", event.target.value)
                }
                placeholder="e.g., 2"
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formValues.allow_extra_view_requests}
                  onChange={(event) =>
                    handleInputChange(
                      "allow_extra_view_requests",
                      event.target.checked,
                    )
                  }
                />
                Allow extra view requests
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {getCenterSettingSourceLabel(
                  "allow_extra_view_requests",
                  persistedSettings,
                )}
              </span>
            </label>

            <label className="space-y-2 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-700 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formValues.pdf_download_permission}
                  onChange={(event) =>
                    handleInputChange(
                      "pdf_download_permission",
                      event.target.checked,
                    )
                  }
                />
                Allow PDF downloads
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {getCenterSettingSourceLabel(
                  "pdf_download_permission",
                  persistedSettings,
                )}
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => void handleSave()}
            disabled={isSaving || isLoading}
          >
            {isSaving ? "Saving..." : "Save Center Policy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
