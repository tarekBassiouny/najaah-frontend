"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DynamicSettingField } from "@/features/settings/components/DynamicSettingField";
import { SettingsSectionCard } from "@/features/settings/components/SettingsSectionCard";
import {
  useCreateSystemSetting,
  useSystemSettings,
  useUpdateSystemSetting,
} from "@/features/system-settings/hooks/use-system-settings";
import {
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import {
  buildSystemSettingsMap,
  cloneValue,
  deepEqual,
  getDefinitionForKey,
  getSystemEditorValue,
  serializeSystemSettingValue,
  translateDynamicLabel,
  translateWithFallback,
  type DynamicTranslateFunction,
} from "@/features/settings/lib/dynamic-settings";
import { useTranslation } from "@/features/localization";

type DraftValues = Record<string, unknown>;

const FETCH_PARAMS = {
  page: 1,
  per_page: 100,
};

function getDynamicGroupTitle(t: DynamicTranslateFunction, group: string) {
  return translateDynamicLabel(t, "groups", group);
}

function groupDescription(t: DynamicTranslateFunction, group: string) {
  return t("pages.dynamicSettings.groupDescriptionSystem", {
    group: getDynamicGroupTitle(t, group),
  });
}

export function SystemSettingsCatalogEditor() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useSystemSettings(FETCH_PARAMS);
  const { mutateAsync: createSystemSetting, isPending: isCreating } =
    useCreateSystemSetting();
  const { mutateAsync: updateSystemSetting, isPending: isUpdating } =
    useUpdateSystemSetting();

  const [draftValues, setDraftValues] = useState<DraftValues>({});
  const [initialValues, setInitialValues] = useState<DraftValues>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const settingsByKey = useMemo(
    () => buildSystemSettingsMap(data?.items ?? []),
    [data?.items],
  );

  useEffect(() => {
    if (!data?.meta) return;

    const nextValues = Object.fromEntries(
      Object.keys(data.meta.catalog ?? {}).map((key) => [
        key,
        getSystemEditorValue(
          key,
          settingsByKey[key]?.value,
          getDefinitionForKey(data.meta.catalog, key),
          data.meta.defaults?.[key],
        ),
      ]),
    );

    setDraftValues(cloneValue(nextValues));
    setInitialValues(cloneValue(nextValues));
  }, [data, settingsByKey]);

  const isSaving = isCreating || isUpdating;
  const groups = useMemo(
    () => Object.entries(data?.meta.catalog_groups ?? {}),
    [data?.meta.catalog_groups],
  );

  const handleSave = async () => {
    if (!data?.meta.catalog) {
      return;
    }

    setFormError(null);
    setSaveSuccess(null);

    const changedKeys = Object.keys(data.meta.catalog).filter(
      (key) => !deepEqual(draftValues[key], initialValues[key]),
    );

    if (changedKeys.length === 0) {
      setSaveSuccess(t("pages.dynamicSettings.noChangesToSave"));
      return;
    }

    try {
      for (const key of changedKeys) {
        const currentSetting = settingsByKey[key];
        const definition = getDefinitionForKey(data.meta.catalog, key);
        const payloadValue = serializeSystemSettingValue(
          key,
          draftValues[key],
          definition,
          currentSetting?.value,
        );

        if (currentSetting) {
          const response = await updateSystemSetting({
            id: currentSetting.id,
            payload: {
              value: payloadValue,
              is_public: currentSetting.is_public,
            },
          });

          if (!isAdminRequestSuccessful(response)) {
            setFormError(
              getAdminResponseMessage(
                response,
                t("pages.dynamicSettings.errors.saveSystemSettings"),
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
        });

        if (!isAdminRequestSuccessful(response)) {
          setFormError(
            getAdminResponseMessage(
              response,
              t("pages.dynamicSettings.errors.createSystemSettingOverride"),
            ),
          );
          return;
        }
      }

      await refetch();
      setSaveSuccess(t("pages.dynamicSettings.systemSaved"));
    } catch (error) {
      setFormError(
        getAdminApiErrorMessage(
          error,
          t("pages.dynamicSettings.errors.saveSystemSettings"),
        ),
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

  if (isError || !data?.meta.catalog) {
    return (
      <Alert variant="destructive">
        <AlertTitle>
          {t("pages.dynamicSettings.systemUnavailableTitle")}
        </AlertTitle>
        <AlertDescription>
          {t("pages.dynamicSettings.systemUnavailableDescription")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>{t("pages.dynamicSettings.saveFailedTitle")}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {saveSuccess ? (
        <Alert>
          <AlertTitle>
            {t("pages.dynamicSettings.systemUpdatedTitle")}
          </AlertTitle>
          <AlertDescription>{saveSuccess}</AlertDescription>
        </Alert>
      ) : null}

      {groups.map(([group, keys]) => (
        <SettingsSectionCard
          key={group}
          title={getDynamicGroupTitle(t, group)}
          description={groupDescription(t, group)}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            {keys.map((key) => {
              const definition = getDefinitionForKey(data.meta.catalog, key);
              const currentSetting = settingsByKey[key];

              return (
                <div key={key} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {currentSetting
                        ? t("pages.dynamicSettings.storedOverride")
                        : t("pages.dynamicSettings.defaultOnly")}
                    </Badge>
                    <Badge variant="secondary">
                      {translateWithFallback(
                        t,
                        `pages.dynamicSettings.types.${definition?.type ?? "string"}`,
                        definition?.type ??
                          t("pages.dynamicSettings.types.string"),
                      )}
                    </Badge>
                  </div>

                  <DynamicSettingField
                    fieldKey={key}
                    value={draftValues[key]}
                    definition={definition}
                    resolvedValue={data.meta.defaults?.[key]}
                    description={
                      typeof definition?.storage === "string"
                        ? t("pages.dynamicSettings.storageDescription", {
                            storage: definition.storage,
                          })
                        : null
                    }
                    onChange={(nextValue) =>
                      setDraftValues((current) => ({
                        ...current,
                        [key]: nextValue,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </SettingsSectionCard>
      ))}

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraftValues(cloneValue(initialValues));
            setFormError(null);
            setSaveSuccess(null);
          }}
          disabled={isSaving}
        >
          {t("common.actions.reset")}
        </Button>
        <Button type="button" onClick={handleSave} disabled={isSaving}>
          {isSaving
            ? t("common.actions.saving")
            : t("pages.dynamicSettings.saveSystemSettings")}
        </Button>
      </div>
    </div>
  );
}
