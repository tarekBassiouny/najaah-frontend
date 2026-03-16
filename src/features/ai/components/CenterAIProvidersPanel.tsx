"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAICenterProviders,
  useUpdateAICenterProvider,
} from "@/features/ai/hooks/use-ai";
import type {
  AICenterProvider,
  AILimits,
  AIProviderKey,
} from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import { can } from "@/lib/capabilities";
import { getAdminApiErrorMessage } from "@/lib/admin-response";

type CenterAIProvidersPanelProps = {
  centerId: string | number;
};

type CenterProviderDraft = {
  is_enabled: boolean;
  allowed_models: string[];
  default_model: string | null;
  limits: AILimits;
};

const LIMIT_FIELDS: Array<{
  key: keyof AILimits;
  labelKey: string;
}> = [
  {
    key: "daily_job_limit",
    labelKey: "pages.centerAISettings.fields.dailyJobLimit",
  },
  {
    key: "monthly_job_limit",
    labelKey: "pages.centerAISettings.fields.monthlyJobLimit",
  },
  {
    key: "daily_token_limit",
    labelKey: "pages.centerAISettings.fields.dailyTokenLimit",
  },
  {
    key: "monthly_token_limit",
    labelKey: "pages.centerAISettings.fields.monthlyTokenLimit",
  },
  {
    key: "max_input_chars",
    labelKey: "pages.centerAISettings.fields.maxInputChars",
  },
  {
    key: "max_output_chars",
    labelKey: "pages.centerAISettings.fields.maxOutputChars",
  },
  {
    key: "max_concurrent_jobs",
    labelKey: "pages.centerAISettings.fields.maxConcurrentJobs",
  },
  {
    key: "default_output_token_estimate",
    labelKey: "pages.centerAISettings.fields.defaultOutputTokenEstimate",
  },
];

function toSafeLimitNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function normalizeModelList(models: string[]) {
  const deduped = new Map<string, string>();

  models.forEach((model) => {
    const trimmed = model.trim();
    if (!trimmed) return;

    const normalizedKey = trimmed.toLowerCase();
    if (!deduped.has(normalizedKey)) {
      deduped.set(normalizedKey, trimmed);
    }
  });

  return Array.from(deduped.values());
}

function normalizeLimits(
  limits: Partial<AILimits> | null | undefined,
): AILimits {
  return {
    daily_job_limit: toSafeLimitNumber(limits?.daily_job_limit),
    monthly_job_limit: toSafeLimitNumber(limits?.monthly_job_limit),
    daily_token_limit: toSafeLimitNumber(limits?.daily_token_limit),
    monthly_token_limit: toSafeLimitNumber(limits?.monthly_token_limit),
    max_input_chars: toSafeLimitNumber(limits?.max_input_chars),
    max_output_chars: toSafeLimitNumber(limits?.max_output_chars),
    max_concurrent_jobs: toSafeLimitNumber(limits?.max_concurrent_jobs),
    default_output_token_estimate: toSafeLimitNumber(
      limits?.default_output_token_estimate,
    ),
  };
}

function buildCenterDraft(provider: AICenterProvider): CenterProviderDraft {
  const allowedModelsSource =
    Array.isArray(provider.allowed_models) && provider.allowed_models.length > 0
      ? provider.allowed_models
      : provider.models;

  const allowedModels = normalizeModelList(allowedModelsSource ?? []);
  const defaultModel =
    provider.default_model && allowedModels.includes(provider.default_model)
      ? provider.default_model
      : (allowedModels[0] ?? null);

  return {
    is_enabled: Boolean(provider.center_enabled),
    allowed_models: allowedModels,
    default_model: defaultModel,
    limits: normalizeLimits(provider.limits),
  };
}

