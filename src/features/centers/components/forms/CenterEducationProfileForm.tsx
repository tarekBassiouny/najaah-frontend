"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useCenterSettings,
  useUpdateCenterSettings,
} from "@/features/centers/hooks/use-center-settings";
import { getAdminApiErrorMessage } from "@/lib/admin-response";
import { useTranslation } from "@/features/localization";

type CenterEducationProfileFormProps = {
  centerId: string | number;
};

type EducationProfileValues = {
  enable_grade: boolean;
  enable_school: boolean;
  enable_college: boolean;
  require_grade: boolean;
  require_school: boolean;
  require_college: boolean;
};

const DEFAULT_EDUCATION_PROFILE_VALUES: EducationProfileValues = {
  enable_grade: true,
  enable_school: true,
  enable_college: true,
  require_grade: false,
  require_school: false,
  require_college: false,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeEducationProfileValues(
  values: EducationProfileValues,
): EducationProfileValues {
  return {
    ...values,
    require_grade: values.enable_grade ? values.require_grade : false,
    require_school: values.enable_school ? values.require_school : false,
    require_college: values.enable_college ? values.require_college : false,
  };
}

function mapResolvedSettingsToEducationProfileValues(
  resolvedSettings: Record<string, unknown>,
): EducationProfileValues {
  const profile = asRecord(resolvedSettings.education_profile);
  if (!profile) {
    return DEFAULT_EDUCATION_PROFILE_VALUES;
  }

  return normalizeEducationProfileValues({
    enable_grade: readBoolean(
      profile.enable_grade,
      DEFAULT_EDUCATION_PROFILE_VALUES.enable_grade,
    ),
    enable_school: readBoolean(
      profile.enable_school,
      DEFAULT_EDUCATION_PROFILE_VALUES.enable_school,
    ),
    enable_college: readBoolean(
      profile.enable_college,
      DEFAULT_EDUCATION_PROFILE_VALUES.enable_college,
    ),
    require_grade: readBoolean(
      profile.require_grade,
      DEFAULT_EDUCATION_PROFILE_VALUES.require_grade,
    ),
    require_school: readBoolean(
      profile.require_school,
      DEFAULT_EDUCATION_PROFILE_VALUES.require_school,
    ),
    require_college: readBoolean(
      profile.require_college,
      DEFAULT_EDUCATION_PROFILE_VALUES.require_college,
    ),
  });
}

export function CenterEducationProfileForm({
  centerId,
}: CenterEducationProfileFormProps) {
  const { t } = useTranslation();

  const {
    data,
    isLoading,
    isError,
    refetch: refetchCenterSettings,
  } = useCenterSettings(centerId);
  const { mutateAsync: updateCenterSettings, isPending: isSaving } =
    useUpdateCenterSettings();

  const [formValues, setFormValues] = useState<EducationProfileValues>(
    DEFAULT_EDUCATION_PROFILE_VALUES,
  );
  const [initialValues, setInitialValues] = useState<EducationProfileValues>(
    DEFAULT_EDUCATION_PROFILE_VALUES,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!data) return;

    const nextValues = mapResolvedSettingsToEducationProfileValues(
      data.resolved_settings ?? {},
    );
    setFormValues(nextValues);
    setInitialValues(nextValues);
  }, [data]);

  const normalizedCurrentValues = useMemo(
    () => normalizeEducationProfileValues(formValues),
    [formValues],
  );
  const normalizedInitialValues = useMemo(
    () => normalizeEducationProfileValues(initialValues),
    [initialValues],
  );

  const hasChanges = useMemo(
    () =>
      JSON.stringify(normalizedCurrentValues) !==
      JSON.stringify(normalizedInitialValues),
    [normalizedCurrentValues, normalizedInitialValues],
  );

  const handleSave = async () => {
    setFormError(null);
    setSaveSuccess(false);

    if (!hasChanges) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      return;
    }

    try {
      await updateCenterSettings({
        centerId,
        payload: {
          settings: {
            education_profile: normalizedCurrentValues,
          },
        },
      });

      await refetchCenterSettings();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      setFormError(
        getAdminApiErrorMessage(
          error,
          "Failed to save education profile settings.",
        ),
      );
    }
  };

  const toggleEnable = (
    key: "grade" | "school" | "college",
    checked: boolean,
  ) => {
    if (key === "grade") {
      setFormValues((current) =>
        normalizeEducationProfileValues({
          ...current,
          enable_grade: checked,
        }),
      );
      return;
    }

    if (key === "school") {
      setFormValues((current) =>
        normalizeEducationProfileValues({
          ...current,
          enable_school: checked,
        }),
      );
      return;
    }

    setFormValues((current) =>
      normalizeEducationProfileValues({
        ...current,
        enable_college: checked,
      }),
    );
  };

  const toggleRequire = (
    key: "grade" | "school" | "college",
    checked: boolean,
  ) => {
    if (key === "grade") {
      setFormValues((current) =>
        normalizeEducationProfileValues({
          ...current,
          require_grade: checked,
        }),
      );
      return;
    }

    if (key === "school") {
      setFormValues((current) =>
        normalizeEducationProfileValues({
          ...current,
          require_school: checked,
        }),
      );
      return;
    }

    setFormValues((current) =>
      normalizeEducationProfileValues({
        ...current,
        require_college: checked,
      }),
    );
  };

  return (
    <Card className="overflow-hidden border-gray-200/80 shadow-sm dark:border-gray-800">
      <CardHeader className="border-b border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_48%,#ecfeff_100%)] dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(17,24,39,0.96)_48%,rgba(8,47,73,0.92)_100%)]">
        <CardTitle>
          {t(
            "auto.features.centers.components.forms.centereducationprofileform.s1",
          )}
        </CardTitle>
        <CardDescription>
          {t(
            "auto.features.centers.components.forms.centereducationprofileform.s2",
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.centers.components.forms.centereducationprofileform.s3",
              )}
            </AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {saveSuccess ? (
          <Alert>
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>
              {t(
                "auto.features.centers.components.forms.centereducationprofileform.s4",
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {isError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t(
                "auto.features.centers.components.forms.centereducationprofileform.s5",
              )}
            </AlertTitle>
            <AlertDescription>
              {t(
                "auto.features.centers.components.forms.centereducationprofileform.s6",
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <p className="text-sm text-gray-600 dark:text-gray-300">
          {t(
            "auto.features.centers.components.forms.centereducationprofileform.s7",
          )}
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Grades
            </h3>
            <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>
                {t(
                  "auto.features.centers.components.forms.centereducationprofileform.s8",
                )}
              </span>
              <input
                type="checkbox"
                checked={formValues.enable_grade}
                onChange={(event) =>
                  toggleEnable("grade", event.target.checked)
                }
                disabled={isLoading || isSaving}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>
                {t(
                  "auto.features.centers.components.forms.centereducationprofileform.s9",
                )}
              </span>
              <input
                type="checkbox"
                checked={formValues.require_grade}
                onChange={(event) =>
                  toggleRequire("grade", event.target.checked)
                }
                disabled={isLoading || isSaving || !formValues.enable_grade}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Schools
            </h3>
            <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>
                {t(
                  "auto.features.centers.components.forms.centereducationprofileform.s8",
                )}
              </span>
              <input
                type="checkbox"
                checked={formValues.enable_school}
                onChange={(event) =>
                  toggleEnable("school", event.target.checked)
                }
                disabled={isLoading || isSaving}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>
                {t(
                  "auto.features.centers.components.forms.centereducationprofileform.s9",
                )}
              </span>
              <input
                type="checkbox"
                checked={formValues.require_school}
                onChange={(event) =>
                  toggleRequire("school", event.target.checked)
                }
                disabled={isLoading || isSaving || !formValues.enable_school}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Colleges
            </h3>
            <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>
                {t(
                  "auto.features.centers.components.forms.centereducationprofileform.s8",
                )}
              </span>
              <input
                type="checkbox"
                checked={formValues.enable_college}
                onChange={(event) =>
                  toggleEnable("college", event.target.checked)
                }
                disabled={isLoading || isSaving}
              />
            </label>
            <label className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>
                {t(
                  "auto.features.centers.components.forms.centereducationprofileform.s9",
                )}
              </span>
              <input
                type="checkbox"
                checked={formValues.require_college}
                onChange={(event) =>
                  toggleRequire("college", event.target.checked)
                }
                disabled={isLoading || isSaving || !formValues.enable_college}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => void handleSave()}
            disabled={isLoading || isSaving}
          >
            {isSaving ? "Saving..." : "Save Education Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
