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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAISystemProviders,
  useUpdateAISystemProvider,
} from "@/features/ai/hooks/use-ai";
import type { AISystemProvider } from "@/features/ai/types/ai";
import { useTranslation } from "@/features/localization";
import { can } from "@/lib/capabilities";
import { getAdminApiErrorMessage } from "@/lib/admin-response";

type ProviderDraft = {
  is_enabled: boolean;
  models: string[];
  default_model: string | null;
  api_key: string;
};

function normalizeModels(models: string[]) {
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

function buildProviderDraft(provider: AISystemProvider): ProviderDraft {
  const models = normalizeModels(provider.models ?? []);

  return {
    is_enabled: Boolean(provider.is_enabled),
    models,
    default_model:
      provider.default_model && models.includes(provider.default_model)
        ? provider.default_model
        : (models[0] ?? null),
    api_key: "",
  };
}

function areEqualStringArrays(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function getStateBadgeVariant(state: "ready" | "saving" | "saved" | "error") {
  if (state === "saving") return "info" as const;
  if (state === "saved") return "success" as const;
  if (state === "error") return "error" as const;
  return "outline" as const;
}

export function AISystemProvidersPanel() {
  const { t } = useTranslation();
  const canManageSettings = can("manage_settings");
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useAISystemProviders({
    staleTime: 60_000,
  });
  const { mutateAsync: updateProvider, isPending: isSaving } =
    useUpdateAISystemProvider();

  const providers = useMemo(() => response?.data ?? [], [response?.data]);

  const providersSignature = useMemo(
    () =>
      JSON.stringify(
        providers.map((provider) => ({
          key: String(provider.key),
          is_enabled: provider.is_enabled,
          models: provider.models,
          default_model: provider.default_model,
          configured: provider.configured,
          has_custom_api_key: provider.has_custom_api_key,
        })),
      ),
    [providers],
  );

  const [drafts, setDrafts] = useState<Record<string, ProviderDraft>>({});
  const [newModelInputs, setNewModelInputs] = useState<Record<string, string>>(
    {},
  );
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

    const nextDrafts: Record<string, ProviderDraft> = {};
    const nextInputs: Record<string, string> = {};

    providers.forEach((provider) => {
      const key = String(provider.key);
      nextDrafts[key] = buildProviderDraft(provider);
      nextInputs[key] = "";
    });

    setDrafts(nextDrafts);
    setNewModelInputs(nextInputs);
    setErrors({});
    setSavedProviderKey(null);
    setSavingProviderKey(null);
  }, [providersSignature, providers]);

  const originalsByKey = useMemo(() => {
    return providers.reduce<Record<string, ProviderDraft>>(
      (carry, provider) => {
        carry[String(provider.key)] = buildProviderDraft(provider);
        return carry;
      },
      {},
    );
  }, [providers]);

  const isDirty = (providerKey: string) => {
    const current = drafts[providerKey];
    const original = originalsByKey[providerKey];

    if (!current || !original) return false;

    return (
      current.is_enabled !== original.is_enabled ||
      current.default_model !== original.default_model ||
      !areEqualStringArrays(current.models, original.models) ||
      current.api_key.trim().length > 0
    );
  };

  const updateDraft = (
    providerKey: string,
    updater: (_current: ProviderDraft) => ProviderDraft,
  ) => {
    setDrafts((current) => {
      const draft = current[providerKey];
      if (!draft) return current;

      return {
        ...current,
        [providerKey]: updater(draft),
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

  const appendModel = (providerKey: string) => {
    const nextModel = (newModelInputs[providerKey] ?? "").trim();
    if (!nextModel) return;

    updateDraft(providerKey, (draft) => {
      const models = normalizeModels([...draft.models, nextModel]);
      return {
        ...draft,
        models,
        default_model:
          draft.default_model && models.includes(draft.default_model)
            ? draft.default_model
            : (models[0] ?? null),
      };
    });

    setNewModelInputs((current) => ({
      ...current,
      [providerKey]: "",
    }));
  };

  const removeModel = (providerKey: string, model: string) => {
    updateDraft(providerKey, (draft) => {
      const models = draft.models.filter((value) => value !== model);
      return {
        ...draft,
        models,
        default_model:
          draft.default_model && models.includes(draft.default_model)
            ? draft.default_model
            : (models[0] ?? null),
      };
    });
  };

  const saveProvider = async (provider: AISystemProvider) => {
    const providerKey = String(provider.key);
    const draft = drafts[providerKey];
    if (!draft || isSaving) return;

    if (draft.models.length === 0) {
      setErrors((current) => ({
        ...current,
        [providerKey]: t("pages.aiSystemProviders.validation.modelsRequired"),
      }));
      return;
    }

    if (
      draft.default_model &&
      !draft.models.some((model) => model === draft.default_model)
    ) {
      setErrors((current) => ({
        ...current,
        [providerKey]: t(
          "pages.aiSystemProviders.validation.defaultModelInvalid",
        ),
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
        provider: provider.key,
        payload: {
          is_enabled: draft.is_enabled,
          models: draft.models,
          default_model: draft.default_model,
          api_key: draft.api_key.trim() ? draft.api_key.trim() : undefined,
        },
      });

      const nextDraft = buildProviderDraft(result.data);
      setDrafts((current) => ({
        ...current,
        [providerKey]: nextDraft,
      }));
      setNewModelInputs((current) => ({
        ...current,
        [providerKey]: "",
      }));
      setSavedProviderKey(providerKey);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [providerKey]: getAdminApiErrorMessage(
          error,
          t("pages.aiSystemProviders.saveFailed"),
        ),
      }));
    } finally {
      setSavingProviderKey(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t("common.messages.loadFailed")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t("pages.aiSystemProviders.loadFailed")}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t("common.actions.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!providers.length) {
    return (
      <Alert>
        <AlertTitle>{t("common.messages.noData")}</AlertTitle>
        <AlertDescription>
          {t("pages.aiSystemProviders.noProviders")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {!canManageSettings ? (
        <Alert>
          <AlertTitle>{t("pages.aiSystemProviders.readOnlyTitle")}</AlertTitle>
          <AlertDescription>
            {t("pages.aiSystemProviders.readOnlyDescription")}
          </AlertDescription>
        </Alert>
      ) : null}

      {providers.map((provider) => {
        const providerKey = String(provider.key);
        const draft = drafts[providerKey];
        if (!draft) return null;

        const dirty = isDirty(providerKey);
        const providerError = errors[providerKey];
        const providerIsSaving =
          isSaving &&
          savingProviderKey != null &&
          savingProviderKey === providerKey;

        const state: "ready" | "saving" | "saved" | "error" = providerError
          ? "error"
          : providerIsSaving
            ? "saving"
            : savedProviderKey === providerKey
              ? "saved"
              : "ready";

        return (
          <Card key={providerKey} className="overflow-hidden">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle>{provider.label || providerKey}</CardTitle>
                  <CardDescription>
                    {t("pages.aiSystemProviders.providerKey")}: {providerKey}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={provider.configured ? "success" : "warning"}>
                    {provider.configured
                      ? t("pages.aiSystemProviders.configured")
                      : t("pages.aiSystemProviders.notConfigured")}
                  </Badge>
                  <Badge variant={draft.is_enabled ? "success" : "secondary"}>
                    {draft.is_enabled
                      ? t("pages.aiSystemProviders.enabled")
                      : t("pages.aiSystemProviders.disabled")}
                  </Badge>
                  {dirty ? (
                    <Badge variant="warning">
                      {t("pages.aiSystemProviders.dirty")}
                    </Badge>
                  ) : null}
                  <Badge variant={getStateBadgeVariant(state)}>
                    {state === "saving"
                      ? t("pages.aiSystemProviders.states.saving")
                      : state === "saved"
                        ? t("pages.aiSystemProviders.states.saved")
                        : state === "error"
                          ? t("pages.aiSystemProviders.states.error")
                          : t("pages.aiSystemProviders.states.ready")}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {t("pages.aiSystemProviders.enabled")}
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
                  disabled={!canManageSettings || providerIsSaving}
                />
              </label>

              <div className="space-y-2">
                <Label>{t("pages.aiSystemProviders.models")}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {draft.models.map((model) => (
                    <span
                      key={model}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                    >
                      {model}
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => removeModel(providerKey, model)}
                        disabled={!canManageSettings || providerIsSaving}
                        aria-label={`${t("common.actions.remove")} ${model}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {!draft.models.length ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("pages.aiSystemProviders.noModels")}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Input
                    value={newModelInputs[providerKey] ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setNewModelInputs((current) => ({
                        ...current,
                        [providerKey]: value,
                      }));
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      appendModel(providerKey);
                    }}
                    placeholder={t(
                      "pages.aiSystemProviders.newModelPlaceholder",
                    )}
                    disabled={!canManageSettings || providerIsSaving}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendModel(providerKey)}
                    disabled={!canManageSettings || providerIsSaving}
                  >
                    {t("pages.aiSystemProviders.addModel")}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("pages.aiSystemProviders.defaultModel")}</Label>
                <Select
                  value={draft.default_model ?? "__none__"}
                  onValueChange={(value) => {
                    updateDraft(providerKey, (current) => ({
                      ...current,
                      default_model: value === "__none__" ? null : value,
                    }));
                  }}
                  disabled={
                    !canManageSettings ||
                    providerIsSaving ||
                    draft.models.length === 0
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.labels.none")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("common.labels.none")}
                    </SelectItem>
                    {draft.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("pages.aiSystemProviders.apiKey")}</Label>
                <Input
                  type="password"
                  value={draft.api_key}
                  onChange={(event) => {
                    updateDraft(providerKey, (current) => ({
                      ...current,
                      api_key: event.target.value,
                    }));
                  }}
                  placeholder={
                    provider.has_custom_api_key
                      ? t("pages.aiSystemProviders.apiKeyMasked")
                      : t("pages.aiSystemProviders.apiKeyHint")
                  }
                  autoComplete="new-password"
                  disabled={!canManageSettings || providerIsSaving}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("pages.aiSystemProviders.apiKeyDescription")}
                </p>
              </div>

              {providerError ? (
                <Alert variant="destructive">
                  <AlertTitle>
                    {t("pages.aiSystemProviders.states.error")}
                  </AlertTitle>
                  <AlertDescription>{providerError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => void saveProvider(provider)}
                  disabled={!canManageSettings || !dirty || providerIsSaving}
                >
                  {providerIsSaving
                    ? t("common.actions.saving")
                    : t("pages.aiSystemProviders.saveProvider")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
