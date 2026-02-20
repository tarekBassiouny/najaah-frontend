"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useCreateRole, useUpdateRole } from "@/features/roles/hooks/use-roles";
import type { Role } from "@/features/roles/types/role";

const SLUG_REGEX = /^[a-zA-Z0-9._-]+$/;

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .max(100, "Role name must be 100 characters or less."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(100, "Slug must be 100 characters or less.")
    .regex(
      SLUG_REGEX,
      "Slug may only contain letters, numbers, dot (.), underscore (_) and hyphen (-).",
    ),
  description: z
    .string()
    .trim()
    .max(255, "Description must be 255 characters or less.")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

type RoleFormDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  role?: Role | null;
  onSuccess?: (_message: string) => void;
  scopeCenterId?: string | number | null;
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

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
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

    if (key === "slug") {
      setError("slug", { message });
      hasFieldError = true;
      continue;
    }

    if (key === "name_translations.en" || key === "name_translations") {
      setError("name", { message });
      hasFieldError = true;
      continue;
    }

    if (
      key === "description_translations.en" ||
      key === "description_translations"
    ) {
      setError("description", { message });
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

  return "Unable to save role. Please try again.";
}

function normalizeSlug(slug: string): string {
  return slug.trim();
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
  scopeCenterId,
}: RoleFormDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const isEditMode = Boolean(role);
  const createMutation = useCreateRole({ centerId: scopeCenterId ?? null });
  const updateMutation = useUpdateRole({ centerId: scopeCenterId ?? null });
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) {
      setFormError(null);
      return;
    }

    setFormError(null);
    form.reset({
      name: toText(role?.name ?? role?.name_translations?.en),
      slug: toText(role?.slug),
      description: toText(
        role?.description ?? role?.description_translations?.en,
      ),
    });
  }, [form, open, role]);

  const onSubmit = (values: FormValues) => {
    setFormError(null);

    const name = values.name.trim();
    const slug = normalizeSlug(values.slug);
    const description = values.description?.trim() || "";

    const payload = {
      name_translations: {
        en: name,
      },
      slug,
      description_translations: description
        ? {
            en: description,
          }
        : undefined,
    };

    if (isEditMode && role) {
      updateMutation.mutate(
        {
          roleId: role.id,
          payload,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.("Role updated successfully.");
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
        },
      );

      return;
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.("Role created successfully.");
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
        if (isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update role identity and description."
              : "Create a new role for role-based access control."}
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save role</AlertTitle>
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
                    <Input placeholder="Content Admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="content_admin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Short description" {...field} />
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
                    : "Create Role"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
