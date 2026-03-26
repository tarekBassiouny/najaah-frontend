"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSystemSetting,
  useSystemSettingsByKeys,
  useUpdateSystemSetting,
} from "@/features/system-settings/hooks/use-system-settings";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";
import {
  getAdminApiAllValidationMessages,
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";

const keyPattern = /^[a-zA-Z0-9._-]+$/;

function createSchema(t: TranslateFunction) {
  return z.object({
    key: z
      .string()
      .trim()
      .min(1, t("pages.settingsRegistryDialog.validation.keyRequired"))
      .regex(
        keyPattern,
        t("pages.settingsRegistryDialog.validation.keyInvalid"),
      ),
    valueText: z.string().trim(),
    isPublic: z.enum(["true", "false"]),
  });
}

type FormValues = z.infer<ReturnType<typeof createSchema>>;

type SystemSettingFormDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  setting?: SystemSetting | null;
  onSuccess?: (_message: string) => void;
};

function getErrorMessages(error: unknown, t: TranslateFunction): string[] {
  const fieldMessages = getAdminApiAllValidationMessages(error);
  if (fieldMessages.length > 0) {
    return fieldMessages;
  }

  return [
    getAdminApiErrorMessage(
      error,
      t("pages.settingsRegistryDialog.errors.saveFailed"),
    ),
  ];
}

function formatValueForInput(value: unknown) {
  if (value === null || value === undefined) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "null";
  }
}

function parseSettingValue(
  input: string,
  t: TranslateFunction,
):
  | {
      ok: true;
      value: Record<string, unknown> | null;
    }
  | {
      ok: false;
      message: string;
    } {
  if (!input || input === "null") {
    return { ok: true, value: null };
  }

  try {
    const parsed = JSON.parse(input);
    if (parsed === null) {
      return { ok: true, value: null };
    }

    if (Array.isArray(parsed) || typeof parsed !== "object") {
      return {
        ok: false,
        message: t("pages.settingsRegistryDialog.validation.valueMustBeObject"),
      };
    }

    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      message: t("pages.settingsRegistryDialog.validation.valueMustBeJson"),
    };
  }
}

