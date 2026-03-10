"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
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
import { useAdminChangePassword } from "@/features/auth/hooks/use-admin-change-password";
import { useTranslation } from "@/features/localization";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  onSuccess?: (_message: string) => void;
};

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type BackendErrorData = {
  message?: string;
  errors?: Record<string, string[] | string>;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[] | string>;
  };
};

function getValidationMessage(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value.find(
      (item) => typeof item === "string" && item.trim(),
    ) as string | undefined;
    return first ?? null;
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return null;
}

function getFirstValidationMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;

  for (const value of Object.values(details as Record<string, unknown>)) {
    const message = getValidationMessage(value);
    if (message) return message;
  }

  return null;
}

function mapFieldErrors(
  details: Record<string, string[] | string> | undefined,
  setError: (_name: keyof FormValues, _error: { message: string }) => void,
): boolean {
  if (!details || typeof details !== "object") {
    return false;
  }

  let hasFieldError = false;

  for (const [key, rawMessage] of Object.entries(details)) {
    const message = getValidationMessage(rawMessage);
    if (!message) continue;

    if (key === "current_password") {
      setError("currentPassword", { message });
      hasFieldError = true;
      continue;
    }

    if (key === "new_password" || key === "password") {
      setError("newPassword", { message });
      hasFieldError = true;
      continue;
    }

    if (key === "confirm_password") {
      setError("confirmPassword", { message });
      hasFieldError = true;
      continue;
    }
  }

  return hasFieldError;
}

function extractErrorMessage(
  error: unknown,
  t: (_key: string) => string,
): string {
  if (isAxiosError<BackendErrorData>(error)) {
    const data = error.response?.data;

    const validationMessage =
      getFirstValidationMessage(data?.error?.details) ??
      getFirstValidationMessage(data?.errors);

    if (validationMessage) {
      return validationMessage;
    }

    if (typeof data?.error?.message === "string" && data.error.message.trim()) {
      return data.error.message;
    }

    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
  }

  return t("pages.changePassword.genericError");
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onSuccess,
}: ChangePasswordDialogProps) {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useAdminChangePassword();

  const schema = z
    .object({
      currentPassword: z
        .string()
        .min(1, t("pages.changePassword.validation.currentRequired")),
      newPassword: z
        .string()
        .min(8, t("pages.changePassword.validation.newMinLength")),
      confirmPassword: z
        .string()
        .min(1, t("pages.changePassword.validation.confirmRequired")),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
      path: ["confirmPassword"],
      message: t("pages.changePassword.validation.passwordsDoNotMatch"),
    });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setFormError(null);
      return;
    }

    setFormError(null);
    form.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [form, open]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    mutation.mutate(
      {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.(t("pages.changePassword.successMessage"));
        },
        onError: (error) => {
          const data = isAxiosError<BackendErrorData>(error)
            ? error.response?.data
            : undefined;

          const hasFieldError =
            mapFieldErrors(data?.error?.details, form.setError) ||
            mapFieldErrors(data?.errors, form.setError);

          if (!hasFieldError) {
            setFormError(extractErrorMessage(error, t));
          }
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (mutation.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("pages.changePassword.title")}</DialogTitle>
          <DialogDescription>
            {t("pages.changePassword.description")}
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("pages.changePassword.couldNotChange")}</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.changePassword.currentPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder={t(
                        "pages.changePassword.currentPasswordPlaceholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("pages.changePassword.newPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t(
                        "pages.changePassword.newPasswordPlaceholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.changePassword.confirmNewPassword")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder={t(
                        "pages.changePassword.confirmPasswordPlaceholder",
                      )}
                      {...field}
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
                disabled={mutation.isPending}
              >
                {t("pages.changePassword.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !form.formState.isValid}
              >
                {mutation.isPending
                  ? t("pages.changePassword.saving")
                  : t("pages.changePassword.updatePassword")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
