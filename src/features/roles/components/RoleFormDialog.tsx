"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  useTranslation,
  type TranslateFunction,
} from "@/features/localization";
import {
  getAdminApiErrorCode,
  getAdminApiErrorMessage,
  getAdminApiFieldErrors,
  getAdminApiFirstFieldError,
  getAdminResponseMessage,
  isAdminRequestSuccessful,
} from "@/lib/admin-response";

const SLUG_REGEX = /^[a-zA-Z0-9._-]+$/;

const buildSchema = (t: TranslateFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("pages.roles.dialogs.form.validation.nameRequired"))
      .max(100, t("pages.roles.dialogs.form.validation.nameMax")),
    slug: z
      .string()
      .trim()
      .min(1, t("pages.roles.dialogs.form.validation.slugRequired"))
      .max(100, t("pages.roles.dialogs.form.validation.slugMax"))
      .regex(SLUG_REGEX, t("pages.roles.dialogs.form.validation.slugPattern")),
    description: z
      .string()
      .trim()
      .max(255, t("pages.roles.dialogs.form.validation.descriptionMax"))
      .optional(),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

type RoleFormDialogProps = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  role?: Role | null;
  onSuccess?: (_message: string) => void;
  scopeCenterId?: string | number | null;
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

function getErrorCodeMessage(
  code: string | undefined,
  t: TranslateFunction,
): string | null {
  if (!code) return null;

  const messages: Record<string, string> = {
    PERMISSION_DENIED: t("pages.roles.dialogs.form.errors.permissionDenied"),
    SYSTEM_SCOPE_REQUIRED: t(
      "pages.roles.dialogs.form.errors.systemScopeRequired",
    ),
    SYSTEM_API_KEY_REQUIRED: t(
      "pages.roles.dialogs.form.errors.systemApiKeyRequired",
    ),
    API_KEY_CENTER_MISMATCH: t(
      "pages.roles.dialogs.form.errors.apiKeyCenterMismatch",
    ),
    CENTER_MISMATCH: t("pages.roles.dialogs.form.errors.centerMismatch"),
    NOT_FOUND: t("pages.roles.dialogs.form.errors.notFound"),
    VALIDATION_ERROR: t("pages.roles.dialogs.form.errors.validation"),
  };

  return messages[code] ?? null;
}

function extractErrorMessage(error: unknown, t: TranslateFunction): string {
  const codeMessage = getErrorCodeMessage(getAdminApiErrorCode(error), t);
  if (codeMessage) {
    return codeMessage;
  }

  const validationMessage = getAdminApiFirstFieldError(error);
  if (validationMessage) {
    return validationMessage;
  }

  return getAdminApiErrorMessage(
    error,
    t("pages.roles.dialogs.form.errors.saveFailed"),
  );
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
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);
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
          onSuccess: (response) => {
            if (!isAdminRequestSuccessful(response)) {
              setFormError(
                getAdminResponseMessage(
                  response,
                  t("pages.roles.dialogs.form.errors.saveFailed"),
                ),
              );
              return;
            }
            onOpenChange(false);
            onSuccess?.(
              getAdminResponseMessage(
                response,
                t("pages.roles.dialogs.form.messages.updated"),
              ),
            );
          },
          onError: (error) => {
            const hasFieldError = mapFieldErrors(
              getAdminApiFieldErrors(error) as
                | Record<string, string[] | string>
                | undefined,
              form.setError,
            );

            if (!hasFieldError) {
              setFormError(extractErrorMessage(error, t));
            }
          },
        },
      );

      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (response) => {
        if (!isAdminRequestSuccessful(response)) {
          setFormError(
            getAdminResponseMessage(
              response,
              t("pages.roles.dialogs.form.errors.saveFailed"),
            ),
          );
          return;
        }
        onOpenChange(false);
        onSuccess?.(
          getAdminResponseMessage(
            response,
            t("pages.roles.dialogs.form.messages.created"),
          ),
        );
      },
      onError: (error) => {
        const hasFieldError = mapFieldErrors(
          getAdminApiFieldErrors(error) as
            | Record<string, string[] | string>
            | undefined,
          form.setError,
        );

        if (!hasFieldError) {
          setFormError(extractErrorMessage(error, t));
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
          <DialogTitle>
            {isEditMode
              ? t("pages.roles.dialogs.form.titleEdit")
              : t("pages.roles.dialogs.form.titleCreate")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("pages.roles.dialogs.form.descriptionEdit")
              : t("pages.roles.dialogs.form.descriptionCreate")}
          </DialogDescription>
        </DialogHeader>

        {formError ? (
          <Alert variant="destructive">
            <AlertTitle>
              {t("pages.roles.dialogs.form.errors.saveFailedTitle")}
            </AlertTitle>
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
                  <FormLabel>{t("common.labels.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.roles.dialogs.form.placeholders.name",
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
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("pages.roles.dialogs.form.fields.slug")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.roles.dialogs.form.placeholders.slug",
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.labels.description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        "pages.roles.dialogs.form.placeholders.description",
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
                disabled={isPending}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending || !form.formState.isValid}
              >
                {isPending
                  ? t("common.actions.saving")
                  : isEditMode
                    ? t("pages.roles.dialogs.form.actions.saveChanges")
                    : t("pages.roles.dialogs.form.actions.createRole")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