function areEqualStringArrays(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function areEqualLimits(left: AILimits, right: AILimits) {
  return LIMIT_FIELDS.every((field) => left[field.key] === right[field.key]);
}

function getStateBadgeVariant(
  state: "synced" | "dirty" | "saving" | "saved" | "error",
) {
  if (state === "dirty") return "warning" as const;
  if (state === "saving") return "info" as const;
  if (state === "saved") return "success" as const;
  if (state === "error") return "error" as const;
  return "outline" as const;
}

export function CenterAIProvidersPanel({
  centerId,
}: CenterAIProvidersPanelProps) {
  const { t } = useTranslation();
  const canManageSettings = can("manage_settings");

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useAICenterProviders(centerId, {
    staleTime: 60_000,
  });
  const { mutateAsync: updateProvider, isPending: isSaving } =
    useUpdateAICenterProvider();

  const providers = useMemo(() => response?.data ?? [], [response?.data]);

  const providersSignature = useMemo(
    () =>
      JSON.stringify(
        providers.map((provider) => ({
          key: String(provider.key),
          center_enabled: provider.center_enabled,
          system_enabled: provider.system_enabled,
          enabled: provider.enabled,
          configured: provider.configured,
          default_model: provider.default_model,
          models: provider.models,
          allowed_models: provider.allowed_models,
          limits: provider.limits,
        })),
      ),
    [providers],
  );

  const [drafts, setDrafts] = useState<Record<string, CenterProviderDraft>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [savingProviderKey, setSavingProviderKey] = useState<string | null>(
    null,
  );
  const [savedProviderKey, setSavedProviderKey] = useState<string | null>(null);

  useEffect(() => {
    if (!providers.length) {
      setDrafts({});
      setErrors({});
      return;
    }

    const nextDrafts: Record<string, CenterProviderDraft> = {};
    providers.forEach((provider) => {
      nextDrafts[String(provider.key)] = buildCenterDraft(provider);
    });

    setDrafts(nextDrafts);
    setErrors({});
    setSavingProviderKey(null);
    setSavedProviderKey(null);
  }, [providersSignature, providers]);

  const originalsByKey = useMemo(
    () =>
      providers.reduce<Record<string, CenterProviderDraft>>(
        (carry, provider) => {
          carry[String(provider.key)] = buildCenterDraft(provider);
          return carry;
        },
        {},
      ),
    [providers],
  );

  const isDirty = (providerKey: string) => {
    const current = drafts[providerKey];
    const original = originalsByKey[providerKey];

    if (!current || !original) return false;

    return (
      current.is_enabled !== original.is_enabled ||
      current.default_model !== original.default_model ||
      !areEqualStringArrays(current.allowed_models, original.allowed_models) ||
      !areEqualLimits(current.limits, original.limits)
    );
  };

  const updateDraft = (
    providerKey: string,
    updater: (_draft: CenterProviderDraft) => CenterProviderDraft,
  ) => {
    setDrafts((current) => {
      const providerDraft = current[providerKey];
      if (!providerDraft) return current;

      return {
        ...current,
        [providerKey]: updater(providerDraft),
      };
    });

    setErrors((current) => ({
      ...current,
      [providerKey]: null,
    }));
    setSavedProviderKey((current) =>
      current === providerKey ? null : current,
    );
  };

  const saveProvider = async (provider: AICenterProvider) => {
    const providerKey = String(provider.key);
    const draft = drafts[providerKey];
    if (!draft || isSaving) return;

    const readOnly = !provider.system_enabled || !provider.configured;
    if (readOnly || !canManageSettings) return;

    if (draft.allowed_models.length === 0) {
      setErrors((current) => ({
        ...current,
        [providerKey]: t("pages.centerAISettings.modelsRequired"),
      }));
      return;
    }

    if (
      draft.default_model &&
      !draft.allowed_models.includes(draft.default_model)
    ) {
      setErrors((current) => ({
        ...current,
        [providerKey]: t("pages.centerAISettings.defaultModelInvalid"),
      }));
      return;
    }

    if (
      LIMIT_FIELDS.some(
        (field) =>
          Number.isNaN(draft.limits[field.key]) || draft.limits[field.key] < 0,
      )
    ) {
      setErrors((current) => ({
        ...current,
        [providerKey]: t("pages.centerAISettings.limitValidationFailed"),
      }));
      return;
    }

    setSavingProviderKey(providerKey);
    setSavedProviderKey(null);
    setErrors((current) => ({
      ...current,
      [providerKey]: null,
    }));

    try {
      const result = await updateProvider({
        centerId,
        provider: provider.key as AIProviderKey,
        payload: {
          is_enabled: draft.is_enabled,
          allowed_models: draft.allowed_models,
          default_model: draft.default_model,
          limits: draft.limits,
        },
      });

      setDrafts((current) => ({
        ...current,
        [providerKey]: buildCenterDraft(result.data),
      }));
      setSavedProviderKey(providerKey);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [providerKey]: getAdminApiErrorMessage(
          error,
          t("pages.centerAISettings.saveFailed"),
        ),
      }));
    } finally {
      setSavingProviderKey(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.centerAISettings.title")}</CardTitle>
          <CardDescription>{t("common.actions.loading")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("pages.centerAISettings.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{t("pages.centerAISettings.loadFailed")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                {t("common.actions.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-gray-200/80 shadow-sm dark:border-gray-800">
      <CardHeader className="border-b border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#eef2ff_100%)] dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.96)_48%,rgba(17,24,39,0.96)_100%)]">
        <CardTitle>{t("pages.centerAISettings.title")}</CardTitle>
        <CardDescription>
          {t("pages.centerAISettings.description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {!canManageSettings ? (
          <Alert>
            <AlertTitle>{t("pages.centerAISettings.readOnlyTitle")}</AlertTitle>
            <AlertDescription>
              {t("pages.centerAISettings.readOnlyDescription")}
            </AlertDescription>
          </Alert>
        ) : null}

        {!providers.length ? (
          <Alert>
            <AlertTitle>{t("common.messages.noData")}</AlertTitle>
            <AlertDescription>
              {t("pages.centerAISettings.noProviders")}
            </AlertDescription>
          </Alert>
        ) : null}

        {providers.map((provider) => {
          const providerKey = String(provider.key);
          const draft = drafts[providerKey];
          if (!draft) return null;

          const readOnly = !provider.system_enabled || !provider.configured;
          const dirty = isDirty(providerKey);
          const providerError = errors[providerKey];
          const providerIsSaving =
            isSaving &&
            savingProviderKey != null &&
            savingProviderKey === providerKey;

          const state: "synced" | "dirty" | "saving" | "saved" | "error" =
            providerError
              ? "error"
              : providerIsSaving
                ? "saving"
                : savedProviderKey === providerKey
                  ? "saved"
                  : dirty
                    ? "dirty"
                    : "synced";

          const modelOptions = provider.models.map((model) => ({
            value: model,
            label: model,
          }));

          return (
            <div
              key={providerKey}
              className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {provider.label || providerKey}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.aiSystemProviders.providerKey")}: {providerKey}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={provider.configured ? "success" : "warning"}>
                    {provider.configured
                      ? t("pages.centerAISettings.configured")
                      : t("pages.centerAISettings.notConfigured")}
                  </Badge>
                  <Badge
                    variant={provider.system_enabled ? "success" : "secondary"}
                  >
                    {t("pages.centerAISettings.systemEnabled")}:{" "}
                    {provider.system_enabled
                      ? t("common.status.enabled")
                      : t("common.status.disabled")}
                  </Badge>
                  <Badge
                    variant={provider.center_enabled ? "success" : "secondary"}
                  >
                    {t("pages.centerAISettings.centerEnabled")}:{" "}
                    {provider.center_enabled
                      ? t("common.status.enabled")
                      : t("common.status.disabled")}
                  </Badge>
                  <Badge variant={provider.enabled ? "success" : "secondary"}>
                    {provider.enabled
                      ? t("pages.centerAISettings.effectiveEnabled")
                      : t("pages.centerAISettings.effectiveDisabled")}
                  </Badge>
                  <Badge variant={getStateBadgeVariant(state)}>
                    {state === "saving"
                      ? t("pages.centerAISettings.saving")
                      : state === "saved"
                        ? t("pages.centerAISettings.saved")
                        : state === "error"
                          ? t("pages.centerAISettings.error")
                          : state === "dirty"
                            ? t("pages.centerAISettings.dirty")
                            : t("pages.centerAISettings.synced")}
                  </Badge>
                </div>
              </div>

              {readOnly ? (
                <Alert>
                  <AlertTitle>
                    {t("pages.centerAISettings.readOnlyProviderTitle")}
                  </AlertTitle>
                  <AlertDescription>
                    {!provider.system_enabled
                      ? t("pages.centerAISettings.systemDisabled")
                      : t("pages.centerAISettings.providerUnavailable")}
                  </AlertDescription>
                </Alert>
              ) : null}

              <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {t("pages.centerAISettings.centerEnabled")}
                </span>
                <input
                  type="checkbox"
                  checked={draft.is_enabled}
                  onChange={(event) => {
                    updateDraft(providerKey, (current) => ({
                      ...current,
                      is_enabled: event.target.checked,
                    }));
                  }}
                  disabled={readOnly || !canManageSettings || providerIsSaving}
                />
              </label>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("pages.centerAISettings.allowedModels")}</Label>
                  <SearchableMultiSelect
                    values={draft.allowed_models}
                    onValuesChange={(nextValues) => {
                      const allowedModels = normalizeModelList(nextValues);
                      updateDraft(providerKey, (current) => ({
                        ...current,
                        allowed_models: allowedModels,
                        default_model:
                          current.default_model &&
                          allowedModels.includes(current.default_model)
                            ? current.default_model
                            : (allowedModels[0] ?? null),
                      }));
                    }}
                    options={modelOptions}
                    placeholder={t("pages.centerAISettings.allowedModels")}
                    disabled={
                      readOnly || !canManageSettings || providerIsSaving
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("pages.centerAISettings.defaultModel")}</Label>
                  <Select
                    value={draft.default_model ?? "__none__"}
                    onValueChange={(value) => {
                      updateDraft(providerKey, (current) => ({
                        ...current,
                        default_model: value === "__none__" ? null : value,
                      }));
                    }}
                    disabled={
                      readOnly ||
                      !canManageSettings ||
                      providerIsSaving ||
                      draft.allowed_models.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("common.labels.none")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {t("common.labels.none")}
                      </SelectItem>
                      {draft.allowed_models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("pages.centerAISettings.limits")}
                </p>

                <div className="grid gap-3 md:grid-cols-2">
                  {LIMIT_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label>{t(field.labelKey)}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={draft.limits[field.key]}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (!Number.isFinite(value)) return;
                          updateDraft(providerKey, (current) => ({
                            ...current,
                            limits: {
                              ...current.limits,
                              [field.key]: value,
                            },
                          }));
                        }}
                        disabled={
                          readOnly || !canManageSettings || providerIsSaving
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {providerError ? (
                <Alert variant="destructive">
                  <AlertTitle>{t("pages.centerAISettings.error")}</AlertTitle>
                  <AlertDescription>{providerError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void saveProvider(provider)}
                  disabled={
                    readOnly || !canManageSettings || !dirty || providerIsSaving
                  }
                >
                  {providerIsSaving
                    ? t("common.actions.saving")
                    : t("pages.centerAISettings.saveProvider")}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
