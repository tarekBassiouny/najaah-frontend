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
import { useUpdateAdminProfile } from "@/features/auth/hooks/use-admin-profile-update";
import type { AdminProfileUpdatePayload, AdminUser } from "@/types/auth";

const BASE_MOBILE_REGEX = /^[1-9]\d{9}$/;
const COUNTRY_CODE_REGEX = /^\+[1-9]\d{0,3}$/;

function normalizePhone(value?: string) {
  return value?.replace(/\s+/g, "").trim() ?? "";
}

function normalizeCountryCode(value?: string) {
  return value?.replace(/\s+/g, "").trim() ?? "";
}

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || BASE_MOBILE_REGEX.test(normalizePhone(value)),
      "Use base mobile number only (10 digits, no leading 0).",
    ),
  countryCode: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || COUNTRY_CODE_REGEX.test(normalizeCountryCode(value)),
      "Country code must be in +NN format (for example +20).",
    ),
});

type FormValues = z.infer<typeof schema>;

type EditAdminProfileDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  user: AdminUser;
  onSuccess?: (_message: string) => void;
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

function getFirstValidationMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;

  for (const value of Object.values(details as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const first = value.find(
        (item) => typeof item === "string" && item.trim(),
      ) as string | undefined;
      if (first) return first;
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

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

    if (key === "name") {
      setError("name", { message });
      hasFieldError = true;
      continue;
    }

    if (key === "phone") {
      setError("phone", { message });
      hasFieldError = true;
      continue;
    }

    if (key === "country_code") {
      setError("countryCode", { message });
      hasFieldError = true;
      continue;
    }
  }

  return hasFieldError;
}

function extractErrorMessage(error: unknown): string {
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

  return "Unable to update profile. Please try again.";
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

export function EditAdminProfileDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: EditAdminProfileDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useUpdateAdminProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      countryCode: "+20",
    },
  });

  useEffect(() => {
    if (!open) {
      setFormError(null);
      return;
    }

    setFormError(null);
    form.reset({
      name: toText(user.name),
      phone: toText(user.phone),
      countryCode: toText(user.country_code) || "+20",
    });
  }, [form, open, user]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    const nextName = values.name.trim();
    const nextPhone = normalizePhone(values.phone);
    const nextCountryCode = normalizeCountryCode(values.countryCode);

    const currentName = toText(user.name).trim();
    const currentPhone = normalizePhone(toText(user.phone));
    const currentCountryCode = normalizeCountryCode(toText(user.country_code));

    const payload: AdminProfileUpdatePayload = {};

    if (nextName !== currentName) {
      payload.name = nextName;
    }

    if (nextPhone !== currentPhone) {
      payload.phone = nextPhone || null;
    }

    if (nextCountryCode !== currentCountryCode) {
      payload.country_code = nextCountryCode || null;
    }

    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Profile updated successfully.");
      },
      onError: (error) => {
        const data = isAxiosError<BackendErrorData>(error)
          ? error.response?.data
          : undefined;

        const hasFieldError =
          mapFieldErrors(data?.error?.details, form.setError) ||
          mapFieldErrors(data?.errors, form.setError);

        if (!hasFieldError) {
          setFormError(extractErrorMessage(error));
        }
      },
    });
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
          <DialogTitle>Edit Profile Info</DialogTitle>
          <DialogDescription>
            Update your name and contact information.
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not update profile</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Admin name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="1225291841" {...field} />
                  </FormControl>
                  <p className="text-xs text-gray-400">
                    Base number only (10 digits). Do not include country code or
                    a leading 0.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Code</FormLabel>
                  <FormControl>
                    <Input placeholder="+20" {...field} />
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !form.formState.isValid}
              >
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
