"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCenterSettings,
  useUpdateCenterSettings,
} from "@/features/centers/hooks/use-center-settings";
import { DynamicSettingField } from "@/features/settings/components/DynamicSettingField";
import { SettingsSectionCard } from "@/features/settings/components/SettingsSectionCard";
import {
  asRecord,
  asStringArray,
  buildGroupedSettingKeys,
  cloneValue,
  deepEqual,
  flattenGroupedSettings,
  getDefinitionForKey,
  getSettingValueForRender,
  humanizeKey,
  inferFieldType,
  type DynamicAIProvider,
  type DynamicSettingsCatalog,
  type DynamicSettingsMap,
} from "@/features/settings/lib/dynamic-settings";
import { getAdminApiErrorMessage } from "@/lib/admin-response";

type CenterSettingsEditorProps = {
  centerId: string | number;
  mode?: "workspace" | "manage";
};

type ProviderDraft = {
  key: string;
  label: string;
  enabled: boolean;
  configured: boolean;
  managed_by?: string;
  models: string[];
  editable_fields: string[];
  is_enabled: boolean;
  allowed_models: string[];
  default_model: string | null;
  limits: Record<string, unknown>;
};

function getCenterAdminGroupDescription(group: string) {
  const normalized = group.trim().toLowerCase();

  if (normalized === "branding") {
    return "Update your center branding.";
  }
  if (normalized === "student_profile") {
    return "Configure the student profile fields your center uses.";
  }
  if (normalized === "playback") {
    return "Adjust playback and access settings allowed for your center.";
  }
  if (normalized === "devices") {
    return "Manage the device limits available to your center.";
  }
  if (normalized === "downloads") {
    return "Manage download-related settings available to your center.";
  }
  if (normalized === "guest") {
    return "Manage guest access options allowed for your center.";
  }
  if (normalized === "video_access") {
    return "Manage video access options available to your center.";
  }

  return undefined;
}

function buildCatalogGroups(catalog: DynamicSettingsCatalog | undefined) {
  const groups = new Map<string, string[]>();

  Object.entries(catalog ?? {}).forEach(([key, definition]) => {
    if (definition.scope !== "center") {
      return;
    }

    const group =
      typeof definition.group === "string" ? definition.group : "general";
    const bucket = groups.get(group) ?? [];
    bucket.push(key);
    groups.set(group, bucket);
  });

  return Object.fromEntries(groups);
}

function toGroupKeyMap(groups: Record<string, DynamicSettingsMap> | undefined) {
  return Object.fromEntries(
    Object.entries(groups ?? {}).map(([group, values]) => [
      group,
      Object.keys(values),
    ]),
  );
}

function buildSettingsDraft(
  resolvedValues: DynamicSettingsMap,
  rawValues: DynamicSettingsMap,
  catalog: DynamicSettingsCatalog | undefined,
  constraints: DynamicSettingsMap,
): DynamicSettingsMap {
  const keys = new Set([
    ...Object.keys(resolvedValues),
    ...Object.keys(rawValues),
    ...Object.keys(catalog ?? {}),
  ]);

  return Object.fromEntries(
    Array.from(keys).map((key) => {
      const definition = getDefinitionForKey(catalog, key);
      const overrideKey =
        typeof definition?.system_override === "string"
          ? definition.system_override
          : null;
      const forcedBySystem =
        overrideKey !== null && constraints[overrideKey] === true;
      const sourceValue =
        forcedBySystem &&
        Object.prototype.hasOwnProperty.call(resolvedValues, key)
          ? resolvedValues[key]
          : getSettingValueForRender(
              key,
              resolvedValues,
              rawValues,
              definition,
            );

      return [key, cloneValue(sourceValue)];
    }),
  );
}

function buildProviderDraft(provider: DynamicAIProvider): ProviderDraft | null {
  const key = typeof provider.key === "string" ? provider.key : null;
  if (!key) {
    return null;
  }

  const models = asStringArray(provider.models);
  const allowedModels = asStringArray(provider.allowed_models);
  const editableFields = asStringArray(provider.editable_fields);
  const limits = asRecord(provider.limits) ?? {};

  return {
    key,
    label: String(provider.label ?? key),
    enabled: Boolean(provider.enabled),
    configured: Boolean(provider.configured),
    managed_by:
      typeof provider.managed_by === "string" ? provider.managed_by : undefined,
    models,
    editable_fields: editableFields,
    is_enabled: Boolean(provider.enabled),
    allowed_models: allowedModels.length > 0 ? allowedModels : models,
    default_model:
      typeof provider.default_model === "string"
        ? provider.default_model
        : null,
    limits,
  };
}

function buildAIDraft(providers: DynamicAIProvider[] | undefined) {
  const drafts = (providers ?? [])
    .map((provider) => buildProviderDraft(provider))
    .filter((provider): provider is ProviderDraft => provider !== null);

  return Object.fromEntries(drafts.map((provider) => [provider.key, provider]));
}