export function SystemSettingFormDialog({
  open,
  onOpenChange,
  setting,
  onSuccess,
}: SystemSettingFormDialogProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => createSchema(t), [t]);

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const isEditMode = Boolean(setting);
  const createMutation = useCreateSystemSetting();
  const updateMutation = useUpdateSystemSetting();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      key: "",
      valueText: "{\n  \n}",
      isPublic: "false",
    },
  });
  const watchedKey = form.watch("key");
  const normalizedDraftKey = watchedKey.trim();
  const { data: existingByKey } = useSystemSettingsByKeys(
    normalizedDraftKey && !isEditMode ? [normalizedDraftKey] : [],
  );
  const matchingExistingSetting =
    normalizedDraftKey && !isEditMode
      ? (existingByKey?.[normalizedDraftKey] ?? null)
      : null;

  useEffect(() => {
    if (!open) {
      setFormErrors([]);
    }
  }, [open]);

  useEffect(() => {
    setFormErrors([]);
    form.reset({
      key: setting?.key ? String(setting.key) : "",
      valueText: setting ? formatValueForInput(setting.value) : "{\n  \n}",
      isPublic: setting?.is_public ? "true" : "false",
    });
  }, [form, setting]);

  const onSubmit = (values: FormValues) => {
    setFormErrors([]);

    const trimmedKey = values.key.trim();
    if (!isEditMode && matchingExistingSetting) {
      form.setError("key", {
        message: t("pages.settingsRegistryDialog.validation.keyExists"),
      });
      return;
    }

    const parsedValue = parseSettingValue(values.valueText.trim(), t);
    if (!parsedValue.ok) {
      form.setError("valueText", {
        message: parsedValue.message,
      });
      return;
    }

    const isPublic = values.isPublic === "true";

    if (isEditMode && setting) {
      updateMutation.mutate(
        {
          id: setting.id,
          payload: {
            value: parsedValue.value,
            is_public: isPublic,
          },
        },
        {
          onSuccess: (response) => {
            if (!isAdminRequestSuccessful(response)) {
              setFormErrors([
                getAdminResponseMessage(
                  response,
                  t("pages.settingsRegistryDialog.errors.saveFailed"),
                ),
              ]);
              return;
            }
            onOpenChange(false);
            onSuccess?.(
              getAdminResponseMessage(
                response,
                t("pages.settingsRegistryDialog.success.updated"),
              ),
            );
          },
          onError: (error) => setFormErrors(getErrorMessages(error, t)),
        },
      );
      return;
    }

    createMutation.mutate(
      {
        key: trimmedKey,
        value: parsedValue.value,
        is_public: isPublic,
      },
      {
        onSuccess: (response) => {
          if (!isAdminRequestSuccessful(response)) {
            setFormErrors([
              getAdminResponseMessage(
                response,
                t("pages.settingsRegistryDialog.errors.saveFailed"),
              ),
            ]);
            return;
          }
          onOpenChange(false);
          onSuccess?.(
            getAdminResponseMessage(
              response,
              t("pages.settingsRegistryDialog.success.created"),
            ),
          );
        },
        onError: (error) => setFormErrors(getErrorMessages(error, t)),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl overflow-hidden border-gray-200 p-0 dark:border-gray-800">
        <div className="border-b border-gray-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#fff7ed_100%)] px-6 py-5 dark:border-gray-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(17,24,39,0.96)_55%,rgba(41,37,36,0.92)_100%)]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? t("pages.settingsRegistryDialog.titleEdit")
                : t("pages.settingsRegistryDialog.titleCreate")}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? t("pages.settingsRegistryDialog.descriptionEdit")
                : t("pages.settingsRegistryDialog.descriptionCreate")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          {formErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTitle>
                {t("pages.settingsRegistryDialog.errorTitle")}
              </AlertTitle>
              <AlertDescription>
                {formErrors.length === 1 ? (
                  formErrors[0]
                ) : (
                  <ul className="list-inside list-disc space-y-1">
                    {formErrors.map((message, index) => (
                      <li key={index}>{message}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              {t("pages.settingsRegistryDialog.payloadNotesTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {t("pages.dynamicSettings.registryControlDescription")}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.settingsRegistryDialog.fields.key.label")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "pages.settingsRegistryDialog.fields.key.placeholder",
                        )}
                        className="h-11 rounded-xl font-mono"
                        {...field}
                        disabled={isPending || isEditMode}
                      />
                    </FormControl>
                    {!isEditMode && matchingExistingSetting ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {t(
                          "pages.settingsRegistryDialog.validation.keyExistsHint",
                        )}
                      </p>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "pages.settingsRegistryDialog.fields.visibility.label",
                      )}
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue
                            placeholder={t(
                              "pages.settingsRegistryDialog.fields.visibility.placeholder",
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="false">
                          {t(
                            "pages.settingsRegistryDialog.fields.visibility.private",
                          )}
                        </SelectItem>
                        <SelectItem value="true">
                          {t(
                            "pages.settingsRegistryDialog.fields.visibility.public",
                          )}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("pages.settingsRegistryDialog.fields.value.label")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={12}
                        placeholder={t(
                          "pages.settingsRegistryDialog.fields.value.placeholder",
                        )}
                        className="min-h-[260px] rounded-2xl border-gray-200 bg-gray-50 font-mono text-xs leading-6 dark:border-gray-800 dark:bg-gray-950/80"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="border-t border-gray-200 pt-4 dark:border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  {t("common.actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    !form.formState.isValid ||
                    Boolean(!isEditMode && matchingExistingSetting)
                  }
                >
                  {isPending
                    ? t("common.actions.saving")
                    : isEditMode
                      ? t("common.actions.saveChanges")
                      : t("pages.settingsRegistryDialog.actions.create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
