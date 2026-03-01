"use client";

import { useEffect, useState } from "react";
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
  getAdminApiErrorMessage,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

const keyPattern = /^[a-zA-Z0-9._-]+$/;

const schema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required.")
    .regex(
      keyPattern,
      "Key may only contain letters, numbers, dot (.), underscore (_) and hyphen (-).",
    ),
  valueText: z.string().trim(),
  isPublic: z.enum(["true", "false"]),
});

type FormValues = z.infer<typeof schema>;

type SystemSettingFormDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  setting?: SystemSetting | null;
  onSuccess?: (_message: string) => void;
};

const KNOWN_SETTING_TEMPLATES: Record<
  string,
  { label: string; value: Record<string, unknown> }
> = {
  timezone: {
    label: "Timezone default",
    value: { timezone: "UTC" },
  },
  support_email: {
    label: "Support email",
    value: { email: "support@example.com" },
  },
  require_device_approval: {
    label: "Device approval",
    value: { enabled: true },
  },
  attendance_required: {
    label: "Attendance policy",
    value: { enabled: false },
  },
};
const CANONICAL_DEFAULT_KEYS = new Set(Object.keys(KNOWN_SETTING_TEMPLATES));

function getErrorMessage(error: unknown) {
  return getAdminApiErrorMessage(
    error,
    "Unable to save setting. Please try again.",
  );
}

function formatValueForInput(value: unknown) {
  if (value === null || value === undefined) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "null";
  }
}

function formatTemplateValue(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2);
}

function parseSettingValue(input: string):
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
      return { ok: false, message: "Value must be a JSON object or null." };
    }

    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, message: "Value must be valid JSON." };
  }
}

export function SystemSettingFormDialog({
  open,
  onOpenChange,
  setting,
  onSuccess,
}: SystemSettingFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
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
  const suggestedTemplate = KNOWN_SETTING_TEMPLATES[normalizedDraftKey] ?? null;

  useEffect(() => {
    if (!open) {
      setFormError(null);
    }
  }, [open]);

  useEffect(() => {
    setFormError(null);
    form.reset({
      key: setting?.key ? String(setting.key) : "",
      valueText: setting ? formatValueForInput(setting.value) : "{\n  \n}",
      isPublic: setting?.is_public ? "true" : "false",
    });
  }, [form, setting]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    const trimmedKey = values.key.trim();
    if (!isEditMode && CANONICAL_DEFAULT_KEYS.has(trimmedKey)) {
      form.setError("key", {
        message:
          "This key is managed from the canonical defaults panel. Edit it there instead.",
      });
      return;
    }
    if (!isEditMode && matchingExistingSetting) {
      form.setError("key", {
        message: "A global setting with this key already exists.",
      });
      return;
    }

    const parsedValue = parseSettingValue(values.valueText.trim());
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
              setFormError(
                getAdminResponseMessage(
                  response,
                  "Unable to save setting. Please try again.",
                ),
              );
              return;
            }
            onOpenChange(false);
            onSuccess?.(
              getAdminResponseMessage(
                response,
                "Setting updated successfully.",
              ),
            );
          },
          onError: (error) => setFormError(getErrorMessage(error)),
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
            setFormError(
              getAdminResponseMessage(
                response,
                "Unable to save setting. Please try again.",
              ),
            );
            return;
          }
          onOpenChange(false);
          onSuccess?.(
            getAdminResponseMessage(response, "Setting created successfully."),
          );
        },
        onError: (error) => setFormError(getErrorMessage(error)),
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
              {isEditMode ? "Edit System Setting" : "Create System Setting"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update setting value and visibility. Key cannot be changed after creation."
                : "Create a new global setting key with JSON value and visibility."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6">
          {formError && (
            <Alert variant="destructive">
              <AlertTitle>Could not save setting</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/50">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Payload Notes
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              Store values as JSON objects such as{" "}
              <span className="font-mono">{`{ "enabled": true }`}</span> or{" "}
              <span className="font-mono">{`{ "timezone": "UTC" }`}</span>. Use{" "}
              <span className="font-mono">null</span> only when the setting
              intentionally carries no structured payload.
            </p>
            {suggestedTemplate && !isEditMode ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-white/90 px-3 py-3 dark:border-amber-900/60 dark:bg-gray-900/80">
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    Suggested template: {suggestedTemplate.label}
                  </p>
                  <p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-300">
                    {JSON.stringify(suggestedTemplate.value)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    form.setValue(
                      "valueText",
                      formatTemplateValue(suggestedTemplate.value),
                      { shouldDirty: true, shouldValidate: true },
                    )
                  }
                  disabled={isPending}
                >
                  Use Template
                </Button>
              </div>
            ) : null}
            {!isEditMode && CANONICAL_DEFAULT_KEYS.has(normalizedDraftKey) ? (
              <div className="mt-4 rounded-xl border border-blue-200/80 bg-blue-50/80 px-3 py-3 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                This key is edited from the Global Defaults panel above, not
                from the generic registry dialog.
              </div>
            ) : null}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="student.default_country_code"
                        className="h-11 rounded-xl font-mono"
                        {...field}
                        disabled={isPending || isEditMode}
                      />
                    </FormControl>
                    {!isEditMode && matchingExistingSetting ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        This key already exists in the system registry. Edit the
                        existing record instead of creating a duplicate.
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
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="false">Private</SelectItem>
                        <SelectItem value="true">Public</SelectItem>
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
                    <FormLabel>Value (JSON object or null)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={12}
                        placeholder='{"code":"+20"}'
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    !form.formState.isValid ||
                    Boolean(
                      !isEditMode &&
                      (matchingExistingSetting ||
                        CANONICAL_DEFAULT_KEYS.has(normalizedDraftKey)),
                    )
                  }
                >
                  {isPending
                    ? "Saving..."
                    : isEditMode
                      ? "Save Changes"
                      : "Create Setting"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
