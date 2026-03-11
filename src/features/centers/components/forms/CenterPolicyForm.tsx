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
import { useTranslation } from "@/features/localization";

type CenterPolicyFormProps = {
  centerId: string | number;
};

type EditablePolicyValues = {
  default_view_limit: string;
  allow_extra_view_requests: boolean;
  requires_video_approval: boolean;
  video_code_expiry_days: string;
  whatsapp_max_retries: string;
  pdf_download_permission: boolean;
  device_limit: string;
};

type EditablePolicyKey = keyof EditablePolicyValues;

const CENTER_POLICY_KEYS: EditablePolicyKey[] = [
  "default_view_limit",
  "allow_extra_view_requests",
  "requires_video_approval",
  "video_code_expiry_days",
  "whatsapp_max_retries",
  "pdf_download_permission",
  "device_limit",
];

const WHATSAPP_MAX_RETRIES_FALLBACK = 2;

const EMPTY_EDITABLE_VALUES: EditablePolicyValues = {
  default_view_limit: "",
  allow_extra_view_requests: false,
  requires_video_approval: false,
  video_code_expiry_days: "",
  whatsapp_max_retries: String(WHATSAPP_MAX_RETRIES_FALLBACK),
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
  persistedSettings: CenterSettingsMap,
): EditablePolicyValues {
  const persistedSettingsRecord = asRecord(persistedSettings);
  const whatsappBulkSettings = asRecord(
    persistedSettingsRecord?.whatsapp_bulk_settings,
  );

  const persistedWhatsappMaxRetries = whatsappBulkSettings?.max_retries;
  const whatsappMaxRetries =
    typeof persistedWhatsappMaxRetries === "number" &&
    Number.isFinite(persistedWhatsappMaxRetries)
      ? persistedWhatsappMaxRetries
      : typeof persistedWhatsappMaxRetries === "string" &&
          persistedWhatsappMaxRetries.trim().length > 0 &&
          Number.isFinite(Number(persistedWhatsappMaxRetries))
        ? Number(persistedWhatsappMaxRetries)
        : WHATSAPP_MAX_RETRIES_FALLBACK;

  return {
    default_view_limit: readIntegerInput(resolvedSettings.default_view_limit),
    allow_extra_view_requests: readBoolean(
      resolvedSettings.allow_extra_view_requests,
    ),
    requires_video_approval: readBoolean(
      resolvedSettings.requires_video_approval,
    ),
    video_code_expiry_days: readIntegerInput(
      resolvedSettings.video_code_expiry_days,
    ),
    whatsapp_max_retries: readIntegerInput(whatsappMaxRetries),
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
    video_code_expiry_days: values.video_code_expiry_days.trim(),
    whatsapp_max_retries: values.whatsapp_max_retries.trim(),
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
  if (key === "whatsapp_max_retries") {
    const persistedSettingsRecord = asRecord(persistedSettings);
    const whatsappBulkSettings = asRecord(
      persistedSettingsRecord?.whatsapp_bulk_settings,
    );
    const rawMaxRetries = whatsappBulkSettings?.max_retries;
    const hasCustomMaxRetries =
      (typeof rawMaxRetries === "number" && Number.isFinite(rawMaxRetries)) ||
      (typeof rawMaxRetries === "string" && rawMaxRetries.trim().length > 0);

    return hasCustomMaxRetries
      ? "Custom for this center"
      : "Using inherited default";
  }

  return hasOwnKey(asRecord(persistedSettings), key)
    ? "Custom for this center"
    : "Using inherited default";
}

export function CenterPolicyForm({ centerId }: CenterPolicyFormProps) {
  const { t } = useTranslation();

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

  useEffect(() => {
    if (!data) return;

    const nextValues = mapResolvedSettingsToEditableValues(
      data.resolved_settings,
      data.settings,
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

    const videoCodeExpiryDays = parseOptionalInteger(
      formValues.video_code_expiry_days,
      "Video code expiry days",
    );
    if (!videoCodeExpiryDays.ok) {
      setFormError(videoCodeExpiryDays.message);
      return;
    }
    if (
      typeof videoCodeExpiryDays.value === "number" &&
      videoCodeExpiryDays.value < 1
    ) {
      setFormError("Video code expiry days must be at least 1.");
      return;
    }

    const whatsappMaxRetries = parseOptionalInteger(
      formValues.whatsapp_max_retries,
      "WhatsApp max retries",
    );
    if (!whatsappMaxRetries.ok) {
      setFormError(whatsappMaxRetries.message);
      return;
    }
    const normalizedWhatsappMaxRetries =
      typeof whatsappMaxRetries.value === "number"
        ? whatsappMaxRetries.value
        : WHATSAPP_MAX_RETRIES_FALLBACK;
    if (normalizedWhatsappMaxRetries < 0) {
      setFormError("WhatsApp max retries must be 0 or greater.");
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
    const persistedSettingsRecord = asRecord(persistedSettings);
    const existingWhatsappBulkSettings = asRecord(
      persistedSettingsRecord?.whatsapp_bulk_settings,
    );

    for (const key of changedKeys) {
      switch (key) {
        case "default_view_limit":
          centerPayloadSettings.default_view_limit = defaultViewLimit.value;
          break;
        case "allow_extra_view_requests":
          centerPayloadSettings.allow_extra_view_requests =
            formValues.allow_extra_view_requests;
          break;
        case "requires_video_approval":
          centerPayloadSettings.requires_video_approval =
            formValues.requires_video_approval;
          break;
        case "video_code_expiry_days":
          centerPayloadSettings.video_code_expiry_days =
            videoCodeExpiryDays.value;
          break;
        case "whatsapp_max_retries":
          centerPayloadSettings.whatsapp_bulk_settings = {
            ...(existingWhatsappBulkSettings ?? {}),
            max_retries: normalizedWhatsappMaxRetries,
          };
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
          <CardTitle>
            {t("auto.features.centers.components.forms.centerpolicyform.s1")}
          </CardTitle>
          <CardDescription>
            {t("auto.features.centers.components.forms.centerpolicyform.s2")}
          </CardDescription>
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
        <CardTitle>
          {t("auto.features.centers.components.forms.centerpolicyform.s1")}
        </CardTitle>
        <CardDescription>
          {t("auto.features.centers.components.forms.centerpolicyform.s3")}
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
              {t("auto.features.centers.components.forms.centerpolicyform.s4")}
            </AlertDescription>
          </Alert>
        ) : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("auto.features.centers.components.forms.centerpolicyform.s5")}
            </AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                {t(
                  "auto.features.centers.components.forms.centerpolicyform.s6",
                )}
              </p>
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
              {t("auto.features.centers.components.forms.centerpolicyform.s7")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("auto.features.centers.components.forms.centerpolicyform.s8")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="default-view-limit">
                  {t(
                    "auto.features.centers.components.forms.centerpolicyform.s9",
                  )}
                </Label>
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
                placeholder={t(
                  "auto.features.centers.components.forms.centerpolicyform.s10",
                )}
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="device-limit">
                  {t(
                    "auto.features.centers.components.forms.centerpolicyform.s11",
                  )}
                </Label>
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
                placeholder={t(
                  "auto.features.centers.components.forms.centerpolicyform.s10",
                )}
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="video-code-expiry-days">
                  {t(
                    "auto.features.centers.components.forms.centerpolicyform.s12",
                  )}
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getCenterSettingSourceLabel(
                    "video_code_expiry_days",
                    persistedSettings,
                  )}
                </p>
              </div>
              <Input
                id="video-code-expiry-days"
                value={formValues.video_code_expiry_days}
                onChange={(event) =>
                  handleInputChange(
                    "video_code_expiry_days",
                    event.target.value,
                  )
                }
                placeholder={t(
                  "auto.features.centers.components.forms.centerpolicyform.s13",
                )}
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor="whatsapp-max-retries">
                  {t(
                    "auto.features.centers.components.forms.centerpolicyform.s14",
                  )}
                </Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getCenterSettingSourceLabel(
                    "whatsapp_max_retries",
                    persistedSettings,
                  )}
                </p>
              </div>
              <Input
                id="whatsapp-max-retries"
                value={formValues.whatsapp_max_retries}
                onChange={(event) =>
                  handleInputChange("whatsapp_max_retries", event.target.value)
                }
                placeholder={t(
                  "auto.features.centers.components.forms.centerpolicyform.s10",
                )}
                inputMode="numeric"
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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
                {t(
                  "auto.features.centers.components.forms.centerpolicyform.s15",
                )}
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
                  checked={formValues.requires_video_approval}
                  onChange={(event) =>
                    handleInputChange(
                      "requires_video_approval",
                      event.target.checked,
                    )
                  }
                />
                {t(
                  "auto.features.centers.components.forms.centerpolicyform.s16",
                )}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {getCenterSettingSourceLabel(
                  "requires_video_approval",
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
                {t(
                  "auto.features.centers.components.forms.centerpolicyform.s17",
                )}
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