export function CenterSettingsEditor({
  centerId,
  mode = "workspace",
}: CenterSettingsEditorProps) {
  const { data, isLoading, isError, refetch } = useCenterSettings(centerId);
  const { mutateAsync: updateCenterSettings, isPending: isSaving } =
    useUpdateCenterSettings();

  const [draftSettings, setDraftSettings] = useState<DynamicSettingsMap>({});
  const [initialSettings, setInitialSettings] = useState<DynamicSettingsMap>(
    {},
  );
  const [draftFeatures, setDraftFeatures] = useState<Record<string, boolean>>(
    {},
  );
  const [initialFeatures, setInitialFeatures] = useState<
    Record<string, boolean>
  >({});
  const [draftAI, setDraftAI] = useState<Record<string, ProviderDraft>>({});
  const [initialAI, setInitialAI] = useState<Record<string, ProviderDraft>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const catalog = useMemo(
    () => (data?.catalog ?? {}) as DynamicSettingsCatalog,
    [data?.catalog],
  );
  const catalogGroups = useMemo(() => buildCatalogGroups(catalog), [catalog]);
  const rawGrouped = useMemo(
    () => data?.sections?.settings?.groups ?? {},
    [data?.sections?.settings?.groups],
  );
  const resolvedGrouped = useMemo(
    () => data?.sections?.settings?.resolved_groups ?? {},
    [data?.sections?.settings?.resolved_groups],
  );
  const rawValues = useMemo(
    () => flattenGroupedSettings(rawGrouped),
    [rawGrouped],
  );
  const resolvedValues = useMemo(
    () => flattenGroupedSettings(resolvedGrouped),
    [resolvedGrouped],
  );
  const featureValues = useMemo(
    () => data?.sections?.features?.values ?? data?.features ?? {},
    [data?.features, data?.sections?.features?.values],
  );
  const isSystemAdminActor =
    data?.page?.type === "system_admin_center_settings" ||
    data?.page?.actor_scope === "system";
  const isManagementView = isSystemAdminActor && mode === "manage";
  const isWorkspaceView = mode === "workspace";
  const editableSettings = useMemo(
    () => new Set(data?.page?.editable?.settings ?? []),
    [data?.page?.editable?.settings],
  );
  const editableFeatures = useMemo(
    () => new Set(data?.page?.editable?.features ?? []),
    [data?.page?.editable?.features],
  );
  const editableAIProviders = useMemo(
    () => data?.page?.editable?.ai?.providers ?? {},
    [data?.page?.editable?.ai?.providers],
  );
  const groupedKeys = useMemo(
    () =>
      buildGroupedSettingKeys(
        catalogGroups,
        toGroupKeyMap(resolvedGrouped),
        Object.keys(rawGrouped).length ? toGroupKeyMap(rawGrouped) : undefined,
      ),
    [catalogGroups, resolvedGrouped, rawGrouped],
  );

  useEffect(() => {
    if (!data) return;

    const nextSettings = buildSettingsDraft(
      resolvedValues,
      rawValues,
      catalog,
      data.system_constraints ?? {},
    );
    const nextFeatures = cloneValue(featureValues);
    const nextAI = buildAIDraft(data.sections?.ai?.providers);

    setDraftSettings(nextSettings);
    setInitialSettings(cloneValue(nextSettings));
    setDraftFeatures(nextFeatures);
    setInitialFeatures(cloneValue(nextFeatures));
    setDraftAI(nextAI);
    setInitialAI(cloneValue(nextAI));
  }, [catalog, data, featureValues, rawValues, resolvedValues]);

  const handleSave = async () => {
    setFormError(null);
    setSaveSuccess(null);

    const changedSettings = Object.fromEntries(
      Object.entries(draftSettings).filter(
        ([key, value]) => !deepEqual(value, initialSettings[key]),
      ),
    );

    const changedFeatures = Object.fromEntries(
      Object.entries(draftFeatures).filter(
        ([key, value]) => !deepEqual(value, initialFeatures[key]),
      ),
    );

    const changedProviders = Object.fromEntries(
      Object.entries(draftAI)
        .map(([providerKey, providerDraft]) => {
          const initialDraft = initialAI[providerKey];
          if (!initialDraft) {
            return [providerKey, providerDraft] as const;
          }

          const payload: Record<string, unknown> = {};

          providerDraft.editable_fields.forEach((field) => {
            if (
              !deepEqual(
                providerDraft[field as keyof ProviderDraft],
                initialDraft[field as keyof ProviderDraft],
              )
            ) {
              payload[field] = cloneValue(
                providerDraft[field as keyof ProviderDraft],
              );
            }
          });

          return [providerKey, payload] as const;
        })
        .filter(([, payload]) => Object.keys(payload).length > 0),
    );

    if (
      Object.keys(changedSettings).length === 0 &&
      Object.keys(changedFeatures).length === 0 &&
      Object.keys(changedProviders).length === 0
    ) {
      setSaveSuccess("No changes to save.");
      return;
    }

    try {
      await updateCenterSettings({
        centerId,
        payload: {
          ...(Object.keys(changedSettings).length > 0
            ? { settings: changedSettings }
            : {}),
          ...(isManagementView && Object.keys(changedFeatures).length > 0
            ? { features: changedFeatures }
            : {}),
          ...(Object.keys(changedProviders).length > 0
            ? { ai: { providers: changedProviders } }
            : {}),
        },
      });

      await refetch();
      setSaveSuccess("Center settings saved.");
    } catch (error) {
      setFormError(
        getAdminApiErrorMessage(error, "Unable to save center settings."),
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Center settings unavailable</AlertTitle>
        <AlertDescription>
          The grouped center settings payload could not be loaded.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {data.summaries?.map((summary, index) => (
        <Alert key={`${summary.title}-${index}`}>
          <AlertTitle>{summary.title ?? "Notice"}</AlertTitle>
          <AlertDescription>{summary.message ?? ""}</AlertDescription>
        </Alert>
      ))}

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Save failed</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {saveSuccess ? (
        <Alert>
          <AlertTitle>Center settings updated</AlertTitle>
          <AlertDescription>{saveSuccess}</AlertDescription>
        </Alert>
      ) : null}

      {groupedKeys.map(({ group, keys }) => {
        const visibleKeys = keys.filter((key) => {
          if (editableSettings.size > 0 && !editableSettings.has(key)) {
            return false;
          }

          const definition = getDefinitionForKey(catalog, key);
          if (!isManagementView && definition?.feature_flag) {
            return featureValues[definition.feature_flag] !== false;
          }

          return true;
        });

        if (visibleKeys.length === 0) {
          return null;
        }

        return (
          <SettingsSectionCard
            key={group}
            title={humanizeKey(group)}
            description={
              isManagementView
                ? `Driven by grouped center settings payload for ${humanizeKey(group)}.`
                : getCenterAdminGroupDescription(group)
            }
          >
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleKeys.map((key) => {
                const definition = getDefinitionForKey(catalog, key);
                const overrideKey =
                  typeof definition?.system_override === "string"
                    ? definition.system_override
                    : null;
                const limitKey =
                  typeof definition?.system_limit === "string"
                    ? definition.system_limit
                    : null;
                const forcedBySystem =
                  !isManagementView &&
                  overrideKey !== null &&
                  data.system_constraints?.[overrideKey] === true;
                const limitHint =
                  limitKey && data.system_constraints?.[limitKey] !== undefined
                    ? `System max: ${String(data.system_constraints[limitKey])}`
                    : null;
                const featureHint =
                  definition?.feature_flag &&
                  featureValues[definition.feature_flag] === false
                    ? `Feature flag "${humanizeKey(definition.feature_flag)}" is disabled for this center.`
                    : null;
                const hint = forcedBySystem
                  ? "Disabled by system administrator."
                  : (limitHint ?? featureHint);

                return (
                  <DynamicSettingField
                    key={key}
                    fieldKey={key}
                    value={draftSettings[key]}
                    resolvedValue={resolvedValues[key]}
                    definition={definition}
                    disabled={forcedBySystem}
                    hint={hint}
                    description={
                      isManagementView &&
                      typeof definition?.storage === "string"
                        ? `Storage: ${definition.storage}`
                        : null
                    }
                    onChange={(nextValue) =>
                      setDraftSettings((current) => ({
                        ...current,
                        [key]:
                          inferFieldType(nextValue, definition) === "object"
                            ? cloneValue(nextValue)
                            : nextValue,
                      }))
                    }
                  />
                );
              })}
            </div>
          </SettingsSectionCard>
        );
      })}

      {isManagementView && Object.keys(draftFeatures).length > 0 ? (
        <SettingsSectionCard
          title="Features"
          description="Per-center feature flags from the grouped center settings payload."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {Object.keys(draftFeatures)
              .filter(
                (key) =>
                  editableFeatures.size === 0 || editableFeatures.has(key),
              )
              .map((key) => (
                <DynamicSettingField
                  key={key}
                  fieldKey={key}
                  value={draftFeatures[key]}
                  disabled={false}
                  onChange={(nextValue) =>
                    setDraftFeatures((current) => ({
                      ...current,
                      [key]: Boolean(nextValue),
                    }))
                  }
                />
              ))}
          </div>
        </SettingsSectionCard>
      ) : null}

      {(data.sections?.ai?.providers?.length ?? 0) > 0 ? (
        <SettingsSectionCard
          title="AI"
          description={
            isManagementView
              ? "Provider policy is driven by the grouped center settings payload."
              : "Choose the default AI model available to your center where platform policy allows it."
          }
        >
          <div className="space-y-5">
            {Object.values(draftAI).map((provider) => {
              const providerEditableFields =
                editableAIProviders[provider.key] ?? [];
              const defaultModelOptions =
                provider.allowed_models.length > 0
                  ? provider.allowed_models
                  : provider.models;

              if (
                !isManagementView &&
                !providerEditableFields.includes("default_model")
              ) {
                return null;
              }

              return (
                <div
                  key={provider.key}
                  className="space-y-4 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-950/30"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-950 dark:text-white">
                      {provider.label}
                    </h3>

                    {isManagementView ? (
                      <>
                        <Badge
                          variant={provider.enabled ? "success" : "secondary"}
                        >
                          {provider.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge
                          variant={
                            provider.configured ? "outline" : "secondary"
                          }
                        >
                          {provider.configured
                            ? "Configured"
                            : "Not configured"}
                        </Badge>
                      </>
                    ) : null}

                    {!isManagementView && provider.managed_by ? (
                      <Badge variant="outline">Managed by platform</Badge>
                    ) : null}
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    {isManagementView &&
                    provider.editable_fields.includes("is_enabled") ? (
                      <DynamicSettingField
                        fieldKey="is_enabled"
                        value={provider.is_enabled}
                        onChange={(nextValue) =>
                          setDraftAI((current) => ({
                            ...current,
                            [provider.key]: {
                              ...current[provider.key],
                              is_enabled: Boolean(nextValue),
                            },
                          }))
                        }
                      />
                    ) : null}

                    {isManagementView &&
                    provider.editable_fields.includes("allowed_models") ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-950 dark:text-white">
                          Allowed Models
                        </Label>
                        <SearchableMultiSelect
                          values={provider.allowed_models}
                          options={provider.models.map((model) => ({
                            value: model,
                            label: model,
                          }))}
                          onValuesChange={(nextValues) =>
                            setDraftAI((current) => ({
                              ...current,
                              [provider.key]: {
                                ...current[provider.key],
                                allowed_models: nextValues,
                                default_model: nextValues.includes(
                                  current[provider.key].default_model ?? "",
                                )
                                  ? current[provider.key].default_model
                                  : (nextValues[0] ?? null),
                              },
                            }))
                          }
                        />
                      </div>
                    ) : null}

                    {(
                      isManagementView
                        ? provider.editable_fields.includes("default_model")
                        : providerEditableFields.includes("default_model")
                    ) ? (
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-950 dark:text-white">
                          Default Model
                        </Label>
                        <select
                          value={provider.default_model ?? ""}
                          onChange={(event) =>
                            setDraftAI((current) => ({
                              ...current,
                              [provider.key]: {
                                ...current[provider.key],
                                default_model: event.target.value || null,
                              },
                            }))
                          }
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm shadow-sm dark:border-gray-800 dark:bg-gray-950/40"
                        >
                          <option value="">Select a model</option>
                          {defaultModelOptions.map((model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>

                  {isManagementView &&
                  (provider.editable_fields.includes("limits") ||
                    Object.keys(provider.limits).length > 0) ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.entries(provider.limits).map(
                        ([limitKey, limitValue]) => (
                          <div key={limitKey} className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-950 dark:text-white">
                              {humanizeKey(limitKey)}
                            </Label>
                            {provider.editable_fields.includes("limits") ? (
                              <Input
                                type="number"
                                value={
                                  limitValue === null ||
                                  limitValue === undefined
                                    ? ""
                                    : String(limitValue)
                                }
                                onChange={(event) =>
                                  setDraftAI((current) => ({
                                    ...current,
                                    [provider.key]: {
                                      ...current[provider.key],
                                      limits: {
                                        ...current[provider.key].limits,
                                        [limitKey]:
                                          event.target.value.trim() === ""
                                            ? null
                                            : Number(event.target.value),
                                      },
                                    },
                                  }))
                                }
                                className="h-10 bg-white shadow-sm dark:bg-gray-950/40"
                              />
                            ) : (
                              <Input
                                value={String(limitValue ?? "")}
                                disabled
                                className="h-10 bg-gray-100 dark:bg-gray-900/60"
                              />
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </SettingsSectionCard>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraftSettings(cloneValue(initialSettings));
            setDraftFeatures(cloneValue(initialFeatures));
            setDraftAI(cloneValue(initialAI));
            setFormError(null);
            setSaveSuccess(null);
          }}
          disabled={isSaving}
        >
          Reset
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving
            ? "Saving..."
            : isWorkspaceView
              ? "Save workspace settings"
              : "Save center settings"}
        </Button>
      </div>
    </div>
  );
}
