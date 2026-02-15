"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
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
  useUpdateSystemSetting,
} from "@/features/system-settings/hooks/use-system-settings";
import type { SystemSetting } from "@/features/system-settings/types/system-setting";

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

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data?.errors && typeof data.errors === "object") {
      const firstEntry = Object.values(data.errors)[0];
      if (Array.isArray(firstEntry) && firstEntry.length > 0) {
        return firstEntry[0];
      }
    }
  }

  return "Unable to save setting. Please try again.";
}

function formatValueForInput(value: unknown) {
  if (value === null || value === undefined) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "null";
  }
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
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.("Setting updated successfully.");
          },
          onError: (error) => setFormError(getErrorMessage(error)),
        },
      );
      return;
    }

    createMutation.mutate(
      {
        key: values.key.trim(),
        value: parsedValue.value,
        is_public: isPublic,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.("Setting created successfully.");
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
      <DialogContent className="max-w-2xl">
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

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Could not save setting</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="student.default_country_code"
                      {...field}
                      disabled={isPending || isEditMode}
                    />
                  </FormControl>
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
                      <SelectTrigger>
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
                      rows={10}
                      placeholder='{"code":"+20"}'
                      className="font-mono text-xs"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
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
                disabled={isPending || !form.formState.isValid}
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
      </DialogContent>
    </Dialog>
  );
}
